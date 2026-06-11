import type { ComponentType } from 'react';
import type { GameId } from '../types';
import { PautaILesson } from './pauta-i';
import { PautaIILesson } from './pauta-ii';
import { ClavesLesson } from './claves';
import { ClaveSolLesson } from './clave-sol';

export interface LessonProps {
  onExit: () => void;
  onPractice: () => void;
}

export const LESSONS: Partial<Record<GameId, ComponentType<LessonProps>>> = {
  'pauta-i': PautaILesson,
  'pauta-ii': PautaIILesson,
  claves: ClavesLesson,
  'clave-sol': ClaveSolLesson,
};

export function hasLesson(id: GameId): boolean {
  return id in LESSONS;
}
