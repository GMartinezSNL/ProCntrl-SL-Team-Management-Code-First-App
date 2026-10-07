// NEW DETAILS (spec section 8, step 2): role, discipline, five state-labelled switches, and
// part-time hours. Continue blocks until valid, with inline Field errors (F1, F8).
import { useRef, useState } from 'react';
import {
  Body1,
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  Option,
  Subtitle2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { PART_TIME_HOURS, ROUTES } from '../../config';
import { AccessSwitch } from '../../components/AccessSwitch';
import { PageActions } from '../../components/PageActions';
import { PersonStatusBadge, SelectedPersonBox } from '../../components/SelectedPersonBox';
import { NEW_PATH_STEPS, WizardLayout } from '../../components/WizardLayout';
import { getRoles, getSlDisciplines } from '../../data/dataService';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useLookup } from '../../hooks/useLookup';
import { getDetailsErrors, type ToggleKey } from '../../state/request';
import { useRequest } from '../../state/requestStore';
import { MEDIA } from '../../theme/layout';

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  // Spec section 13: Role | Discipline, then Employment | Access on desktop; one column below.
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: tokens.spacingVerticalL,
    [MEDIA.desktopUp]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      columnGap: tokens.spacingHorizontalXXL,
    },
  },
  dropdown: { width: '100%', minWidth: 0 },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    margin: 0,
    padding: 0,
    border: 'none',
    minWidth: 0,
  },
  legend: { padding: 0, marginBottom: tokens.spacingVerticalXS },
});

const SWITCHES: { key: ToggleKey; on: string; off: string }[] = [
  { key: 'isCore', on: 'Core', off: 'Support' },
  { key: 'isFullTime', on: 'Full Time', off: 'Part Time' },
  { key: 'hasEgnyte', on: 'Egnyte Access', off: 'No Egnyte Access' },
  { key: 'hasTeams', on: 'MS Teams Access', off: 'No MS Teams Access' },
  { key: 'hasPowerPlatform', on: 'Power Platform Access', off: 'No Power Platform Access' },
];
const EMPLOYMENT_KEYS: ToggleKey[] = ['isCore', 'isFullTime'];

export function NewDetailsPage() {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { state, dispatch } = useRequest();
  const roles = useLookup(getRoles);
  const disciplines = useLookup(getSlDisciplines);
  const [showErrors, setShowErrors] = useState(false);
  const roleRef = useRef<HTMLButtonElement>(null);
  const disciplineRef = useRef<HTMLButtonElement>(null);
  const hoursRef = useRef<HTMLButtonElement>(null);

  const { person } = state;
  if (!person) return null;
  const errors = showErrors ? getDetailsErrors(state) : {};

  const onContinue = () => {
    const current = getDetailsErrors(state);
    if (Object.keys(current).length === 0) {
      navigate(ROUTES.NEW_PROJECTS);
      return;
    }
    setShowErrors(true);
    // Focus the first invalid field so the error is read out (F11).
    if (current.role) roleRef.current?.focus();
    else if (current.discipline) disciplineRef.current?.focus();
    else hoursRef.current?.focus();
  };

  const renderSwitch = ({ key, on, off }: (typeof SWITCHES)[number]) => (
    <AccessSwitch
      key={key}
      checked={state[key]}
      onLabel={on}
      offLabel={off}
      onChange={(value) => dispatch({ type: 'setToggle', key, value })}
    />
  );

  const lookupError = roles.error ?? disciplines.error;

  return (
    <WizardLayout
      title="Onboard User"
      steps={NEW_PATH_STEPS}
      current={1}
      actions={
        <PageActions onBack={() => navigate(ROUTES.PERSON, 'back')} primaryLabel="Continue" onPrimary={onContinue} />
      }
    >
      <div className={styles.form}>
        <Body1>Enter info for new user</Body1>
        <SelectedPersonBox fullName={person.fullName} email={person.email}>
          <PersonStatusBadge status={person.status} />
        </SelectedPersonBox>
        {lookupError && (
          <MessageBar intent="error">
            <MessageBarBody>Could not load the role or discipline list: {lookupError}</MessageBarBody>
          </MessageBar>
        )}
        <div className={styles.grid}>
          <Field label="Role" required validationMessage={errors.role}>
            <Dropdown
              ref={roleRef}
              className={styles.dropdown}
              placeholder={roles.isLoading ? 'Loading roles...' : 'Select Role'}
              value={state.roleName ?? ''}
              selectedOptions={state.roleId ? [state.roleId] : []}
              onOptionSelect={(_event, data) =>
                dispatch({ type: 'setRole', id: data.optionValue ?? null, name: data.optionText ?? null })
              }
            >
              {roles.items.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field label="Discipline" required validationMessage={errors.discipline}>
            <Dropdown
              ref={disciplineRef}
              className={styles.dropdown}
              placeholder={disciplines.isLoading ? 'Loading disciplines...' : 'Select Discipline'}
              value={state.disciplineName ?? ''}
              selectedOptions={state.disciplineId ? [state.disciplineId] : []}
              onOptionSelect={(_event, data) =>
                dispatch({ type: 'setDiscipline', id: data.optionValue ?? null, name: data.optionText ?? null })
              }
            >
              {disciplines.items.map((discipline) => (
                <Option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>
              <Subtitle2>Employment</Subtitle2>
            </legend>
            {SWITCHES.filter((s) => EMPLOYMENT_KEYS.includes(s.key)).map(renderSwitch)}
            {!state.isFullTime && (
              <Field label="Approx. Hrs/wk" required validationMessage={errors.hours}>
                <Dropdown
                  ref={hoursRef}
                  className={styles.dropdown}
                  placeholder="Select hours"
                  value={state.partTimeHours === null ? '' : String(state.partTimeHours)}
                  selectedOptions={state.partTimeHours === null ? [] : [String(state.partTimeHours)]}
                  onOptionSelect={(_event, data) =>
                    dispatch({ type: 'setHours', hours: data.optionValue ? Number(data.optionValue) : null })
                  }
                >
                  {PART_TIME_HOURS.map((hours) => (
                    <Option key={hours} value={String(hours)}>
                      {String(hours)}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            )}
          </fieldset>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>
              <Subtitle2>Access</Subtitle2>
            </legend>
            {SWITCHES.filter((s) => !EMPLOYMENT_KEYS.includes(s.key)).map(renderSwitch)}
          </fieldset>
        </div>
      </div>
    </WizardLayout>
  );
}
