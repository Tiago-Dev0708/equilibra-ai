'use client';

import { Sport } from '@/lib/types';
import { SPORTS } from '@/lib/sports';
import SportIcon from './icons/SportIcon';

interface SportSelectorProps {
  selectedSport: Sport | null;
  onSelect: (sport: Sport) => void;
}

export default function SportSelector({ selectedSport, onSelect }: SportSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {SPORTS.map((sport) => {
        const selected = selectedSport?.id === sport.id;
        return (
          <button
            key={sport.id}
            type="button"
            onClick={() => onSelect(sport)}
            aria-pressed={selected}
            className={`flex cursor-pointer flex-col gap-4 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected
                ? 'border-accent bg-accent-soft ring-1 ring-accent'
                : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            <span className="flex items-start justify-between">
              <SportIcon
                sportId={sport.id}
                size={22}
                className={selected ? 'text-accent' : 'text-fg'}
              />
              <span className="font-mono text-[11px] text-faint tabular-nums">
                {sport.teamSize}×{sport.teamSize}
              </span>
            </span>
            <span className="block">
              <span className="block text-sm leading-snug font-medium text-fg">{sport.name}</span>
              <span className="mt-0.5 block text-xs text-muted">{sport.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
