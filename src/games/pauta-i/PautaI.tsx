import { ModuleOneGame } from '../module-one/ModuleOneGame';

// Questions come from the shared Module 1 bank in module-one/staff.ts.
export function PautaI({ onExit }: { onExit: () => void }) {
  return <ModuleOneGame id="pauta-i" onExit={onExit} />;
}
