// Shared types for feed items — used by both the main thread and the Web Worker.
// Keeping these in a separate file avoids DOM vs. WebWorker lib conflicts.

export interface RawFeedItem {
  id: number;
  title: string;
  description: string;
  value: number;
  timestamp: number;
}

export interface ProcessedFeedItem extends RawFeedItem {
  /** Derived by the Web Worker — not available until processing completes. */
  category: 'high' | 'medium' | 'low';
  /** Zero-padded value string, e.g. "007". Computed off the main thread. */
  formattedValue: string;
  /** Human-readable age, e.g. "3m ago". Computed off the main thread. */
  ageLabel: string;
}
