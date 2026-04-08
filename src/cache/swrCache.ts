/**
 * Stale-While-Revalidate (SWR) Cache
 *
 * Concept demonstrated:
 *   → Return cached data immediately (even if stale) so the user sees content at once.
 *   → Trigger a background revalidation to replace stale data silently.
 *   → Result: the UI feels instant on repeat visits while always converging on fresh data.
 *
 * In production you would add:
 *   • Persistent storage (IndexedDB / localStorage) for cross-session hits.
 *   • Per-entry TTL configuration driven by Cache-Control headers.
 *   • Deduplicated in-flight requests (request deduplication).
 */

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const DEFAULT_TTL_MS = 30_000; // 30 s — stale after this, revalidated in background

export class SWRCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Returns cached data plus a `isStale` flag.
   * Returns `null` when no entry exists (cache miss).
   */
  get<T>(key: string, ttlMs = DEFAULT_TTL_MS): { data: T; isStale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    return { data: entry.data, isStale: Date.now() - entry.fetchedAt > ttlMs };
  }

  /** Write a fresh entry. */
  set<T>(key: string, data: T): void {
    this.store.set(key, { data, fetchedAt: Date.now() });
  }

  /** Force-remove an entry so the next `get` is a miss. */
  invalidate(key: string): void {
    this.store.delete(key);
  }
}

/**
 * Module-level singleton shared across the whole application.
 * All hooks use this instance so cache hits are shared between components.
 */
export const swrCache = new SWRCache();
