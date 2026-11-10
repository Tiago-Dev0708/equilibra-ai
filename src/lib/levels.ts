import { Elo } from './types';

export const LEVELS: Elo[] = ['high', 'mid', 'low'];

export const LEVEL_POINTS: Record<Elo, number> = {
  high: 3,
  mid: 2,
  low: 1,
};

export const LEVEL_LABEL: Record<Elo, string> = {
  high: 'Alto',
  mid: 'Médio',
  low: 'Baixo',
};

/** Classe de cor do marcador (ponto) de cada nível. */
export const LEVEL_DOT: Record<Elo, string> = {
  high: 'bg-level-high',
  mid: 'bg-level-mid',
  low: 'bg-level-low',
};

export function isElo(value: unknown): value is Elo {
  return value === 'high' || value === 'mid' || value === 'low';
}
