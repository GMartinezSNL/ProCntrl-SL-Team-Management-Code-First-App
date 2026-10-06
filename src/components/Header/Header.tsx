// Sticky 64px top bar (spec section 13): Home + app name left; user, dark-mode toggle, Help right.
import type { RefObject } from 'react';
import {
  Avatar,
  Button,
  FluentProvider,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
  type PartialTheme,
} from '@fluentui/react-components';
import { Home24Regular, QuestionCircle24Regular, WeatherMoon24Regular, WeatherSunny24Regular } from '@fluentui/react-icons';
import { useThemeMode } from '../../theme/FluentThemeProvider';
import { MEDIA } from '../../theme/layout';
import { useScrolled } from '../../hooks/useScrolled';

export const HEADER_HEIGHT = 64;

// Controls inside the header sit on the brand gradient: re-theme them (not restyle) to on-brand text.
const ON_BRAND = tokens.colorNeutralForegroundOnBrand;
const HEADER_THEME: PartialTheme = {
  colorNeutralForeground1: ON_BRAND,
  colorNeutralForeground2: ON_BRAND,
  colorNeutralForeground2Hover: ON_BRAND,
  colorNeutralForeground2Pressed: ON_BRAND,
  colorNeutralForeground2BrandHover: ON_BRAND,
  colorNeutralForeground2BrandPressed: ON_BRAND,
  colorNeutralForeground2BrandSelected: ON_BRAND,
  colorSubtleBackgroundHover: 'rgba(255, 255, 255, 0.16)',
  colorSubtleBackgroundPressed: 'rgba(255, 255, 255, 0.24)',
  colorStrokeFocus2: ON_BRAND,
};

const useStyles = makeStyles({
  provider: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  bar: {
    position: 'relative',
    height: `${HEADER_HEIGHT}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    paddingInline: tokens.spacingHorizontalL,
    isolation: 'isolate',
    '::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      backgroundImage: 'linear-gradient(90deg, var(--tm-main), var(--tm-medium))',
      transitionProperty: 'opacity',
      transitionDuration: tokens.durationNormal,
    },
  },
  scrolled: {
    backdropFilter: 'blur(12px)',
    boxShadow: tokens.shadow8,
    '::before': { opacity: 0.9 },
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  appName: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userName: {
    whiteSpace: 'nowrap',
    marginInlineEnd: tokens.spacingHorizontalS,
    [MEDIA.belowDesktop]: { display: 'none' },
  },
});

interface HeaderProps {
  userName: string | null;
  onHomeClick: () => void;
  onHelpClick: () => void;
  helpButtonRef: RefObject<HTMLButtonElement | null>;
}

export function Header({ userName, onHomeClick, onHelpClick, helpButtonRef }: HeaderProps) {
  const styles = useStyles();
  const { colorScheme, toggleColorScheme } = useThemeMode();
  const isScrolled = useScrolled();
  const isDark = colorScheme === 'dark';
  const toggleLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <FluentProvider theme={HEADER_THEME} className={styles.provider}>
      <header className={mergeClasses(styles.bar, isScrolled && styles.scrolled)}>
        <div className={styles.group}>
          <Tooltip content="Start over & return to home page" relationship="label" appearance="inverted">
            <Button appearance="subtle" size="large" icon={<Home24Regular />} onClick={onHomeClick} />
          </Tooltip>
          <Text weight="semibold" size={400} className={styles.appName}>
            Team Management
          </Text>
        </div>
        <div className={styles.group}>
          {userName && (
            <>
              <Avatar name={userName} color="colorful" size={32} aria-label={`Signed in as ${userName}`} />
              <Text className={styles.userName} aria-hidden="true">
                {userName}
              </Text>
            </>
          )}
          <Tooltip content={toggleLabel} relationship="label" appearance="inverted">
            <Button
              appearance="subtle"
              size="large"
              icon={isDark ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
              onClick={toggleColorScheme}
            />
          </Tooltip>
          <Tooltip content="Help" relationship="label" appearance="inverted">
            <Button
              ref={helpButtonRef}
              appearance="subtle"
              size="large"
              icon={<QuestionCircle24Regular />}
              onClick={onHelpClick}
            />
          </Tooltip>
        </div>
      </header>
    </FluentProvider>
  );
}
