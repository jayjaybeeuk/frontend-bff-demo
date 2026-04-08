# Implementation Planning

## Phase 1: Project Scaffold ✅
- Set up Vite + React + TypeScript
- Configure Tailwind CSS and PostCSS
- Add shadcn/ui-inspired Skeleton component
- Configure ESLint and Prettier
- Set up Vitest + React Testing Library

## Phase 2: State Management ✅
- Define Jotai atoms: `dataAtom`, `loadingAtom`, `errorAtom`
- Create `useBatchedFetch` hook for incremental data loading

## Phase 3: UI Components ✅
- `SkeletonList` – renders placeholder rows during initial load
- `ErrorBoundary` – class component catching render errors
- `VirtualizedList` – renders only visible rows using `@tanstack/react-virtual`

## Phase 4: Data Layer ✅
- `useBatchedFetch` simulates server-side BFF responses arriving in batches
- Data is merged incrementally into the Jotai `dataAtom`
- An abort flag allows in-flight fetches to be cancelled

## Phase 5: UX Enhancements ✅
- `VirtualizedList` is code-split via `React.lazy` + `Suspense`
- `SkeletonList` is the `Suspense` fallback for both lazy loading and data loading
- Error boundary wraps the entire app for resilience

## Phase 6: Documentation & Testing ✅
- README.md with full feature list, scripts, and project structure
- Unit tests for atoms, utility functions, and components
- planning.md (this file)

## Phase 7: High-Throughput Showcase ✅
Full implementation of the system-design patterns from the reference article.

### New files
| File | Purpose |
|---|---|
| `src/types/feed.ts` | Shared `RawFeedItem` / `ProcessedFeedItem` types used by both the main thread and the Web Worker |
| `src/bff/index.ts` | BFF simulation layer — `bffFetchHero`, `bffFetchMetrics`, `bffFetchFeedBatch` each map to a separate "microservice" with its own latency |
| `src/cache/swrCache.ts` | `SWRCache` class + module-level singleton; `get` returns `{ data, isStale }`, `set` stamps a `fetchedAt` timestamp |
| `src/workers/dataProcessor.worker.ts` | Web Worker — receives `PROCESS_BATCH` messages, derives `category`, `formattedValue`, `ageLabel` off the main thread, replies with `BATCH_PROCESSED` |
| `src/hooks/usePrioritizedFetch.ts` | Generic hook: checks SWR cache first, schedules the network fetch by priority (`queueMicrotask` / `rAF` / `rIC`), retries with exponential backoff |
| `src/hooks/useWorkerProcessor.ts` | React bridge to the Web Worker — creates/terminates the worker on mount/unmount, routes responses via a `batchId` map of Promise resolvers |
| `src/components/HeroSection.tsx` | CRITICAL-priority section; uses `usePrioritizedFetch` with `cacheKey: 'bff:hero'`; shows cache status badge |
| `src/components/MetricsSection.tsx` | HIGH-priority section; four KPI cards with trend arrows; shows SWR cache badge |
| `src/components/ConceptLabel.tsx` | Colour-coded annotation banner labelling each page section with its fetch priority and the concepts it demonstrates |
| `src/components/PerformancePanel.tsx` | Floating overlay showing hero/metrics/first-batch/all-batches timing (relative to `performance.now()` at page load) and Web Worker status |

### Modified files
| File | Change |
|---|---|
| `src/state/index.ts` | Added `heroAtom`, `heroLoadingAtom`, `metricsAtom`, `metricsLoadingAtom`, `perfAtom` (`PerfMetrics` interface); `dataAtom` now typed as `ProcessedFeedItem[]` |
| `src/hooks/useBatchedFetch.ts` | Replaced mock `generateBatch` with `bffFetchFeedBatch`; each batch is processed via `useWorkerProcessor` before state update; uses `AbortController` (replaces boolean flag); records `firstBatchAt` / `allBatchesAt` perf marks; exponential-backoff retry per batch |
| `src/components/VirtualizedList.tsx` | Each row now displays Worker-derived fields (`category` badge, `formattedValue`, `ageLabel`); status bar shows BFF batch progress |
| `src/App.tsx` | Full rework: three priority-labelled sections (CRITICAL → HIGH → LOW), each wrapped in its own `ErrorBoundary`; `PerformancePanel` always visible; architecture diagram in JSDoc |

---

## Key Concepts Demonstrated

### BFF Pattern
`src/bff/index.ts` simulates a dedicated Backend-for-Frontend layer that aggregates `hero-service` (80 ms), `metrics-service` (140 ms) and `feed-service` (50 ms/batch) into UI-ready payloads. In production this layer runs at the edge, reducing the browser's round-trips from N service calls to 1.

### Priority Scheduling
`usePrioritizedFetch` maps fetch priority to the appropriate browser scheduling API:
- `CRITICAL` → `queueMicrotask` (runs before the next paint)
- `HIGH` → `requestAnimationFrame` (after layout, within the same frame)
- `LOW` → `requestIdleCallback` / `setTimeout(50)` (browser idle time)

This ensures above-fold content wins CPU time over deferred content without any artificial delays.

### Stale-While-Revalidate Cache
`SWRCache` (module-level singleton) stores entries with a `fetchedAt` timestamp. On every mount `usePrioritizedFetch` checks the cache first:
- **Fresh hit** — returns immediately, no network request.
- **Stale hit** — returns the old data instantly and triggers a background revalidation; the UI updates silently when fresh data arrives.
- **Miss** — falls through to the scheduled network fetch.

### Web Worker Data Pipeline
Each feed batch travels through a two-stage pipeline:
1. `bffFetchFeedBatch` — fetches raw items from the BFF.
2. `useWorkerProcessor.processBatch` — posts the batch to `dataProcessor.worker.ts` via `postMessage` and awaits the `BATCH_PROCESSED` reply.

The worker derives `category`, `formattedValue` and `ageLabel` off the main thread, keeping the UI thread free for rendering and interaction.

### Progressive / Batched Loading
State is updated after every 50-item batch so the virtualised list grows visually as data streams in. Users never stare at a blank screen waiting for all 500 items.

### Exponential-Backoff Retry
Both `usePrioritizedFetch` and `useBatchedFetch` retry transient failures with delays of `baseDelay × 2^attempt` (100 ms, 200 ms, 400 ms, …), capped at `maxRetries = 3`.

### Skeleton UI / CLS = 0
`HeroSection` and `MetricsSection` render placeholder elements of the exact final dimensions before data arrives, preventing layout shift (target CLS = 0).

### Virtualisation
`VirtualizedList` uses TanStack Virtual to render only the DOM nodes in the scroll viewport (~12 nodes instead of 500), keeping layout cost near-constant regardless of list size.

### Code Splitting
`VirtualizedList` (which bundles TanStack Virtual) is loaded via `React.lazy` so its JS does not block the CRITICAL and HIGH sections from rendering.

### Error Boundaries
Each priority section has its own `ErrorBoundary` so a failure in one section does not unmount the others.

### Performance Measurement
`PerformancePanel` records `performance.now()` milestones at hero load, metrics load, first batch, and all batches, all relative to page load. In production these would feed into a Real User Monitoring (RUM) pipeline alongside LCP, CLS, and INP from the `web-vitals` library.

---

## References
- [Frontend System Design – High-Throughput Data-Intensive Landing Page](https://ujjwaltiwari2.medium.com/frontend-system-design-of-a-high-throughput-data-intensive-landing-page-784abb745eea)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Jotai Docs](https://jotai.org/)
- [Prioritized Task Scheduling API](https://developer.mozilla.org/en-US/docs/Web/API/Prioritized_Task_Scheduling_API)
- [Stale-While-Revalidate (RFC 5861)](https://www.rfc-editor.org/rfc/rfc5861)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
