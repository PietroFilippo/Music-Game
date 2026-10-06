import type { MarkerTone } from '../../components/Fretboard';
import { fretsForLetter, naturalAt, naturalFrets, positionKey, type FretPosition } from '../../music/guitar';
import { LETTERS, type LetterNote } from '../../music/notes';
import { shuffle } from '../../music/theory';
import { NECK_FRETS, STRINGS, type BoardView, type Copy, type ModuleTwoQuestion } from './model';

// Natural Notes on the Neck: name and find natural notes on frets 0–12.
export function naturalNoteQuestions(c: Copy): ModuleTwoQuestion[][] {
  const { text, name, short } = c;
  const letterAt = (p: FretPosition) => naturalAt(p)!;
  // Neighbors in the note sequence make the player count rather than guess.
  const neighborChoices = (letter: LetterNote) => {
    const i = LETTERS.indexOf(letter);
    const neighbors = [-2, -1, 1, 2].map(d => LETTERS[(i + d + 7) % 7]);
    return c.letterChoices(shuffle([letter, ...shuffle(neighbors).slice(0, 3)]));
  };
  const counting = (p: FretPosition) => {
    const letter = name(letterAt(p));
    if (p.fret === 0) return text(`Corda solta: a ${p.string + 1}ª corda é ${letter}.`, `Open string: string ${p.string + 1} is ${letter}.`);
    if (p.fret === NECK_FRETS) {
      return text(`A casa 12 repete a nota da corda solta (${letter}), uma oitava acima.`,
        `Fret 12 repeats the open-string note (${letter}), one octave higher.`);
    }
    const route = naturalFrets(p.string, p.fret)
      .map(fret => `${short(letterAt({ string: p.string, fret }))} (${fret})`).join(' → ');
    const halfSteps = `${short('E')}–${short('F')} ${text('e', 'and')} ${short('B')}–${short('C')}`;
    return text(
      `Conte a partir da corda solta: ${route}. ${halfSteps} ficam a uma casa de distância; as outras notas naturais vizinhas, a duas.`,
      `Count up from the open string: ${route}. ${halfSteps} are one fret apart; other neighboring natural notes are two frets apart.`,
    );
  };
  // The string's natural notes up to the answer, with the answer highlighted.
  const routeBoard = (string: number, targets: number[]): BoardView => ({
    markers: naturalFrets(string, Math.max(...targets)).map(fret => ({
      string, fret, label: short(letterAt({ string, fret })),
      tone: (targets.includes(fret) ? 'accent' : 'plain') as MarkerTone,
    })),
    stringLabels: 'name',
    showFretNumbers: true,
  });

  const positions = STRINGS.flatMap(string => naturalFrets(string, NECK_FRETS).map(fret => ({ string, fret })));

  const nameOnBoard = positions.map((p): ModuleTwoQuestion => ({
    id: `board-${positionKey(p)}`,
    prompt: text(`Qual nota está marcada? (${c.where(p)})`, `Which note is marked? (${c.where(p)})`),
    answer: {
      kind: 'choice',
      visual: {
        kind: 'board',
        board: { markers: [{ ...p, label: '?', tone: 'accent' }], stringLabels: 'name', showFretNumbers: true },
      },
      choices: neighborChoices(letterAt(p)),
      correct: letterAt(p),
    },
    explanation: counting(p),
    reveal: routeBoard(p.string, [p.fret]),
    notation: p,
  }));

  const nameFromTab = positions.map((p): ModuleTwoQuestion => ({
    id: `tab-${positionKey(p)}`,
    prompt: text('Qual nota esta tablatura indica?', 'Which note does this tab show?'),
    answer: { kind: 'choice', visual: { kind: 'tab', position: p }, choices: neighborChoices(letterAt(p)), correct: letterAt(p) },
    explanation: text(
      `A linha ${p.string + 1} da tablatura, de cima para baixo, é a ${p.string + 1}ª corda; ${p.fret === 0 ? 'o 0 indica corda solta' : `o número ${p.fret} é a casa`}. `,
      `Tab line ${p.string + 1} from the top is string ${p.string + 1}; ${p.fret === 0 ? '0 means the open string' : `the number ${p.fret} is the fret`}. `,
    ) + counting(p),
    reveal: routeBoard(p.string, [p.fret]),
    notation: p,
  }));

  const findOnString = STRINGS.flatMap(string => LETTERS.map((letter): ModuleTwoQuestion => {
    const frets = fretsForLetter(letter, string, NECK_FRETS);
    const list = frets.join(text(' e ', ' and '));
    const first = { string, fret: frets[0] };
    return {
      id: `find-${string}-${letter}`,
      prompt: text(`Encontre ${name(letter)} na ${string + 1}ª corda (casas 0 a 12).`,
        `Find ${name(letter)} on string ${string + 1} (frets 0–12).`),
      answer: {
        kind: 'board',
        board: { stringLabels: 'name', showFretNumbers: true },
        accepts: frets.map(fret => ({ string, fret })),
      },
      explanation: text(
        `${name(letter)} na ${string + 1}ª corda: ${frets.length > 1 ? 'casas' : 'casa'} ${list}. `,
        `${name(letter)} on string ${string + 1}: ${frets.length > 1 ? 'frets' : 'fret'} ${list}. `,
      ) + counting(first),
      reveal: routeBoard(string, frets),
      notation: first,
    };
  }));

  return [nameOnBoard, nameFromTab, findOnString];
}
