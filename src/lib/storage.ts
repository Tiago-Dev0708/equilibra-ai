import { Player } from './types';
import { sanitizePlayer } from './validate';

const CACHE_KEY = 'equilibra-players-v1';

export type RemoteStorage = 'cloud' | 'file' | 'none';

export function readCachedPlayers(): Player[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(sanitizePlayer).filter((p): p is Player => p !== null);
  } catch {
    return null;
  }
}

export function writeCachedPlayers(players: Player[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(players));
  } catch {
    // modo privado / armazenamento cheio: segue só com o estado em memória
  }
}

export async function fetchRemotePlayers(): Promise<{
  players: Player[];
  storage: RemoteStorage;
} | null> {
  try {
    const res = await fetch('/api/players', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.players)) return null;
    return { players: data.players as Player[], storage: data.storage as RemoteStorage };
  } catch {
    return null;
  }
}

export type SaveResult =
  | { ok: true; storage: 'cloud' | 'file' }
  | { ok: false; unavailable: boolean };

export async function postRemotePlayers(players: Player[]): Promise<SaveResult> {
  try {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(players),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, storage: data.storage };
    }
    return { ok: false, unavailable: res.status === 503 };
  } catch {
    return { ok: false, unavailable: false };
  }
}

export function exportPlayersJSON(players: Player[]): string {
  return JSON.stringify(players, null, 2);
}

/** Importação tolerante: ignora itens inválidos em vez de rejeitar o arquivo. */
export function importPlayersJSON(json: string): Player[] | null {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return null;
    return data.map(sanitizePlayer).filter((p): p is Player => p !== null);
  } catch {
    return null;
  }
}

export function generateId(): string {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}
