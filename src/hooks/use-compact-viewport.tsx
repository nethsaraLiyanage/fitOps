import * as React from "react";

/** Tablets and below — iPad landscape is exactly 1024px, so it counts as compact. */
export const COMPACT_BREAKPOINT = 1024;

const query = `(max-width: ${COMPACT_BREAKPOINT}px)`;

/**
 * True on phone and tablet widths. Read synchronously on the first render so
 * the sidebar starts collapsed instead of flashing open.
 */
export function useIsCompactViewport() {
  const [compact, setCompact] = React.useState(() => window.matchMedia(query).matches);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setCompact(mql.matches);
    mql.addEventListener("change", onChange);
    setCompact(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return compact;
}
