import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TWO_PANE } from '../hooks/useMediaQuery';
import { SettingsProvider } from '../SettingsContext';
import { LessonShell, type LessonStep } from './LessonShell';

const STEPS: LessonStep[] = [
  { title: 'Lines', body: <p>Five lines.</p>, visual: <div>Lines diagram</div> },
  { body: <p>Four spaces.</p>, visual: <div>Spaces diagram</div> },
  { title: 'On your guitar', body: <p>Play it.</p>, visual: <svg className="fretboard"><rect role="button" tabIndex={0} aria-label="Cell" /></svg> },
];

function renderLesson(wide: boolean) {
  // jsdom has no matchMedia; answer the two-pane query as the test needs.
  window.matchMedia = ((query: string) => ({
    matches: wide && query === TWO_PANE, media: query,
    addEventListener: () => {}, removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  localStorage.setItem('musicgame.settings', JSON.stringify({ language: 'en' }));
  const onPractice = vi.fn();
  render(<SettingsProvider><LessonShell title="Staff" steps={STEPS} onExit={() => {}} onPractice={onPractice} /></SettingsProvider>);
  return { onPractice };
}

const arrow = (key: 'ArrowLeft' | 'ArrowRight', target: Element = document.body) =>
  act(() => { fireEvent.keyDown(target, { key }); });

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('lesson shell, one column', () => {
  it('shows the segment strip, the step label, the copy and the visual', () => {
    renderLesson(false);
    expect(screen.getByText('Step 1 of 3')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Lines' })).toBeDefined();
    expect(screen.getByText('Five lines.')).toBeDefined();
    expect(screen.getByText('Lines diagram')).toBeDefined();
    const strip = screen.getByRole('navigation', { name: 'Steps' });
    expect(within(strip).getAllByRole('button')).toHaveLength(3);
    expect(within(strip).getByRole('button', { name: 'Go to step 1' }).getAttribute('aria-current')).toBe('step');
  });

  it('keeps focus on Next and ends with Practice', () => {
    const { onPractice } = renderLesson(false);
    const next = screen.getByRole('button', { name: 'Next' });
    next.focus();
    fireEvent.click(next);
    expect(screen.getByText('Step 2 of 3')).toBeDefined();
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    expect(document.activeElement?.textContent).toContain('Practice');
    fireEvent.click(screen.getByRole('button', { name: 'Practice' }));
    expect(onPractice).toHaveBeenCalledOnce();
  });

  it('changes steps with the arrow keys, but not inside the fretboard or with modifiers', () => {
    renderLesson(false);
    arrow('ArrowRight');
    expect(screen.getByText('Step 2 of 3')).toBeDefined();
    arrow('ArrowRight', screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('Step 3 of 3')).toBeDefined();
    arrow('ArrowRight');
    expect(screen.getByText('Step 3 of 3')).toBeDefined();

    arrow('ArrowLeft', screen.getByRole('button', { name: 'Cell' }));
    expect(screen.getByText('Step 3 of 3')).toBeDefined();
    act(() => { fireEvent.keyDown(document.body, { key: 'ArrowLeft', altKey: true }); });
    expect(screen.getByText('Step 3 of 3')).toBeDefined();
    arrow('ArrowLeft');
    expect(screen.getByText('Step 2 of 3')).toBeDefined();
  });
});

describe('lesson shell, two panes', () => {
  it('lists the steps by title and puts the visual in the panel', () => {
    renderLesson(true);
    const list = within(screen.getByRole('navigation', { name: 'Steps' }));
    const items = list.getAllByRole('button');
    expect(items.map(b => b.textContent)).toEqual(['1Lines', '2Step 2', '3On your guitar']);
    expect(items[0].getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('heading', { name: 'Lines' })).toBeDefined();
    expect(document.querySelector('.lesson-panel')?.textContent).toBe('Lines diagram');
    expect(screen.queryByText(/Step 1 of 3/)).toBeNull();
  });

  it('marks visited steps done and jumps from the list', () => {
    renderLesson(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const list = within(screen.getByRole('navigation', { name: 'Steps' }));
    expect(list.getByRole('button', { name: /Lines/ }).textContent).toContain('(done)');
    expect(list.getByRole('button', { name: /Step 2/ }).getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('Four spaces.')).toBeDefined();

    const last = list.getByRole('button', { name: /On your guitar/ });
    last.focus();
    fireEvent.click(last);
    expect(document.activeElement).toBe(last);
    expect(last.getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('button', { name: 'Practice' })).toBeDefined();
    arrow('ArrowLeft', last);
    expect(list.getByRole('button', { name: /Step 2/ }).getAttribute('aria-current')).toBe('step');
  });
});
