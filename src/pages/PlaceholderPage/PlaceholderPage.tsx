// TEMPORARY placeholders for pages that later features build (F05-F09).
import { Body1, Card, Title1, makeStyles, tokens } from '@fluentui/react-components';
import { PageActions } from '../../components/PageActions';
import { WizardLayout } from '../../components/WizardLayout';
import { useAppNavigate } from '../../hooks/useAppNavigate';

const useStyles = makeStyles({
  card: { padding: tokens.spacingHorizontalXL },
  heading: { outlineStyle: 'none', display: 'block', marginBottom: tokens.spacingVerticalL },
  narrow: {
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '640px',
    marginInline: 'auto',
  },
});

interface WizardPlaceholderProps {
  title: string;
  steps: readonly string[];
  current: number;
  backTo: string;
  builtIn: string;
}

export function WizardPlaceholder({ title, steps, current, backTo, builtIn }: WizardPlaceholderProps) {
  const styles = useStyles();
  const navigate = useAppNavigate();
  return (
    <WizardLayout
      title={title}
      steps={steps}
      current={current}
      actions={<PageActions onBack={() => navigate(backTo, 'back')} />}
    >
      <Card className={styles.card}>
        <Body1>This step is built in {builtIn}.</Body1>
      </Card>
    </WizardLayout>
  );
}

interface SimplePlaceholderProps {
  title: string;
  backTo: string;
  builtIn: string;
}

export function SimplePlaceholder({ title, backTo, builtIn }: SimplePlaceholderProps) {
  const styles = useStyles();
  const navigate = useAppNavigate();
  return (
    <div className={styles.narrow}>
      <Title1 as="h1" tabIndex={-1} className={styles.heading}>
        {title}
      </Title1>
      <Card className={styles.card}>
        <Body1>This page is built in {builtIn}.</Body1>
      </Card>
      <PageActions onBack={() => navigate(backTo, 'back')} />
    </div>
  );
}
