import { createElement, lazy, type ComponentType } from 'react';
import type { GameId } from '../types';

export interface LessonProps {
  onExit: () => void;
  onPractice: () => void;
}

// Importing the menu should not download VexFlow or lesson content.
export const LESSONS: Record<GameId, ComponentType<LessonProps>> = {
  'pauta-i': lazy(() => import('./pauta-i').then(m => ({ default: m.PautaILesson }))),
  'pauta-ii': lazy(() => import('./pauta-ii').then(m => ({ default: m.PautaIILesson }))),
  claves: lazy(() => import('./claves').then(m => ({ default: m.ClavesLesson }))),
  'clave-sol': lazy(() => import('./clave-sol').then(m => ({ default: m.ClaveSolLesson }))),
  'nome-notas': moduleLesson('nome-notas'),
  'notacao-alfabetica': moduleLesson('notacao-alfabetica'),
  'nome-figuras': moduleLesson('nome-figuras'),
  'notas-descendentes': moduleLesson('notas-descendentes'),
  'propriedades-som': moduleLesson('propriedades-som'),
  'notas-teclado': moduleLesson('notas-teclado'),
};

function moduleLesson(id: import('../games/module-one/questions').ModuleOneId) {
  return lazy(() => import('./module-one').then(m => ({
    default: (props: LessonProps) => createElement(m.ModuleOneLesson, { ...props, id }),
  })));
}

export function hasLesson(id: GameId): boolean {
  return id in LESSONS;
}
