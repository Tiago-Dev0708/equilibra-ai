export type Elo = 'high' | 'mid' | 'low';

export interface Player {
  id: string;
  name: string;
  elos: Record<string, Elo>; // sportId -> elo
}

export interface Sport {
  id: string;
  name: string;
  emoji: string;
  teamSize: number;
  description: string;
}

export interface Team {
  players: PlayerWithElo[];
  totalScore: number;
}

export interface PlayerWithElo {
  id: string;
  name: string;
  elo: Elo;
  score: number;
}

export interface SortResult {
  sport: Sport;
  teams: Team[];
  timestamp: string;
}
