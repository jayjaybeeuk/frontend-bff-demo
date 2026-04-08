# Frontend BFF Demo

A high-throughput, data-intensive landing page demo built with **React 18**, **TypeScript**, **Vite**, **Jotai**, and **Tailwind CSS**.

## Features

- ⚡ **Vite** for fast dev server and optimised production builds
- 🔷 **TypeScript** for type safety and maintainability
- 🎯 **Jotai** for minimal, atomic state management
- 💅 **Tailwind CSS** for utility-first styling with a shadcn/ui-inspired component layer
- 🗂 **Data virtualisation** via `@tanstack/react-virtual` – only DOM nodes in view are rendered
- 📦 **Batched data fetching** – data is loaded in configurable batch sizes to avoid blocking the main thread
- ✂️ **Code splitting & lazy loading** – `VirtualizedList` is loaded via `React.lazy` + `Suspense`
- 💀 **Skeleton loaders** – displayed while the first batch of data is in-flight
- 🛡 **Error boundaries** – graceful fallback UI for unexpected render errors
- 🧹 **ESLint + Prettier** for consistent code quality
- 🧪 **Vitest + React Testing Library** for unit and component tests

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |
| `npm run format` | Format source files with Prettier |

## Project Structure

```
src/
├── components/
│   ├── ui/
│   │   └── skeleton.tsx       # shadcn/ui-style Skeleton primitive
│   ├── ErrorBoundary.tsx      # Class-based error boundary
│   ├── SkeletonList.tsx       # Loading skeleton list
│   └── VirtualizedList.tsx   # Virtualised data list
├── hooks/
│   └── useBatchedFetch.ts    # Batched async data fetching hook
├── state/
│   └── index.ts              # Jotai atoms (data, loading, error)
├── test/
│   ├── setup.ts              # Vitest setup (jest-dom matchers)
│   ├── ErrorBoundary.test.tsx
│   ├── SkeletonList.test.tsx
│   └── state.test.ts
├── utils/
│   ├── cn.ts                 # Tailwind class merging utility
│   └── cn.test.ts
├── App.tsx                   # Root component with lazy loading
├── main.tsx                  # React DOM entry point
└── index.css                 # Tailwind directives + global styles
```

See [planning.md](./planning.md) for the full implementation plan.