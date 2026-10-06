// Wizard page frame (spec section 13): H1, step indicator, then form (2/3) + sticky summary (1/3)
// on desktop; one column with a collapsible "Summary" above the page actions below desktop.
import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Card,
  Subtitle2,
  Title1,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { StepIndicator } from '../StepIndicator';
import { RequestSummary } from '../RequestSummary';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { QUERY } from '../../theme/layout';
import { HEADER_HEIGHT } from '../Header';

export const NEW_PATH_STEPS = ['Person', 'Details', 'Projects', 'Review'] as const;
export const EXISTING_PATH_STEPS = ['Person', 'Projects', 'Review'] as const;

const useStyles = makeStyles({
  heading: { outlineStyle: 'none', display: 'block', marginBottom: tokens.spacingVerticalL },
  steps: { marginBottom: tokens.spacingVerticalXXL },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: tokens.spacingHorizontalXXXL,
    alignItems: 'start',
  },
  form: { minWidth: 0 },
  aside: {
    position: 'sticky',
    top: `${HEADER_HEIGHT + 24}px`,
  },
  summaryCard: { padding: tokens.spacingHorizontalL },
  mobileSummary: {
    marginBlock: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
  },
});

interface WizardLayoutProps {
  title: string;
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
  children: ReactNode;
  /** The PageActions element for this page. */
  actions: ReactNode;
}

export function WizardLayout({ title, steps, current, children, actions }: WizardLayoutProps) {
  const styles = useStyles();
  const isDesktop = useMediaQuery(QUERY.desktopUp);

  return (
    <>
      <Title1 as="h1" tabIndex={-1} className={styles.heading}>
        {title}
      </Title1>
      <div className={styles.steps}>
        <StepIndicator steps={steps} current={current} />
      </div>
      {isDesktop ? (
        <div className={styles.grid}>
          <div className={styles.form}>
            {children}
            {actions}
          </div>
          <aside className={styles.aside} aria-labelledby="request-summary-title">
            <Card className={styles.summaryCard}>
              <Subtitle2 as="h2" id="request-summary-title">
                Request summary
              </Subtitle2>
              <RequestSummary />
            </Card>
          </aside>
        </div>
      ) : (
        <>
          {children}
          <Accordion collapsible className={styles.mobileSummary}>
            <AccordionItem value="summary">
              <AccordionHeader as="h2">Summary</AccordionHeader>
              <AccordionPanel>
                <RequestSummary />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          {actions}
        </>
      )}
    </>
  );
}
