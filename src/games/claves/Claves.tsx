import { ModuleOneGame } from '../module-one/ModuleOneGame';

// Questions come from the shared Module 1 bank in module-one/staff.ts.
export function Claves({ onExit }: { onExit: () => void }) {
  return <ModuleOneGame id="claves" onExit={onExit} />;
}
