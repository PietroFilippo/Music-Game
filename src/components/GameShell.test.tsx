import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { DeckQuiz } from '../games/DeckQuiz';
import { fretboardRound } from '../games/fretboard/FretboardQuiz';
import { ModuleOneGame } from '../games/module-one/ModuleOneGame';
import { createQuestionDeck } from '../games/module-one/questions';
import { createQuestionPool } from '../games/module-two/questions';
import type { FretPosition } from '../music/guitar';
import type { QuizItem } from '../review/registry';
import { SettingsProvider } from '../SettingsContext';
import { QuizNavContext } from './QuizNav';

// Notation rendering is exercised in the browser; these tests cover the quiz shell.
vi.mock('./Staff', () => ({ Staff: () => <div>Staff diagram</div> }));
vi.mock('./GuitarTab', () => ({ GuitarTab: () => <div>Guitar tab</div> }));
vi.mock('./StaffDiagram', () => ({ StaffDiagram: () => <div>Staff diagram</div> }));
vi.mock('./MeasureNotation', () => ({ MeasureNotation: () => <div>Measure notation</div> }));
vi.mock('../audio/sound', () => ({ playNotes: () => {}, playEffect: () => {} }));

const proto = Element.prototype as Partial<Element>;
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete proto.scrollIntoView;
});

function useSettings(settings: Record<string, unknown>) {
  localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en', notation: 'letter', ...settings }));
}

// jsdom has no matchMedia; this one matches the given queries.
function matchMedia(...matching: string[]) {
  vi.stubGlobal('matchMedia', (media: string) => ({
    media, matches: matching.includes(media), addEventListener: () => {}, removeEventListener: () => {},
  }));
}

const cellName = (p: FretPosition) => (p.fret === 0 ? `String ${p.string + 1}, open` : `String ${p.string + 1}, fret ${p.fret}`);

// Two "find the note on a string" rounds, answered by tapping the neck.
function neckRounds() {
  return createQuestionPool('notas-braco', 'en', 'letter').filter(q => q.answer.kind === 'board').slice(0, 2)
    .map((question): QuizItem => ({ family: 'fretboard', gameId: 'notas-braco', question }));
}

function renderNeckRounds(items: QuizItem[]) {
  render(<SettingsProvider><DeckQuiz title="Neck" scoreAs={null} onExit={() => {}} renderers={{ fretboard: fretboardRound }}
    createDeck={() => items} /></SettingsProvider>);
}

const accepted = (item: QuizItem) => {
  if (item.family !== 'fretboard' || item.question.answer.kind !== 'board') throw new Error('expected a neck question');
  return item.question.answer.accepts[0];
};

describe('quiz keys', () => {
  it('skips the automatic wait with Enter or Space, once', () => {
    vi.useFakeTimers();
    useSettings({ advanceMode: 'auto', autoAdvanceDelayMs: 2000 });
    render(<SettingsProvider><ModuleOneGame id="notacao-alfabetica" onExit={() => {}} /></SettingsProvider>);
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByRole('status')).toBeDefined();
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(screen.getByText('Round 2 of 10')).toBeDefined();
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(screen.getByText('Round 3 of 10')).toBeDefined();
    // A held key does not skip: the next round waits.
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(document.body, { key: 'Enter', repeat: true });
    expect(screen.getByText('Round 3 of 10')).toBeDefined();
    // The skipped waits are cancelled, not run later.
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Round 4 of 10')).toBeDefined();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('Round 4 of 10')).toBeDefined();
  });

  it('continues with Enter after a keyboard tap on the neck, but leaves Enter on Listen to Listen', () => {
    vi.useFakeTimers();
    useSettings({ advanceMode: 'auto', autoAdvanceDelayMs: 2000 });
    const items = neckRounds();
    renderNeckRounds(items);
    const cell = screen.getByRole('button', { name: cellName(accepted(items[0])) });
    cell.focus();
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(screen.getByRole('status').textContent).toContain('Correct!');
    const listen = screen.getByRole('button', { name: 'Listen' });
    listen.focus();
    fireEvent.keyDown(listen, { key: 'Enter' });
    expect(screen.getByText('Round 1 of 2')).toBeDefined();
    // The answered neck is disabled, so Enter on its cell goes to the quiz.
    cell.focus();
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(screen.getByText('Round 2 of 2')).toBeDefined();
  });

  it('shows the key hints only in the two-pane stage', () => {
    useSettings({ advanceMode: 'manual' });
    render(<SettingsProvider><ModuleOneGame id="notas-teclado" onExit={() => {}} /></SettingsProvider>);
    expect(document.querySelector('.kbd')).toBeNull();
    expect(screen.queryByText(/to answer\.$/)).toBeNull();
  });
});

describe('feedback below 1000 px', () => {
  it('follows the question in the page, scrolls the verdict into view and focuses Continue', () => {
    useSettings({ advanceMode: 'manual' });
    const scrollIntoView = vi.fn();
    proto.scrollIntoView = scrollIntoView;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 900, bottom: 1600 } as DOMRect);
    render(<SettingsProvider><ModuleOneGame id="notas-teclado" onExit={() => {}} /></SettingsProvider>);
    fireEvent.click(within(screen.getByRole('main')).getAllByRole('button')[0]);
    const feedback = screen.getByRole('region', { name: 'Answer feedback' });
    const main = screen.getByRole('main');
    expect(main.contains(feedback)).toBe(false);
    expect(main.compareDocumentPosition(feedback) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(feedback.closest('[role="dialog"], [aria-modal]')).toBeNull();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continue' }));
  });

  it('scrolls without animation under reduced motion, and not at all when the feedback is in view', () => {
    useSettings({ advanceMode: 'manual' });
    matchMedia('(prefers-reduced-motion: reduce)');
    const scrollIntoView = vi.fn();
    proto.scrollIntoView = scrollIntoView;
    const box = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 900, bottom: 1600 } as DOMRect);
    render(<SettingsProvider><ModuleOneGame id="notas-teclado" onExit={() => {}} /></SettingsProvider>);
    fireEvent.click(within(screen.getByRole('main')).getAllByRole('button')[0]);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    scrollIntoView.mockClear();
    box.mockReturnValue({ top: 300, bottom: 600 } as DOMRect);
    fireEvent.click(within(screen.getByRole('main')).getAllByRole('button')[0]);
    expect(screen.getByRole('status')).toBeDefined();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('the two-pane stage from 1000 px', () => {
  it('puts the answers in one column with number keys and the feedback in the same column', () => {
    useSettings({ advanceMode: 'manual' });
    matchMedia('(min-width: 1000px)');
    vi.spyOn(Math, 'random').mockReturnValue(0.37);
    const question = createQuestionDeck('notas-teclado', 'en', 'letter')[0];
    render(<SettingsProvider><ModuleOneGame id="notas-teclado" onExit={() => {}} /></SettingsProvider>);
    const stage = screen.getByRole('main');
    expect(stage.className).toBe('stage');
    expect([...stage.querySelectorAll('.answers-col .kbd')].map(k => k.textContent))
      .toEqual(question.choices.map((_, i) => String(i + 1)));
    expect(within(stage).getByText(`Press 1–${question.choices.length} to answer.`)).toBeDefined();
    const correct = question.choices.find(c => c.value === question.correct)!;
    fireEvent.click(within(stage).getByRole('button', { name: correct.label }));
    expect(within(stage).getByRole('status').textContent).toContain('Correct!');
    // The answers stay above the verdict, the right one marked.
    expect(within(stage).getByRole('button', { name: correct.label }).className).toContain('answer-ok');
    const next = within(stage).getByRole('button', { name: 'Continue' });
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    expect(screen.getByText('Round 2 of 10')).toBeDefined();
  });

  it('draws the solution on the question’s own neck instead of a second one', () => {
    useSettings({ advanceMode: 'manual' });
    matchMedia('(min-width: 1000px)');
    const items = neckRounds();
    renderNeckRounds(items);
    expect(screen.getByText('Tap the position on the neck. Arrow keys move, Enter selects.')).toBeDefined();
    const target = accepted(items[0]);
    fireEvent.click(screen.getByRole('button', { name: cellName({ ...target, fret: target.fret === 0 ? 1 : target.fret - 1 }) }));
    expect(screen.getByRole('status').textContent).toContain('Let’s review');
    expect(document.querySelectorAll('svg.fretboard')).toHaveLength(1);
    const neck = screen.getByRole('group', { name: 'Guitar fretboard: choose a position' });
    expect(neck.getAttribute('aria-disabled')).toBe('true');
    expect(within(neck).getByText('✗')).toBeDefined();
    const question = items[0].family === 'fretboard' ? items[0].question : null;
    for (const marker of question!.reveal.markers ?? []) expect(within(neck).getAllByText(marker.label!).length).toBeGreaterThan(0);
  });
});

describe('results', () => {
  function playKeyboardNotes(wrongRound?: number) {
    vi.spyOn(Math, 'random').mockReturnValue(0.37);
    useSettings({ advanceMode: 'manual' });
    const deck = createQuestionDeck('notas-teclado', 'en', 'letter');
    return {
      deck,
      play: () => deck.forEach((question, i) => {
        const pick = question.choices.find(c => (c.value === question.correct) !== (i === wrongRound))!;
        fireEvent.click(screen.getByRole('button', { name: pick.label }));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      }),
    };
  }

  it('offers the lesson and, after a perfect score, the topic up next', () => {
    const { play } = playKeyboardNotes();
    const learn = vi.fn();
    const open = vi.fn();
    const upNext = vi.fn(() => ({ id: 'claves' as const, lesson: false, open }));
    render(<QuizNavContext.Provider value={{ learn, upNext }}>
      <SettingsProvider><ModuleOneGame id="notas-teclado" onExit={() => {}} /></SettingsProvider>
    </QuizNavContext.Provider>);
    play();
    expect(screen.getByRole('heading', { name: 'Game complete!' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Every answer right!' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Lesson' }));
    expect(learn).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Up next: Clefs' }));
    expect(open).toHaveBeenCalledOnce();
  });

  it('suggests no other topic after a miss, and no lesson where none is given', () => {
    const { play } = playKeyboardNotes(4);
    const upNext = vi.fn(() => null);
    render(<QuizNavContext.Provider value={{ upNext }}>
      <SettingsProvider><ModuleOneGame id="notas-teclado" onExit={() => {}} /></SettingsProvider>
    </QuizNavContext.Provider>);
    play();
    expect(screen.getByText('To review (1)')).toBeDefined();
    expect(screen.getByRole('listitem').textContent).toContain('Your answer');
    expect(screen.queryByRole('button', { name: /Up next/ })).toBeNull();
    expect(upNext).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Lesson' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Review this one' })).toBeDefined();
  });

  it('opens the topic’s lesson, or the next topic, from the app', async () => {
    const { play } = playKeyboardNotes();
    render(<App />);
    fireEvent.click(within(screen.getByRole('article', { name: 'Keyboard Notes' })).getByRole('button', { name: 'Practice' }));
    expect(await screen.findByText('Round 1 of 10', {}, { timeout: 5000 })).toBeDefined();
    play();
    // Nothing else is played yet, so the next topic starts with its lesson.
    expect(screen.getByRole('button', { name: 'Up next: Staff I — Lines & Spaces' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Lesson' }));
    expect(await screen.findByRole('navigation', { name: 'Steps' }, { timeout: 5000 })).toBeDefined();
    expect(screen.getByText(/^Step 1 of/)).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Keyboard Notes' })).toBeDefined();
  });
});
