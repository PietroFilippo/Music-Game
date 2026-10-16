import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { COURSE_MODULES } from '../curriculum';
import { DeckQuiz } from '../games/DeckQuiz';
import { fretboardRound } from '../games/fretboard/FretboardQuiz';
import { readingRound } from '../games/module-one/ModuleOneGame';
import { createQuestionPool } from '../games/module-two/questions';
import { t } from '../i18n';
import type { FretPosition } from '../music/guitar';
import { SettingsProvider } from '../SettingsContext';
import { getAttempts, recordAttempt } from '../store/attempts';
import { getScore, recordScore } from '../store/scores';
import type { QuizItem } from './registry';
import { ReviewSession } from './ReviewSession';
import { buildReviewDeck } from './session';

vi.mock('../components/Staff', () => ({ Staff: () => <div>Staff diagram</div> }));
vi.mock('../components/GuitarTab', () => ({ GuitarTab: () => <div>Guitar tab</div> }));
vi.mock('../audio/sound', () => ({ playNotes: () => {}, playEffect: () => {} }));

const cellName = (p: FretPosition) => (p.fret === 0 ? `String ${p.string + 1}, open` : `String ${p.string + 1}, fret ${p.fret}`);
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

function answer(item: QuizItem, correct: boolean) {
  if (item.family === 'reading') {
    const { choices, correct: value } = item.question;
    return click(choices.find(c => (c.value === value) === correct)!.label);
  }
  const { answer: a } = item.question;
  if (a.kind === 'choice') return click(a.choices.find(c => (c.value === a.correct) === correct)!.label);
  const wrong = Array.from({ length: 78 }, (_, i) => ({ string: Math.floor(i / 13), fret: i % 13 }))
    .find(p => !a.accepts.some(x => x.string === p.string && x.fret === p.fret))!;
  click(cellName(correct ? a.accepts[0] : wrong));
}

function start(moduleId: string) {
  vi.spyOn(Math, 'random').mockReturnValue(0.37);
  localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', notation: 'letter', advanceMode: 'manual' }));
  const module = COURSE_MODULES.find(m => m.id === moduleId)!;
  const deck = buildReviewDeck(module.games, 'en', 'letter');
  const onExit = vi.fn();
  render(<StrictMode><SettingsProvider><ReviewSession moduleId={moduleId} onExit={onExit} /></SettingsProvider></StrictMode>);
  return { deck, onExit };
}

describe('Review weak spots', () => {
  it('runs a short session across topics, updating answer history but never scores', () => {
    recordScore('claves', 70, 'none');
    recordScore('notas-teclado', 90, 'easy');
    recordAttempt('claves', 'bass', 'wrong', 900);
    recordAttempt('notas-teclado', 'D', 'timeout', 900);
    recordAttempt('pauta-ii', 'e/4:up3', 'wrong', 900);
    recordAttempt('pauta-i', 'g/4', 'correct', 900); // due tomorrow
    recordAttempt('nome-notas', 'z/9', 'wrong', 900); // no longer in the bank
    const scores = localStorage.getItem('musicgame.scores');
    const { deck } = start('foundations');

    expect(deck.map(i => i.gameId).sort()).toEqual(['claves', 'notas-teclado', 'pauta-ii']);
    expect(screen.getByRole('heading', { name: 'Review · Module 1' })).toBeDefined();
    expect(screen.getByText('Round 1 of 3')).toBeDefined();
    expect(document.querySelectorAll('.segs span')).toHaveLength(3);
    deck.forEach((item, i) => {
      expect(document.querySelector('.question-topic')!.textContent).toBe(t(`games.${item.gameId}`, 'en'));
      expect(screen.getByText(item.question.prompt)).toBeDefined();
      answer(item, i !== 1);
      click('Continue');
    });

    expect(screen.getByRole('heading', { name: 'Review complete' })).toBeDefined();
    expect(screen.getByText('2 of 3 correct')).toBeDefined();
    expect(screen.queryByText('New best')).toBeNull();
    expect(localStorage.getItem('musicgame.scores')).toBe(scores);
    expect(getScore('pauta-ii')).toBeUndefined();
    const record = (item: QuizItem) => getAttempts(item.gameId)[item.question.id];
    expect(record(deck[0])).toMatchObject({ seen: 2, last: 'correct', box: 2 });
    expect(record(deck[1])).toMatchObject({ seen: 2, last: 'wrong', box: 1 });
    expect(record(deck[2])).toMatchObject({ seen: 2, last: 'correct', box: 2 });
    expect(getAttempts('pauta-i')['g/4'].seen).toBe(1);

    // Starting over picks up what is still due: the question missed again.
    click('Play again');
    expect(screen.getByText('Round 1 of 1')).toBeDefined();
    expect(screen.getByText(deck[1].question.prompt)).toBeDefined();
  });

  it('reviews fretboard topics with their own renderer', () => {
    const pool = createQuestionPool('notas-braco', 'en', 'letter');
    const board = pool.find(q => q.answer.kind === 'board')!;
    const choice = pool.find(q => q.answer.kind === 'choice')!;
    recordAttempt('notas-braco', board.id, 'wrong', 900);
    recordAttempt('notas-braco', choice.id, 'wrong', 900);
    const { deck } = start('fretboard');
    expect(deck).toHaveLength(2);
    deck.forEach(item => { answer(item, true); click('Continue'); });
    expect(screen.getByRole('heading', { name: 'Review complete' })).toBeDefined();
    expect(getScore('notas-braco')).toBeUndefined();
    expect(getAttempts('notas-braco')[board.id]).toMatchObject({ seen: 2, box: 2 });
  });

  it('says when nothing is due', () => {
    recordAttempt('claves', 'bass', 'correct', 900);
    const { onExit } = start('foundations');
    expect(screen.getByRole('heading', { name: 'Nothing to review right now' })).toBeDefined();
    click('Back to course');
    expect(onExit).toHaveBeenCalled();
  });

  it('switches renderer per round in a deck that mixes question families', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.37);
    localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', notation: 'letter', advanceMode: 'manual' }));
    const reading: QuizItem = { family: 'reading', gameId: 'notas-teclado', question: {
      id: 'C', prompt: 'Which note is the green key?', visual: { kind: 'keyboard', note: 'C' },
      choices: [{ value: 'C', label: 'C' }, { value: 'D', label: 'D' }], correct: 'C', explanation: 'White keys run C to B.',
    } };
    const board = createQuestionPool('notas-braco', 'en', 'letter').find(q => q.answer.kind === 'board')!;
    const fretboard: QuizItem = { family: 'fretboard', gameId: 'notas-braco', question: board };
    render(<SettingsProvider><DeckQuiz title="Mixed" scoreAs={null} onExit={() => {}} showTopic
      renderers={{ reading: readingRound, fretboard: fretboardRound }} createDeck={() => [reading, fretboard]} /></SettingsProvider>);
    expect(screen.getByText('Keyboard Notes')).toBeDefined();
    answer(reading, true);
    click('Continue');
    expect(screen.getByText('Natural Notes on the Neck')).toBeDefined();
    expect(screen.getAllByRole('group', { name: /Guitar fretboard: choose a position/ }).length).toBeGreaterThan(0);
    answer(fretboard, true);
    click('Continue');
    expect(screen.getByText('2 of 2 correct')).toBeDefined();
    expect(getAttempts('notas-teclado').C.seen).toBe(1);
    expect(getAttempts('notas-braco')[board.id].seen).toBe(1);
  });
});
