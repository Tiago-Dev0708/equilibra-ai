import { Player } from './types';
import defaultPlayersData from '../data/players.json';

const STORAGE_KEY = 'equilibra-players-v1';

export function loadPlayers(): Player[] {
  if (typeof window === 'undefined') {
    return defaultPlayersData as Player[];
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading players from localStorage', err);
  }
  // Fallback to default bundled JSON if localStorage is empty
  return (defaultPlayersData as Player[]) || [];
}

export async function syncPlayersFromServer(): Promise<Player[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/players', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data as Player[];
      }
    }
  } catch (err) {
    console.error('Error syncing from server:', err);
  }
  return null;
}

export async function savePlayers(
  players: Player[]
): Promise<{ success?: boolean; provider?: string; message?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(players),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error saving players to server:', err);
  }
  return { success: true, provider: 'local' };
}

export function exportPlayersJSON(players: Player[]): string {
  return JSON.stringify(players, null, 2);
}

export function importPlayersJSON(json: string): Player[] | null {
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data)) {
      const validated: Player[] = [];
      for (const item of data) {
        if (
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          item.elos &&
          typeof item.elos === 'object'
        ) {
          validated.push({
            id: item.id,
            name: item.name.trim(),
            elos: item.elos,
          });
        }
      }
      return validated;
    }
  } catch (err) {
    console.error('Error parsing players JSON', err);
  }
  return null;
}

export function generateId(): string {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}
