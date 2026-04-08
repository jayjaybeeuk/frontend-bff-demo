/**
 * ConceptLabel — Educational annotation shown above each demo section.
 * Communicates which system-design concept(s) a section demonstrates
 * and its data-loading priority.
 */

import type { FetchPriority } from '../hooks/usePrioritizedFetch';

const PRIORITY_STYLES: Record<FetchPriority, { bg: string; text: string; label: string }> = {
  CRITICAL: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'CRITICAL' },
  HIGH: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'HIGH' },
  LOW: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'LOW' },
};

interface ConceptLabelProps {
  priority: FetchPriority;
  concepts: string[];
}

export function ConceptLabel({ priority, concepts }: ConceptLabelProps) {
  const { bg, text, label } = PRIORITY_STYLES[priority];
  return (
    <div className="flex items-center gap-3 mb-2 px-1">
      <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${bg} ${text}`}>
        {label}
      </span>
      <span className="text-xs text-white/40 font-mono">
        {concepts.join(' · ')}
      </span>
    </div>
  );
}
