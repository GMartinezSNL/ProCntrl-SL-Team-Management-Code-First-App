// Read-only "selected person" box: Light fill with a Main border (spec section 7).
import type { ReactNode } from 'react';
import { Avatar, Body1Strong, Caption1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { useThemeMode } from '../../theme/FluentThemeProvider';

const useStyles = makeStyles({
  box: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusXLarge,
    border: '1px solid var(--tm-main)',
    flexWrap: 'wrap',
  },
  // Light is a pale tint, so text stays dark; in dark mode a dark brand tint keeps light text readable.
  light: { backgroundColor: 'var(--tm-light)', color: tokens.colorNeutralForeground1 },
  dark: { backgroundColor: tokens.colorBrandBackground2, color: tokens.colorNeutralForeground1 },
  text: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: '1 1 auto',
    overflowWrap: 'anywhere',
  },
});

interface SelectedPersonBoxProps {
  fullName: string;
  email: string | null;
  /** Optional slot, e.g. the status Badge. */
  children?: ReactNode;
}

export function SelectedPersonBox({ fullName, email, children }: SelectedPersonBoxProps) {
  const styles = useStyles();
  const { colorScheme } = useThemeMode();
  return (
    <section
      aria-label="Selected person"
      className={mergeClasses(styles.box, colorScheme === 'dark' ? styles.dark : styles.light)}
    >
      <Avatar name={fullName} color="colorful" size={40} aria-hidden="true" />
      <div className={styles.text}>
        <Body1Strong>{fullName}</Body1Strong>
        <Caption1>{email ?? 'No email on file'}</Caption1>
      </div>
      {children}
    </section>
  );
}
