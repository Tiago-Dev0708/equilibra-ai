import { Team } from './types';

/** Posições do vôlei (usadas nas modalidades quarteto e sexteto). */
export type VolleyPosition = 'levantador' | 'ponteiro' | 'central' | 'oposto' | 'libero';

export const VOLLEY_POSITIONS: VolleyPosition[] = [
  'levantador',
  'ponteiro',
  'central',
  'oposto',
  'libero',
];

export const POSITION_LABEL: Record<VolleyPosition, string> = {
  levantador: 'Levantador',
  ponteiro: 'Ponteiro',
  central: 'Central',
  oposto: 'Oposto',
  libero: 'Líbero',
};

const POSITION_PLURAL: Record<VolleyPosition, string> = {
  levantador: 'levantadores',
  ponteiro: 'ponteiros',
  central: 'centrais',
  oposto: 'opostos',
  libero: 'líberos',
};

export function positionCount(n: number, position: VolleyPosition) {
  return `${n} ${n === 1 ? POSITION_LABEL[position].toLowerCase() : POSITION_PLURAL[position]}`;
}

export interface RoleRequirement {
  position: VolleyPosition;
  min: number;
}

/** Mínimo por time: 1 levantador e 2 ponteiros. */
export const VOLLEY_REQUIREMENTS: RoleRequirement[] = [
  { position: 'levantador', min: 1 },
  { position: 'ponteiro', min: 2 },
];

export function isVolleyPosition(value: unknown): value is VolleyPosition {
  return typeof value === 'string' && (VOLLEY_POSITIONS as string[]).includes(value);
}

/** Posições obrigatórias que faltam em um time. */
export function missingRoles(team: Team, requirements: RoleRequirement[]) {
  return requirements
    .map(({ position, min }) => ({
      position,
      missing: min - team.players.filter((p) => p.position === position).length,
    }))
    .filter((r) => r.missing > 0);
}
