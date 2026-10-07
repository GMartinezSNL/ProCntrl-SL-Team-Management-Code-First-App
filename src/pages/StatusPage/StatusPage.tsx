// STATUS (spec section 8): the person is already onboarded or in progress. Guarded in routes.tsx,
// so a person with one of those statuses is always present here.
import {
  Body1,
  Body1Strong,
  Button,
  Card,
  CardFooter,
  Subtitle2,
  Title1,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Home24Regular } from '@fluentui/react-icons';
import { ROUTES } from '../../config';
import { PageActions } from '../../components/PageActions';
import { PersonStatusBadge, SelectedPersonBox } from '../../components/SelectedPersonBox';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useEnvironmentName } from '../../hooks/useEnvironmentName';
import { useRequest } from '../../state/requestStore';

const ONBOARDED_MESSAGE = 'The user selected is already onboarded to the environment. Select an option below.';
const IN_PROGRESS_MESSAGE =
  'The user selected is already in the process of being onboarded to the environment. Select an option below.';

const useStyles = makeStyles({
  wrap: {
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '640px',
    marginInline: 'auto',
  },
  heading: { outlineStyle: 'none', display: 'block', marginBottom: tokens.spacingVerticalL },
  card: { padding: 0, overflow: 'hidden' },
  // Header strip in the brand fill; the theme pairs it with on-brand text for contrast.
  strip: {
    margin: 0,
    paddingBlock: tokens.spacingVerticalM,
    paddingInline: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    paddingInline: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingHorizontalL,
  },
});

export function StatusPage() {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { state, dispatch, reset } = useRequest();
  const { person } = state;
  const environmentName = useEnvironmentName();
  if (!person) return null;

  const goHome = () => {
    reset();
    navigate(ROUTES.HOME, 'back');
  };

  const goProjectSpecific = () => {
    dispatch({ type: 'setPath', path: 'existing' });
    navigate(ROUTES.EXISTING_PROJECTS);
  };

  return (
    <div className={styles.wrap}>
      <Title1 as="h1" tabIndex={-1} className={styles.heading}>
        Onboard Team Member
      </Title1>
      <Card className={styles.card}>
        <Subtitle2 as="h2" className={styles.strip}>
          Onboarding Message
        </Subtitle2>
        <div className={styles.body}>
          <Body1>{person.status === 'inProgress' ? IN_PROGRESS_MESSAGE : ONBOARDED_MESSAGE}</Body1>
          {environmentName && (
            <Body1>
              <Body1Strong>Environment:</Body1Strong> {environmentName}
            </Body1>
          )}
          <SelectedPersonBox fullName={person.fullName} email={person.email}>
            <PersonStatusBadge status={person.status} />
          </SelectedPersonBox>
        </div>
        <CardFooter className={styles.footer}>
          <Button appearance="secondary" size="large" icon={<Home24Regular />} onClick={goHome}>
            Home
          </Button>
          <Tooltip content="Onboard user to specific projects. Select projects on next page." relationship="description">
            <Button appearance="primary" size="large" onClick={goProjectSpecific}>
              Project-Specific Onboard
            </Button>
          </Tooltip>
        </CardFooter>
      </Card>
      <PageActions onBack={() => navigate(ROUTES.PERSON, 'back')} />
    </div>
  );
}
