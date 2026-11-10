'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Elo, Player, Sport, Team } from '@/lib/types';
import { SPORTS } from '@/lib/sports';
import { LEVELS, LEVEL_LABEL } from '@/lib/levels';
import { balanceTeams, scoreSpread } from '@/lib/balancer';
import { generateId } from '@/lib/storage';
import { MAX_NAME_LENGTH } from '@/lib/validate';
import { usePlayers } from '@/lib/usePlayers';
import SportSelector from '@/components/SportSelector';
import SportLevelPicker from '@/components/SportLevelPicker';
import TeamCard, { teamLabel } from '@/components/TeamCard';
import Modal from '@/components/Modal';
import CheckMark from '@/components/Checkbox';
import SyncStatus from '@/components/SyncStatus';
import { LevelDot, LevelSelector } from '@/components/Level';
import PositionSelect from '@/components/PositionSelect';
import {
  POSITION_LABEL,
  VOLLEY_REQUIREMENTS,
  VolleyPosition,
  positionCount,
} from '@/lib/positions';
import {
  IconCheck,
  IconChevronDown,
  IconClipboard,
  IconCopy,
  IconPlus,
  IconSearch,
  IconShuffle,
  IconX,
} from '@/components/icons/ui';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** Extrai nomes de uma lista colada do WhatsApp ("1. Tiago", "2 - Lucas ✅"...). */
function parseNameList(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split('\n')) {
    const cleaned = raw
      .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
      .replace(/^[\s\d.\-–—)\]#*•·_~]+/, '')
      .replace(/[*_~]+/g, '')
      .trim()
      .slice(0, MAX_NAME_LENGTH);
    if (cleaned.length < 2) continue;
    const key = normalize(cleaned);
    if (/^(lista|pelada|jogo|confirmados|time)\b/.test(key) || cleaned.endsWith(':')) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(cleaned);
  }
  return names;
}

function SectionHeading({
  index,
  title,
  aside,
}: {
  index: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h2 className="flex items-baseline gap-2.5 text-sm font-semibold text-fg">
        <span className="section-index">{index}</span>
        {title}
      </h2>
      {aside}
    </div>
  );
}

export default function SorteioPage() {
  const { players, ready, save, storage, sync } = usePlayers();

  const [sport, setSport] = useState<Sport>(SPORTS[0]);
  // Por padrão todos os praticantes da modalidade estão escalados; guardamos
  // apenas quem foi desmarcado.
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<Team[]>([]);
  const [drawCount, setDrawCount] = useState(0);
  const [numTeamsOverride, setNumTeamsOverride] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showOthers, setShowOthers] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newElos, setNewElos] = useState<Record<string, Elo>>({});
  const [newPosition, setNewPosition] = useState<VolleyPosition | undefined>(undefined);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (drawCount > 0) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [drawCount]);

  // ---------------------------------------------------------------- derived

  const sportPlayers = useMemo(
    () => players.filter((p) => p.elos[sport.id] !== undefined),
    [players, sport.id]
  );
  const otherPlayers = useMemo(
    () => players.filter((p) => p.elos[sport.id] === undefined),
    [players, sport.id]
  );
  const selectedPlayers = useMemo(
    () => sportPlayers.filter((p) => !excludedIds.has(p.id)),
    [sportPlayers, excludedIds]
  );

  const query = normalize(search);
  const visibleSportPlayers = query
    ? sportPlayers.filter((p) => normalize(p.name).includes(query))
    : sportPlayers;
  const visibleOtherPlayers = query
    ? otherPlayers.filter((p) => normalize(p.name).includes(query))
    : otherPlayers;

  const poolStats = useMemo(() => {
    const stats: Record<Elo, number> = { high: 0, mid: 0, low: 0 };
    selectedPlayers.forEach((p) => stats[p.elos[sport.id] ?? 'mid']++);
    return stats;
  }, [selectedPlayers, sport.id]);

  const selectedCount = selectedPlayers.length;
  const maxTeams = Math.max(2, Math.min(6, Math.floor(selectedCount / 2)));
  const defaultTeams = Math.min(maxTeams, Math.max(2, Math.floor(selectedCount / sport.teamSize)));
  const numTeams = Math.min(numTeamsOverride ?? defaultTeams, maxTeams);
  const minPlayers = numTeams * 2;
  const canDraw = selectedCount >= minPlayers;
  const perTeamMin = Math.floor(selectedCount / numTeams);
  const perTeamMax = Math.ceil(selectedCount / numTeams);
  const perTeamLabel = perTeamMin === perTeamMax ? `${perTeamMin}` : `${perTeamMin} a ${perTeamMax}`;

  // Vôlei quarteto/sexteto: posições mínimas por time.
  const requirements = sport.hasPositions ? VOLLEY_REQUIREMENTS : [];
  const roleShortages = requirements
    .map(({ position, min }) => {
      const available = selectedPlayers.filter((p) => p.volleyPosition === position).length;
      return { position, available, needed: min * numTeams };
    })
    .filter((r) => r.available < r.needed);

  // --------------------------------------------------------------- handlers

  const resetDraw = () => setTeams([]);

  const handleSelectSport = (next: Sport) => {
    setSport(next);
    setExcludedIds(new Set());
    setNumTeamsOverride(null);
    resetDraw();
  };

  const togglePlayer = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    resetDraw();
  };

  const selectAll = () => {
    setExcludedIds(new Set());
    resetDraw();
  };

  const clearSelection = () => {
    setExcludedIds(new Set(sportPlayers.map((p) => p.id)));
    resetDraw();
  };

  const updatePlayerLevel = (id: string, level: Elo) => {
    save(players.map((p) => (p.id === id ? { ...p, elos: { ...p.elos, [sport.id]: level } } : p)));
    resetDraw();
  };

  const updatePlayerPosition = (id: string, position: VolleyPosition | undefined) => {
    save(players.map((p) => (p.id === id ? { ...p, volleyPosition: position } : p)));
    resetDraw();
  };

  const enableSportFor = (player: Player) => {
    save(
      players.map((p) =>
        p.id === player.id ? { ...p, elos: { ...p.elos, [sport.id]: 'mid' as Elo } } : p
      )
    );
    setExcludedIds((prev) => {
      const next = new Set(prev);
      next.delete(player.id);
      return next;
    });
    resetDraw();
  };

  const disableSportFor = (id: string) => {
    save(
      players.map((p) => {
        if (p.id !== id) return p;
        const elos = { ...p.elos };
        delete elos[sport.id];
        return { ...p, elos };
      })
    );
    resetDraw();
  };

  const openAddModal = () => {
    setNewName('');
    setNewElos({ [sport.id]: 'mid' });
    setNewPosition(undefined);
    setShowAddModal(true);
  };

  const newPlaysPositionSport = SPORTS.some((s) => s.hasPositions && newElos[s.id] !== undefined);

  const handleAddPlayer = () => {
    const name = newName.trim();
    if (!name) return;
    const player: Player = { id: generateId(), name, elos: { ...newElos } };
    if (newPlaysPositionSport && newPosition) player.volleyPosition = newPosition;
    save([player, ...players]);
    resetDraw();
    setShowAddModal(false);
  };

  const parsedNames = useMemo(() => parseNameList(pasteText), [pasteText]);

  const handleImportList = () => {
    if (parsedNames.length === 0) return;
    const byName = new Map(players.map((p) => [normalize(p.name), p]));
    const listedIds = new Set<string>();
    const created: Player[] = [];
    const enabled = new Set<string>();

    for (const name of parsedNames) {
      const existing = byName.get(normalize(name));
      if (existing) {
        listedIds.add(existing.id);
        if (existing.elos[sport.id] === undefined) enabled.add(existing.id);
      } else {
        const player: Player = { id: generateId(), name, elos: { [sport.id]: 'mid' } };
        created.push(player);
        listedIds.add(player.id);
      }
    }

    const updated =
      created.length > 0 || enabled.size > 0
        ? [
            ...players.map((p) =>
              enabled.has(p.id) ? { ...p, elos: { ...p.elos, [sport.id]: 'mid' as Elo } } : p
            ),
            ...created,
          ]
        : players;
    if (updated !== players) save(updated);

    // A lista colada define exatamente quem está presente.
    const practitioners = updated.filter((p) => p.elos[sport.id] !== undefined);
    setExcludedIds(new Set(practitioners.filter((p) => !listedIds.has(p.id)).map((p) => p.id)));
    setShowPasteModal(false);
    setPasteText('');
    resetDraw();
  };

  const handleDraw = () => {
    if (!canDraw) return;
    setTeams(balanceTeams(selectedPlayers, sport.id, sport.teamSize, numTeams, requirements));
    setDrawCount((c) => c + 1);
  };

  const handleMovePlayer = useCallback((from: number, playerIndex: number, to: number) => {
    setTeams((prev) => {
      if (from === to) return prev;
      const next = prev.map((t) => ({ ...t, players: [...t.players] }));
      const [moved] = next[from].players.splice(playerIndex, 1);
      if (!moved) return prev;
      next[to].players.push(moved);
      next[from].totalScore -= moved.score;
      next[to].totalScore += moved.score;
      return next;
    });
  }, []);

  const copyTeams = async () => {
    if (teams.length === 0) return;
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let text = `*Times · ${sport.name}*\n${date} às ${time}\n`;
    teams.forEach((team, i) => {
      text += `\n*${teamLabel(i)}* · ${team.totalScore} pts\n`;
      team.players.forEach((p, idx) => {
        const tags = [p.position && POSITION_LABEL[p.position], LEVEL_LABEL[p.elo]].filter(Boolean);
        text += `${idx + 1}. ${p.name} (${tags.join(', ')})\n`;
      });
    });
    text += `\n_Sorteado com Equilibra_`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copie o texto abaixo:', text);
    }
  };

  const spread = scoreSpread(teams);

  // ----------------------------------------------------------------- render

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Sorteio de times</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Escolha a modalidade, marque quem está presente e gere times equilibrados pelo nível de
            cada jogador.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setShowPasteModal(true)}>
            <IconClipboard />
            Colar lista
          </button>
          <button type="button" className="btn btn-secondary" onClick={openAddModal}>
            <IconPlus />
            Jogador
          </button>
        </div>
      </div>

      {/* 01 · Modalidade */}
      <section className="mb-10">
        <SectionHeading index="01" title="Modalidade" />
        <SportSelector selectedSport={sport} onSelect={handleSelectSport} />
      </section>

      {/* 02 · Presentes */}
      <section>
        <SectionHeading
          index="02"
          title={
            <>
              Presentes
              <span className="font-normal text-faint tabular-nums">
                {selectedCount} de {sportPlayers.length}
              </span>
            </>
          }
          aside={
            <div className="flex items-center gap-3">
              <SyncStatus storage={storage} sync={sync} />
              <span className="h-4 w-px bg-line" aria-hidden="true" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={selectAll}>
                Todos
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearSelection}>
                Nenhum
              </button>
            </div>
          }
        />

        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-72">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar jogador"
                aria-label="Buscar jogador"
                className="input h-9 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted">
              {LEVELS.map((level) => (
                <span key={level} className="inline-flex items-center gap-1.5">
                  <LevelDot level={level} />
                  <span className="font-medium text-fg tabular-nums">{poolStats[level]}</span>
                  {LEVEL_LABEL[level].toLowerCase()}
                </span>
              ))}
              {requirements.map(({ position }) => {
                const n = selectedPlayers.filter((p) => p.volleyPosition === position).length;
                return (
                  <span key={position} className="inline-flex items-center gap-1">
                    <span className="font-medium text-fg tabular-nums">{n}</span>
                    {positionCount(n, position).replace(/^\d+ /, '')}
                  </span>
                );
              })}
            </div>
          </div>

          {!ready ? (
            <div className="space-y-2 p-4" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-subtle" />
              ))}
            </div>
          ) : sportPlayers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-fg">
                Ninguém cadastrado em {sport.name} ainda
              </p>
              <p className="mt-1 text-sm text-muted">
                Cole a lista de confirmados do grupo ou cadastre os jogadores.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPasteModal(true)}>
                  <IconClipboard size={15} />
                  Colar lista
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
                  <IconPlus size={15} />
                  Novo jogador
                </button>
              </div>
            </div>
          ) : visibleSportPlayers.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">
              Nenhum jogador encontrado para &ldquo;{search}&rdquo;.
            </p>
          ) : (
            <div className={`grid gap-px bg-line ${sport.hasPositions ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
              {visibleSportPlayers.map((player) => {
                const selected = !excludedIds.has(player.id);
                const level = player.elos[sport.id] ?? 'mid';
                return (
                  <div
                    key={player.id}
                    className="flex flex-col gap-2 bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:gap-2 sm:py-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => togglePlayer(player.id)}
                      aria-pressed={selected}
                      className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <CheckMark checked={selected} />
                      <span className={`truncate text-sm ${selected ? 'text-fg' : 'text-faint'}`}>
                        {player.name}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2 pl-[30px] sm:flex-nowrap sm:pl-0">
                      {sport.hasPositions && (
                        <PositionSelect
                          value={player.volleyPosition}
                          onChange={(pos) => updatePlayerPosition(player.id, pos)}
                          label={`Posição de ${player.name}`}
                          className="h-8 w-[8.5rem] px-2 text-[13px]"
                        />
                      )}
                      <LevelSelector
                        value={level}
                        onChange={(l) => updatePlayerLevel(player.id, l)}
                        label={`Nível de ${player.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => disableSportFor(player.id)}
                        className="btn btn-ghost btn-icon ml-auto size-8 text-faint sm:ml-0"
                        title={`Remover ${player.name} de ${sport.name}`}
                        aria-label={`Remover ${player.name} de ${sport.name}`}
                      >
                        <IconX size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {!sport.hasPositions && visibleSportPlayers.length % 2 === 1 && (
                <div className="hidden bg-surface lg:block" aria-hidden="true" />
              )}
            </div>
          )}

          {ready && otherPlayers.length > 0 && (
            <div className="border-t border-line">
              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-subtle/60 hover:text-fg"
              >
                <span>
                  Outros jogadores cadastrados{' '}
                  <span className="text-faint tabular-nums">· {visibleOtherPlayers.length}</span>
                </span>
                <IconChevronDown className={`transition-transform ${showOthers ? 'rotate-180' : ''}`} />
              </button>
              {showOthers && (
                <div className="grid gap-px border-t border-line bg-line md:grid-cols-2">
                  {visibleOtherPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between gap-3 bg-surface px-4 py-2">
                      <span className="truncate text-sm text-muted">{player.name}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm shrink-0"
                        onClick={() => enableSportFor(player)}
                      >
                        <IconPlus size={14} />
                        Adicionar
                      </button>
                    </div>
                  ))}
                  {visibleOtherPlayers.length % 2 === 1 && (
                    <div className="hidden bg-surface md:block" aria-hidden="true" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Barra de ação */}
      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mt-4">
        <div className="card flex flex-col gap-3 px-4 py-3 shadow-lg shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="sr-only sm:not-sr-only">Dividir em</span>
              <select
                value={numTeams}
                onChange={(e) => {
                  setNumTeamsOverride(Number(e.target.value));
                  resetDraw();
                }}
                className="select h-9 pr-8 text-sm"
              >
                {Array.from({ length: maxTeams - 1 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n} times
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted">
              {canDraw ? (
                <>
                  <span className="font-medium text-fg tabular-nums">{selectedCount}</span> jogadores ·{' '}
                  {perTeamLabel} por time
                  {perTeamMax < sport.teamSize && (
                    <span className="text-faint"> (formato {sport.teamSize}×{sport.teamSize})</span>
                  )}
                </>
              ) : (
                <>Selecione pelo menos {minPlayers} jogadores.</>
              )}
            </p>
            {canDraw && roleShortages.length > 0 && (
              <p className="w-full text-xs text-warning">
                Para {numTeams} times faltam{' '}
                {roleShortages
                  .map((r) => positionCount(r.needed - r.available, r.position))
                  .join(' e ')}
                . O sorteio distribui os disponíveis da forma mais justa.
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary h-11 w-full px-5 sm:h-10 sm:w-auto"
            onClick={handleDraw}
            disabled={!canDraw}
          >
            <IconShuffle />
            {teams.length > 0 ? 'Sortear novamente' : 'Sortear times'}
          </button>
        </div>
      </div>

      {/* 03 · Times */}
      {teams.length > 0 && (
        <section ref={resultsRef} key={drawCount} className="animate-enter mt-10 scroll-mt-20">
          <SectionHeading
            index="03"
            title="Times"
            aside={
              <button type="button" className="btn btn-secondary btn-sm" onClick={copyTeams}>
                {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                {copied ? 'Copiado' : 'Copiar para WhatsApp'}
              </button>
            }
          />
          <p className="-mt-1 mb-4 text-sm text-muted">
            {sport.name} · diferença de{' '}
            <span className={`font-medium tabular-nums ${spread <= 1 ? 'text-accent' : 'text-warning'}`}>
              {spread} {spread === 1 ? 'ponto' : 'pontos'}
            </span>{' '}
            entre o time mais forte e o mais fraco. Use &ldquo;Mover&rdquo; para ajustes manuais.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, idx) => (
              <TeamCard
                key={idx}
                team={team}
                index={idx}
                totalTeams={teams.length}
                onMovePlayer={handleMovePlayer}
                requirements={requirements}
              />
            ))}
          </div>
        </section>
      )}

      {/* Colar lista */}
      <Modal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        title="Colar lista de presença"
        description={`Os nomes serão escalados em ${sport.name}. Quem ainda não tem cadastro entra com nível médio.`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowPasteModal(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImportList}
              disabled={parsedNames.length === 0}
            >
              {parsedNames.length > 0 ? `Escalar ${parsedNames.length} jogadores` : 'Escalar jogadores'}
            </button>
          </>
        }
      >
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'1. Tiago\n2. Lucas Silva\n3. Gabriel\n4. Mateus'}
          rows={9}
          autoFocus
          aria-label="Lista de nomes"
          className="input h-auto resize-none py-2.5 font-mono text-[13px] leading-relaxed"
        />
        <p className="mt-2 text-xs text-faint">
          Numeração, marcadores e emojis são removidos automaticamente.
        </p>
      </Modal>

      {/* Novo jogador */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Novo jogador"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancelar
            </button>
            <button type="submit" form="add-player-form" className="btn btn-primary" disabled={!newName.trim()}>
              Cadastrar
            </button>
          </>
        }
      >
        <form
          id="add-player-form"
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPlayer();
          }}
        >
          <div>
            <label htmlFor="new-player-name" className="field-label">
              Nome
            </label>
            <input
              id="new-player-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Como o jogador é chamado no grupo"
              autoFocus
              className="input"
            />
          </div>
          <SportLevelPicker elos={newElos} onChange={setNewElos} />
          {newPlaysPositionSport && (
            <div>
              <label htmlFor="new-player-position" className="field-label">
                Posição no vôlei
              </label>
              <PositionSelect
                id="new-player-position"
                value={newPosition}
                onChange={setNewPosition}
                className="w-full"
              />
              <p className="mt-1.5 text-xs text-faint">
                Vale para quarteto e sexteto. Cada time recebe ao menos 1 levantador e 2 ponteiros.
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
