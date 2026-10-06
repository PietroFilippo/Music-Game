import { lazy, Suspense, useState } from 'react';
import { SettingsProvider } from './SettingsContext';
import { Menu } from './Menu';
import { GAMES } from './games';
import { LESSONS } from './lessons';
import { useI18n } from './hooks/useI18n';
import type { GameId } from './types';

type Route = 'menu' | 'stats' | 'tuner' | GameId | `learn:${GameId}`;

const Stats = lazy(() => import('./Stats').then(m => ({ default: m.Stats })));
const Tuner = lazy(() => import('./Tuner').then(m => ({ default: m.Tuner })));

function Loading() {
  const { t } = useI18n();
  return <p role="status" style={{ padding: 40, textAlign: 'center' }}>{t('common.loading')}</p>;
}

export default function App() {
  const [route, setRoute] = useState<Route>('menu');
  const back = () => setRoute('menu');

  let lesson = null;
  if (route.startsWith('learn:')) {
    const gameId = route.slice('learn:'.length) as GameId;
    const Lesson = LESSONS[gameId];
    if (Lesson) lesson = <Lesson key={route} onExit={back} onPractice={() => setRoute(gameId)} />;
  }
  const Game = route in GAMES ? GAMES[route as GameId] : null;

  return (
    <SettingsProvider>
      <Suspense fallback={<Loading />}>
        {route === 'menu' && (
          <Menu
            onPlay={setRoute}
            onLearn={id => setRoute(`learn:${id}`)}
            onNavigate={setRoute}
          />
        )}
        {route === 'stats' && <Stats onBack={back} />}
        {route === 'tuner' && <Tuner onBack={back} />}
        {Game && <Game key={route} onExit={back} />}
        {lesson}
      </Suspense>
    </SettingsProvider>
  );
}
