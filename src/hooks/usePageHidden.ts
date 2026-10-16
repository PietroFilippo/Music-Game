import { useEffect, useState } from 'react';

// The desktop shell announces when its window goes to the tray. Browsers report
// background tabs and minimized windows through document.hidden.
let shellHidden = false;

const isHidden = () => typeof document !== 'undefined' && (document.hidden || shellHidden);

export function setShellHidden(hidden: boolean): void {
  shellHidden = hidden;
  document.dispatchEvent(new Event('visibilitychange'));
}

/** True while nobody can see the page: a background tab, a minimized window or the tray. */
export function usePageHidden(): boolean {
  const [hidden, setHidden] = useState(isHidden);
  useEffect(() => {
    const update = () => setHidden(isHidden());
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return hidden;
}
