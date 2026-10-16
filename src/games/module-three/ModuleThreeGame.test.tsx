import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FretPosition } from '../../music/guitar';
import { SettingsProvider } from '../../SettingsContext';
import { getAttempts } from '../../store/attempts';
import { getScore } from '../../store/scores';
import { LANGUAGES, type Language } from '../../types';
import { ModuleThreeGame } from './ModuleThreeGame';
import { createQuestionDeck, MODULE_THREE_IDS, type TriadQuestion } from './questions';

// Notation rendering is exercised in the browser; these tests cover gameplay.
vi.mock('../../components/Staff', () => ({ Staff: () => <div>Staff diagram</div> }));
vi.mock('../../components/GuitarTab', () => ({ GuitarTab: () => <div>Guitar tab</div> }));
const playNotes = vi.fn();
vi.mock('../../audio/sound', () => ({ playNotes: (...args: unknown[]) => playNotes(...args), playEffect: () => {} }));

const cellName = (p: FretPosition, language: Language = 'en') => language === 'pt'
  ? p.fret === 0 ? `Corda ${p.string + 1}, solta` : `Corda ${p.string + 1}, casa ${p.fret}`
  : p.fret === 0 ? `String ${p.string + 1}, open` : `String ${p.string + 1}, fret ${p.fret}`;

function answerCorrectly(question: TriadQuestion, language: Language = 'en') {
  const { answer } = question;
  if (answer.kind === 'choice') {
    const correct = answer.choices.find(c => c.value === answer.correct)!;
    fireEvent.click(screen.getByRole('button', { name: correct.label }));
  } else {
    fireEvent.click(screen.getByRole('button', { name: cellName(answer.accepts[0], language) }));
  }
}

function startGame(id: (typeof MODULE_THREE_IDS)[number], language: Language = 'en') {
  vi.spyOn(Math, 'random').mockReturnValue(0.37);
  localStorage.setItem('musicgame.settings', JSON.stringify({ language, notation: 'letter', advanceMode: 'manual' }));
  const deck = createQuestionDeck(id, language, 'letter');
  render(<StrictMode><SettingsProvider><ModuleThreeGame id={id} onExit={() => {}} /></SettingsProvider></StrictMode>);
  return deck;
}

describe('module 3 games', () => {
  it.each(MODULE_THREE_IDS.flatMap(id => LANGUAGES.map(language => ({ id, language }))))('$id [$language] completes with choice and fretboard answers, records once, and restarts', ({ id, language }) => {
    const deck = startGame(id, language);
    expect(deck.some(q => q.answer.kind === 'board')).toBe(true);
    expect(deck.some(q => q.answer.kind === 'choice')).toBe(true);
    for (const question of deck) {
      expect(screen.getByText(question.prompt)).toBeDefined();
      answerCorrectly(question, language);
      expect(screen.getByRole('status').textContent).toContain(language === 'pt' ? 'Correto!' : 'Correct!');
      fireEvent.click(screen.getByRole('button', { name: language === 'pt' ? 'Continuar' : 'Continue' }));
    }
    expect(screen.getByRole('heading', { name: language === 'pt' ? 'Jogo completo!' : 'Game complete!' })).toBeDefined();
    expect(getScore(id)).toMatchObject({ plays: 1, last: 100, best: 100 });
    expect(getScore(id)!.history).toHaveLength(1);
    const attempts = getAttempts(id);
    expect(Object.keys(attempts).sort()).toEqual(deck.map(q => q.id).sort());
    expect(Object.values(attempts).every(a => a.seen === 1 && a.last === 'correct')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: language === 'pt' ? 'Jogar novamente' : 'Play again' }));
    expect(screen.getByText(language === 'pt' ? 'Rodada 1 de 10' : 'Round 1 of 10')).toBeDefined();
    expect(getScore(id)!.plays).toBe(1);
  });

  it('reviews a wrong fretboard answer and locks the board', () => {
    const deck = startGame('triades');
    const index = deck.findIndex(q => q.answer.kind === 'board');
    for (const question of deck.slice(0, index)) {
      answerCorrectly(question);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    const question = deck[index];
    if (question.answer.kind !== 'board') throw new Error('expected a fretboard question');
    const { accepts } = question.answer;
    const target = accepts[0];
    const wrong = Array.from({ length: 78 }, (_, i) => ({ string: i % 6, fret: Math.floor(i / 6) }))
      .find(p => !accepts.some(a => a.string === p.string && a.fret === p.fret))!;
    fireEvent.click(screen.getByRole('button', { name: cellName(wrong) }));
    expect(screen.getByRole('status').textContent).toContain('Let’s review');
    expect(screen.getByRole('status').textContent).toContain(question.explanation);
    expect(screen.getAllByText('✗').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: cellName(target) }));
    expect(screen.queryByText('✓')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText(`${index} correct`)).toBeDefined();
    expect(screen.getByLabelText('1 wrong')).toBeDefined();
  });

  it('plays the triad after an answer', () => {
    const deck = startGame('triades');
    answerCorrectly(deck[0]);
    playNotes.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(playNotes).toHaveBeenCalledWith(deck[0].sound!.notes, { spacing: 0.03 });
    expect(deck[0].sound!.notes).toHaveLength(3);
  });

  it('plays arpeggio feedback one note at a time', () => {
    const deck = startGame('arpejos-triades');
    answerCorrectly(deck[0]);
    playNotes.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(playNotes).toHaveBeenCalledWith(deck[0].sound!.notes, { spacing: 0.3 });
  });

  it('accepts a fretboard answer using arrows and Enter', () => {
    const deck = startGame('inversoes-triades');
    const index = deck.findIndex(q => q.answer.kind === 'board');
    for (const question of deck.slice(0, index)) {
      answerCorrectly(question);
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    }
    const { answer } = deck[index];
    if (answer.kind !== 'board') throw new Error('expected a fretboard question');
    const target = answer.accepts[0];
    const before = screen.getByRole('button', { name: cellName({ ...target, fret: Math.max(0, target.fret - 1) }) });
    before.focus();
    fireEvent.keyDown(before, { key: target.fret > 0 ? 'ArrowRight' : 'Home' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: cellName(target) }));
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(screen.getByRole('status').textContent).toContain('Correct!');
  });
});
