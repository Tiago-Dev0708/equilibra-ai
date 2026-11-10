'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Sport, Team, Elo } from '@/lib/types';
import { SPORTS } from '@/lib/sports';
import {
  loadPlayers,
  syncPlayersFromServer,
  savePlayers,
  generateId,
} from '@/lib/storage';
import { balanceTeams, getEloShortLabel, getEloBgColor } from '@/lib/balancer';
import SportSelector from '@/components/SportSelector';
import EloSelector from '@/components/EloSelector';
import SportEloPicker from '@/components/SportEloPicker';
import TeamCard from '@/components/TeamCard';
import Modal from '@/components/Modal';

export default function SorteioPage() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(SPORTS[0]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerElos, setNewPlayerElos] = useState<Record<string, Elo>>({
    [SPORTS[0].id]: 'mid',
  });
  const [showOtherPlayers, setShowOtherPlayers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [numTeamsOverride, setNumTeamsOverride] = useState<number | null>(null);

  useEffect(() => {
    const loaded = loadPlayers();
    setAllPlayers(loaded);
    // Pre-select players who actually play the default sport
    if (loaded.length > 0 && SPORTS[0]) {
      const eligible = loaded.filter((p) => p.elos[SPORTS[0].id] !== undefined);
      setSelectedPlayerIds(new Set(eligible.map((p) => p.id)));
    }

    // Sync from cloud (Vercel KV or GitHub)
    syncPlayersFromServer().then((remote) => {
      if (remote && remote.length > 0) {
        setAllPlayers(remote);
      }
    });
  }, []);

  const handleSelectSport = useCallback((sport: Sport) => {
    setSelectedSport(sport);
    setTeams([]);
    setNumTeamsOverride(null);
    // Pre-select only players who actually practice this sport
    setAllPlayers((currentPlayers) => {
      const eligible = currentPlayers.filter((p) => p.elos[sport.id] !== undefined);
      setSelectedPlayerIds(new Set(eligible.map((p) => p.id)));
      return currentPlayers;
    });
  }, []);

  const togglePlayer = useCallback((playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
    setTeams([]);
  }, []);

  // Players who actively play the selected sport
  const sportPlayers = useMemo(() => {
    if (!selectedSport) return [];
    return allPlayers.filter((p) => p.elos[selectedSport.id] !== undefined);
  }, [allPlayers, selectedSport]);

  // Players who DO NOT currently play the selected sport
  const nonSportPlayers = useMemo(() => {
    if (!selectedSport) return [];
    return allPlayers.filter((p) => p.elos[selectedSport.id] === undefined);
  }, [allPlayers, selectedSport]);

  const handleSelectAllSportPlayers = useCallback(() => {
    if (!selectedSport) return;
    const ids = sportPlayers.map((p) => p.id);
    setSelectedPlayerIds(new Set(ids));
    setTeams([]);
  }, [selectedSport, sportPlayers]);

  const handleClearSelection = useCallback(() => {
    setSelectedPlayerIds(new Set());
    setTeams([]);
  }, []);

  const handleUpdatePlayerElo = useCallback(
    (playerId: string, elo: Elo) => {
      if (!selectedSport) return;
      const updated = allPlayers.map((p) =>
        p.id === playerId
          ? { ...p, elos: { ...p.elos, [selectedSport.id]: elo } }
          : p
      );
      setAllPlayers(updated);
      savePlayers(updated);
    },
    [allPlayers, selectedSport]
  );

  const handleEnableSportForPlayer = useCallback(
    (player: Player, initialElo: Elo = 'mid') => {
      if (!selectedSport) return;
      const updated = allPlayers.map((p) =>
        p.id === player.id
          ? { ...p, elos: { ...p.elos, [selectedSport.id]: initialElo } }
          : p
      );
      setAllPlayers(updated);
      savePlayers(updated);
      // Automatically check them in for the draw
      setSelectedPlayerIds((prev) => new Set(prev).add(player.id));
      setTeams([]);
    },
    [allPlayers, selectedSport]
  );

  const handleDisableSportForPlayer = useCallback(
    (playerId: string) => {
      if (!selectedSport) return;
      const updated = allPlayers.map((p) => {
        if (p.id !== playerId) return p;
        const newElos = { ...p.elos };
        delete newElos[selectedSport.id];
        return { ...p, elos: newElos };
      });
      setAllPlayers(updated);
      savePlayers(updated);
      setSelectedPlayerIds((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
      setTeams([]);
    },
    [allPlayers, selectedSport]
  );

  const handleOpenAddModal = useCallback(() => {
    setNewPlayerName('');
    // Initialize modal with only the currently active sport selected
    setNewPlayerElos(selectedSport ? { [selectedSport.id]: 'mid' } : {});
    setShowAddModal(true);
  }, [selectedSport]);

  const handleAddPlayer = useCallback(() => {
    if (!newPlayerName.trim()) return;
    const player: Player = {
      id: generateId(),
      name: newPlayerName.trim(),
      elos: { ...newPlayerElos },
    };
    const updated = [player, ...allPlayers];
    setAllPlayers(updated);
    savePlayers(updated);

    // If the player plays the current sport, select them
    if (selectedSport && player.elos[selectedSport.id]) {
      setSelectedPlayerIds((prev) => new Set(prev).add(player.id));
    }
    setNewPlayerName('');
    setNewPlayerElos({});
    setShowAddModal(false);
  }, [newPlayerName, newPlayerElos, allPlayers, selectedSport]);

  // WhatsApp bulk list parser
  const handleImportWhatsApp = useCallback(() => {
    if (!whatsAppText.trim() || !selectedSport) return;
    const lines = whatsAppText.split('\n');
    const names: string[] = [];

    for (const raw of lines) {
      let cleaned = raw.trim();
      cleaned = cleaned.replace(/^[\d\s.\-–—)\]#*•]+/, '').trim();
      if (!cleaned || cleaned.length < 2) continue;
      const lower = cleaned.toLowerCase();
      if (lower.startsWith('lista') || lower.startsWith('pelada') || lower.startsWith('jogo')) {
        continue;
      }
      names.push(cleaned);
    }

    if (names.length === 0) return;

    let current = [...allPlayers];
    const newSelected = new Set(selectedPlayerIds);
    let dirty = false;

    for (const name of names) {
      const existing = current.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        if (existing.elos[selectedSport.id] === undefined) {
          existing.elos[selectedSport.id] = 'mid';
          dirty = true;
        }
        newSelected.add(existing.id);
      } else {
        const newP: Player = {
          id: generateId(),
          name,
          elos: { [selectedSport.id]: 'mid' },
        };
        current.push(newP);
        newSelected.add(newP.id);
        dirty = true;
      }
    }

    if (dirty) {
      setAllPlayers(current);
      savePlayers(current);
    }
    setSelectedPlayerIds(newSelected);
    setShowWhatsAppModal(false);
    setWhatsAppText('');
    setTeams([]);
  }, [whatsAppText, selectedSport, allPlayers, selectedPlayerIds]);

  // Move player between teams manually
  const handleMovePlayer = useCallback(
    (fromTeamIndex: number, playerIndex: number, toTeamIndex: number) => {
      setTeams((prev) => {
        if (fromTeamIndex === toTeamIndex) return prev;
        const next = prev.map((t) => ({ ...t, players: [...t.players] }));
        const [moved] = next[fromTeamIndex].players.splice(playerIndex, 1);
        if (!moved) return prev;
        next[toTeamIndex].players.push(moved);
        next[fromTeamIndex].totalScore -= moved.score;
        next[toTeamIndex].totalScore += moved.score;
        return next;
      });
    },
    []
  );

  // Filtered lists according to search
  const filteredSportPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sportPlayers;
    return sportPlayers.filter((p) => p.name.toLowerCase().includes(q));
  }, [sportPlayers, searchQuery]);

  const filteredNonSportPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return nonSportPlayers;
    return nonSportPlayers.filter((p) => p.name.toLowerCase().includes(q));
  }, [nonSportPlayers, searchQuery]);

  const selectedPlayersList = useMemo(() => {
    return allPlayers.filter((p) => selectedPlayerIds.has(p.id));
  }, [allPlayers, selectedPlayerIds]);

  const minPlayers = selectedSport ? selectedSport.teamSize * 2 : 2;
  const canSort = selectedPlayersList.length >= minPlayers;

  // Suggested teams calculation
  const defaultNumTeams = selectedSport
    ? Math.max(2, Math.floor(selectedPlayersList.length / selectedSport.teamSize))
    : 2;

  const currentNumTeams = numTeamsOverride || defaultNumTeams;

  const handleSortear = useCallback(() => {
    if (!selectedSport || !canSort) return;
    const result = balanceTeams(
      selectedPlayersList,
      selectedSport.id,
      selectedSport.teamSize,
      currentNumTeams
    );
    setTeams(result);
  }, [selectedSport, canSort, selectedPlayersList, currentNumTeams]);

  // Statistics of selected pool
  const poolStats = useMemo(() => {
    if (!selectedSport) return { high: 0, mid: 0, low: 0, total: 0 };
    let high = 0;
    let mid = 0;
    let low = 0;
    selectedPlayersList.forEach((p) => {
      const elo = p.elos[selectedSport.id] || 'mid';
      if (elo === 'high') high++;
      else if (elo === 'low') low++;
      else mid++;
    });
    return { high, mid, low, total: selectedPlayersList.length };
  }, [selectedPlayersList, selectedSport]);

  const copyTeamsToClipboard = useCallback(() => {
    if (teams.length === 0 || !selectedSport) return;
    let text = `*⚖️ Equilibra.ai — Sorteio de Times*\n`;
    text += `*Modalidade:* ${selectedSport.emoji} ${selectedSport.name}\n`;
    text += `*Data:* ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    teams.forEach((t, i) => {
      text += `*Time ${String.fromCharCode(65 + i)}* (Força: ${t.totalScore} pts):\n`;
      t.players.forEach((p, idx) => {
        text += `  ${idx + 1}. ${p.name} (${getEloShortLabel(p.elo)})\n`;
      });
      text += `\n`;
    });

    text += `_Gerado por Equilibra.ai_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [teams, selectedSport]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Intro hero banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-900 border border-violet-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-2">
              <span>⚡</span> Sorteador Inteligente por Elo
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              Sorteio de Times Equilibrados
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Defina o esporte e selecione os jogadores presentes. O sistema lista quem pratica a modalidade com seu respectivo Elo.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Colar lista de nomes direto do grupo do WhatsApp"
            >
              <span>📋</span> Colar do WhatsApp
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
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
              Adicionar Jogador
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Sport Selection */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-bold">
              1
            </span>
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">
              Qual é o esporte de hoje?
            </h2>
          </div>
          {selectedSport && (
            <span className="text-xs text-zinc-400">
              {selectedSport.emoji} {selectedSport.name} ({selectedSport.teamSize} por time)
            </span>
          )}
        </div>
        <SportSelector
          selectedSport={selectedSport}
          onSelect={handleSelectSport}
        />
      </section>

      {selectedSport && (
        <>
          {/* Step 2: Player Selection */}
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-bold">
                  2
                </span>
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                  Quem vai jogar {selectedSport.name}?
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {selectedPlayersList.length} escalados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSportPlayers}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
                >
                  Selecionar praticantes ({sportPlayers.length})
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800 transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Elo pool overview bar */}
            <div className="mb-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400 font-medium">Equilíbrio da escalação:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                  {poolStats.high} High Elo
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                  {poolStats.mid} Mid Elo
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
                  {poolStats.low} Low Elo
                </span>
              </div>

              {selectedPlayersList.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Divisão em times:</span>
                  <select
                    value={currentNumTeams}
                    onChange={(e) => {
                      setNumTeamsOverride(Number(e.target.value));
                      setTeams([]);
                    }}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-violet-500"
                  >
                    {[2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} times (~{Math.round(selectedPlayersList.length / n)} por time)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Group 1: Players who practice this sport */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Jogadores cadastrados em {selectedSport.name} ({filteredSportPlayers.length})
                </span>
                <span className="text-[11px] text-zinc-500">
                  Marque quem veio jogar hoje
                </span>
              </div>

              {filteredSportPlayers.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/20">
                  Nenhum jogador cadastrado nesta modalidade ainda. Cole uma lista do WhatsApp ou adicione jogadores abaixo!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
                  {filteredSportPlayers.map((player) => {
                    const isSelected = selectedPlayerIds.has(player.id);
                    const playerElo = player.elos[selectedSport.id] || 'mid';
                    return (
                      <div
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-violet-500/50 bg-violet-500/10 shadow-sm'
                            : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-800/30 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              isSelected
                                ? 'border-violet-500 bg-violet-600 text-white'
                                : 'border-zinc-700 bg-zinc-800'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-zinc-100' : 'text-zinc-400'
                            }`}
                          >
                            {player.name}
                          </span>
                        </div>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center gap-1.5"
                        >
                          <EloSelector
                            value={playerElo}
                            onChange={(elo) =>
                              handleUpdatePlayerElo(player.id, elo)
                            }
                            size="sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleDisableSportForPlayer(player.id)}
                            className="text-zinc-600 hover:text-zinc-300 p-1 text-xs"
                            title="Remover modalidade deste jogador"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Group 2: Other players who do NOT practice this sport yet */}
            {nonSportPlayers.length > 0 && (
              <div className="mt-4 border-t border-zinc-800/60 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOtherPlayers(!showOtherPlayers)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>{showOtherPlayers ? '▼' : '▶'}</span>
                    <span>
                      Outros cadastrados que não jogam {selectedSport.name} ({filteredNonSportPlayers.length})
                    </span>
                  </span>
                  <span className="text-[11px] text-violet-400 underline">
                    {showOtherPlayers ? 'Ocultar' : 'Exibir para habilitar'}
                  </span>
                </button>

                {showOtherPlayers && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredNonSportPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40"
                      >
                        <span className="text-xs font-medium text-zinc-400 truncate pr-2">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEnableSportForPlayer(player, 'mid')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-all cursor-pointer"
                            title={`Adicionar ${player.name} em ${selectedSport.name}`}
                          >
                            + Habilitar & Escalar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Step 3: Draw action */}
          <section className="mb-10 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-bold">
                  3
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  Pronto para o sorteio?
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {selectedPlayersList.length < minPlayers ? (
                  <span className="text-amber-400">
                    Selecione pelo menos {minPlayers} jogadores para formar {currentNumTeams} times.
                  </span>
                ) : (
                  <span>
                    Serão formados {currentNumTeams} times balanceados com os {selectedPlayersList.length} jogadores selecionados.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSortear}
                disabled={!canSort}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                  canSort
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/30 hover:scale-[1.02]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                }`}
              >
                <span>🎲</span> Sortear Times
              </button>

              {teams.length > 0 && (
                <button
                  type="button"
                  onClick={handleSortear}
                  className="px-4 py-3 rounded-xl font-semibold text-sm border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Sortear novamente com outra combinação justa"
                >
                  <span>🔄</span> Re-sortear
                </button>
              )}
            </div>
          </section>

          {/* Results section */}
          {teams.length > 0 && (
            <section className="animate-slide-up space-y-6 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <h2 className="text-xl font-extrabold text-zinc-100 tracking-tight">
                      Times Sorteados
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
                      {selectedSport.emoji} {selectedSport.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Equilíbrio por pontuação de Elo (High = 3, Mid = 2, Low = 1) • É possível remanejar jogadores diretamente nos cartões.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyTeamsToClipboard}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  {copied ? (
                    <>
                      <span>✓</span> Copiado para WhatsApp!
                    </>
                  ) : (
                    <>
                      <span>📋</span> Copiar para WhatsApp
                    </>
                  )}
                </button>
              </div>

              {/* Team Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team, idx) => (
                  <TeamCard
                    key={idx}
                    team={team}
                    index={idx}
                    totalTeams={teams.length}
                    onMovePlayer={handleMovePlayer}
                  />
                ))}
              </div>

              {/* Balance diagnostic summary */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="text-zinc-400 font-semibold uppercase tracking-wider">
                    Diagnóstico de Força:
                  </span>
                  {teams.map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-zinc-300 font-bold">
                        Time {String.fromCharCode(65 + i)}:
                      </span>
                      <span className="font-extrabold text-violet-400">
                        {t.totalScore} pts
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">Diferença máxima:</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    {Math.max(...teams.map((t) => t.totalScore)) -
                      Math.min(...teams.map((t) => t.totalScore))}{' '}
                    pontos
                  </span>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* WhatsApp Bulk List Modal */}
      <Modal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title="Colar Lista do WhatsApp"
      >
        <div className="space-y-4 text-xs text-zinc-300">
          <p className="text-zinc-400">
            Cole a lista de confirmados copiada do WhatsApp. O sistema extrai os nomes (removendo números como &quot;1.&quot;, &quot;2 -&quot;) e já escala automaticamente em{' '}
            <strong className="text-violet-300">{selectedSport?.name}</strong>:
          </p>

          <textarea
            value={whatsAppText}
            onChange={(e) => setWhatsAppText(e.target.value)}
            placeholder={`1. Tiago\n2. Lucas Silva\n3. Gabriel\n4. Mateus\n5. Rodrigo Lima`}
            rows={8}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowWhatsAppModal(false);
                setWhatsAppText('');
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImportWhatsApp}
              disabled={!whatsAppText.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all cursor-pointer"
            >
              Escalar Jogadores da Lista
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Add Player Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Cadastrar Novo Jogador"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Nome do Jogador
            </label>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Ex: Gabriel, Pedro, Mariana..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <SportEloPicker
              elos={newPlayerElos}
              onChange={setNewPlayerElos}
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all cursor-pointer"
            >
              Cadastrar Jogador
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
