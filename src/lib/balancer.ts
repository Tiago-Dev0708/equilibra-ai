import { Player, PlayerWithElo, Team } from './types';
import { LEVEL_POINTS } from './levels';
import { RoleRequirement } from './positions';

const ATTEMPTS = 200;

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Do mais forte para o mais fraco, embaralhando dentro de cada nível. */
function strongestFirst(pool: PlayerWithElo[]) {
  return [
    ...shuffle(pool.filter((p) => p.elo === 'high')),
    ...shuffle(pool.filter((p) => p.elo === 'mid')),
    ...shuffle(pool.filter((p) => p.elo === 'low')),
  ];
}

function countPosition(team: Team, position: string) {
  return team.players.filter((p) => p.position === position).length;
}

function addTo(team: Team, player: PlayerWithElo) {
  team.players.push(player);
  team.totalScore += player.score;
}

/**
 * Distribui os jogadores em `numTeams` times minimizando a diferença de
 * pontuação (Alto = 3, Médio = 2, Baixo = 1) e espalhando os jogadores de
 * nível alto. Com `requirements` (vôlei), primeiro garante as posições
 * mínimas em cada time — ex.: 1 levantador e 2 ponteiros — e depois
 * completa com os demais. Roda várias tentativas e fica com a mais justa.
 */
export function balanceTeams(
  players: Player[],
  sportId: string,
  teamSize: number,
  numTeams?: number,
  requirements: RoleRequirement[] = []
): Team[] {
  const teamsCount = numTeams || Math.max(2, Math.floor(players.length / teamSize));
  if (players.length < teamsCount || teamsCount < 2) return [];

  const pool: PlayerWithElo[] = players.map((p) => {
    const elo = p.elos[sportId] || 'mid';
    return {
      id: p.id,
      name: p.name,
      elo,
      score: LEVEL_POINTS[elo],
      position: requirements.length > 0 ? p.volleyPosition : undefined,
    };
  });

  const maxPerTeam = Math.ceil(pool.length / teamsCount);

  let best: Team[] = [];
  let bestPenalty = Infinity;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const teams: Team[] = Array.from({ length: teamsCount }, () => ({
      players: [],
      totalScore: 0,
    }));
    const placed = new Set<string>();

    // 1. Posições obrigatórias: cada time recebe o seu antes de alguém receber o segundo.
    for (const { position, min } of requirements) {
      const candidates = strongestFirst(pool.filter((p) => p.position === position));
      for (const player of candidates.slice(0, min * teamsCount)) {
        const target = teams
          .filter((t) => t.players.length < maxPerTeam && countPosition(t, position) < min)
          .sort(
            (a, b) =>
              countPosition(a, position) - countPosition(b, position) ||
              a.totalScore - b.totalScore ||
              Math.random() - 0.5
          )[0];
        if (!target) break;
        addTo(target, player);
        placed.add(player.id);
      }
    }

    // 2. Demais jogadores: cada um vai para o time mais fraco com vaga.
    for (const player of strongestFirst(pool.filter((p) => !placed.has(p.id)))) {
      const target = teams
        .filter((t) => t.players.length < maxPerTeam)
        .sort(
          (a, b) =>
            a.totalScore - b.totalScore ||
            a.players.length - b.players.length ||
            Math.random() - 0.5
        )[0];
      addTo(target, player);
    }

    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    let penalty =
      spread(teams.map((t) => t.totalScore)) * 10 +
      spread(teams.map((t) => t.players.filter((p) => p.elo === 'high').length)) * 5;
    for (const { position } of requirements) {
      // Prefere espalhar também os excedentes (ex.: não juntar dois levantadores).
      penalty += spread(teams.map((t) => countPosition(t, position))) * 2;
    }

    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = teams;
      if (penalty === 0) break;
    }
  }

  return best;
}

export function scoreSpread(teams: Team[]): number {
  if (teams.length === 0) return 0;
  const scores = teams.map((t) => t.totalScore);
  return Math.max(...scores) - Math.min(...scores);
}
