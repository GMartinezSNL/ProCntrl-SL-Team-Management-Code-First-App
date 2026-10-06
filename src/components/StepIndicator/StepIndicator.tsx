// Numbered dots joined by a line that fills with Main (spec section 11); compact text + bar on phone.
import { Caption1, ProgressBar, Text, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { Checkmark16Filled } from '@fluentui/react-icons';
import { MEDIA } from '../../theme/layout';

const DOT_SIZE = 32;

const useStyles = makeStyles({
  full: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    [MEDIA.phone]: { display: 'none' },
  },
  step: {
    position: 'relative',
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    textAlign: 'center',
  },
  // Connector from this step's dot to the previous step's dot.
  line: {
    position: 'absolute',
    top: `${DOT_SIZE / 2 - 1}px`,
    right: '50%',
    width: '100%',
    height: '2px',
    backgroundColor: tokens.colorNeutralStroke2,
    overflow: 'hidden',
    zIndex: 0,
  },
  lineFill: {
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--tm-main)',
    transformOrigin: 'left',
    transform: 'scaleX(0)',
    transitionProperty: 'transform',
    transitionDuration: tokens.durationSlow,
    transitionTimingFunction: tokens.curveDecelerateMid,
    [MEDIA.reducedMotion]: { transitionDuration: '0ms' },
  },
  lineFilled: { transform: 'scaleX(1)' },
  dot: {
    position: 'relative',
    zIndex: 1,
    width: `${DOT_SIZE}px`,
    height: `${DOT_SIZE}px`,
    borderRadius: tokens.borderRadiusCircular,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
  },
  dotDone: {
    backgroundColor: tokens.colorBrandBackground,
    border: `2px solid ${tokens.colorBrandBackground}`,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  dotCurrent: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    color: tokens.colorBrandForeground1,
    '::after': {
      content: '""',
      position: 'absolute',
      inset: '-6px',
      borderRadius: tokens.borderRadiusCircular,
      border: `2px solid ${tokens.colorBrandStroke1}`,
      opacity: 0,
      animationName: {
        '0%': { opacity: 0.6, transform: 'scale(0.85)' },
        '100%': { opacity: 0, transform: 'scale(1.15)' },
      },
      animationDuration: '2s',
      animationIterationCount: 3,
      animationTimingFunction: tokens.curveEasyEase,
      [MEDIA.reducedMotion]: { animationName: 'none' },
    },
  },
  labelCurrent: { fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1 },
  label: { color: tokens.colorNeutralForeground2 },
  compact: {
    display: 'none',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    [MEDIA.phone]: { display: 'flex' },
  },
});

interface StepIndicatorProps {
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  const styles = useStyles();
  const position = `Step ${current + 1} of ${steps.length}`;

  return (
    <nav aria-label="Progress">
      <ol className={styles.full}>
        {steps.map((label, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          return (
            <li key={label} className={styles.step} aria-current={isCurrent ? 'step' : undefined}>
              {index > 0 && (
                <span className={styles.line} aria-hidden="true">
                  <span className={mergeClasses(styles.lineFill, index <= current && styles.lineFilled)} />
                </span>
              )}
              <span
                className={mergeClasses(styles.dot, isDone && styles.dotDone, isCurrent && styles.dotCurrent)}
                aria-hidden="true"
              >
                {isDone ? <Checkmark16Filled /> : index + 1}
              </span>
              <Caption1 className={isCurrent ? styles.labelCurrent : styles.label}>
                {label}
                {isDone && <span className="visually-hidden"> (completed)</span>}
              </Caption1>
            </li>
          );
        })}
      </ol>
      <div className={styles.compact}>
        <Text weight="semibold">
          {position} - {steps[current]}
        </Text>
        <ProgressBar value={(current + 1) / steps.length} thickness="medium" aria-label={position} />
      </div>
    </nav>
  );
}
