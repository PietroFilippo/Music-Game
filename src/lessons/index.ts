import { createElement, lazy, type ComponentType } from 'react';
import type { ModuleOneId } from '../games/module-one/questions';
import type { ModuleTwoId } from '../games/module-two/questions';
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
  'cordas-afinacao': moduleTwoLesson('cordas-afinacao'),
  'notas-braco': moduleTwoLesson('notas-braco'),
  'sustenidos-bemois': moduleTwoLesson('sustenidos-bemois'),
  oitavas: moduleTwoLesson('oitavas'),
  intervalos: moduleTwoLesson('intervalos'),
  escalas: moduleTwoLesson('escalas'),
};

function moduleLesson(id: ModuleOneId) {
  return lazy(() => import('./module-one').then(m => ({
    default: (props: LessonProps) => createElement(m.ModuleOneLesson, { ...props, id }),
  })));
}

function moduleTwoLesson(id: ModuleTwoId) {
  return lazy(() => import('./module-two').then(m => ({
    default: (props: LessonProps) => createElement(m.ModuleTwoLesson, { ...props, id }),
  })));
}
