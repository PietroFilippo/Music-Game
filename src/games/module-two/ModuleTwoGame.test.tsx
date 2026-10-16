import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FretPosition } from '../../music/guitar';
import { SettingsProvider } from '../../SettingsContext';
import { getAttempts } from '../../store/attempts';
import { getScore } from '../../store/scores';
import { ModuleTwoGame } from './ModuleTwoGame';
import { createQuestionDeck, createQuestionPool, MODULE_TWO_IDS, type ModuleTwoQuestion } from './questions';

// Notation rendering is exercised in the browser; these tests cover gameplay.
vi.mock('../../components/Staff', () => ({ Staff: () => <div>Staff diagram</div> }));
vi.mock('../../components/GuitarTab', () => ({ GuitarTab: () => <div>Guitar tab</div> }));
const playNotes = vi.fn();
vi.mock('../../audio/sound', () => ({ playNotes: (...args: unknown[]) => playNotes(...args), playEffect: () => {} }));

const cellName = (p: FretPosition) =>
  p.fret === 0 ? `String ${p.string + 1}, open` : `String ${p.string + 1}, fret ${p.fret}`;

const cellNamePt = (p: FretPosition) =>
  p.fret === 0 ? `Corda ${p.string + 1}, solta` : `Corda ${p.string + 1}, casa ${p.fret}`;

function answerCorrectly(question: ModuleTwoQuestion, cell = cellName) {
  const { answer } = question;
  if (answer.kind === 'choice') {
    const correct = answer.choices.find(c => c.value === answer.correct)!;
    fireEvent.click(screen.getByRole('button', { name: correct.label }));
  } else {
    fireEvent.click(screen.getByRole('button', { name: cell(answer.accepts[0]) }));
  }
}

function answerWrongly(question: ModuleTwoQuestion) {
  const { answer } = question;
  if (answer.kind === 'choice') {
    fireEvent.click(screen.getByRole('button', { name: answer.choices.find(c => c.value !== answer.correct)!.label }));
  } else {
    const miss = Array.from({ length: 6 * 13 }, (_, i) => ({ string: Math.floor(i / 13), fret: i % 13 }))
      .find(p => !answer.accepts.some(a => a.string === p.string && a.fret === p.fret))!;
    fireEvent.click(screen.getByRole('button', { name: cellName(miss) }));
  }
}

const continueQuiz = () => fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

function startGame(id: (typeof MODULE_TWO_IDS)[number]) {
  vi.spyOn(Math, 'random').mockReturnValue(0.37);
  localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', notation: 'letter', advanceMode: 'manual' }));
  const deck = createQuestionDeck(id, 'en', 'letter');
  render(<StrictMode><SettingsProvider><ModuleTwoGame id={id} onExit={() => {}} /></SettingsProvider></StrictMode>);
  return deck;
}

describe('module 2 games', () => {
  it.each(MODULE_TWO_IDS)('%s completes with choice and fretboard answers, records once, and restarts', id => {
    const deck = startGame(id);
    expect(deck.some(q => q.answer.kind === 'board')).toBe(true);
    expect(deck.some(q => q.answer.kind === 'choice')).toBe(true);
    for (const question of deck) {
      expect(screen.getByText(question.prompt)).toBeDefined();
      answerCorrectly(question);
      expect(screen.getByRole('status').textContent).toContain('Correct!');
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    expect(screen.getByRole('heading', { name: 'Game complete!' })).toBeDefined();
    expect(getScore(id)).toMatchObject({ plays: 1, last: 100, best: 100 });
    expect(getScore(id)!.history).toHaveLength(1);
    const attempts = getAttempts(id);
    expect(Object.keys(attempts).sort()).toEqual(deck.map(q => q.id).sort());
    expect(Object.values(attempts).every(a => a.seen === 1 && a.last === 'correct')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByText('Round 1 of 10')).toBeDefined();
    expect(getScore(id)!.plays).toBe(1);
  });

  it('reviews a wrong fretboard answer and locks the board', () => {
    const deck = startGame('notas-braco');
    const index = deck.findIndex(q => q.answer.kind === 'board');
    for (const question of deck.slice(0, index)) {
      answerCorrectly(question);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    const question = deck[index];
    if (question.answer.kind !== 'board') throw new Error('expected a fretboard question');
    const target = question.answer.accepts[0];
    fireEvent.click(screen.getByRole('button', { name: cellName({ string: (target.string + 1) % 6, fret: 1 }) }));
    expect(screen.getByRole('status').textContent).toContain('Let’s review');
    expect(screen.getByRole('status').textContent).toContain(question.explanation);
    expect(screen.getAllByText('✗').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: cellName(target) }));
    expect(screen.queryByText('✓')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText(`${index} correct`)).toBeDefined();
    expect(screen.getByLabelText('1 wrong')).toBeDefined();
  });

  it('replays exactly the missed questions as an unscored review', () => {
    const deck = startGame('notas-braco');
    const missed = [1, 4, 7];
    deck.forEach((question, i) => {
      if (missed.includes(i)) answerWrongly(question);
      else answerCorrectly(question);
      continueQuiz();
    });
    const score = getScore('notas-braco');
    expect(score).toMatchObject({ plays: 1, last: 70 });
    fireEvent.click(screen.getByRole('button', { name: 'Review these 3' }));

    expect(screen.getByText('Round 1 of 3')).toBeDefined();
    expect(document.querySelectorAll('.segs span')).toHaveLength(3);
    missed.forEach((index, round) => {
      expect(screen.getByText(deck[index].prompt)).toBeDefined();
      if (round === 2) answerWrongly(deck[index]);
      else answerCorrectly(deck[index]);
      continueQuiz();
    });
    expect(screen.getByRole('heading', { name: 'Review complete' })).toBeDefined();
    expect(screen.getByText('Reviews do not change your scores.')).toBeDefined();
    expect(screen.getByText('2 of 3 correct')).toBeDefined();
    expect(getScore('notas-braco')).toEqual(score);
    expect(getAttempts('notas-braco')[deck[1].id]).toMatchObject({ seen: 2, last: 'correct', box: 2 });
    expect(getAttempts('notas-braco')[deck[7].id]).toMatchObject({ seen: 2, last: 'wrong', box: 1 });

    // A miss in the review can be reviewed again; Play again goes back to a scored quiz.
    fireEvent.click(screen.getByRole('button', { name: 'Review this one' }));
    expect(screen.getByText('Round 1 of 1')).toBeDefined();
    expect(screen.getByText(deck[7].prompt)).toBeDefined();
    answerCorrectly(deck[7]);
    continueQuiz();
    expect(screen.queryByRole('button', { name: /Review th/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByText('Round 1 of 10')).toBeDefined();
    deck.forEach(question => { answerCorrectly(question); continueQuiz(); });
    expect(getScore('notas-braco')).toMatchObject({ plays: 2, last: 100 });
  });

  it('switches a running quiz to a new language without changing its rounds', () => {
    const deck = startGame('sustenidos-bemois');
    const inPortuguese = (index: number) => createQuestionPool('sustenidos-bemois', 'pt', 'letter').find(q => q.id === deck[index].id)!;
    const setLanguage = (open: string, language: string, close: string) => {
      fireEvent.click(screen.getByRole('button', { name: open }));
      fireEvent.click(screen.getByRole('button', { name: language }));
      fireEvent.click(screen.getByRole('button', { name: close }));
    };
    setLanguage('Settings', 'Português', 'Fechar');
    expect(screen.getByText('Rodada 1 de 10')).toBeDefined();
    expect(screen.getByText(inPortuguese(0).prompt)).toBeDefined();
    answerCorrectly(inPortuguese(0), cellNamePt);
    // An answered round keeps its question until Continue.
    setLanguage('Configurações', 'English', 'Close');
    expect(screen.getByText(inPortuguese(0).prompt)).toBeDefined();
    continueQuiz();
    expect(screen.getByText('Round 2 of 10')).toBeDefined();
    expect(screen.getByText(deck[1].prompt)).toBeDefined();
    deck.slice(1).forEach(question => { answerCorrectly(question); continueQuiz(); });
    expect(getScore('sustenidos-bemois')).toMatchObject({ plays: 1, last: 100 });
    expect(Object.keys(getAttempts('sustenidos-bemois')).sort()).toEqual(deck.map(q => q.id).sort());
  });

  it('plays the interval after an answer', () => {
    const deck = startGame('intervalos');
    answerCorrectly(deck[0]);
    playNotes.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(playNotes).toHaveBeenCalledWith(deck[0].sound!.notes, { spacing: 0.6 });
    expect(deck[0].sound!.notes).toHaveLength(2);
  });
});
