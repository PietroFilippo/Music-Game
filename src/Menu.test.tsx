import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TWO_PANE } from './hooks/useMediaQuery';
import { Menu, recommendTopic } from './Menu';
import { SettingsProvider } from './SettingsContext';
import { recordAttempt } from './store/attempts';
import type { GameId, ScoreRecord } from './types';

const save = (records: Partial<Record<GameId, Pick<ScoreRecord, 'best' | 'last'> & { date: string }>>) => {
  const all = Object.fromEntries(Object.entries(records).map(([id, r]) => [id, {
    gameId: id, best: r!.best, last: r!.last, plays: 1, history: [{ percent: r!.last, date: r!.date, difficulty: 'none' }],
  }]));
  localStorage.setItem('musicgame.scores', JSON.stringify(all));
};

const showMenu = (language: 'en' | 'pt' = 'en') => {
  localStorage.setItem('musicgame.settings', JSON.stringify({ language }));
  const onReview = vi.fn();
  const onLearn = vi.fn();
  render(<SettingsProvider><Menu onPlay={() => {}} onLearn={onLearn} onReview={onReview} onNavigate={() => {}} /></SettingsProvider>);
  const card = (name: string) => within(screen.getByRole('region', { name }));
  const pt = language === 'pt';
  return {
    onReview, onLearn, card,
    module1: card(pt ? 'Fundamentos de leitura musical' : 'Music-reading foundations'),
    module2: card(pt ? 'Braço da guitarra e intervalos' : 'Guitar fretboard and intervals'),
  };
};

/** Pretends the window is at least 1000 px wide. */
const twoPane = () => vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query === TWO_PANE, addEventListener: () => {}, removeEventListener: () => {},
}));

afterEach(() => vi.unstubAllGlobals());

describe('continue recommendation', () => {
  it('starts with the first topic of the course', () => {
    expect(recommendTopic()).toEqual({ id: 'pauta-i', kind: 'next' });
  });

  it('returns to the most recent topic while its last score is low', () => {
    save({
      'pauta-i': { best: 90, last: 90, date: '2026-10-01T10:00:00Z' },
      'notas-braco': { best: 80, last: 60, date: '2026-10-05T10:00:00Z' },
    });
    expect(recommendTopic()).toEqual({ id: 'notas-braco', kind: 'continue' });
  });

  it('moves on to the next unplayed topic once the recent one went well', () => {
    save({
      'pauta-i': { best: 90, last: 90, date: '2026-10-01T10:00:00Z' },
      'pauta-ii': { best: 100, last: 100, date: '2026-10-02T10:00:00Z' },
    });
    expect(recommendTopic()).toEqual({ id: 'claves', kind: 'next' });
  });
});

describe('module cards', () => {
  it('shows progress as a ring and the scores on each topic', () => {
    save({ 'pauta-i': { best: 90, last: 80, date: '2026-10-01T10:00:00Z' } });
    const { module1, module2 } = showMenu();
    expect(module1.getByRole('img', { name: '1 of 10 topics' }).textContent).toBe('1/10');
    expect(module2.getByRole('img', { name: '0 of 7 topics' })).toBeDefined();
    const topic = within(module1.getByRole('article', { name: 'Staff I — Lines & Spaces' }));
    expect(topic.getByText('Best 90%, last 80%')).toBeDefined();
    expect(module1.getByRole('article', { name: 'Clefs' }).textContent).toContain('Not played yet');
  });

  it('describes a module until it has answer history', () => {
    const { module2 } = showMenu();
    expect(module2.getByText(/Locate notes on the instrument/)).toBeDefined();
  });

  it('keeps Learn as a named button when it shows only its icon', () => {
    const { onLearn, module1 } = showMenu();
    fireEvent.click(within(module1.getByRole('article', { name: 'Clefs' })).getByRole('button', { name: 'Learn' }));
    expect(onLearn).toHaveBeenCalledWith('claves');
  });

  it('collapses finished modules on narrow screens and remembers the choice', () => {
    save(Object.fromEntries(['pauta-i', 'pauta-ii', 'claves', 'clave-sol', 'nome-notas', 'notacao-alfabetica', 'nome-figuras',
      'notas-descendentes', 'propriedades-som', 'notas-teclado'].map(id => [id, { best: 90, last: 90, date: '2026-10-01T10:00:00Z' }])));
    const { module1 } = showMenu();
    const toggle = module1.getByRole('button', { name: /Show 10 topics/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('module-content-foundations')!.hidden).toBe(true);
    fireEvent.click(toggle);
    expect(document.getElementById('module-content-foundations')!.hidden).toBe(false);
    expect(JSON.parse(localStorage.getItem('musicgame.modules')!).foundations).toBe(true);
  });

  it('opens every module without toggles at two-pane widths', () => {
    twoPane();
    save(Object.fromEntries(['pauta-i', 'pauta-ii', 'claves', 'clave-sol', 'nome-notas', 'notacao-alfabetica', 'nome-figuras',
      'notas-descendentes', 'propriedades-som', 'notas-teclado'].map(id => [id, { best: 90, last: 90, date: '2026-10-01T10:00:00Z' }])));
    localStorage.setItem('musicgame.modules', JSON.stringify({ fretboard: false }));
    showMenu();
    expect(screen.queryByRole('button', { name: /Show|Hide topics/ })).toBeNull();
    for (const id of ['foundations', 'fretboard', 'triads', 'sevenths']) {
      expect(document.getElementById(`module-content-${id}`)!.hidden).toBe(false);
    }
  });

  it('names Learn and Practice in Portuguese, next to the longest topic title', () => {
    const { card } = showMenu('pt');
    const module4 = card('Tétrades e aplicação harmônica');
    const topic = within(module4.getByRole('article', { name: 'Tétrades com Fundamental nas Cordas 6, 5 e 4' }));
    expect(topic.getByRole('button', { name: 'Aprender' })).toBeDefined();
    expect(topic.getByRole('button', { name: 'Praticar' })).toBeDefined();
  });
});

describe('review entry on module cards', () => {
  it('is hidden without answer history', () => {
    showMenu();
    expect(screen.queryByRole('button', { name: /Review weak spots/ })).toBeNull();
    expect(screen.queryByText(/\d+ due$/)).toBeNull();
  });

  it('opens a module review with the number of due questions and marks the module', () => {
    recordAttempt('claves', 'bass', 'wrong', 900);
    recordAttempt('notas-teclado', 'D', 'timeout', 900);
    const { onReview, module1, module2 } = showMenu();
    expect(module1.getByText('2 due')).toBeDefined();
    fireEvent.click(module1.getByRole('button', { name: 'Review weak spots · 2' }));
    expect(onReview).toHaveBeenCalledWith('foundations');
    expect(module2.queryByRole('button', { name: /Review weak spots/ })).toBeNull();
    expect(module2.queryByText(/due$/)).toBeNull();
  });

  it('says when the next review comes due while nothing is due', () => {
    recordAttempt('notas-braco', 'board-0:3', 'correct', 900);
    const { module2 } = showMenu();
    expect(module2.queryByRole('button', { name: /Review weak spots/ })).toBeNull();
    expect(module2.getByText('Nothing to review today')).toBeDefined();
    expect(module2.getByText('Next review tomorrow')).toBeDefined();
  });

  it('counts the days to the next review', () => {
    recordAttempt('oitavas', 'octave-5:3', 'correct', 900);
    recordAttempt('oitavas', 'octave-5:3', 'correct', 900);
    const { module2 } = showMenu('pt');
    expect(module2.getByText('Nada para revisar hoje')).toBeDefined();
    expect(module2.getByText('Próxima revisão em 3 dias')).toBeDefined();
  });
});
