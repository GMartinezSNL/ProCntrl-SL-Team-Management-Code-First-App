// Home hero (spec section 11): slow animated gradient in Main, Medium and Light, logo with a soft glow,
// bold title and subtitle. Only transform/opacity animate; reduced motion keeps it still.
import type { ReactNode } from 'react';
import { Body1, Title1, makeStyles, tokens } from '@fluentui/react-components';
import { MEDIA } from '../../theme/layout';

const useStyles = makeStyles({
  hero: {
    position: 'relative',
    overflow: 'hidden',
    isolation: 'isolate',
    borderRadius: tokens.borderRadiusXLarge,
    padding: `${tokens.spacingVerticalXXXL} ${tokens.spacingHorizontalXXXL}`,
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow16,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXL,
    [MEDIA.phone]: {
      flexDirection: 'column',
      textAlign: 'center',
      padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalL}`,
    },
    // Wide gradient layer that drifts sideways.
    '::before': {
      content: '""',
      position: 'absolute',
      zIndex: -2,
      top: 0,
      bottom: 0,
      left: 0,
      width: '200%',
      backgroundImage: 'linear-gradient(110deg, var(--tm-main) 0%, var(--tm-medium) 35%, var(--tm-main) 70%, var(--tm-medium) 100%)',
      animationName: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      animationDuration: '24s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
      animationDirection: 'alternate',
      [MEDIA.reducedMotion]: { animationName: 'none' },
    },
    // Soft Light glow in the far corner, away from the text.
    '::after': {
      content: '""',
      position: 'absolute',
      zIndex: -1,
      width: '320px',
      height: '320px',
      right: '-80px',
      bottom: '-160px',
      borderRadius: tokens.borderRadiusCircular,
      backgroundImage: 'radial-gradient(circle, var(--tm-light) 0%, transparent 70%)',
      opacity: 0.45,
    },
  },
  logo: {
    flexShrink: 0,
    width: '96px',
    height: '96px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0 0 18px rgba(255, 255, 255, 0.45))',
    '& img': { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  },
  text: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, minWidth: 0 },
  title: { outlineStyle: 'none', color: 'inherit' },
  subtitle: { color: 'inherit', opacity: 0.92 },
});

interface HeroBannerProps {
  title: string;
  subtitle: string;
  /** Logo image or a fallback icon. */
  logo: ReactNode;
}

export function HeroBanner({ title, subtitle, logo }: HeroBannerProps) {
  const styles = useStyles();
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.logo}>{logo}</div>
      <div className={styles.text}>
        <Title1 as="h1" id="hero-title" tabIndex={-1} className={styles.title}>
          {title}
        </Title1>
        <Body1 className={styles.subtitle}>{subtitle}</Body1>
      </div>
    </section>
  );
}
