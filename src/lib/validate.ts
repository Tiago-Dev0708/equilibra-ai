import { Elo, Player } from './types';
import { SPORT_IDS } from './sports';
import { isElo } from './levels';
import { isVolleyPosition } from './positions';

export const MAX_PLAYERS = 500;
export const MAX_NAME_LENGTH = 60;
const MAX_ID_LENGTH = 64;

/** Normaliza um jogador vindo de fonte externa. Retorna null se for inválido. */
export function sanitizePlayer(input: unknown): Player | null {
  if (!input || typeof input !== 'object') return null;
  const { id, name, elos, volleyPosition } = input as Record<string, unknown>;

  if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_LENGTH) return null;
  if (typeof name !== 'string') return null;
  const cleanName = name.trim().slice(0, MAX_NAME_LENGTH);
  if (!cleanName) return null;

  const cleanElos: Record<string, Elo> = {};
  if (elos && typeof elos === 'object') {
    for (const [sportId, level] of Object.entries(elos as Record<string, unknown>)) {
      if (SPORT_IDS.has(sportId) && isElo(level)) cleanElos[sportId] = level;
    }
  }

  const player: Player = { id, name: cleanName, elos: cleanElos };
  if (isVolleyPosition(volleyPosition)) player.volleyPosition = volleyPosition;
  return player;
}

/**
 * Valida uma lista inteira (uso no servidor): qualquer item inválido ou id
 * duplicado invalida o payload todo.
 */
export function sanitizePlayers(input: unknown): Player[] | null {
  if (!Array.isArray(input) || input.length > MAX_PLAYERS) return null;
  const seen = new Set<string>();
  const result: Player[] = [];
  for (const item of input) {
    const player = sanitizePlayer(item);
    if (!player || seen.has(player.id)) return null;
    seen.add(player.id);
    result.push(player);
  }
  return result;
}
