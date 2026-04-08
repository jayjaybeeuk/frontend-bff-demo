import { atom } from 'jotai';
import type { HeroData, MetricCard } from '../bff';
import type { ProcessedFeedItem } from '../types/feed';

// ─── Re-exported types (kept for backwards compatibility with existing tests) ─

/** @deprecated Use ProcessedFeedItem from types/feed instead. */
export type DataItem = ProcessedFeedItem;

// ─── Feed atoms ───────────────────────────────────────────────────────────────

export const dataAtom = atom<ProcessedFeedItem[]>([]);
export const loadingAtom = atom<boolean>(true);
export const errorAtom = atom<string | null>(null);

// ─── Hero atoms (CRITICAL priority) ──────────────────────────────────────────

export const heroAtom = atom<HeroData | null>(null);
export const heroLoadingAtom = atom<boolean>(true);

// ─── Metrics atoms (HIGH priority) ───────────────────────────────────────────

export const metricsAtom = atom<MetricCard[]>([]);
export const metricsLoadingAtom = atom<boolean>(true);

// ─── Performance tracking ─────────────────────────────────────────────────────

export interface PerfMetrics {
  /** performance.now() at the moment the page started loading. */
  startedAt: number;
  heroLoadedAt: number | null;
  metricsLoadedAt: number | null;
  firstBatchAt: number | null;
  allBatchesAt: number | null;
  workerActive: boolean;
}

export const perfAtom = atom<PerfMetrics>({
  startedAt: performance.now(),
  heroLoadedAt: null,
  metricsLoadedAt: null,
  firstBatchAt: null,
  allBatchesAt: null,
  workerActive: false,
});
