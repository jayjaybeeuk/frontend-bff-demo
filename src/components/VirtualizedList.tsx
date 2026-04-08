/**
 * VirtualizedList — LOW priority section.
 *
 * Concepts demonstrated:
 *   → Virtualisation: only the DOM nodes for items currently in the viewport are
 *     rendered (via TanStack Virtual). For 500 items this reduces DOM nodes from
 *     500 to ~12, keeping layout thrashing near zero.
 *   → Progressive / streaming loading: state is updated after each 50-item batch
 *     so the list grows visually as data arrives — the user is never staring at a
 *     blank screen waiting for all 500 items.
 *   → Web Worker pipeline: the `category`, `formattedValue`, and `ageLabel` fields
 *     shown on each row were computed off the main thread by dataProcessor.worker.ts.
 *   → Code splitting: this component is loaded lazily (React.lazy in App.tsx) so
 *     its bundle does not block the CRITICAL / HIGH sections from rendering.
 */

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { useVirtualizer } from '@tanstack/react-virtual';
import { dataAtom, loadingAtom, errorAtom } from '../state';
import { useBatchedFetch } from '../hooks/useBatchedFetch';
import { SkeletonList } from './SkeletonList';
import type { ProcessedFeedItem } from '../types/feed';

const CATEGORY_STYLES: Record<ProcessedFeedItem['category'], string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
};

export function VirtualizedList() {
  const data = useAtomValue(dataAtom);
  const loading = useAtomValue(loadingAtom);
  const error = useAtomValue(errorAtom);
  const { fetchAll } = useBatchedFetch();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '420px' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-xs text-white/40 font-mono">
          {loading
            ? `loading — ${data.length} / 500 items  ·  batches of 50 via BFF`
            : `${data.length} items  ·  all batches loaded`}
        </p>
        <p className="text-[10px] text-white/25 font-mono">
          worker-processed fields: category · value · age
        </p>
      </div>

      {data.length === 0 && loading ? (
        <SkeletonList />
      ) : (
        <div
          ref={parentRef}
          className="flex-1 overflow-auto rounded-xl border border-white/10"
          style={{ contain: 'strict' }}
        >
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = data[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="flex items-center px-4 border-b border-white/5"
                >
                  {/* Category badge — derived by the Web Worker */}
                  <span
                    className={`text-[10px] font-bold w-14 text-center py-0.5 rounded border uppercase mr-3 flex-shrink-0 ${CATEGORY_STYLES[item.category]}`}
                  >
                    {item.category}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-[11px] text-white/30 font-mono truncate">
                      {item.description} · {item.ageLabel}
                    </p>
                  </div>

                  {/* Formatted value — computed by the Web Worker */}
                  <span className="ml-3 text-sm font-mono bg-white/5 px-2 py-1 rounded flex-shrink-0">
                    {item.formattedValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
