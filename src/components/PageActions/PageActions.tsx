// Back (secondary) left, Continue/Submit (primary) right (spec section 13, U5).
// Desktop: at the end of the form. Tablet and phone: sticky bottom bar with safe-area padding.
import type { ReactElement } from 'react';
import { Button, Spinner, makeStyles, tokens } from '@fluentui/react-components';
import { MEDIA } from '../../theme/layout';

const useStyles = makeStyles({
  bar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXXL,
    [MEDIA.belowDesktop]: {
      position: 'sticky',
      bottom: 0,
      zIndex: 5,
      // Pushed to the bottom of the AppShell flex column on short pages.
      marginTop: 'auto',
      paddingTop: tokens.spacingVerticalM,
      paddingBottom: `calc(${tokens.spacingVerticalM} + env(safe-area-inset-bottom))`,
      backgroundColor: tokens.colorNeutralBackground1,
      borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
      boxShadow: tokens.shadow8,
    },
    // Matches the AppShell gutters (24px tablet, 16px phone) so the bar spans edge to edge.
    // Negative bottom margin cancels the main area's bottom padding so the bar touches the edge.
    [MEDIA.tabletOnly]: {
      marginInline: '-24px',
      paddingInline: '24px',
      marginBottom: `calc(-1 * ${tokens.spacingVerticalXXL})`,
    },
    [MEDIA.phone]: {
      marginInline: '-16px',
      paddingInline: '16px',
      marginBottom: `calc(-1 * ${tokens.spacingVerticalL})`,
    },
  },
  spacer: { flex: '1 1 auto' },
});

interface PageActionsProps {
  onBack?: () => void;
  backLabel?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  isPrimaryDisabled?: boolean;
  /** Shows a spinner and "Submitting..." and disables both buttons. */
  isBusy?: boolean;
  primaryIcon?: ReactElement;
}

export function PageActions({
  onBack,
  backLabel = 'Back',
  primaryLabel,
  onPrimary,
  isPrimaryDisabled = false,
  isBusy = false,
  primaryIcon,
}: PageActionsProps) {
  const styles = useStyles();
  return (
    <div className={styles.bar}>
      {onBack ? (
        <Button appearance="secondary" size="large" onClick={onBack} disabled={isBusy}>
          {backLabel}
        </Button>
      ) : (
        <span className={styles.spacer} />
      )}
      {primaryLabel && onPrimary && (
        <Button
          appearance="primary"
          size="large"
          onClick={onPrimary}
          disabled={isPrimaryDisabled || isBusy}
          icon={isBusy ? <Spinner size="tiny" /> : primaryIcon}
          iconPosition="after"
        >
          {isBusy ? 'Submitting...' : primaryLabel}
        </Button>
      )}
    </div>
  );
}
