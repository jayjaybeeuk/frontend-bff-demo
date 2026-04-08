/**
 * App — Frontend System Design Showcase
 *
 * Demonstrates the patterns described in:
 *   "Frontend System Design of a High-Throughput Data-Intensive Landing Page"
 *
 * Architecture overview:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  BFF Layer (src/bff/index.ts)                                │
 *   │  Orchestrates hero-service, metrics-service, feed-service    │
 *   └────────────────┬─────────────────────────────────────────────┘
 *                    │
 *        ┌───────────┼──────────────────┐
 *        ▼           ▼                  ▼
 *   [CRITICAL]    [HIGH]              [LOW]
 *   HeroSection  MetricsSection   VirtualizedList
 *   80 ms fetch  140 ms fetch     50 ms × 10 batches
 *   SWR cached   SWR cached       Web Worker processed
 *
 *   PerformancePanel (floating) — live pipeline timing
 *
 * Patterns in play:
 *   • BFF Pattern                 — src/bff/index.ts
 *   • Priority Scheduling         — src/hooks/usePrioritizedFetch.ts
 *   • Stale-While-Revalidate      — src/cache/swrCache.ts
 *   • Web Workers                 — src/workers/dataProcessor.worker.ts
 *   • Virtualisation              — src/components/VirtualizedList.tsx
 *   • Progressive / Batched Load  — src/hooks/useBatchedFetch.ts
 *   • Exponential-Backoff Retry   — usePrioritizedFetch + useBatchedFetch
 *   • Skeleton UI / CLS = 0       — all sections
 *   • Code Splitting              — React.lazy for VirtualizedList
 *   • Error Boundaries            — src/components/ErrorBoundary.tsx
 */

import { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonList } from './components/SkeletonList';
import { HeroSection } from './components/HeroSection';
import { MetricsSection } from './components/MetricsSection';
import { PerformancePanel } from './components/PerformancePanel';
import { ConceptLabel } from './components/ConceptLabel';

// Code-split: VirtualizedList bundles TanStack Virtual separately.
// This keeps the initial JS payload small so CRITICAL content loads faster.
const VirtualizedList = lazy(() =>
  import('./components/VirtualizedList').then((m) => ({ default: m.VirtualizedList })),
);

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-baseline gap-3">
          <h1 className="text-lg font-semibold">Frontend BFF Demo</h1>
          <span className="text-xs text-white/30">
            High-Throughput Landing Page · System Design Showcase
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* ── CRITICAL — BFF + Critical Path ──────────────────────────── */}
        <section>
          <ConceptLabel
            priority="CRITICAL"
            concepts={['BFF Pattern', 'Critical Path', 'Edge Caching', 'Skeleton UI']}
          />
          <ErrorBoundary>
            <HeroSection />
          </ErrorBoundary>
        </section>

        {/* ── HIGH — Priority Scheduling + SWR Cache ───────────────────── */}
        <section>
          <ConceptLabel
            priority="HIGH"
            concepts={['Priority Scheduling', 'Stale-While-Revalidate Cache', 'Skeleton UI']}
          />
          <ErrorBoundary>
            <MetricsSection />
          </ErrorBoundary>
        </section>

        {/* ── LOW — Web Workers + Virtualisation ───────────────────────── */}
        <section>
          <ConceptLabel
            priority="LOW"
            concepts={[
              'Web Workers',
              'Virtualisation',
              'Progressive Loading',
              'Batched BFF Fetch',
              'Code Splitting',
            ]}
          />
          <ErrorBoundary>
            <Suspense fallback={<SkeletonList />}>
              <VirtualizedList />
            </Suspense>
          </ErrorBoundary>
        </section>
      </main>

      {/* ── Floating performance panel ────────────────────────────────── */}
      <PerformancePanel />
    </div>
  );
}

export default App;
