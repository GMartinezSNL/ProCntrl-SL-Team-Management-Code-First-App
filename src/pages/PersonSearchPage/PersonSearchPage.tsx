// PERSON SEARCH (spec section 8): server-side type-ahead, single select, then route by a fresh
// mpm_onboard read (F1, F2, F11, F13, U4, U9).
import { useRef, useState, type KeyboardEvent } from 'react';
import {
  Avatar,
  Body1,
  Caption1,
  Combobox,
  Field,
  MessageBar,
  MessageBarBody,
  Option,
  Skeleton,
  SkeletonItem,
  Spinner,
  makeStyles,
  tokens,
  type ComboboxProps,
} from '@fluentui/react-components';
import { PersonSearchRegular } from '@fluentui/react-icons';
import { PERSON_SEARCH, ROUTES } from '../../config';
import { PageActions } from '../../components/PageActions';
import { PersonStatusBadge, SelectedPersonBox } from '../../components/SelectedPersonBox';
import { NEW_PATH_STEPS, WizardLayout } from '../../components/WizardLayout';
import { getUserStatus } from '../../data/dataService';
import type { PersonResult } from '../../data/types';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { usePersonSearch } from '../../hooks/usePersonSearch';
import { useRequest } from '../../state/requestStore';

const HINT = 'Type at least 2 letters of a first or last name';
const NO_PERSON_ERROR = 'Please select a new team member';
const SKELETON_ROWS = ['a', 'b', 'c'];
// About 8 option rows visible, then scroll (spec section 13).
const LISTBOX_MAX_HEIGHT = '448px';

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  combobox: { width: '100%', minWidth: 0 },
  listbox: { maxHeight: LISTBOX_MAX_HEIGHT, overflowY: 'auto' },
  option: { alignItems: 'center', gap: tokens.spacingHorizontalM },
  optionText: { display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere' },
  match: { fontWeight: tokens.fontWeightBold, color: tokens.colorBrandForeground1 },
  skeletonRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalS,
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground3,
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
});

/** The name with the first case-insensitive match of the typed text emphasised. */
function HighlightedName({ name, typed, className }: { name: string; typed: string; className: string }) {
  const start = typed ? name.toLowerCase().indexOf(typed.toLowerCase()) : -1;
  if (start < 0) return <>{name}</>;
  const end = start + typed.length;
  return (
    <>
      {name.slice(0, start)}
      <span className={className}>{name.slice(start, end)}</span>
      {name.slice(end)}
    </>
  );
}

function resultCountMessage(isLoading: boolean, count: number): string {
  if (isLoading) return 'Searching...';
  if (count === 0) return 'No matches';
  if (count >= PERSON_SEARCH.MAX_RESULTS) return `${count} or more results. Keep typing to narrow the list.`;
  return count === 1 ? '1 result' : `${count} results`;
}

export function PersonSearchPage() {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { state, dispatch } = useRequest();
  const { person } = state;
  const comboboxRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState(person?.fullName ?? '');
  const [isListOpen, setIsListOpen] = useState(false);
  const [showNoPersonError, setShowNoPersonError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  // The chosen person's own name in the box is not a new search.
  const searchText = person && text === person.fullName ? '' : text;
  const search = usePersonSearch(searchText);
  const typed = searchText.trim();
  const isOpen = isListOpen && search.isSearchable;

  const selectPerson = (result: PersonResult) => {
    dispatch({ type: 'selectPerson', person: result });
    setText(result.fullName);
    setShowNoPersonError(false);
    setCheckError(null);
  };

  const onOptionSelect: ComboboxProps['onOptionSelect'] = (_event, data) => {
    const result = search.results.find((r) => r.id === data.optionValue);
    if (result) selectPerson(result);
  };

  const startOnboard = async () => {
    if (!person) {
      setShowNoPersonError(true);
      comboboxRef.current?.focus();
      return;
    }
    setIsChecking(true);
    setCheckError(null);
    try {
      const status = await getUserStatus(person.id);
      dispatch({ type: 'setPersonStatus', status });
      if (status === 'onboard' || status === 'inProgress') {
        dispatch({ type: 'setPath', path: null });
        navigate(ROUTES.STATUS);
        return;
      }
      dispatch({ type: 'setPath', path: 'new' });
      navigate(ROUTES.NEW_DETAILS);
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : String(error));
      setIsChecking(false);
    }
  };

  // Esc with the list closed clears the text (U9); with it open, Fluent just closes the list.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && !isOpen) setText('');
    // Enter on a valid form = Continue (spec section 13).
    if (event.key === 'Enter' && !isOpen && person && text === person.fullName) void startOnboard();
  };

  const renderListContent = () => {
    if (search.isLoading) {
      return SKELETON_ROWS.map((key) => (
        <Skeleton key={key} aria-hidden="true" className={styles.skeletonRow}>
          <SkeletonItem shape="circle" size={32} />
          <SkeletonItem size={16} />
        </Skeleton>
      ));
    }
    if (search.results.length === 0) {
      return (
        <div className={styles.empty} aria-hidden="true">
          <PersonSearchRegular />
          <Body1>No matches</Body1>
        </div>
      );
    }
    return search.results.map((result) => (
      <Option key={result.id} value={result.id} text={result.fullName} className={styles.option}>
        <Avatar name={result.fullName} color="colorful" size={32} aria-hidden="true" />
        <span className={styles.optionText}>
          <Body1>
            <HighlightedName name={result.fullName} typed={typed} className={styles.match} />
          </Body1>
          <Caption1>{result.email ?? 'No email on file'}</Caption1>
        </span>
        <PersonStatusBadge status={result.status} />
      </Option>
    ));
  };

  return (
    <WizardLayout
      title="Onboard User"
      steps={NEW_PATH_STEPS}
      current={0}
      actions={
        <PageActions
          onBack={() => navigate(ROUTES.HOME, 'back')}
          primaryLabel="Start Onboard"
          onPrimary={() => void startOnboard()}
          isPrimaryDisabled={isChecking}
        />
      }
    >
      <div className={styles.form}>
        <Body1>Who would you like to onboard?</Body1>
        <Field
          label="Search & Select User"
          required
          hint={HINT}
          validationMessage={showNoPersonError && !person ? NO_PERSON_ERROR : search.error ?? undefined}
        >
          <Combobox
            ref={comboboxRef}
            className={styles.combobox}
            listbox={{ className: styles.listbox }}
            freeform
            placeholder="Search by first or last name"
            // A search box, not a dropdown: no chevron, results appear after 2 letters (F13).
            expandIcon={null}
            // The options are server results; the browser's own autofill list must not compete with them.
            autoComplete="off"
            value={text}
            selectedOptions={person ? [person.id] : []}
            open={isOpen}
            onOpenChange={(_event, data) => setIsListOpen(data.open)}
            onInput={(event) => {
              setText(event.currentTarget.value);
              setIsListOpen(true);
            }}
            onOptionSelect={onOptionSelect}
            onKeyDown={onKeyDown}
          >
            {renderListContent()}
          </Combobox>
        </Field>
        <div role="status" aria-live="polite" className={styles.visuallyHidden}>
          {search.isSearchable ? resultCountMessage(search.isLoading, search.results.length) : ''}
        </div>
        {person && (
          <SelectedPersonBox fullName={person.fullName} email={person.email}>
            <PersonStatusBadge status={person.status} />
          </SelectedPersonBox>
        )}
        {isChecking && <Spinner size="tiny" label="Checking onboard status..." />}
        {checkError && (
          <MessageBar intent="error">
            <MessageBarBody>Could not check the person's onboard status: {checkError}</MessageBarBody>
          </MessageBar>
        )}
      </div>
    </WizardLayout>
  );
}
