/**
 * useBatchedFetch — Progressive feed loading via the BFF + Web Worker pipeline.
 *
 * Concepts demonstrated:
 *   → BFF integration: data comes from bffFetchFeedBatch, not from a raw service.
 *   → Web Worker pipeline: each batch is dispatched to the worker for off-main-thread
 *     processing before being committed to state.
 *   → Progressive / streaming UX: state is updated after every batch so the user
 *     sees content accumulate rather than waiting for all 500 items.
 *   → Exponential-backoff retry: transient failures are retried automatically.
 *   → AbortController: fetching can be cancelled cleanly (e.g. on unmount).
 */

import { useCallback, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { dataAtom, loadingAtom, errorAtom, perfAtom } from '../state';
import { bffFetchFeedBatch } from '../bff';
import { useWorkerProcessor } from './useWorkerProcessor';
import type { ProcessedFeedItem } from '../types/feed';

const BATCH_SIZE = 50;
const TOTAL_ITEMS = 500;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 100;

async function fetchBatchWithRetry(
  start: number,
  size: number,
  signal: AbortSignal,
): Promise<Awaited<ReturnType<typeof bffFetchFeedBatch>>> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      return await bffFetchFeedBatch(start, size);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, BASE_RETRY_DELAY_MS * Math.pow(2, attempt));
          signal.addEventListener('abort', () => {
            clearTimeout(t);
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        });
      }
    }
  }
  throw lastError;
}

export function useBatchedFetch() {
  const setData = useSetAtom(dataAtom);
  const setLoading = useSetAtom(loadingAtom);
  const setError = useSetAtom(errorAtom);
  const setPerf = useSetAtom(perfAtom);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { processBatch, workerSupported } = useWorkerProcessor();

  const fetchAll = useCallback(async () => {
    // Cancel any in-progress fetch.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    setError(null);
    setData([]);

    // Record that the worker is (or isn't) active for the perf panel.
    setPerf((prev) => ({ ...prev, workerActive: workerSupported }));

    try {
      let accumulated: ProcessedFeedItem[] = [];

      for (let start = 0; start < TOTAL_ITEMS; start += BATCH_SIZE) {
        if (signal.aborted) break;

        const size = Math.min(BATCH_SIZE, TOTAL_ITEMS - start);

        // ── 1. Fetch from BFF ────────────────────────────────────────────────
        const rawBatch = await fetchBatchWithRetry(start, size, signal);
        if (signal.aborted) break;

        // ── 2. Process in Web Worker (off main thread) ───────────────────────
        const processedBatch = await processBatch(rawBatch);
        if (signal.aborted) break;

        accumulated = [...accumulated, ...processedBatch];
        setData([...accumulated]);

        // ── 3. Record timing milestones ──────────────────────────────────────
        if (start === 0) {
          setPerf((prev) => ({ ...prev, firstBatchAt: performance.now() }));
        }
      }

      setPerf((prev) => ({ ...prev, allBatchesAt: performance.now() }));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError, setPerf, processBatch, workerSupported]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { fetchAll, abort };
}
