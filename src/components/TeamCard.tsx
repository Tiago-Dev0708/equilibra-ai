'use client';

import { Team } from '@/lib/types';
import { getEloShortLabel, getEloBgColor } from '@/lib/balancer';

interface TeamCardProps {
  team: Team;
  index: number;
}

const TEAM_THEMES = [
  {
    bg: 'from-violet-500/10 via-zinc-900 to-zinc-900',
    border: 'border-violet-500/30',
    accent: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  {
    bg: 'from-emerald-500/10 via-zinc-900 to-zinc-900',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    bg: 'from-amber-500/10 via-zinc-900 to-zinc-900',
    border: 'border-amber-500/30',
    accent: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    bg: 'from-cyan-500/10 via-zinc-900 to-zinc-900',
    border: 'border-cyan-500/30',
    accent: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    bg: 'from-rose-500/10 via-zinc-900 to-zinc-900',
    border: 'border-rose-500/30',
    accent: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    bg: 'from-fuchsia-500/10 via-zinc-900 to-zinc-900',
    border: 'border-fuchsia-500/30',
    accent: 'text-fuchsia-400',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
];

export default function TeamCard({ team, index }: TeamCardProps) {
  const theme = TEAM_THEMES[index % TEAM_THEMES.length];
  const highCount = team.players.filter((p) => p.elo === 'high').length;
  const midCount = team.players.filter((p) => p.elo === 'mid').length;
  const lowCount = team.players.filter((p) => p.elo === 'low').length;

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b ${theme.bg} ${theme.border} p-5 shadow-xl transition-all`}
    >
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
        <div>
          <h3 className={`font-bold text-lg tracking-tight ${theme.accent}`}>
            Time {String.fromCharCode(65 + index)}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {team.players.length} jogadores
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Força
            </span>
            <span className={`text-base font-extrabold ${theme.accent}`}>
              {team.totalScore} pts
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5 justify-end">
            {highCount > 0 && <span className="text-emerald-400">{highCount}H</span>}
            {midCount > 0 && <span className="text-amber-400">{midCount}M</span>}
            {lowCount > 0 && <span className="text-sky-400">{lowCount}L</span>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {team.players.map((player, pIdx) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800/60 rounded-xl px-3.5 py-2.5 transition-colors hover:border-zinc-700/60"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-zinc-500 font-mono w-4">
                {pIdx + 1}.
              </span>
              <span className="text-sm text-zinc-200 font-medium">
                {player.name}
              </span>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getEloBgColor(
                player.elo
              )}`}
            >
              {getEloShortLabel(player.elo)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
