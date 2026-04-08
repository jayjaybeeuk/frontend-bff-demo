/**
 * usePrioritizedFetch — Priority-aware data fetching with SWR cache and retry.
 *
 * Concepts demonstrated:
 *
 *   PRIORITY SCHEDULING
 *     Data sources are classified as CRITICAL / HIGH / LOW.
 *     • CRITICAL — scheduled via queueMicrotask (before next paint, highest priority).
 *     • HIGH     — scheduled via requestAnimationFrame (after layout, still very fast).
 *     • LOW      — scheduled via requestIdleCallback / setTimeout (browser idle time).
 *     This ensures above-fold content wins CPU time over deferred content.
 *
 *   STALE-WHILE-REVALIDATE
 *     On every mount the cache is checked first.
 *     Stale data → returned immediately AND a background revalidation is triggered.
 *     Fresh data → returned immediately, no network round-trip needed.
 *
 *   EXPONENTIAL-BACKOFF RETRY
 *     Transient failures are retried up to `maxRetries` times with delays of
 *     baseRetryDelayMs * 2^attempt (100 ms, 200 ms, 400 ms, …).
 */

import { useState, useEffect, useRef } from 'react';
import { swrCache } from '../cache/swrCache';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FetchPriority = 'CRITICAL' | 'HIGH' | 'LOW';

export interface UsePrioritizedFetchOptions {
  cacheKey: string;
  priority: FetchPriority;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  cacheTtlMs?: number;
}

export interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** True when data was returned from a stale cache entry while revalidating. */
  isStale: boolean;
  /** True when data came from the SWR cache (stale or fresh). */
  fromCache: boolean;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Schedules `fn` according to `priority` using the most appropriate browser API.
 * This models the Prioritized Task Scheduling approach described in the article.
 */
function scheduleByPriority(priority: FetchPriority, fn: () => void): void {
  if (priority === 'CRITICAL') {
    // Microtask queue — runs before the browser has a chance to paint.
    queueMicrotask(fn);
  } else if (priority === 'HIGH') {
    // After the next layout/paint — still within the same frame.
    requestAnimationFrame(fn);
  } else {
    // Browser idle time — won't compete with critical rendering work.
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(fn);
    } else {
      setTimeout(fn, 50);
    }
  }
}

/**
 * Calls `fn`, retrying on failure up to `maxRetries` times.
 * Delay between attempts doubles each time (exponential backoff).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)),
        );
      }
    }
  }
  throw lastError;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePrioritizedFetch<T>(
  fetchFn: () => Promise<T>,
  options: UsePrioritizedFetchOptions,
): FetchResult<T> {
  const {
    cacheKey,
    priority,
    maxRetries = 3,
    baseRetryDelayMs = 100,
    cacheTtlMs,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Stable ref so the effect can call the latest fetchFn without re-running.
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    let aborted = false;

    // ── 1. SWR cache check ──────────────────────────────────────────────────
    const cached = swrCache.get<T>(cacheKey, cacheTtlMs);
    if (cached) {
      setData(cached.data);
      setIsStale(cached.isStale);
      setFromCache(true);
      if (!cached.isStale) {
        // Fresh cache hit — no network request needed.
        setLoading(false);
        return;
      }
      // Stale hit — show immediately but fall through to revalidate in background.
      setLoading(false);
    }

    // ── 2. Schedule the (re)validation fetch by priority ────────────────────
    scheduleByPriority(priority, () => {
      const doFetch = async () => {
        try {
          const result = await withRetry(fetchFnRef.current, maxRetries, baseRetryDelayMs);
          if (aborted) return;
          swrCache.set(cacheKey, result);
          setData(result);
          setIsStale(false);
          setFromCache(false);
          setError(null);
        } catch (err) {
          if (aborted) return;
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
          if (!aborted) setLoading(false);
        }
      };
      void doFetch();
    });

    return () => {
      aborted = true;
    };
  }, [cacheKey, cacheTtlMs, priority, maxRetries, baseRetryDelayMs]);

  return { data, loading, error, isStale, fromCache };
}
