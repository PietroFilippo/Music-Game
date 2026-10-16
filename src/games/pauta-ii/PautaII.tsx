import { ModuleOneGame } from '../module-one/ModuleOneGame';

// Questions come from the shared Module 1 bank in module-one/staff.ts.
export function PautaII({ onExit }: { onExit: () => void }) {
  return <ModuleOneGame id="pauta-ii" onExit={onExit} />;
}
