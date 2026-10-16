import { lazy, Suspense, useEffect, useReducer, useState } from 'react';
import { SettingsProvider } from './SettingsContext';
import { DesktopBridge, type DesktopRoute } from './desktop/DesktopBridge';
import { DesktopChrome } from './desktop/DesktopChrome';
import { QuizNavContext, type QuizNav } from './components/QuizNav';
import { PROGRESS_CHANGED } from './store/transfer';
import { Menu, recommendTopic } from './Menu';
import { GAMES } from './games';
import { LESSONS } from './lessons';
import { useI18n } from './hooks/useI18n';
import type { GameId } from './types';

type Route = 'menu' | 'stats' | 'tuner' | GameId | `learn:${GameId}` | `review:${string}`;

const Stats = lazy(() => import('./Stats').then(m => ({ default: m.Stats })));
const Tuner = lazy(() => import('./Tuner').then(m => ({ default: m.Tuner })));
const ReviewSession = lazy(() => import('./review/ReviewSession').then(m => ({ default: m.ReviewSession })));

function Loading() {
  const { t } = useI18n();
  return <p role="status" style={{ padding: 40, textAlign: 'center' }}>{t('common.loading')}</p>;
}

export default function App() {
  const [route, setRoute] = useState<Route>('menu');
  const back = () => setRoute('menu');
  // Screens read progress when they render; an import asks them to read it again.
  const [, progressChanged] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener(PROGRESS_CHANGED, progressChanged);
    return () => window.removeEventListener(PROGRESS_CHANGED, progressChanged);
  }, []);
  // The tray menu opens the tuner or the recommended topic.
  const openFromTray = (to: DesktopRoute) => setRoute(to === 'tuner' ? 'tuner' : recommendTopic().id);

  let lesson = null;
  if (route.startsWith('learn:')) {
    const gameId = route.slice('learn:'.length) as GameId;
    const Lesson = LESSONS[gameId];
    if (Lesson) lesson = <Lesson key={route} onExit={back} onPractice={() => setRoute(gameId)} />;
  }
  const Game = route in GAMES ? GAMES[route as GameId] : null;
  // A topic's results offer its lesson and, after a perfect score, the
  // recommended topic: its lesson when it has not been played yet.
  const nav: QuizNav = Game ? {
    learn: LESSONS[route as GameId] ? () => setRoute(`learn:${route as GameId}`) : undefined,
    upNext: () => {
      const pick = recommendTopic();
      if (pick.id === route) return null;
      const lesson = pick.kind === 'next' && !!LESSONS[pick.id];
      return { id: pick.id, lesson, open: () => setRoute(lesson ? `learn:${pick.id}` : pick.id) };
    },
  } : {};
  const reviewModule = route.startsWith('review:') ? route.slice('review:'.length) : null;

  return (
    <SettingsProvider>
      <DesktopBridge onNavigate={openFromTray} screen={route} busy={!!Game || !!reviewModule} />
      <Suspense fallback={<Loading />}>
        {route === 'menu' && (
          <Menu
            onPlay={setRoute}
            onLearn={id => setRoute(`learn:${id}`)}
            onReview={moduleId => setRoute(`review:${moduleId}`)}
            onNavigate={setRoute}
          />
        )}
        {route === 'stats' && <Stats onBack={back} onStart={id => setRoute(`learn:${id}`)} />}
        {route === 'tuner' && <Tuner onBack={back} />}
        {Game && <QuizNavContext.Provider value={nav}><Game key={route} onExit={back} /></QuizNavContext.Provider>}
        {reviewModule && <ReviewSession key={route} moduleId={reviewModule} onExit={back} />}
        {lesson}
      </Suspense>
      <DesktopChrome />
    </SettingsProvider>
  );
}
