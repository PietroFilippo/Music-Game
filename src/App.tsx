import { lazy, Suspense, useEffect, useReducer, useState } from 'react';
import { SettingsProvider } from './SettingsContext';
import { DesktopBridge, type DesktopRoute } from './desktop/DesktopBridge';
import { DesktopChrome } from './desktop/DesktopChrome';
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
        {route === 'stats' && <Stats onBack={back} />}
        {route === 'tuner' && <Tuner onBack={back} />}
        {Game && <Game key={route} onExit={back} />}
        {reviewModule && <ReviewSession key={route} moduleId={reviewModule} onExit={back} />}
        {lesson}
      </Suspense>
      <DesktopChrome />
    </SettingsProvider>
  );
}
