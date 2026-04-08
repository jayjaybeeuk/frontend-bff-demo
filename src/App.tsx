import { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonList } from './components/SkeletonList';

const VirtualizedList = lazy(() =>
  import('./components/VirtualizedList').then((m) => ({ default: m.VirtualizedList }))
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonList />}>
        <VirtualizedList />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
