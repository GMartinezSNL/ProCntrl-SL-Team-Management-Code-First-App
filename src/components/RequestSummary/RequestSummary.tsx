// Live "Request summary" (spec section 13, U8): what has been entered so far, each with an Edit link.
import { Body1, Caption1Strong, Link, makeStyles, tokens } from '@fluentui/react-components';
import { ROUTES } from '../../config';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { hoursToWrite, type RequestState } from '../../state/request';
import { useRequest } from '../../state/requestStore';

const NOT_ENTERED = 'Not entered yet';

interface SummaryRow {
  label: string;
  value: string;
  editTo: string;
}

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

function buildRows(state: RequestState): SummaryRow[] {
  const isExisting = state.path === 'existing';
  const projects = isExisting ? state.existingProjects : state.newProjects;
  const rows: SummaryRow[] = [
    { label: 'Person', value: state.person?.fullName ?? NOT_ENTERED, editTo: ROUTES.PERSON },
    {
      label: 'Request type',
      value: isExisting ? 'Project-specific onboarding' : 'New user onboarding',
      editTo: ROUTES.PERSON,
    },
  ];
  if (!isExisting) {
    const hours = hoursToWrite(state);
    rows.push(
      { label: 'Role', value: state.roleName ?? NOT_ENTERED, editTo: ROUTES.NEW_DETAILS },
      { label: 'Discipline', value: state.disciplineName ?? NOT_ENTERED, editTo: ROUTES.NEW_DETAILS },
      {
        label: 'Employment',
        value: `${state.isCore ? 'Core' : 'Support'}, ${state.isFullTime ? 'Full Time' : 'Part Time'}${
          hours === null ? '' : `, ${hours} Hrs`
        }`,
        editTo: ROUTES.NEW_DETAILS,
      },
      {
        label: 'Access',
        value: `Egnyte: ${yesNo(state.hasEgnyte)}, Teams: ${yesNo(state.hasTeams)}, Power Platform: ${yesNo(
          state.hasPowerPlatform
        )}`,
        editTo: ROUTES.NEW_DETAILS,
      }
    );
  }
  rows.push({
    label: 'Projects',
    value: projects.length > 0 ? projects.map((p) => p.number).join(', ') : 'None selected',
    editTo: isExisting ? ROUTES.EXISTING_PROJECTS : ROUTES.NEW_PROJECTS,
  });
  return rows;
}

const useStyles = makeStyles({
  list: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    columnGap: tokens.spacingHorizontalS,
    alignItems: 'start',
  },
  term: { gridColumn: '1' },
  edit: { gridColumn: '2', gridRow: '1' },
  value: { gridColumn: '1 / -1', margin: 0, overflowWrap: 'anywhere' },
});

export function RequestSummary() {
  const styles = useStyles();
  const { state } = useRequest();
  const navigate = useAppNavigate();

  return (
    <dl className={styles.list}>
      {buildRows(state).map((row) => (
        <div key={row.label} className={styles.row}>
          <dt className={styles.term}>
            <Caption1Strong>{row.label}</Caption1Strong>
          </dt>
          <Link as="button" className={styles.edit} onClick={() => navigate(row.editTo, 'back')} aria-label={`Edit ${row.label}`}>
            Edit
          </Link>
          <dd className={styles.value}>
            <Body1>{row.value}</Body1>
          </dd>
        </div>
      ))}
    </dl>
  );
}
