import type { GameId } from './types';

interface CourseModule {
  id: string;
  number: number;
  games: readonly GameId[];
  /** Topics still to be built; shown as a preview under the module. */
  topicKeys: readonly string[];
}

// Modules 2–4 follow the proposed guitar-focused roadmap. Module 2 has its first
// two topics; the rest are previews, not playable content.
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
    id: 'fretboard', number: 2, games: ['cordas-afinacao', 'notas-braco', 'sustenidos-bemois', 'oitavas', 'intervalos'],
    topicKeys: ['fretboard.scales', 'fretboard.reading'],
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
