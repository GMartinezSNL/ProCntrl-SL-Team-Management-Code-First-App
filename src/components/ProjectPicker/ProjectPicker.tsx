// Project multi-select (spec sections 6, 13, 15): a TagPicker fed by server-side searchProjects.
// Removable tags, NDA tag, status, "N selected" with Clear all; selections persist across searches.
// Shared by New Projects (ndaOnly) and Existing Projects (all projects, F08).
import { useCallback, useState } from 'react';
import {
  Badge,
  Body1,
  Caption1,
  Field,
  Link,
  Tag,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  makeStyles,
  tokens,
  type TagPickerProps,
} from '@fluentui/react-components';
import { DocumentSearchRegular } from '@fluentui/react-icons';
import { PROJECT_SEARCH } from '../../config';
import { searchProjects } from '../../data/dataService';
import type { ProjectOption } from '../../data/types';
import { useServerSearch, type ServerSearch } from '../../hooks/useServerSearch';

export const PROJECT_SEARCH_HINT = 'Type at least 2 characters of a project number';
// About 8 option rows visible, then scroll (matches person search).
const LISTBOX_MAX_HEIGHT = '448px';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  listbox: { maxHeight: LISTBOX_MAX_HEIGHT, overflowY: 'auto' },
  option: { overflowWrap: 'anywhere' },
  optionMeta: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalXS },
  message: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground3,
  },
  count: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, minHeight: '24px' },
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

interface ProjectPickerProps {
  label: string;
  hint?: string;
  required?: boolean;
  validationMessage?: string;
  /** New path: NDA projects only. Existing path: all projects (D1 applies in the data module). */
  ndaOnly: boolean;
  selected: ProjectOption[];
  onChange: (projects: ProjectOption[]) => void;
}

function listMessage(search: ServerSearch<ProjectOption>, available: number): string | null {
  if (!search.isSearchable) return PROJECT_SEARCH_HINT;
  if (search.isLoading) return 'Searching...';
  if (search.error) return `Search failed: ${search.error}`;
  if (search.results.length === 0) return 'No matches';
  if (available === 0) return 'All matching projects are already selected';
  return null;
}

function resultCountMessage(search: ServerSearch<ProjectOption>): string {
  if (!search.isSearchable) return '';
  if (search.isLoading) return 'Searching...';
  const count = search.results.length;
  if (count === 0) return 'No matches';
  if (count >= PROJECT_SEARCH.MAX_RESULTS) return `${count} or more results. Keep typing to narrow the list.`;
  return count === 1 ? '1 result' : `${count} results`;
}

export function ProjectPicker({
  label,
  hint,
  required = false,
  validationMessage,
  ndaOnly,
  selected,
  onChange,
}: ProjectPickerProps) {
  const styles = useStyles();
  const [text, setText] = useState('');
  const search = useServerSearch(
    text,
    useCallback((term: string) => searchProjects(term, ndaOnly), [ndaOnly]),
    PROJECT_SEARCH
  );

  const selectedIds = selected.map((p) => p.id);
  const available = search.results.filter((p) => !selectedIds.includes(p.id));
  const message = listMessage(search, available.length);

  // Fluent reports the full new selection (also on tag dismiss and Backspace). Selected projects
  // that aren't in the current results are kept from the previous selection.
  const onOptionSelect: TagPickerProps['onOptionSelect'] = (_event, data) => {
    const next = data.selectedOptions
      .map((id) => selected.find((p) => p.id === id) ?? search.results.find((p) => p.id === id))
      .filter((p): p is ProjectOption => p !== undefined);
    onChange(next);
    setText('');
  };

  return (
    <div className={styles.root}>
      <Field label={label} hint={hint} required={required} validationMessage={validationMessage}>
        <TagPicker selectedOptions={selectedIds} onOptionSelect={onOptionSelect}>
          <TagPickerControl>
            <TagPickerGroup aria-label="Selected projects">
              {selected.map((project) => (
                <Tag
                  key={project.id}
                  value={project.id}
                  shape="rounded"
                  secondaryText={project.isNda ? 'NDA' : undefined}
                  dismissible
                >
                  {project.number}
                </Tag>
              ))}
            </TagPickerGroup>
            <TagPickerInput
              placeholder={selected.length === 0 ? 'Search by project number' : undefined}
              // Options are server results; the browser's own autofill list must not compete (F13).
              autoComplete="off"
              value={text}
              onChange={(event) => setText(event.currentTarget.value)}
            />
          </TagPickerControl>
          <TagPickerList className={styles.listbox}>
            {message ? (
              <div className={styles.message} aria-hidden="true">
                <DocumentSearchRegular />
                <Body1>{message}</Body1>
              </div>
            ) : (
              available.map((project) => (
                <TagPickerOption
                  key={project.id}
                  value={project.id}
                  text={project.number}
                  className={styles.option}
                  secondaryContent={
                    <span className={styles.optionMeta}>
                      {project.isNda && (
                        <Badge appearance="tint" color="brand" size="small">
                          NDA
                        </Badge>
                      )}
                      <Badge appearance="outline" color={project.isClosed ? 'subtle' : 'success'} size="small">
                        {project.isClosed ? 'Closed' : 'Active'}
                      </Badge>
                    </span>
                  }
                >
                  {project.number}
                </TagPickerOption>
              ))
            )}
          </TagPickerList>
        </TagPicker>
      </Field>
      <div role="status" aria-live="polite" className={styles.visuallyHidden}>
        {resultCountMessage(search)}
      </div>
      <div className={styles.count}>
        <Caption1 aria-live="polite">{selected.length} selected</Caption1>
        {selected.length > 0 && (
          <Link as="button" onClick={() => onChange([])}>
            Clear all
          </Link>
        )}
      </div>
    </div>
  );
}
