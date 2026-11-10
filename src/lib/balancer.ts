import { Player, PlayerWithElo, Team, Elo } from './types';

const ELO_SCORES: Record<Elo, number> = {
  high: 3,
  mid: 2,
  low: 1,
};

export function getEloScore(elo: Elo): number {
  return ELO_SCORES[elo];
}

export function getEloLabel(elo: Elo): string {
  const labels: Record<Elo, string> = {
    high: 'High Elo (Craque)',
    mid: 'Mid Elo (Mediano)',
    low: 'Low Elo (Iniciante)',
  };
  return labels[elo];
}

export function getEloShortLabel(elo: Elo): string {
  const labels: Record<Elo, string> = {
    high: 'High',
    mid: 'Mid',
    low: 'Low',
  };
  return labels[elo];
}

export function getEloColor(elo: Elo): string {
  const colors: Record<Elo, string> = {
    high: 'text-emerald-400',
    mid: 'text-amber-400',
    low: 'text-sky-400',
  };
  return colors[elo];
}

export function getEloBgColor(elo: Elo): string {
  const colors: Record<Elo, string> = {
    high: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    mid: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    low: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
  };
  return colors[elo];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function balanceTeams(
  players: Player[],
  sportId: string,
  teamSize: number,
  customNumTeams?: number
): Team[] {
  if (players.length < 2) return [];

  const numTeams = customNumTeams || Math.max(2, Math.floor(players.length / teamSize));
  if (numTeams < 2) return [];

  // Map all selected players to PlayerWithElo
  const playersWithElo: PlayerWithElo[] = players.map((p) => {
    const elo = p.elos[sportId] || 'mid';
    return {
      id: p.id,
      name: p.name,
      elo,
      score: getEloScore(elo),
    };
  });

  const maxPlayersPerTeam = Math.ceil(playersWithElo.length / numTeams);
  const minPlayersPerTeam = Math.floor(playersWithElo.length / numTeams);

  // We run multiple randomized attempts and choose the one with best fairness score
  let bestTeams: Team[] | null = null;
  let bestPenalty = Infinity;

  const ATTEMPTS = 150;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const high = shuffleArray(playersWithElo.filter((p) => p.elo === 'high'));
    const mid = shuffleArray(playersWithElo.filter((p) => p.elo === 'mid'));
    const low = shuffleArray(playersWithElo.filter((p) => p.elo === 'low'));

    // Sequence to distribute: High first, then Low (to counterbalance), then Mid to fill gaps
    const ordered = [...high, ...mid, ...low];

    const currentTeams: Team[] = Array.from({ length: numTeams }, () => ({
      players: [],
      totalScore: 0,
    }));

    for (const player of ordered) {
      // Find eligible teams (those that haven't reached max capacity)
      const eligible = currentTeams.filter(
        (t) => t.players.length < maxPlayersPerTeam
      );

      // Among eligible, pick team with lowest total score
      // Tie breaker: fewer players, then random
      eligible.sort((a, b) => {
        if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
        if (a.players.length !== b.players.length) return a.players.length - b.players.length;
        return Math.random() - 0.5;
      });

      const target = eligible[0];
      target.players.push(player);
      target.totalScore += player.score;
    }

    // Evaluate fairness
    const scores = currentTeams.map((t) => t.totalScore);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreDiff = maxScore - minScore;

    // High Elo distribution check
    const highCounts = currentTeams.map(
      (t) => t.players.filter((p) => p.elo === 'high').length
    );
    const maxHigh = Math.max(...highCounts);
    const minHigh = Math.min(...highCounts);
    const highDiff = maxHigh - minHigh;

    // Penalty combines score variance, high elo variance, and player count balance
    const penalty = scoreDiff * 10 + highDiff * 5;

    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestTeams = currentTeams;
      if (penalty === 0) break; // Perfect balance reached
    }
  }

  return bestTeams || [];
}
