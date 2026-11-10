import { Sport } from './types';

export const SPORTS: Sport[] = [
  {
    id: 'society',
    name: 'Futebol Society',
    shortName: 'Society',
    teamSize: 6,
    description: '6 por time',
  },
  {
    id: 'futsal',
    name: 'Futsal',
    shortName: 'Futsal',
    teamSize: 5,
    description: '5 por time',
  },
  {
    id: 'futebol',
    name: 'Futebol de Campo',
    shortName: 'Campo',
    teamSize: 11,
    description: '11 por time',
  },
  {
    id: 'volei-dupla',
    name: 'Vôlei de Praia',
    shortName: 'Vôlei praia',
    teamSize: 2,
    description: 'Dupla mista',
  },
  {
    id: 'volei-quarteto',
    name: 'Vôlei Quarteto',
    shortName: 'Vôlei 4x4',
    teamSize: 4,
    description: 'Quarteto misto',
    hasPositions: true,
  },
  {
    id: 'volei-sexteto',
    name: 'Vôlei de Quadra',
    shortName: 'Vôlei quadra',
    teamSize: 6,
    description: 'Sexteto misto',
    hasPositions: true,
  },
  {
    id: 'basquete',
    name: 'Basquete',
    shortName: 'Basquete',
    teamSize: 5,
    description: '5 por time',
  },
  {
    id: 'basquete-3x3',
    name: 'Basquete 3x3',
    shortName: 'Basquete 3x3',
    teamSize: 3,
    description: '3 por time',
  },
  {
    id: 'beach-tennis',
    name: 'Beach Tennis',
    shortName: 'Beach tennis',
    teamSize: 2,
    description: 'Dupla',
  },
  {
    id: 'handebol',
    name: 'Handebol',
    shortName: 'Handebol',
    teamSize: 7,
    description: '7 por time',
  },
];

export const SPORT_IDS = new Set(SPORTS.map((s) => s.id));

export function getSport(id: string): Sport | undefined {
  return SPORTS.find((s) => s.id === id);
}
