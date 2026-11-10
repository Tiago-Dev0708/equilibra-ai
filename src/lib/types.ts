import type { VolleyPosition } from './positions';

export type Elo = 'high' | 'mid' | 'low';

export interface Player {
  id: string;
  name: string;
  /** sportId -> nível. Só existem chaves para as modalidades que o jogador pratica. */
  elos: Record<string, Elo>;
  /** Posição no vôlei (quarteto e sexteto). */
  volleyPosition?: VolleyPosition;
}

export interface Sport {
  id: string;
  name: string;
  shortName: string;
  teamSize: number;
  description: string;
  /** Modalidade com posições definidas (vôlei quarteto/sexteto). */
  hasPositions?: boolean;
}

export interface PlayerWithElo {
  id: string;
  name: string;
  elo: Elo;
  score: number;
  position?: VolleyPosition;
}

export interface Team {
  players: PlayerWithElo[];
  totalScore: number;
}

/** Onde a lista de jogadores está sendo persistida. */
export type StorageMode = 'cloud' | 'file' | 'browser';
