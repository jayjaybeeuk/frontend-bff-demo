/**
 * MetricsSection — HIGH priority section.
 *
 * Concepts demonstrated:
 *   → Priority scheduling: scheduled via requestAnimationFrame — runs after
 *     the CRITICAL hero section but before LOW-priority feed data.
 *   → Stale-while-revalidate: on a second visit, stale cached values are shown
 *     instantly while the BFF revalidates in the background; the UI updates
 *     silently when fresh data arrives.
 *   → Skeleton UI: card placeholders of the exact final size prevent layout shift.
 */

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { perfAtom } from '../state';
import { bffFetchMetrics } from '../bff';
import type { MetricCard } from '../bff';
import { usePrioritizedFetch } from '../hooks/usePrioritizedFetch';
import { Skeleton } from './ui/skeleton';

function TrendArrow({ trend }: { trend: MetricCard['trend'] }) {
  if (trend === 'up') return <span className="text-green-400 text-xs">▲</span>;
  if (trend === 'down') return <span className="text-red-400 text-xs">▼</span>;
  return <span className="text-white/30 text-xs">—</span>;
}

function MetricCardSkeleton() {
  return (
    <div className="flex-1 min-w-[130px] p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-14 mb-2" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function MetricsSection() {
  const setPerf = useSetAtom(perfAtom);

  const { data, loading, isStale, fromCache } = usePrioritizedFetch(bffFetchMetrics, {
    cacheKey: 'bff:metrics',
    priority: 'HIGH',
    cacheTtlMs: 30_000,
  });

  useEffect(() => {
    if (data) {
      setPerf((prev) => ({ ...prev, metricsLoadedAt: performance.now() }));
    }
  }, [data, setPerf]);

  return (
    <div>
      {/* Cache indicator row */}
      {fromCache && !loading && (
        <div className="mb-2 text-right">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/30">
            {isStale ? 'cache: stale → revalidating' : 'cache: fresh'}
          </span>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          : (data ?? []).map((card) => (
              <div
                key={card.id}
                className="flex-1 min-w-[130px] p-4 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendArrow trend={card.trend} />
                  <span
                    className={`text-xs tabular-nums ${
                      card.trend === 'up'
                        ? 'text-green-400'
                        : card.trend === 'down'
                          ? 'text-red-400'
                          : 'text-white/30'
                    }`}
                  >
                    {card.delta > 0 ? '+' : ''}
                    {card.delta}%
                  </span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
