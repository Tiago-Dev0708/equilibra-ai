'use client';

import { Elo } from '@/lib/types';
import { SPORTS } from '@/lib/sports';
import { getEloShortLabel, getEloBgColor } from '@/lib/balancer';

interface SportEloPickerProps {
  elos: Record<string, Elo>;
  onChange: (newElos: Record<string, Elo>) => void;
}

export default function SportEloPicker({ elos, onChange }: SportEloPickerProps) {
  const toggleSport = (sportId: string) => {
    const updated = { ...elos };
    if (updated[sportId]) {
      delete updated[sportId];
    } else {
      updated[sportId] = 'mid'; // Default when activating
    }
    onChange(updated);
  };

  const setSportElo = (sportId: string, elo: Elo) => {
    onChange({
      ...elos,
      [sportId]: elo,
    });
  };

  const selectAll = () => {
    const all: Record<string, Elo> = {};
    SPORTS.forEach((s) => {
      all[s.id] = elos[s.id] || 'mid';
    });
    onChange(all);
  };

  const deselectAll = () => {
    onChange({});
  };

  const activeCount = Object.keys(elos).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Modalidades praticadas ({activeCount} de {SPORTS.length})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
          >
            Marcar todos
          </button>
          <span className="text-zinc-600">•</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
          >
            Desmarcar todos
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {SPORTS.map((sport) => {
          const plays = elos[sport.id] !== undefined;
          const currentElo = elos[sport.id] || 'mid';

          return (
            <div
              key={sport.id}
              className={`p-2.5 rounded-xl border transition-all ${
                plays
                  ? 'border-violet-500/40 bg-zinc-900/90 shadow-sm'
                  : 'border-zinc-800/60 bg-zinc-950/40 opacity-70 hover:opacity-100 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Toggle checkbox & name */}
                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={plays}
                    onChange={() => toggleSport(sport.id)}
                    className="w-4 h-4 rounded border-zinc-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-zinc-950 bg-zinc-800 cursor-pointer"
                  />
                  <span className="text-lg leading-none shrink-0">{sport.emoji}</span>
                  <div className="truncate">
                    <span
                      className={`text-xs font-semibold block truncate ${
                        plays ? 'text-zinc-100' : 'text-zinc-400'
                      }`}
                    >
                      {sport.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 block truncate">
                      {sport.description}
                    </span>
                  </div>
                </label>

                {/* Elo selection or "Não joga" indicator */}
                <div className="shrink-0 flex items-center">
                  {plays ? (
                    <div className="flex gap-1">
                      {(['high', 'mid', 'low'] as Elo[]).map((elo) => {
                        const isSelected = currentElo === elo;
                        return (
                          <button
                            key={elo}
                            type="button"
                            onClick={() => setSportElo(sport.id, elo)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? `${getEloBgColor(elo)} shadow-sm`
                                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            {getEloShortLabel(elo)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleSport(sport.id)}
                      className="text-[11px] font-medium text-zinc-500 hover:text-violet-300 px-2 py-0.5 rounded-lg border border-dashed border-zinc-800 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all cursor-pointer"
                    >
                      + Ativar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

