import { lazy, type ComponentType } from 'react';
import type { GameId } from '../types';
import type { ModuleOneId } from './module-one/questions';
import type { ModuleTwoId } from './module-two/questions';

interface GameProps { onExit: () => void }

function moduleGame(id: ModuleOneId) {
  return lazy(() => import('./module-one/ModuleOneGame').then(m => ({
    default: (props: GameProps) => <m.ModuleOneGame {...props} id={id} />,
  })));
}

function moduleTwoGame(id: ModuleTwoId) {
  return lazy(() => import('./module-two/ModuleTwoGame').then(m => ({
    default: (props: GameProps) => <m.ModuleTwoGame {...props} id={id} />,
  })));
}

export const GAMES: Record<GameId, ComponentType<GameProps>> = {
  'pauta-i': lazy(() => import('./pauta-i/PautaI').then(m => ({ default: m.PautaI }))),
  'pauta-ii': lazy(() => import('./pauta-ii/PautaII').then(m => ({ default: m.PautaII }))),
  claves: lazy(() => import('./claves/Claves').then(m => ({ default: m.Claves }))),
  'clave-sol': lazy(() => import('./clave-sol/ClaveSol').then(m => ({ default: m.ClaveSol }))),
  'nome-notas': moduleGame('nome-notas'),
  'notacao-alfabetica': moduleGame('notacao-alfabetica'),
  'nome-figuras': moduleGame('nome-figuras'),
  'notas-descendentes': moduleGame('notas-descendentes'),
  'propriedades-som': moduleGame('propriedades-som'),
  'notas-teclado': moduleGame('notas-teclado'),
  'cordas-afinacao': moduleTwoGame('cordas-afinacao'),
  'notas-braco': moduleTwoGame('notas-braco'),
  'sustenidos-bemois': moduleTwoGame('sustenidos-bemois'),
  oitavas: moduleTwoGame('oitavas'),
  intervalos: moduleTwoGame('intervalos'),
  escalas: moduleTwoGame('escalas'),
};
