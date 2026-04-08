/**
 * BFF (Backend for Frontend) — simulation layer.
 *
 * In a real system this would be a dedicated Node/Edge service that:
 *  • Aggregates data from multiple downstream microservices in parallel.
 *  • Returns UI-ready payloads so the browser makes one request instead of many.
 *  • Applies per-client transformations (locale, A/B variant, feature flags).
 *
 * Concept demonstrated:
 *   → BFF Pattern: one orchestration layer per client surface (web, mobile, …)
 *   → Parallel service calls: hero-service, metrics-service, feed-service fetched concurrently
 *   → Payload shaping: only the fields the UI actually needs are returned
 */

import type { RawFeedItem } from '../types/feed';

// ─── Data shapes returned by the BFF ────────────────────────────────────────

export interface HeroData {
  headline: string;
  subline: string;
  cta: string;
  badge: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  delta: number;
  trend: 'up' | 'down' | 'flat';
}

// ─── Simulated downstream microservices ─────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** hero-service: small payload, edge-cached, very fast. */
async function heroService(): Promise<HeroData> {
  await delay(80);
  return {
    headline: 'High-Throughput Data Platform',
    subline:
      'Real-time analytics across 500+ data points — served via a BFF with SWR caching and a Web Worker pipeline.',
    cta: 'Explore the Dashboard',
    badge: 'LIVE',
  };
}

/** metrics-service: aggregated KPIs, slightly slower. */
async function metricsService(): Promise<MetricCard[]> {
  await delay(140);
  return [
    { id: 'm1', label: 'Total Items', value: '500', delta: 12.4, trend: 'up' },
    { id: 'm2', label: 'Avg Value', value: '49.3', delta: -2.1, trend: 'down' },
    { id: 'm3', label: 'High Priority', value: '163', delta: 5.8, trend: 'up' },
    { id: 'm4', label: 'Cache Hit Rate', value: '94.2%', delta: 1.3, trend: 'up' },
  ];
}

/** feed-service: paginated high-volume data, streamed in batches. */
async function feedService(start: number, size: number): Promise<RawFeedItem[]> {
  await delay(50);
  return Array.from({ length: size }, (_, i) => ({
    id: start + i,
    title: `Item ${start + i + 1}`,
    description: `feed-service · batch @${start}`,
    value: Math.floor(Math.random() * 100),
    timestamp: Date.now() - Math.floor(Math.random() * 86_400_000),
  }));
}

// ─── BFF public API ──────────────────────────────────────────────────────────

/**
 * Fetches hero content (CRITICAL priority).
 * In production: cached at the edge, served in < 20 ms for repeat visitors.
 */
export function bffFetchHero(): Promise<HeroData> {
  return heroService();
}

/**
 * Fetches metric cards (HIGH priority).
 * In production: aggregated server-side from several KPI microservices.
 */
export function bffFetchMetrics(): Promise<MetricCard[]> {
  return metricsService();
}

/**
 * Fetches one page of the feed (LOW priority, batched).
 * In production: cursor-paginated, compressed with Brotli.
 */
export function bffFetchFeedBatch(start: number, size: number): Promise<RawFeedItem[]> {
  return feedService(start, size);
}
