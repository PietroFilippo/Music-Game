import { t } from '../../i18n';
import { fretsForVexKey } from '../../music/guitar';
import { LETTERS, noteLabel, type LetterNote } from '../../music/notes';
import { CLEFS, shuffle, TREBLE_POSITIONS, type StaffPosition } from '../../music/theory';
import type { Language, Notation } from '../../types';
import { fillDeck, type ModuleQuestion } from './questions';

// Question banks for the four original Module 1 games, which used to draw a
// random question each round. Item IDs match what those games recorded, so
// earlier answer history stays reviewable: the note's VexFlow key (Staff I,
// Treble Clef), the clef (Clefs), or the starting note and counting step
// (Staff II, e.g. "e/4:up3").
export const STAFF_GAME_IDS = ['pauta-i', 'pauta-ii', 'claves', 'clave-sol'] as const;
export type StaffGameId = typeof STAFF_GAME_IDS[number];

export const isStaffGame = (id: string): id is StaffGameId => (STAFF_GAME_IDS as readonly string[]).includes(id);

const COUNT_STEPS = [1, 2, 3, 4];
const TREBLE_CLEF_NOTES = ['g/4', 'a/4', 'b/4'];

export function createStaffPool(id: StaffGameId, language: Language, notation: Notation): ModuleQuestion[] {
  const tr = (key: string, vars?: Record<string, string | number>) => t(key, language, vars);
  const text = (pt: string, en: string) => (language === 'pt' ? pt : en);
  const name = (letter: LetterNote) => noteLabel(letter, notation, language);
  const place = (p: StaffPosition) => `${tr(p.kind === 'line' ? 'common.line' : 'common.space')} ${p.index}`;
  const letterChoices = (letters: LetterNote[]) => letters.map(value => ({ value, label: name(value) }));
  const otherLetters = (correct: LetterNote) => shuffle([correct, ...shuffle(LETTERS.filter(l => l !== correct)).slice(0, 3)]);

  switch (id) {
    case 'pauta-i': return TREBLE_POSITIONS.map(target => {
      const where = place(target);
      return {
        id: target.vexKey,
        prompt: tr('prompts.pauta-i'),
        visual: { kind: 'staff', vexKey: target.vexKey },
        choices: shuffle([target, ...shuffle(TREBLE_POSITIONS.filter(p => p !== target)).slice(0, 3)])
          .map(p => ({ value: `${p.kind}-${p.index}`, label: place(p) })),
        correct: `${target.kind}-${target.index}`,
        explanation: text(
          `${where[0].toUpperCase()}${where.slice(1)}, contando de baixo para cima: é a nota ${name(target.letter)}.`,
          `${where[0].toUpperCase()}${where.slice(1)}, counting from the bottom: the note is ${name(target.letter)}.`,
        ),
        fretKey: target.vexKey,
      };
    });
    case 'pauta-ii': return (['up', 'down'] as const).flatMap(direction => COUNT_STEPS.flatMap(steps =>
      TREBLE_POSITIONS.flatMap((start, i): ModuleQuestion[] => {
        const at = (k: number) => TREBLE_POSITIONS[direction === 'up' ? i + k : i - k];
        const target = at(steps);
        if (!target) return [];
        const prompt = tr(`prompts.pauta-ii.${direction}`, { n: steps });
        const route = Array.from({ length: steps }, (_, k) => name(at(k + 1).letter)).join(', ');
        return [{
          id: `${start.vexKey}:${direction}${steps}`,
          prompt,
          visual: { kind: 'staff', vexKey: start.vexKey },
          hint: { label: tr('common.startNote'), value: name(start.letter) },
          summary: `${prompt} ${tr('common.startNote')}: ${name(start.letter)}`,
          choices: letterChoices(otherLetters(target.letter)),
          correct: target.letter,
          explanation: text(
            `De ${name(start.letter)}, conte ${steps} para ${direction === 'up' ? 'cima' : 'baixo'}: ${route}. A resposta é ${name(target.letter)}.`,
            `From ${name(start.letter)}, count ${steps} ${direction}: ${route}. The answer is ${name(target.letter)}.`,
          ),
          fretKey: target.vexKey,
        }];
      })));
    case 'claves': return CLEFS.map(clef => ({
      id: clef.id,
      prompt: tr('prompts.claves'),
      visual: { kind: 'clef', clef: clef.vexClef },
      summary: `${tr('prompts.claves')} (${tr(`clef.${clef.id}`)})`,
      choices: letterChoices(shuffle(CLEFS.map(c => c.anchorLetter))),
      correct: clef.anchorLetter,
      explanation: tr(`clef.${clef.id}.anchor`),
    }));
    case 'clave-sol': return TREBLE_POSITIONS.filter(p => TREBLE_CLEF_NOTES.includes(p.vexKey)).map(target => {
      const { string, fret } = fretsForVexKey(target.vexKey)[0];
      const guitar = fret === 0
        ? text(`${string + 1}ª corda solta`, `open string ${string + 1}`)
        : text(`${string + 1}ª corda, casa ${fret}`, `string ${string + 1}, fret ${fret}`);
      return {
        id: target.vexKey,
        prompt: tr('prompts.clave-sol'),
        visual: { kind: 'staff', vexKey: target.vexKey },
        choices: letterChoices(shuffle<LetterNote>(['G', 'A', 'B'])),
        correct: target.letter,
        explanation: text(
          `${name(target.letter)} fica ${target.kind === 'line' ? 'na linha' : 'no espaço'} ${target.index}. Na guitarra: ${guitar}.`,
          `${name(target.letter)} is on ${target.kind} ${target.index}. On the guitar: ${guitar}.`,
        ),
        fretKey: target.vexKey,
        notation: true,
      };
    });
  }
}

export function createStaffDeck(id: StaffGameId, language: Language, notation: Notation): ModuleQuestion[] {
  return fillDeck(createStaffPool(id, language, notation));
}
