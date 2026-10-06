// Media queries derived from the config breakpoints, for makeStyles.
// Griffel doesn't order media rules by width, so when two queries set the same property use
// non-overlapping ranges (tabletOnly, tabletToDesktop) instead of relying on rule order.
import { BREAKPOINTS } from '../config';

export const MEDIA = {
  phone: `@media (max-width: ${BREAKPOINTS.TABLET - 1}px)`,
  tabletOnly: `@media (min-width: ${BREAKPOINTS.TABLET}px) and (max-width: ${BREAKPOINTS.DESKTOP - 1}px)`,
  tabletToDesktop: `@media (min-width: ${BREAKPOINTS.TABLET}px) and (max-width: ${BREAKPOINTS.WIDE - 1}px)`,
  tabletUp: `@media (min-width: ${BREAKPOINTS.TABLET}px)`,
  belowDesktop: `@media (max-width: ${BREAKPOINTS.DESKTOP - 1}px)`,
  desktopUp: `@media (min-width: ${BREAKPOINTS.DESKTOP}px)`,
  wideUp: `@media (min-width: ${BREAKPOINTS.WIDE}px)`,
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;

export const QUERY = {
  phone: `(max-width: ${BREAKPOINTS.TABLET - 1}px)`,
  desktopUp: `(min-width: ${BREAKPOINTS.DESKTOP}px)`,
} as const;
