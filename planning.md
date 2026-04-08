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

## Key Concepts Demonstrated

### Virtualisation
Only the DOM nodes currently visible in the scroll viewport are rendered. As the user scrolls, nodes are recycled. This allows tens of thousands of rows with near-constant memory and render cost.

### Batched Fetching
Data is fetched in configurable batches (`BATCH_SIZE = 50`, `TOTAL_ITEMS = 500`). After each batch the UI updates, providing progressive feedback without waiting for all data. This mirrors BFF (Backend for Frontend) patterns where the server streams or paginates responses.

### Code Splitting
`VirtualizedList` is imported via `React.lazy`, which means its JavaScript bundle is only downloaded when the component is first rendered. Combined with `Suspense`, users see the `SkeletonList` until the component is ready.

## References
- [Frontend System Design – High-Throughput Data-Intensive Landing Page](https://ujjwaltiwari2.medium.com/frontend-system-design-of-a-high-throughput-data-intensive-landing-page-784abb745eea)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Jotai Docs](https://jotai.org/)
