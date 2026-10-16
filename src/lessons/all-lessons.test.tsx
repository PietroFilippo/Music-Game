import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MODULE_FOUR_IDS } from '../games/module-four/questions';
import { MODULE_ONE_IDS } from '../games/module-one/questions';
import { MODULE_THREE_IDS } from '../games/module-three/questions';
import { MODULE_TWO_IDS } from '../games/module-two/questions';
import { TWO_PANE } from '../hooks/useMediaQuery';
import { SettingsProvider } from '../SettingsContext';
import { ClaveSolLesson } from './clave-sol';
import { ClavesLesson } from './claves';
import { LESSONS, type LessonProps } from './index';
import { ModuleFourLesson } from './module-four';
import { ModuleOneLesson } from './module-one';
import { ModuleThreeLesson } from './module-three';
import { ModuleTwoLesson } from './module-two';
import { PautaILesson } from './pauta-i';
import { PautaIILesson } from './pauta-ii';

// VexFlow needs a real layout engine; the notation is checked in the browser.
vi.mock('../components/StaffDiagram', () => ({ StaffDiagram: () => <div>Staff diagram</div> }));
vi.mock('../components/MeasureNotation', () => ({ MeasureNotation: () => <div>Measure</div> }));
vi.mock('../components/PositionNotation', () => ({ PositionNotation: () => <div>Tab and staff</div> }));
vi.mock('../components/GuitarTab', () => ({ GuitarTab: () => <div>Tab</div> }));

type Lesson = (props: LessonProps) => ReactElement;
const ALL: [string, Lesson][] = [
  ['pauta-i', p => <PautaILesson {...p} />],
  ['pauta-ii', p => <PautaIILesson {...p} />],
  ['claves', p => <ClavesLesson {...p} />],
  ['clave-sol', p => <ClaveSolLesson {...p} />],
  ...MODULE_ONE_IDS.map((id): [string, Lesson] => [id, p => <ModuleOneLesson id={id} {...p} />]),
  ...MODULE_TWO_IDS.map((id): [string, Lesson] => [id, p => <ModuleTwoLesson id={id} {...p} />]),
  ...MODULE_THREE_IDS.map((id): [string, Lesson] => [id, p => <ModuleThreeLesson id={id} {...p} />]),
  ...MODULE_FOUR_IDS.map((id): [string, Lesson] => [id, p => <ModuleFourLesson id={id} {...p} />]),
];

function setLayout(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: wide && query === TWO_PANE, media: query,
    addEventListener: () => {}, removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

// The heading, copy and visual of every step, as text, in one layout.
function readSteps(lesson: Lesson, wide: boolean, next: string): string[] {
  setLayout(wide);
  const { unmount } = render(<SettingsProvider>{lesson({ onExit: () => {}, onPractice: () => {} })}</SettingsProvider>);
  const texts: string[] = [];
  for (;;) {
    const heading = document.querySelector('main h2')?.textContent ?? '';
    const copy = document.querySelector('main .lesson-text')?.textContent ?? '';
    const visual = document.querySelector(wide ? 'main .lesson-panel' : 'main .lesson-visual');
    expect(heading.length, 'heading').toBeGreaterThan(0);
    expect(copy.length, `copy of "${heading}"`).toBeGreaterThan(40);
    expect(visual, `visual of "${heading}"`).not.toBeNull();
    texts.push(`${heading}\n${copy}\n${visual!.textContent}\n${visual!.querySelectorAll('svg, button').length}`);
    const button = screen.queryByRole('button', { name: next });
    if (!button) break;
    fireEvent.click(button);
  }
  unmount();
  return texts;
}

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('every lesson in both layouts', () => {
  it('covers every topic', () => {
    expect(ALL.map(([id]) => id).sort()).toEqual(Object.keys(LESSONS).sort());
  });

  it.each(ALL)('%s shows the same steps, copy and visuals in one column and in two panes', (_, lesson) => {
    for (const language of ['en', 'pt'] as const) {
      localStorage.setItem('musicgame.settings', JSON.stringify({ language, notation: 'both' }));
      const next = language === 'pt' ? 'Próxima' : 'Next';
      const narrow = readSteps(lesson, false, next);
      const wide = readSteps(lesson, true, next);
      expect(narrow.length).toBe(6);
      expect(wide).toEqual(narrow);
    }
  });
});
