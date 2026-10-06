// TEMPORARY (F03 checkpoint only). Removed in F04.
import { useEffect, useState } from 'react';
import {
  getAllProjects,
  getCurrentUser,
  getNdaProjects,
  getRoles,
  getSlDisciplines,
  getTheme,
  searchUsers,
} from '../../data/dataService';
import type { PersonResult, ProjectOption, ThemeColors } from '../../data/types';
import { PERSON_SEARCH } from '../../config';

interface Summary {
  roleCount: number;
  disciplineCount: number;
  ndaProjects: ProjectOption[];
  allProjects: ProjectOption[];
  userName: string;
  theme: ThemeColors;
}

const PREVIEW_COUNT = 5;

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function DiagnosticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getRoles(), getSlDisciplines(), getNdaProjects(), getAllProjects(), getCurrentUser(), getTheme()])
      .then(([roles, disciplines, nda, all, user, theme]) =>
        setSummary({
          roleCount: roles.length,
          disciplineCount: disciplines.length,
          ndaProjects: nda.slice(0, PREVIEW_COUNT),
          allProjects: all.slice(0, PREVIEW_COUNT),
          userName: user.fullName ?? user.userPrincipalName ?? '(unknown)',
          theme,
        })
      )
      .catch((error: unknown) => setLoadError(errorText(error)));
  }, []);

  useEffect(() => {
    let isStale = false;
    const timer = window.setTimeout(() => {
      setSearchError(null);
      searchUsers(query)
        .then((rows) => {
          if (!isStale) setResults(rows);
        })
        .catch((error: unknown) => {
          if (!isStale) setSearchError(errorText(error));
        });
    }, PERSON_SEARCH.DEBOUNCE_MS);
    return () => {
      isStale = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto', textAlign: 'left' }}>
      <h1>Diagnostics (temporary)</h1>
      {loadError && <p role="alert">Load error: {loadError}</p>}
      {!summary && !loadError && <p>Loading live data...</p>}
      {summary && (
        <>
          <p>Signed in as: <strong>{summary.userName}</strong></p>
          <p>Roles: {summary.roleCount} | SL disciplines: {summary.disciplineCount}</p>
          <h2>First {PREVIEW_COUNT} NDA projects</h2>
          <ul>{summary.ndaProjects.map((p) => <li key={p.id}>{p.number}</li>)}</ul>
          <h2>First {PREVIEW_COUNT} of all projects</h2>
          <ul>{summary.allProjects.map((p) => <li key={p.id}>{p.number}{p.isNda ? ' (NDA)' : ''}</li>)}</ul>
          <h2>Theme</h2>
          <p>Values: {JSON.stringify(summary.theme.values)}</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {(['main', 'light', 'medium'] as const).map((key) => (
              <figure key={key} style={{ margin: 0 }}>
                <div style={{ width: 96, height: 48, background: summary.theme[key], border: '1px solid' }} />
                <figcaption>{key}<br />{summary.theme[key]}</figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
      <h2>Test person search</h2>
      <label htmlFor="diag-search">Search & Select User</label>{' '}
      <input id="diag-search" value={query} onChange={(event) => setQuery(event.target.value)} />
      {searchError && <p role="alert">Search error: {searchError}</p>}
      <p aria-live="polite">{results.length} result(s)</p>
      <ul>
        {results.map((person) => (
          <li key={person.id}>{person.fullName} ({person.email ?? 'no email'}) - {person.status}</li>
        ))}
      </ul>
    </main>
  );
}
