import type { ComponentType } from 'react';
import type { GameId } from '../types';
import { PautaILesson } from './pauta-i';

export interface LessonProps {
  onExit: () => void;
  onPractice: () => void;
}

export const LESSONS: Partial<Record<GameId, ComponentType<LessonProps>>> = {
  'pauta-i': PautaILesson,
};

export function hasLesson(id: GameId): boolean {
  return id in LESSONS;
}
