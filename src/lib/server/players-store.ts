import { promises as fs } from 'fs';
import path from 'path';
import seedPlayers from '@/data/players.json';
import { Player } from '@/lib/types';
import { sanitizePlayers } from '@/lib/validate';

/**
 * Persistência da lista de jogadores.
 *
 * - cloud: Redis via API REST da Upstash. É o banco que a Vercel conecta pela
 *   aba Storage (Marketplace > Upstash for Redis); as variáveis de ambiente
 *   são injetadas automaticamente no projeto.
 * - file:  desenvolvimento local sem Redis, grava em `.data/players.json`.
 * - none:  rodando na Vercel sem banco conectado (somente leitura).
 *
 * `src/data/players.json` é apenas a lista inicial: é usada enquanto o banco
 * ainda não tem nenhum dado salvo.
 */

export type ServerStorage = 'cloud' | 'file' | 'none';

const REDIS_KEY = 'equilibra_players';
const LOCAL_FILE = path.join(process.cwd(), '.data', 'players.json');

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

export function getStorageMode(): ServerStorage {
  if (redisConfig()) return 'cloud';
  if (!process.env.VERCEL) return 'file';
  return 'none';
}

async function redisCommand(command: string[]): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error('Redis não configurado');

  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => null)) as { result?: unknown; error?: string } | null;
  if (!res.ok || !data || data.error) {
    throw new Error(`Redis respondeu ${res.status}: ${data?.error ?? 'sem corpo'}`);
  }
  return data.result;
}

function parseStored(raw: unknown): Player[] | null {
  let value = raw;
  // Versões anteriores gravavam a lista serializada duas vezes.
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return sanitizePlayers(value);
}

function seed(): Player[] {
  return sanitizePlayers(seedPlayers) ?? [];
}

export async function readPlayers(): Promise<{ players: Player[]; storage: ServerStorage }> {
  const storage = getStorageMode();

  if (storage === 'cloud') {
    const raw = await redisCommand(['GET', REDIS_KEY]);
    if (raw === null || raw === undefined) return { players: seed(), storage };
    const players = parseStored(raw);
    if (!players) throw new Error('Conteúdo inválido no Redis');
    return { players, storage };
  }

  if (storage === 'file') {
    try {
      const content = await fs.readFile(LOCAL_FILE, 'utf-8');
      return { players: parseStored(content) ?? seed(), storage };
    } catch {
      return { players: seed(), storage };
    }
  }

  return { players: seed(), storage };
}

export async function writePlayers(players: Player[]): Promise<ServerStorage> {
  const storage = getStorageMode();

  if (storage === 'cloud') {
    await redisCommand(['SET', REDIS_KEY, JSON.stringify(players)]);
  } else if (storage === 'file') {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, JSON.stringify(players, null, 2) + '\n', 'utf-8');
  } else {
    throw new Error('Nenhum armazenamento configurado');
  }

  return storage;
}
