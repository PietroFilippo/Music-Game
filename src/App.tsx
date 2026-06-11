import { useState } from 'react';
import { SettingsProvider } from './SettingsContext';
import { Menu } from './Menu';
import { PautaI } from './games/pauta-i/PautaI';
import { PautaII } from './games/pauta-ii/PautaII';
import { Claves } from './games/claves/Claves';
import { ClaveSol } from './games/clave-sol/ClaveSol';
import { LESSONS } from './lessons';
import type { GameId } from './types';

type Route = 'menu' | GameId | `learn:${GameId}`;

export default function App() {
  const [route, setRoute] = useState<Route>('menu');
  const back = () => setRoute('menu');

  let lesson = null;
  if (route.startsWith('learn:')) {
    const gameId = route.slice('learn:'.length) as GameId;
    const Lesson = LESSONS[gameId];
    if (Lesson) lesson = <Lesson onExit={back} onPractice={() => setRoute(gameId)} />;
  }

  return (
    <SettingsProvider>
      {route === 'menu' && <Menu onPlay={setRoute} onLearn={id => setRoute(`learn:${id}`)} />}
      {route === 'pauta-i' && <PautaI onExit={back} />}
      {route === 'pauta-ii' && <PautaII onExit={back} />}
      {route === 'claves' && <Claves onExit={back} />}
      {route === 'clave-sol' && <ClaveSol onExit={back} />}
      {lesson}
    </SettingsProvider>
  );
}
