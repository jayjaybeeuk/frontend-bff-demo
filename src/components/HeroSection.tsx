/**
 * HeroSection — CRITICAL priority section.
 *
 * Concepts demonstrated:
 *   → BFF Pattern: data is fetched from bffFetchHero (a dedicated BFF endpoint
 *     that would be edge-cached in production for < 20 ms TTFB).
 *   → Critical path prioritisation: scheduled via queueMicrotask, runs before
 *     any other data fetch starts.
 *   → Skeleton UI: while loading, a placeholder of the same dimensions is shown
 *     to prevent layout shift (CLS = 0).
 */

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { perfAtom } from '../state';
import { bffFetchHero } from '../bff';
import { usePrioritizedFetch } from '../hooks/usePrioritizedFetch';
import { Skeleton } from './ui/skeleton';

function HeroSkeleton() {
  return (
    <div className="space-y-3 p-6 rounded-xl border border-white/10">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function HeroSection() {
  const setPerf = useSetAtom(perfAtom);

  const { data, loading, isStale, fromCache } = usePrioritizedFetch(bffFetchHero, {
    cacheKey: 'bff:hero',
    priority: 'CRITICAL',
    cacheTtlMs: 30_000,
  });

  useEffect(() => {
    if (data) {
      setPerf((prev) => ({ ...prev, heroLoadedAt: performance.now() }));
    }
  }, [data, setPerf]);

  if (loading) return <HeroSkeleton />;

  if (!data) return null;

  return (
    <div className="relative p-6 rounded-xl border border-white/10 bg-white/[0.02]">
      {/* Cache indicator */}
      {fromCache && (
        <span className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/30">
          {isStale ? 'cache: stale → revalidating' : 'cache: fresh'}
        </span>
      )}

      <div className="mb-1">
        <span className="text-[10px] font-bold tracking-widest uppercase text-red-400/70">
          hero-service via BFF
        </span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">{data.headline}</h1>
      <p className="text-white/60 text-base mb-5 max-w-xl">{data.subline}</p>
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
          {data.cta}
        </button>
        <span className="text-xs font-mono px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
          {data.badge}
        </span>
      </div>
    </div>
  );
}
