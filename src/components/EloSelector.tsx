'use client';

import { Elo } from '@/lib/types';
import { getEloShortLabel, getEloLabel, getEloBgColor } from '@/lib/balancer';

interface EloSelectorProps {
  value: Elo;
  onChange: (elo: Elo) => void;
  size?: 'sm' | 'md';
}

const elos: Elo[] = ['high', 'mid', 'low'];

export default function EloSelector({ value, onChange, size = 'md' }: EloSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {elos.map((elo) => {
        const isSelected = value === elo;
        const label = size === 'sm' ? getEloShortLabel(elo) : getEloLabel(elo);
        return (
          <button
            type="button"
            key={elo}
            onClick={() => onChange(elo)}
            className={`rounded-lg font-medium transition-all duration-200 border cursor-pointer ${
              size === 'sm'
                ? 'px-2 py-0.5 text-xs'
                : 'px-3 py-1.5 text-xs sm:text-sm'
            } ${
              isSelected
                ? `${getEloBgColor(elo)} font-semibold shadow-sm`
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
