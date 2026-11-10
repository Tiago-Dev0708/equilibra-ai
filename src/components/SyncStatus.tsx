'use client';

import { StorageMode } from '@/lib/types';
import { SyncState } from '@/lib/usePlayers';

interface SyncStatusProps {
  storage: StorageMode | null;
  sync: SyncState;
}

export default function SyncStatus({ storage, sync }: SyncStatusProps) {
  let label: string;
  let dot: string;
  let title: string | undefined;

  if (sync === 'loading') {
    label = 'Carregando';
    dot = 'bg-faint animate-pulse';
  } else if (sync === 'saving') {
    label = 'Salvando';
    dot = 'bg-warning animate-pulse';
  } else if (sync === 'error') {
    label = 'Falha ao sincronizar';
    dot = 'bg-danger';
    title = 'As alterações estão guardadas neste navegador e serão enviadas na próxima gravação.';
  } else if (storage === 'cloud') {
    label = 'Sincronizado';
    dot = 'bg-accent';
    title = 'Lista salva no banco do projeto e compartilhada entre dispositivos.';
  } else if (storage === 'file') {
    label = 'Salvo localmente';
    dot = 'bg-accent';
    title = 'Ambiente de desenvolvimento: gravando em .data/players.json.';
  } else {
    label = 'Salvo neste navegador';
    dot = 'bg-faint';
    title = 'Conecte o Upstash Redis na Vercel (aba Storage) para compartilhar a lista entre dispositivos.';
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted"
      title={title}
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
