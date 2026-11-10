'use client';

import { Team } from '@/lib/types';
import { LEVELS, LEVEL_LABEL } from '@/lib/levels';
import { POSITION_LABEL, RoleRequirement, missingRoles, positionCount } from '@/lib/positions';
import { LevelDot, LevelTag } from './Level';

/** Cores de colete para identificar cada time. */
export const TEAM_COLORS = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#db2777', '#0891b2'];

export function teamLabel(index: number) {
  return `Time ${String.fromCharCode(65 + index)}`;
}

interface TeamCardProps {
  team: Team;
  index: number;
  totalTeams: number;
  onMovePlayer?: (fromTeam: number, playerIndex: number, toTeam: number) => void;
  /** Posições mínimas por time (vôlei). */
  requirements?: RoleRequirement[];
}

export default function TeamCard({
  team,
  index,
  totalTeams,
  onMovePlayer,
  requirements = [],
}: TeamCardProps) {
  const missing = missingRoles(team, requirements);
  const color = TEAM_COLORS[index % TEAM_COLORS.length];
  const counts = LEVELS.map((level) => ({
    level,
    count: team.players.filter((p) => p.elo === level).length,
  })).filter((c) => c.count > 0);

  return (
    <article className="card flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="size-3 rounded-[3px]" style={{ background: color }} />
          <h3 className="text-sm font-semibold text-fg">{teamLabel(index)}</h3>
          <span className="text-xs text-faint">{team.players.length} jogadores</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm font-medium text-fg tabular-nums">{team.totalScore}</span>
          <span className="ml-1 text-xs text-faint">pts</span>
        </div>
      </header>

      <ol className="flex-1 divide-y divide-line">
        {team.players.map((player, pIdx) => (
          <li key={player.id} className="flex items-center justify-between gap-2 px-4 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-4 shrink-0 text-right font-mono text-xs text-faint tabular-nums">
                {pIdx + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-fg">{player.name}</span>
                {requirements.length > 0 && (
                  <span className="block text-xs text-faint">
                    {player.position ? POSITION_LABEL[player.position] : 'Sem posição'}
                  </span>
                )}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LevelTag level={player.elo} />
              {totalTeams > 1 && onMovePlayer && (
                <select
                  value=""
                  onChange={(e) => {
                    const target = Number(e.target.value);
                    if (!Number.isNaN(target)) onMovePlayer(index, pIdx, target);
                  }}
                  aria-label={`Mover ${player.name} para outro time`}
                  className="h-7 cursor-pointer rounded-md border border-line bg-surface px-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg focus:border-accent focus:outline-none"
                >
                  <option value="" disabled>
                    Mover
                  </option>
                  {Array.from({ length: totalTeams }, (_, tIdx) =>
                    tIdx === index ? null : (
                      <option key={tIdx} value={tIdx}>
                        {teamLabel(tIdx)}
                      </option>
                    )
                  )}
                </select>
              )}
            </div>
          </li>
        ))}
      </ol>

      {counts.length > 0 && (
        <footer className="space-y-1.5 border-t border-line bg-subtle/40 px-4 py-2.5">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {counts.map(({ level, count }) => (
              <span key={level} className="inline-flex items-center gap-1.5 text-xs text-muted">
                <LevelDot level={level} />
                {count} {LEVEL_LABEL[level].toLowerCase()}
              </span>
            ))}
          </div>
          {missing.length > 0 && (
            <p className="text-xs font-medium text-warning">
              Falta {missing.map((m) => positionCount(m.missing, m.position)).join(' e ')}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
