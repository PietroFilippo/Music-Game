import { useState } from 'react';
import { SettingsProvider } from './SettingsContext';
import { Menu } from './Menu';
import { PautaI } from './games/pauta-i/PautaI';
import { PautaII } from './games/pauta-ii/PautaII';
import { Claves } from './games/claves/Claves';
import { ClaveSol } from './games/clave-sol/ClaveSol';
import type { GameId } from './types';

type Route = 'menu' | GameId;

export default function App() {
  const [route, setRoute] = useState<Route>('menu');
  const back = () => setRoute('menu');

  return (
    <SettingsProvider>
      {route === 'menu' && <Menu onPick={setRoute} />}
      {route === 'pauta-i' && <PautaI onExit={back} />}
      {route === 'pauta-ii' && <PautaII onExit={back} />}
      {route === 'claves' && <Claves onExit={back} />}
      {route === 'clave-sol' && <ClaveSol onExit={back} />}
    </SettingsProvider>
  );
}
