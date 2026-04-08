import { useCallback, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { dataAtom, loadingAtom, errorAtom, DataItem } from '../state';

const BATCH_SIZE = 50;
const TOTAL_ITEMS = 500;

function generateBatch(start: number, size: number): DataItem[] {
  return Array.from({ length: size }, (_, i) => ({
    id: start + i,
    title: `Item ${start + i + 1}`,
    description: `Description for item ${start + i + 1}`,
    value: Math.floor(Math.random() * 100),
  }));
}

export function useBatchedFetch() {
  const setData = useSetAtom(dataAtom);
  const setLoading = useSetAtom(loadingAtom);
  const setError = useSetAtom(errorAtom);
  const abortRef = useRef<boolean>(false);

  const fetchAll = useCallback(async () => {
    abortRef.current = false;
    setLoading(true);
    setError(null);
    setData([]);

    try {
      let fetched: DataItem[] = [];
      for (let start = 0; start < TOTAL_ITEMS; start += BATCH_SIZE) {
        if (abortRef.current) break;
        // Simulate network latency per batch
        await new Promise((resolve) => setTimeout(resolve, 50));
        const batch = generateBatch(start, Math.min(BATCH_SIZE, TOTAL_ITEMS - start));
        fetched = [...fetched, ...batch];
        setData([...fetched]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { fetchAll, abort };
}
