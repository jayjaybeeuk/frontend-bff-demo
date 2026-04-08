/**
 * useWorkerProcessor — React bridge to the dataProcessor Web Worker.
 *
 * Concept demonstrated:
 *   → Multi-threaded data pipeline: raw batches are handed off to a worker via
 *     postMessage and the processed results are delivered asynchronously.
 *   → The main thread never blocks on JSON parsing / normalisation / derived-field
 *     computation — it stays responsive for rendering and user interaction.
 *   → A Promise-based API wraps the message-passing protocol, making the async
 *     handoff transparent to callers.
 *
 * Lifecycle:
 *   • Worker is created once on mount and terminated on unmount.
 *   • Each `processBatch` call gets a unique batchId so responses are routed to
 *     the correct Promise resolver even if batches complete out of order.
 */

import { useRef, useEffect, useCallback } from 'react';
import type { RawFeedItem, ProcessedFeedItem } from '../types/feed';

interface WorkerResponse {
  type: string;
  payload: ProcessedFeedItem[];
  batchId: number;
}

export function useWorkerProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<number, (items: ProcessedFeedItem[]) => void>>(new Map());
  const batchCounterRef = useRef(0);
  /** Exposed so callers can label whether worker support is available. */
  const workerSupportedRef = useRef(typeof Worker !== 'undefined');

  useEffect(() => {
    if (!workerSupportedRef.current) return;

    // Vite resolves this URL at build time and bundles the worker separately.
    const worker = new Worker(
      new URL('../workers/dataProcessor.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'BATCH_PROCESSED') {
        const resolve = pendingRef.current.get(e.data.batchId);
        if (resolve) {
          resolve(e.data.payload);
          pendingRef.current.delete(e.data.batchId);
        }
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Sends a raw batch to the worker and returns a Promise that resolves with the
   * processed batch. Falls back to synchronous main-thread processing when the
   * Worker API is unavailable.
   */
  const processBatch = useCallback((items: RawFeedItem[]): Promise<ProcessedFeedItem[]> => {
    if (!workerRef.current) {
      // Fallback: process synchronously on the main thread.
      const processed: ProcessedFeedItem[] = items.map((item) => ({
        ...item,
        category: item.value > 66 ? 'high' : item.value > 33 ? 'medium' : 'low',
        formattedValue: item.value.toString().padStart(3, '0'),
        ageLabel: (() => {
          const ageMs = Date.now() - item.timestamp;
          const hours = Math.floor(ageMs / 3_600_000);
          return hours > 0
            ? `${hours}h ago`
            : `${Math.floor(ageMs / 60_000)}m ago`;
        })(),
      }));
      return Promise.resolve(processed);
    }

    return new Promise<ProcessedFeedItem[]>((resolve) => {
      const batchId = batchCounterRef.current++;
      pendingRef.current.set(batchId, resolve);
      workerRef.current!.postMessage({ type: 'PROCESS_BATCH', payload: items, batchId });
    });
  }, []);

  return { processBatch, workerSupported: workerSupportedRef.current };
}
