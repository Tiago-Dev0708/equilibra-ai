'use client';

import { useMemo, useState } from 'react';
import { Elo, Player } from '@/lib/types';
import { SPORTS } from '@/lib/sports';
import { LEVEL_LABEL } from '@/lib/levels';
import { exportPlayersJSON, generateId, importPlayersJSON } from '@/lib/storage';
import { MAX_NAME_LENGTH } from '@/lib/validate';
import { usePlayers } from '@/lib/usePlayers';
import SportLevelPicker from '@/components/SportLevelPicker';
import SportIcon from '@/components/icons/SportIcon';
import Modal from '@/components/Modal';
import SyncStatus from '@/components/SyncStatus';
import { LevelDot } from '@/components/Level';
import PositionSelect from '@/components/PositionSelect';
import { POSITION_LABEL, VolleyPosition } from '@/lib/positions';
import {
  IconDownload,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
  IconUsers,
} from '@/components/icons/ui';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

export default function JogadoresPage() {
  const { players, ready, save, storage, sync } = usePlayers();

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formElos, setFormElos] = useState<Record<string, Elo>>({});
  const [formPosition, setFormPosition] = useState<VolleyPosition | undefined>(undefined);
  const formPlaysPositionSport = SPORTS.some((s) => s.hasPositions && formElos[s.id] !== undefined);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(search);
    return players
      .filter((p) => (q ? normalize(p.name).includes(q) : true))
      .filter((p) => (sportFilter === 'all' ? true : p.elos[sportFilter] !== undefined))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [players, search, sportFilter]);

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormElos({});
    setFormPosition(undefined);
    setEditorOpen(true);
  };

  const openEdit = (player: Player) => {
    setEditingId(player.id);
    setFormName(player.name);
    setFormElos({ ...player.elos });
    setFormPosition(player.volleyPosition);
    setEditorOpen(true);
  };

  const handleSubmit = () => {
    const name = formName.trim();
    if (!name) return;
    const volleyPosition = formPlaysPositionSport ? formPosition : undefined;
    if (editingId) {
      save(
        players.map((p) =>
          p.id === editingId ? { ...p, name, elos: { ...formElos }, volleyPosition } : p
        )
      );
    } else {
      save([{ id: generateId(), name, elos: { ...formElos }, volleyPosition }, ...players]);
    }
    setEditorOpen(false);
  };

  const handleDelete = (id: string) => {
    save(players.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    const blob = new Blob([exportPlayersJSON(players)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jogadores-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportText('');
    setImportError('');
  };

  const handleImport = () => {
    const imported = importPlayersJSON(importText);
    if (!imported || imported.length === 0) {
      setImportError('Arquivo inválido. O formato esperado é uma lista de jogadores com id, name e elos.');
      return;
    }
    const existingNames = new Set(players.map((p) => normalize(p.name)));
    const existingIds = new Set(players.map((p) => p.id));
    const additions = imported
      .filter((p) => !existingNames.has(normalize(p.name)))
      .map((p) => (existingIds.has(p.id) ? { ...p, id: generateId() } : p));
    save([...players, ...additions]);
    closeImport();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(String(event.target?.result ?? ''));
      setImportError('');
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-baseline gap-2.5 text-2xl font-semibold tracking-tight text-fg">
            Jogadores
            {ready && <span className="text-base font-normal text-faint tabular-nums">{players.length}</span>}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Cadastre quem joga e o nível de cada um em cada modalidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(true)}>
            <IconUpload />
            Importar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={players.length === 0}
          >
            <IconDownload />
            Exportar
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <IconPlus />
            Novo jogador
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome"
            aria-label="Buscar por nome"
            className="input pl-9"
          />
        </div>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          aria-label="Filtrar por modalidade"
          className="select sm:w-60"
        >
          <option value="all">Todas as modalidades</option>
          {SPORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 flex justify-end">
        <SyncStatus storage={storage} sync={sync} />
      </div>

      <div className="card overflow-hidden">
        {!ready ? (
          <div className="space-y-2 p-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-subtle" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-subtle text-muted">
              <IconUsers size={20} />
            </span>
            <p className="text-sm font-medium text-fg">
              {players.length === 0 ? 'Nenhum jogador cadastrado' : 'Nenhum jogador encontrado'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {players.length === 0
                ? 'Cadastre o primeiro jogador ou importe uma lista salva.'
                : 'Ajuste a busca ou o filtro de modalidade.'}
            </p>
            {players.length === 0 && (
              <button type="button" className="btn btn-primary btn-sm mt-5" onClick={openCreate}>
                <IconPlus size={15} />
                Novo jogador
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((player) => {
              const entries = SPORTS.filter((s) => player.elos[s.id] !== undefined).map((s) => ({
                sport: s,
                level: player.elos[s.id],
              }));
              const confirming = deleteConfirm === player.id;
              return (
                <li
                  key={player.id}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2 text-sm font-medium text-fg">
                      <span className="truncate">{player.name}</span>
                      {player.volleyPosition && (
                        <span className="shrink-0 text-xs font-normal text-faint">
                          {POSITION_LABEL[player.volleyPosition]}
                        </span>
                      )}
                    </p>
                    {entries.length === 0 ? (
                      <p className="mt-1 text-xs text-faint">Nenhuma modalidade definida</p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Modalidades de ${player.name}`}>
                        {entries.map(({ sport, level }) => (
                          <li
                            key={sport.id}
                            title={`${sport.name}: nível ${LEVEL_LABEL[level].toLowerCase()}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-subtle/60 py-0.5 pr-2 pl-1.5 text-xs text-muted"
                          >
                            <SportIcon sportId={sport.id} size={14} className="text-fg" />
                            {sport.shortName}
                            <LevelDot level={level} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                    {confirming ? (
                      <>
                        <span className="mr-1 text-xs text-muted">Excluir jogador?</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(player.id)}
                        >
                          Excluir
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => openEdit(player)}
                          title="Editar"
                          aria-label={`Editar ${player.name}`}
                        >
                          <IconPencil />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon hover:text-danger"
                          onClick={() => setDeleteConfirm(player.id)}
                          title="Excluir"
                          aria-label={`Excluir ${player.name}`}
                        >
                          <IconTrash />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Cadastro / edição */}
      <Modal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Editar jogador' : 'Novo jogador'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEditorOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="player-form" className="btn btn-primary" disabled={!formName.trim()}>
              {editingId ? 'Salvar' : 'Cadastrar'}
            </button>
          </>
        }
      >
        <form
          id="player-form"
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div>
            <label htmlFor="player-name" className="field-label">
              Nome
            </label>
            <input
              id="player-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Como o jogador é chamado no grupo"
              autoFocus
              className="input"
            />
          </div>
          <SportLevelPicker elos={formElos} onChange={setFormElos} />
          {formPlaysPositionSport && (
            <div>
              <label htmlFor="player-position" className="field-label">
                Posição no vôlei
              </label>
              <PositionSelect
                id="player-position"
                value={formPosition}
                onChange={setFormPosition}
                className="w-full"
              />
              <p className="mt-1.5 text-xs text-faint">
                Vale para quarteto e sexteto. Cada time recebe ao menos 1 levantador e 2 ponteiros.
              </p>
            </div>
          )}
        </form>
      </Modal>

      {/* Importar */}
      <Modal
        isOpen={importOpen}
        onClose={closeImport}
        title="Importar jogadores"
        description="Use um arquivo exportado pelo Equilibra. Jogadores com nomes já cadastrados são ignorados."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeImport}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              Importar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="import-file" className="field-label">
              Arquivo JSON
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:h-9 file:cursor-pointer file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:text-sm file:font-medium file:text-fg hover:file:bg-subtle"
            />
          </div>
          <div>
            <label htmlFor="import-text" className="field-label">
              Ou cole o conteúdo
            </label>
            <textarea
              id="import-text"
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError('');
              }}
              placeholder='[{"id": "p1", "name": "Ana", "elos": {"futsal": "high"}}]'
              rows={6}
              className="input h-auto resize-none py-2.5 font-mono text-xs leading-relaxed"
            />
            {importError && <p className="mt-2 text-xs text-danger">{importError}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
