import { createContext, useContext } from 'react';
import type { GameId } from '../types';

/** A topic the results screen suggests, and how to open it. */
export interface NextTopic {
  id: GameId;
  /** Opens the topic: its lesson when it has not been played yet, otherwise its quiz. */
  open: () => void;
  /** Whether `open` goes to the lesson. */
  lesson: boolean;
}

/** Where a topic's results screen can send the player; the app sets it around each topic's quiz. */
export interface QuizNav {
  /** Opens the lesson of the topic being played. */
  learn?: () => void;
  /** The topic to suggest after a perfect score; null when there is nothing else to suggest. */
  upNext?: () => NextTopic | null;
}

export const QuizNavContext = createContext<QuizNav>({});

export const useQuizNav = () => useContext(QuizNavContext);
