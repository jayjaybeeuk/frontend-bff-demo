import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { useVirtualizer } from '@tanstack/react-virtual';
import { dataAtom, loadingAtom, errorAtom } from '../state';
import { useBatchedFetch } from '../hooks/useBatchedFetch';
import { SkeletonList } from './SkeletonList';

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
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Frontend BFF Demo</h1>
        <p className="text-sm opacity-60">
          {loading ? `Loading… (${data.length} items fetched so far)` : `${data.length} items loaded`}
        </p>
      </div>

      {data.length === 0 && loading ? (
        <SkeletonList />
      ) : (
        <div
          ref={parentRef}
          className="flex-1 overflow-auto border rounded-lg"
          style={{ contain: 'strict' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
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
                  className="flex items-center px-4 border-b border-white/10"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs opacity-60">{item.description}</p>
                  </div>
                  <span className="ml-4 text-sm font-mono bg-white/10 px-2 py-1 rounded">
                    {item.value}
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
