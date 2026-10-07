// NEW PROJECTS (spec section 8, step 3): optional NDA project selection.
import { Body1, makeStyles, tokens } from '@fluentui/react-components';
import { ROUTES } from '../../config';
import { PageActions } from '../../components/PageActions';
import { ProjectPicker } from '../../components/ProjectPicker';
import { NEW_PATH_STEPS, WizardLayout } from '../../components/WizardLayout';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useRequest } from '../../state/requestStore';

const INTRO =
  "The selected user will be onboarded to the environment and receive the relevant NDAs. If you'd like to assign the user to specific projects or project parts with unique NDAs, please select them below. Only projects or project parts with NDAs associated in the MDD will appear.";
const HINT =
  'Select projects only if the team member will be working on projects with unique/distinct confidentiality obligations/NDA(s).';

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
});

export function NewProjectsPage() {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { state, dispatch } = useRequest();

  return (
    <WizardLayout
      title="Onboard User"
      steps={NEW_PATH_STEPS}
      current={2}
      actions={
        <PageActions
          onBack={() => navigate(ROUTES.NEW_DETAILS, 'back')}
          primaryLabel="Continue"
          onPrimary={() => navigate(ROUTES.NEW_REVIEW)}
        />
      }
    >
      <div className={styles.form}>
        <Body1>Add user to project or project part</Body1>
        <Body1>{INTRO}</Body1>
        <ProjectPicker
          label="Select Project(s)"
          hint={HINT}
          ndaOnly
          selected={state.newProjects}
          onChange={(projects) => dispatch({ type: 'setNewProjects', projects })}
        />
      </div>
    </WizardLayout>
  );
}
