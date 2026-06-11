import type { ComponentType } from 'react';
import type { GameId } from '../types';
import { PautaILesson } from './pauta-i';
import { PautaIILesson } from './pauta-ii';

export interface LessonProps {
  onExit: () => void;
  onPractice: () => void;
}

export const LESSONS: Partial<Record<GameId, ComponentType<LessonProps>>> = {
  'pauta-i': PautaILesson,
  'pauta-ii': PautaIILesson,
};

export function hasLesson(id: GameId): boolean {
  return id in LESSONS;
}
