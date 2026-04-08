/**
 * Web Worker — Data Processor
 *
 * Concept demonstrated:
 *   → Off-main-thread processing: CPU-bound work (normalisation, derived-field
 *     computation, sorting) runs in a separate OS thread so the main thread stays
 *     free for rendering and user interaction.
 *   → In a real high-throughput pipeline 2-4 workers would form a pool, each
 *     handling a slice of the incoming data stream concurrently.
 *
 * Message protocol:
 *   IN  { type: 'PROCESS_BATCH', payload: RawFeedItem[], batchId: number }
 *   OUT { type: 'BATCH_PROCESSED', payload: ProcessedFeedItem[], batchId: number }
 */

// Inline types to avoid DOM ↔ WebWorker lib conflicts.
interface RawFeedItem {
  id: number;
  title: string;
  description: string;
  value: number;
  timestamp: number;
}

interface ProcessedFeedItem extends RawFeedItem {
  category: 'high' | 'medium' | 'low';
  formattedValue: string;
  ageLabel: string;
}

interface IncomingMessage {
  type: 'PROCESS_BATCH';
  payload: RawFeedItem[];
  batchId: number;
}

// ─── Processing logic ────────────────────────────────────────────────────────

function deriveCategory(value: number): 'high' | 'medium' | 'low' {
  if (value > 66) return 'high';
  if (value > 33) return 'medium';
  return 'low';
}

function deriveAgeLabel(timestamp: number): string {
  const ageMs = Date.now() - timestamp;
  const hours = Math.floor(ageMs / 3_600_000);
  const minutes = Math.floor(ageMs / 60_000);
  return hours > 0 ? `${hours}h ago` : `${minutes}m ago`;
}

function processItem(item: RawFeedItem): ProcessedFeedItem {
  return {
    ...item,
    category: deriveCategory(item.value),
    formattedValue: item.value.toString().padStart(3, '0'),
    ageLabel: deriveAgeLabel(item.timestamp),
  };
}

// ─── Message handler ─────────────────────────────────────────────────────────

addEventListener('message', (event: Event) => {
  const msg = (event as MessageEvent).data as IncomingMessage;
  if (msg.type === 'PROCESS_BATCH') {
    const processed: ProcessedFeedItem[] = msg.payload.map(processItem);
    postMessage({ type: 'BATCH_PROCESSED', payload: processed, batchId: msg.batchId });
  }
});
