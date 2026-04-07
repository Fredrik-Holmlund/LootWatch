import { useEffect } from 'react';

declare global {
  interface Window {
    $WowheadPower?: { refreshLinks: () => void };
  }
}

/** Call after any render that adds new item links to the DOM. */
export function useWowheadTooltips(deps: unknown[]) {
  useEffect(() => {
    window.$WowheadPower?.refreshLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
