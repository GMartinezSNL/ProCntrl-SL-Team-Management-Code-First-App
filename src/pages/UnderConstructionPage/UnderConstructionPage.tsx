// UNDER CONSTRUCTION (spec section 8): large bold centered text in Main, plus a Home button.
import { Button, LargeTitle, makeStyles, tokens } from '@fluentui/react-components';
import { Home24Regular, WrenchScrewdriver24Regular } from '@fluentui/react-icons';
import { ROUTES } from '../../config';
import { useAppNavigate } from '../../hooks/useAppNavigate';

const useStyles = makeStyles({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalXXL,
    paddingBlock: tokens.spacingVerticalXXXL,
    maxWidth: '640px',
    marginInline: 'auto',
  },
  icon: { fontSize: '48px', color: tokens.colorBrandForeground1 },
  // colorBrandForeground1 is Main in the light theme and a lighter brand shade in dark mode (AA).
  title: { color: tokens.colorBrandForeground1, outlineStyle: 'none' },
});

export function UnderConstructionPage() {
  const styles = useStyles();
  const navigate = useAppNavigate();
  return (
    <div className={styles.wrap}>
      <WrenchScrewdriver24Regular className={styles.icon} aria-hidden="true" />
      <LargeTitle as="h1" tabIndex={-1} className={styles.title}>
        Under Construction, Contact DMS
      </LargeTitle>
      <Button appearance="primary" size="large" icon={<Home24Regular />} onClick={() => navigate(ROUTES.HOME, 'back')}>
        Home
      </Button>
    </div>
  );
}
