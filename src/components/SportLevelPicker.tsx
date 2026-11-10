'use client';

import { Elo } from '@/lib/types';
import { SPORTS } from '@/lib/sports';
import SportIcon from './icons/SportIcon';
import CheckMark from './Checkbox';
import { LevelSelector } from './Level';

interface SportLevelPickerProps {
  elos: Record<string, Elo>;
  onChange: (next: Record<string, Elo>) => void;
}

export default function SportLevelPicker({ elos, onChange }: SportLevelPickerProps) {
  const activeCount = Object.keys(elos).length;

  const toggle = (sportId: string) => {
    const next = { ...elos };
    if (next[sportId]) delete next[sportId];
    else next[sportId] = 'mid';
    onChange(next);
  };

  const setLevel = (sportId: string, level: Elo) => onChange({ ...elos, [sportId]: level });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="field-label mb-0">
          Modalidades <span className="font-normal text-faint">· {activeCount} de {SPORTS.length}</span>
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="cursor-pointer text-xs text-muted hover:text-fg"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {SPORTS.map((sport) => {
          const level = elos[sport.id];
          const plays = level !== undefined;
          return (
            <div
              key={sport.id}
              className={`flex min-h-12 items-center justify-between gap-3 px-3 py-2 ${
                plays ? 'bg-surface' : 'bg-subtle/50'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(sport.id)}
                aria-pressed={plays}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                <CheckMark checked={plays} />
                <SportIcon
                  sportId={sport.id}
                  size={18}
                  className={plays ? 'text-fg' : 'text-faint'}
                />
                <span className={`truncate text-sm ${plays ? 'text-fg' : 'text-muted'}`}>
                  {sport.name}
                </span>
              </button>
              {plays && (
                <LevelSelector
                  value={level}
                  onChange={(l) => setLevel(sport.id, l)}
                  label={`Nível em ${sport.name}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
