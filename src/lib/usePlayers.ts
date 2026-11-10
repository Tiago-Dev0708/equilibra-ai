'use client';

import { useCallback, useEffect, useState } from 'react';
import { Player, StorageMode } from './types';
import {
  fetchRemotePlayers,
  postRemotePlayers,
  readCachedPlayers,
  writeCachedPlayers,
} from './storage';

export type SyncState = 'loading' | 'saved' | 'saving' | 'error';

interface SyncStatus {
  storage: StorageMode | null;
  sync: SyncState;
}

// Estado de sincronização compartilhado entre as páginas (sobrevive à
// navegação client-side), com fila de gravação serializada: cada alteração
// substitui a pendente e as requisições nunca chegam fora de ordem.
let status: SyncStatus = { storage: null, sync: 'loading' };
const subscribers = new Set<(s: SyncStatus) => void>();
let queued: Player[] | null = null;
let flushing: Promise<void> | null = null;

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  subscribers.forEach((fn) => fn(status));
}

function enqueueSave(players: Player[]) {
  queued = players;
  if (flushing) return;
  flushing = (async () => {
    while (queued) {
      const batch = queued;
      queued = null;
      setStatus({ sync: 'saving' });
      const result = await postRemotePlayers(batch);
      if (result.ok) setStatus({ storage: result.storage, sync: 'saved' });
      else if (result.unavailable) setStatus({ storage: 'browser', sync: 'saved' });
      else setStatus({ sync: 'error' });
    }
  })().finally(() => {
    flushing = null;
  });
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncStatus>(status);

  useEffect(() => {
    subscribers.add(setSync);
    return () => {
      subscribers.delete(setSync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = readCachedPlayers();
      if (cached) {
        setPlayers(cached);
        setReady(true);
      }

      // Evita ler um estado antigo enquanto uma gravação ainda está em andamento.
      if (flushing) await flushing;
      const remote = await fetchRemotePlayers();
      if (cancelled) return;

      if (remote && remote.storage !== 'none') {
        setPlayers(remote.players);
        writeCachedPlayers(remote.players);
        setStatus({ storage: remote.storage, sync: 'saved' });
      } else if (remote) {
        // Servidor sem banco: o navegador é a fonte da verdade.
        if (!cached) setPlayers(remote.players);
        setStatus({ storage: 'browser', sync: 'saved' });
      } else {
        setStatus({ sync: 'error' });
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback((next: Player[]) => {
    setPlayers(next);
    writeCachedPlayers(next);
    enqueueSave(next);
  }, []);

  return { players, ready, save, storage: sync.storage, sync: sync.sync };
}
