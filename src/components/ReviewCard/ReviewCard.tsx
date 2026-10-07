// One review item (spec sections 8, 11, 13; U2): label, value, and an Edit link back to its step.
// Cards fade in one after another; reduced motion shows them at once.
import { Body1, Caption1Strong, Card, Link, makeStyles, tokens } from '@fluentui/react-components';
import { MEDIA } from '../../theme/layout';

const STAGGER_MS = 50;

const useStyles = makeStyles({
  card: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalXS,
    alignItems: 'start',
    padding: tokens.spacingHorizontalL,
    animationName: { from: { opacity: 0 }, to: { opacity: 1 } },
    animationDuration: tokens.durationSlow,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: 'both',
    [MEDIA.reducedMotion]: { animationName: 'none' },
  },
  value: { gridColumn: '1 / -1', overflowWrap: 'anywhere' },
});

interface ReviewCardProps {
  label: string;
  value: string;
  onEdit: () => void;
  /** Position in the list, for the fade-in stagger. */
  index: number;
}

export function ReviewCard({ label, value, onEdit, index }: ReviewCardProps) {
  const styles = useStyles();
  return (
    <Card className={styles.card} style={{ animationDelay: `${index * STAGGER_MS}ms` }}>
      <Caption1Strong as="h2">{label}</Caption1Strong>
      <Link as="button" onClick={onEdit} aria-label={`Edit ${label}`}>
        Edit
      </Link>
      <Body1 className={styles.value}>{value}</Body1>
    </Card>
  );
}
