/**
 * PerformancePanel — floating overlay showing live timing and pipeline metadata.
 *
 * Concepts demonstrated:
 *   → Performance measurement: custom marks via performance.now() capture
 *     real timings for each stage of the data pipeline.
 *   → Web Vitals awareness: in production you would report LCP/CLS/INP here
 *     using the web-vitals library or PerformanceObserver.
 *   → Observability: making the system's behaviour visible helps developers
 *     understand and optimise the pipeline.
 */

import { useAtomValue } from 'jotai';
import { perfAtom } from '../state';

function fmt(ms: number | null): string {
  if (ms === null) return '—';
  return `${Math.round(ms)} ms`;
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/40 text-[11px]">{label}</span>
      <span className={`text-[11px] font-mono ${highlight ? 'text-green-400' : 'text-white/70'}`}>
        {value}
      </span>
    </div>
  );
}

export function PerformancePanel() {
  const perf = useAtomValue(perfAtom);

  const elapsed = (at: number | null) =>
    at !== null ? at - perf.startedAt : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900/90 backdrop-blur border border-white/10 rounded-xl p-4 w-56 space-y-1.5 shadow-2xl">
      <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">
        Pipeline Timing
      </p>
      <Row label="Hero loaded" value={fmt(elapsed(perf.heroLoadedAt))} />
      <Row label="Metrics loaded" value={fmt(elapsed(perf.metricsLoadedAt))} />
      <Row label="First batch" value={fmt(elapsed(perf.firstBatchAt))} />
      <Row label="All batches" value={fmt(elapsed(perf.allBatchesAt))} />
      <div className="border-t border-white/10 pt-1.5 mt-1.5 space-y-1.5">
        <Row
          label="Web Worker"
          value={perf.workerActive ? 'active' : 'fallback'}
          highlight={perf.workerActive}
        />
      </div>
      <p className="text-[9px] text-white/20 pt-1">
        Times relative to page load. In production: report LCP, CLS, INP via
        PerformanceObserver or web-vitals.
      </p>
    </div>
  );
}
