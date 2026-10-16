import { ModuleOneGame } from '../module-one/ModuleOneGame';

// Questions come from the shared Module 1 bank in module-one/staff.ts.
export function ClaveSol({ onExit }: { onExit: () => void }) {
  return <ModuleOneGame id="clave-sol" onExit={onExit} />;
}
