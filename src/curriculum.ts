import type { GameId } from './types';

interface CourseModule {
  id: string;
  number: number;
  games: readonly GameId[];
  topicKeys: readonly string[];
}

// Modules 2–4 are the proposed guitar-focused roadmap, not playable content.
// Keep each game in one module so the menu and future progress summaries agree.
export const COURSE_MODULES: readonly CourseModule[] = [
  {
    id: 'foundations', number: 1,
    games: [
      'pauta-i', 'pauta-ii', 'claves', 'clave-sol', 'nome-notas',
      'notacao-alfabetica', 'nome-figuras', 'notas-descendentes',
      'propriedades-som', 'notas-teclado',
    ],
    topicKeys: [],
  },
  {
    id: 'fretboard', number: 2, games: [],
    topicKeys: ['fretboard.notes', 'fretboard.intervals', 'fretboard.scales', 'fretboard.reading'],
  },
  {
    id: 'triads', number: 3, games: [],
    topicKeys: ['triads.formulas', 'triads.voicings', 'triads.arpeggios', 'triads.application'],
  },
  {
    id: 'sevenths', number: 4, games: [],
    topicKeys: ['sevenths.formulas', 'sevenths.voicings', 'sevenths.arpeggios', 'sevenths.application'],
  },
];
