// NEW REVIEW (spec section 8, step 4): review cards with Edit links (U2), the U11 sentence, and
// Confirm. Submit is a stub until F07 builds the W1-W3 engine; nothing is written here.
import { useState } from 'react';
import { Body1, MessageBar, MessageBarBody, makeStyles, tokens } from '@fluentui/react-components';
import { ROUTES } from '../../config';
import { PageActions } from '../../components/PageActions';
import { ReviewCard } from '../../components/ReviewCard';
import { NEW_PATH_STEPS, WizardLayout } from '../../components/WizardLayout';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { hoursToWrite, type RequestState } from '../../state/request';
import { useRequest } from '../../state/requestStore';
import { MEDIA } from '../../theme/layout';

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  // Spec section 13: 2 columns on desktop, 1 on phone.
  cards: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: tokens.spacingHorizontalM,
    [MEDIA.desktopUp]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
});

interface ReviewItem {
  label: string;
  value: string;
  editTo: string;
}

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

function buildItems(state: RequestState): ReviewItem[] {
  const employment = state.isFullTime ? 'Full Time' : 'Part Time';
  return [
    { label: 'Name', value: state.person?.fullName ?? '', editTo: ROUTES.PERSON },
    { label: 'Role', value: state.roleName ?? '', editTo: ROUTES.NEW_DETAILS },
    { label: 'Discipline', value: state.disciplineName ?? '', editTo: ROUTES.NEW_DETAILS },
    { label: 'Core/Support', value: state.isCore ? 'Core' : 'Support', editTo: ROUTES.NEW_DETAILS },
    { label: 'Full/Part Time', value: `${employment}, ${hoursToWrite(state)} Hrs`, editTo: ROUTES.NEW_DETAILS },
    { label: 'Egnyte Access', value: yesNo(state.hasEgnyte), editTo: ROUTES.NEW_DETAILS },
    { label: 'Teams Access', value: yesNo(state.hasTeams), editTo: ROUTES.NEW_DETAILS },
    { label: 'Power Platform Access', value: yesNo(state.hasPowerPlatform), editTo: ROUTES.NEW_DETAILS },
    {
      label: 'Projects',
      value: state.newProjects.length > 0 ? state.newProjects.map((p) => p.number).join(', ') : 'None selected',
      editTo: ROUTES.NEW_PROJECTS,
    },
  ];
}

// Replaced in F07 by the submit engine (docs/ARCHITECTURE.md section 5).
function submitNewRequest(): Promise<void> {
  return Promise.reject(new Error('Not built yet (F07)'));
}

export function NewReviewPage() {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { state } = useRequest();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { person } = state;
  if (!person) return null;
  const rowCount = 1 + state.newProjects.length;

  const onConfirm = () => {
    setSubmitError(null);
    submitNewRequest().catch((error: unknown) => setSubmitError(error instanceof Error ? error.message : String(error)));
  };

  return (
    <WizardLayout
      title="Onboard User"
      steps={NEW_PATH_STEPS}
      current={3}
      actions={
        <PageActions
          onBack={() => navigate(ROUTES.NEW_DETAILS, 'back')}
          backLabel="Cancel"
          primaryLabel="Confirm and Submit Onboard Request"
          onPrimary={onConfirm}
        />
      }
    >
      <div className={styles.form}>
        <Body1>Please confirm selection below</Body1>
        <div className={styles.cards}>
          {buildItems(state).map((item, index) => (
            <ReviewCard
              key={item.label}
              label={item.label}
              value={item.value}
              index={index}
              onEdit={() => navigate(item.editTo, 'back')}
            />
          ))}
        </div>
        <Body1>
          This marks {person.fullName} In-Progress and creates {rowCount} onboarding request {rowCount === 1 ? 'row' : 'rows'}.
        </Body1>
        {submitError && (
          <MessageBar intent="info">
            <MessageBarBody>{submitError}</MessageBarBody>
          </MessageBar>
        )}
      </div>
    </WizardLayout>
  );
}
