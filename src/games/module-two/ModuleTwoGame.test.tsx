import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FretPosition } from '../../music/guitar';
import { SettingsProvider } from '../../SettingsContext';
import { getAttempts } from '../../store/attempts';
import { getScore } from '../../store/scores';
import { ModuleTwoGame } from './ModuleTwoGame';
import { createQuestionDeck, MODULE_TWO_IDS, type ModuleTwoQuestion } from './questions';

// Notation rendering is exercised in the browser; these tests cover gameplay.
vi.mock('../../components/Staff', () => ({ Staff: () => <div>Staff diagram</div> }));
vi.mock('../../components/GuitarTab', () => ({ GuitarTab: () => <div>Guitar tab</div> }));
vi.mock('../../components/MeasureNotation', () => ({ MeasureNotation: () => <div>Measure notation</div> }));
const playNotes = vi.fn();
vi.mock('../../audio/sound', () => ({ playNotes: (...args: unknown[]) => playNotes(...args), playEffect: () => {} }));

const cellName = (p: FretPosition) =>
  p.fret === 0 ? `String ${p.string + 1}, open` : `String ${p.string + 1}, fret ${p.fret}`;

function answerCorrectly(question: ModuleTwoQuestion) {
  const { answer } = question;
  if (answer.kind === 'choice') {
    const correct = answer.choices.find(c => c.value === answer.correct)!;
    fireEvent.click(screen.getByRole('button', { name: correct.label }));
  } else {
    fireEvent.click(screen.getByRole('button', { name: cellName(answer.accepts[0]) }));
  }
}

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

  it('plays the interval after an answer', () => {
    const deck = startGame('intervalos');
    answerCorrectly(deck[0]);
    playNotes.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(playNotes).toHaveBeenCalledWith(deck[0].sound!.notes, { spacing: 0.6 });
    expect(deck[0].sound!.notes).toHaveLength(2);
  });

  it('shows a staff above the answer board and accepts an alternate position', () => {
    const deck = startGame('leitura-braco');
    const index = deck.findIndex(q => q.answer.kind === 'board' && q.answer.accepts.length > 1);
    expect(index).toBeGreaterThanOrEqual(0);
    for (const question of deck.slice(0, index)) {
      answerCorrectly(question);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    expect(screen.getByText('Staff diagram')).toBeDefined();
    const { answer } = deck[index];
    if (answer.kind !== 'board') throw new Error('expected a board answer');
    fireEvent.click(screen.getByRole('button', { name: cellName(answer.accepts[1]) }));
    expect(screen.getByRole('status').textContent).toContain('Correct!');
  });

  it('renders a reading measure and plays its sounding pitches with the configured spacing', () => {
    const deck = startGame('leitura-braco');
    const index = deck.findIndex(q => q.answer.kind === 'choice' && q.answer.visual.kind === 'measure');
    expect(index).toBeGreaterThanOrEqual(0);
    for (const question of deck.slice(0, index)) {
      answerCorrectly(question);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    expect(screen.getByText('Measure notation')).toBeDefined();
    answerCorrectly(deck[index]);
    playNotes.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(playNotes).toHaveBeenCalledWith(deck[index].sound!.notes, { spacing: deck[index].sound!.spacing });
  });
});
