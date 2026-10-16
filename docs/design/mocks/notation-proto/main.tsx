// Entry point of the notation prototype (see index.html for the parameters).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsProvider } from '/src/SettingsContext';
import {
  ExplorerScreen, FeedbackScreen, LessonClefsScreen, LessonMeasureScreen, LessonTrebleScreen, McScreen, QuizMeasureScreen, StripScreen,
  type ScreenOpts,
} from './screens';
import type { Theme } from './notation';

const params = new URLSearchParams(location.search);
const screen = params.get('screen') ?? 'strip';
const theme = (params.get('theme') ?? 'linked') as Theme;
const lang = params.get('lang') ?? 'en';
const notation = params.get('notation') ?? 'both';
const answered = params.get('answered') === '1';
const step = params.get('step') ?? '';
const desktop = window.innerWidth >= 1000;

// The real SettingsProvider reads localStorage; seed it before mounting.
localStorage.setItem('musicgame.settings', JSON.stringify({
  language: lang, notation, advanceMode: 'auto', autoAdvanceDelayMs: 900, difficulty: 'none', sound: true,
}));

const SCREENS: Record<string, (o: ScreenOpts) => JSX.Element> = {
  feedback: FeedbackScreen,
  mc: McScreen,
  'lesson-treble': LessonTrebleScreen,
  'lesson-clefs': LessonClefsScreen,
  'lesson-measure': LessonMeasureScreen,
  'quiz-measure': QuizMeasureScreen,
  explorer: ExplorerScreen,
  strip: StripScreen,
};
const Screen = SCREENS[screen] ?? StripScreen;
const tall = screen === 'strip' || !desktop;

const caption = desktop && (
  <div className="caption" aria-label="Window controls">
    <span className="caption-btn"><svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1"><path d="M0 5h10" /></svg></span>
    <span className="caption-btn"><svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1"><rect x=".5" y=".5" width="9" height="9" rx="1" /></svg></span>
    <span className="caption-btn"><svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1"><path d="M.5 .5l9 9M9.5 .5l-9 9" /></svg></span>
  </div>
);

document.documentElement.lang = lang;
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <div className={`screen ${desktop ? 'desktop' : 'phone'}${tall ? ' tall' : ''}`} lang={lang}>
        {caption}
        <Screen theme={theme} answered={answered} step={step} desktop={desktop} />
      </div>
    </SettingsProvider>
  </StrictMode>,
);
