'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Elo } from '@/lib/types';
import { SPORTS } from '@/lib/sports';
import {
  loadPlayers,
  savePlayers,
  exportPlayersJSON,
  importPlayersJSON,
  generateId,
} from '@/lib/storage';
import { getEloShortLabel, getEloBgColor } from '@/lib/balancer';
import defaultPlayersData from '@/data/players.json';
import EloSelector from '@/components/EloSelector';
import Modal from '@/components/Modal';

export default function JogadoresPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newName, setNewName] = useState('');
  const [newElos, setNewElos] = useState<Record<string, Elo>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlayers(loadPlayers());
  }, []);

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleAdd = useCallback(() => {
    if (!newName.trim()) return;
    const player: Player = {
      id: generateId(),
      name: newName.trim(),
      elos: { ...newElos },
    };
    const updated = [player, ...players];
    setPlayers(updated);
    savePlayers(updated);
    setNewName('');
    setNewElos({});
    setShowAddModal(false);
  }, [newName, newElos, players]);

  const handleEdit = useCallback(() => {
    if (!editingPlayer || !newName.trim()) return;
    const updated = players.map((p) =>
      p.id === editingPlayer.id
        ? { ...p, name: newName.trim(), elos: { ...newElos } }
        : p
    );
    setPlayers(updated);
    savePlayers(updated);
    setEditingPlayer(null);
    setNewName('');
    setNewElos({});
  }, [editingPlayer, newName, newElos, players]);

  const handleDelete = useCallback(
    (id: string) => {
      const updated = players.filter((p) => p.id !== id);
      setPlayers(updated);
      savePlayers(updated);
      setDeleteConfirm(null);
    },
    [players]
  );

  const openEdit = useCallback((player: Player) => {
    setEditingPlayer(player);
    setNewName(player.name);
    setNewElos({ ...player.elos });
  }, []);

  const handleExport = useCallback(() => {
    const json = exportPlayersJSON(players);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [players]);

  const handleRestoreDefaults = useCallback(() => {
    if (confirm('Deseja restaurar a lista padrão com jogadores de exemplo?')) {
      const defaults = defaultPlayersData as Player[];
      setPlayers(defaults);
      savePlayers(defaults);
    }
  }, []);

  const handleImport = useCallback(() => {
    const imported = importPlayersJSON(importText);
    if (!imported || imported.length === 0) {
      setImportError('JSON inválido ou vazio. Formato esperado: array de jogadores com id, name e elos.');
      return;
    }
    const existingNames = new Set(players.map((p) => p.name.toLowerCase()));
    const newOnes = imported.filter((p) => !existingNames.has(p.name.toLowerCase()));
    const updated = [...players, ...newOnes];
    setPlayers(updated);
    savePlayers(updated);
    setShowImportModal(false);
    setImportText('');
    setImportError('');
  }, [importText, players]);

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportText(text);
      };
      reader.readAsText(file);
    },
    []
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              Gerenciar Jogadores
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
              {players.length} cadastrados
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Cada jogador tem seu nível salvo por modalidade. Se alterar o esporte, mantemos o mesmo jogador com o elo respectivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            title="Importar arquivo JSON de jogadores"
          >
            <span>📥</span> Importar JSON
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={players.length === 0}
            className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
            title="Baixar arquivo JSON para salvar no repositório / commit"
          >
            <span>📤</span> Salvar JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setNewName('');
              setNewElos({});
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo Jogador
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Buscar jogador por nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
        />
      </div>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl p-8">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-zinc-400 text-sm font-medium">
            {players.length === 0
              ? 'Nenhum jogador cadastrado no momento.'
              : 'Nenhum jogador encontrado com essa busca.'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Cadastrar Jogador
            </button>
            {players.length === 0 && (
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
              >
                Carregar Jogadores de Exemplo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPlayers.map((player) => {
            const eloEntries = Object.entries(player.elos);
            return (
              <div
                key={player.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70 transition-all gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-sm sm:text-base text-zinc-100">
                      {player.name}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {eloEntries.length} esporte{eloEntries.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {eloEntries.map(([sportId, elo]) => {
                      const sport = SPORTS.find((s) => s.id === sportId);
                      if (!sport) return null;
                      return (
                        <span
                          key={sportId}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${getEloBgColor(
                            elo
                          )}`}
                          title={`${sport.name}: ${getEloShortLabel(elo)}`}
                        >
                          <span>{sport.emoji}</span>
                          <span>{sport.name.split(' ')[0]}</span>
                          <span className="opacity-75">• {getEloShortLabel(elo)}</span>
                        </span>
                      );
                    })}
                    {eloEntries.length === 0 && (
                      <span className="text-xs text-zinc-500 italic">
                        Sem avaliações específicas (assume Médio por padrão)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(player)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Editar Elos do Jogador"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  {deleteConfirm === player.id ? (
                    <div className="flex items-center gap-1 bg-red-950/40 p-1 rounded-lg border border-red-500/30">
                      <button
                        type="button"
                        onClick={() => handleDelete(player.id)}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-red-600 text-white hover:bg-red-500 transition-all cursor-pointer"
                      >
                        Excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(player.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Excluir Jogador"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || !!editingPlayer}
        onClose={() => {
          setShowAddModal(false);
          setEditingPlayer(null);
          setNewName('');
          setNewElos({});
        }}
        title={editingPlayer ? `Editar: ${editingPlayer.name}` : 'Cadastrar Novo Jogador'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Nome Completo / Apelido
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                (editingPlayer ? handleEdit() : handleAdd())
              }
              placeholder="Ex: Carlos, Mariana, Dudu..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Classificação por Modalidade
              </label>
              <span className="text-[11px] text-zinc-500">
                (opcional — padrão é Mid)
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {SPORTS.map((sport) => {
                const current = newElos[sport.id] || 'mid';
                return (
                  <div
                    key={sport.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80"
                  >
                    <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5 truncate pr-2">
                      <span>{sport.emoji}</span>
                      <span className="truncate">{sport.name}</span>
                    </span>
                    <EloSelector
                      value={current}
                      onChange={(elo) =>
                        setNewElos((prev) => ({ ...prev, [sport.id]: elo }))
                      }
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingPlayer(null);
                setNewName('');
                setNewElos({});
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={editingPlayer ? handleEdit : handleAdd}
              disabled={!newName.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all cursor-pointer"
            >
              {editingPlayer ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportText('');
          setImportError('');
        }}
        title="Importar Lista de Jogadores"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Selecione o arquivo players.json
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 file:cursor-pointer mb-3"
            />
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Ou cole o JSON diretamente:
            </label>
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError('');
              }}
              placeholder='[{"id":"p1","name":"Neymar","elos":{"futsal":"high"}}]'
              rows={6}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            />
            {importError && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{importError}</p>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                setShowImportModal(false);
                setImportText('');
                setImportError('');
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all cursor-pointer"
            >
              Importar Dados
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
