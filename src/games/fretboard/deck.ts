import { shuffle } from '../../music/theory';

export const ROUNDS = 10;

// Take questions from each type in turn so a large group cannot crowd out the others.
export function balancedDeck<T>(groups: T[][], rounds = ROUNDS): T[] {
  const shuffled = shuffle(groups).map(group => shuffle(group));
  const longest = Math.max(...shuffled.map(group => group.length));
  const interleaved = Array.from({ length: longest }, (_, i) => shuffled.map(group => group[i]))
    .flat()
    .filter((q): q is T => q !== undefined);
  return shuffle(interleaved.slice(0, rounds));
}
