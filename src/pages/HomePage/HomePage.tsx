// HOME (spec section 8): hero + four action cards (4 across wide, 2 x 2 tablet/desktop, 1 column phone).
import type { KeyboardEvent, ReactElement } from 'react';
import { Body1, Card, Subtitle1, makeStyles, tokens } from '@fluentui/react-components';
import {
  PeopleTeam48Regular,
  PersonAdd24Regular,
  PersonDelete24Regular,
  PersonEdit24Regular,
  QuestionCircle24Regular,
} from '@fluentui/react-icons';
import { ROUTES } from '../../config';
import { HeroBanner } from '../../components/HeroBanner';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useRequest } from '../../state/requestStore';
import { MEDIA } from '../../theme/layout';

// Optional asset: the user copies logo.png into src/assets. Until then a Fluent icon stands in.
const logoModules = import.meta.glob<string>('../../assets/logo.png', { eager: true, import: 'default' });
const LOGO_SRC = Object.values(logoModules)[0] ?? null;

interface HomeAction {
  key: string;
  title: string;
  description: string;
  icon: ReactElement;
  run: () => void;
}

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalXXL,
    gridTemplateColumns: '1fr',
    [MEDIA.tabletToDesktop]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    [MEDIA.wideUp]: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  },
  card: {
    padding: tokens.spacingHorizontalXL,
    gap: tokens.spacingVerticalM,
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveDecelerateMid,
    ':hover': { transform: 'translateY(-3px)', boxShadow: tokens.shadow16 },
    ':active': { transform: 'scale(0.97)' },
    [MEDIA.reducedMotion]: {
      transitionProperty: 'box-shadow',
      ':hover': { transform: 'none' },
      ':active': { transform: 'none' },
    },
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: tokens.borderRadiusLarge,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  description: { color: tokens.colorNeutralForeground2 },
  logoFallback: { color: tokens.colorNeutralForegroundOnBrand },
});

export function HomePage() {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { reset } = useRequest();

  const actions: HomeAction[] = [
    {
      key: 'onboard',
      title: 'Onboard User',
      description: 'Start an onboarding request for a new or existing team member.',
      icon: <PersonAdd24Regular />,
      run: () => {
        reset();
        navigate(ROUTES.PERSON);
      },
    },
    {
      key: 'offboard',
      title: 'Offboard User',
      description: 'Remove a team member from the environment.',
      icon: <PersonDelete24Regular />,
      run: () => navigate(ROUTES.UNDER_CONSTRUCTION),
    },
    {
      key: 'update',
      title: 'Update User Info',
      description: "Change a team member's details.",
      icon: <PersonEdit24Regular />,
      run: () => navigate(ROUTES.UNDER_CONSTRUCTION),
    },
    {
      key: 'help',
      title: 'Help Page',
      description: 'Step-by-step guides for each task.',
      icon: <QuestionCircle24Regular />,
      run: () => navigate(ROUTES.HELP),
    },
  ];

  const onCardKeyDown = (event: KeyboardEvent, run: () => void) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    run();
  };

  const logo = LOGO_SRC ? (
    <img src={LOGO_SRC} alt="Sargent & Lundy logo" />
  ) : (
    <PeopleTeam48Regular className={styles.logoFallback} aria-hidden="true" />
  );

  return (
    <>
      <HeroBanner
        title="Team Management App"
        subtitle="Onboard project team members and manage their access in a few guided steps."
        logo={logo}
      />
      <nav aria-label="Home actions" className={styles.grid}>
        {actions.map((action) => (
          <Card
            key={action.key}
            role="button"
            aria-label={action.title}
            className={styles.card}
            onClick={action.run}
            onKeyDown={(event) => onCardKeyDown(event, action.run)}
          >
            <span className={styles.iconWrap} aria-hidden="true">
              {action.icon}
            </span>
            <Subtitle1 as="h2">{action.title}</Subtitle1>
            <Body1 className={styles.description}>{action.description}</Body1>
          </Card>
        ))}
      </nav>
    </>
  );
}
