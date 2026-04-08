import { Skeleton } from './ui/skeleton';

export function SkeletonList() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded" />
      ))}
    </div>
  );
}
