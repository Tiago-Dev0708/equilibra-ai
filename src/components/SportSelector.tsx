'use client';

import { Sport } from '@/lib/types';
import { SPORTS } from '@/lib/sports';

interface SportSelectorProps {
  selectedSport: Sport | null;
  onSelect: (sport: Sport) => void;
}

export default function SportSelector({ selectedSport, onSelect }: SportSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
      {SPORTS.map((sport) => {
        const isSelected = selectedSport?.id === sport.id;
        return (
          <button
            key={sport.id}
            type="button"
            onClick={() => onSelect(sport)}
            className={`group relative flex flex-col items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-violet-500/70 bg-gradient-to-b from-violet-500/20 to-violet-950/30 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/40'
                : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-2xl filter drop-shadow group-hover:scale-110 transition-transform">
                {sport.emoji}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isSelected
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                }`}
              >
                {sport.teamSize}x{sport.teamSize}
              </span>
            </div>
            <div className="w-full">
              <span
                className={`block text-xs font-semibold leading-snug line-clamp-2 ${
                  isSelected ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-100'
                }`}
              >
                {sport.name}
              </span>
              <span
                className={`block text-[11px] mt-0.5 line-clamp-1 ${
                  isSelected ? 'text-violet-300/80' : 'text-zinc-500'
                }`}
              >
                {sport.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
