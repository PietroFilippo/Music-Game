import type { ComponentType } from 'react';
import type { GameId } from '../types';
import { PautaILesson } from './pauta-i';
import { PautaIILesson } from './pauta-ii';
import { ClavesLesson } from './claves';

export interface LessonProps {
  onExit: () => void;
  onPractice: () => void;
}

export const LESSONS: Partial<Record<GameId, ComponentType<LessonProps>>> = {
  'pauta-i': PautaILesson,
  'pauta-ii': PautaIILesson,
  claves: ClavesLesson,
};

export function hasLesson(id: GameId): boolean {
  return id in LESSONS;
}
