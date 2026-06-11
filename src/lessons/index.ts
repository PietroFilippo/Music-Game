import type { ComponentType } from 'react';
import type { GameId } from '../types';

export interface LessonProps {
  onExit: () => void;
  onPractice: () => void;
}

export const LESSONS: Partial<Record<GameId, ComponentType<LessonProps>>> = {};

export function hasLesson(id: GameId): boolean {
  return id in LESSONS;
}
