// Server-side person type-ahead (spec section 6, F13): waits 300 ms after typing stops, needs 2+
// characters, and drops responses for text the user has already changed.
import { useEffect, useState } from 'react';
import { PERSON_SEARCH } from '../config';
import { searchUsers } from '../data/dataService';
import type { PersonResult } from '../data/types';

interface SearchResponse {
  term: string;
  results: PersonResult[];
  error: string | null;
}

export interface PersonSearch {
  /** True when the text is long enough to search. */
  isSearchable: boolean;
  isLoading: boolean;
  results: PersonResult[];
  error: string | null;
}

const EMPTY_RESPONSE: SearchResponse = { term: '', results: [], error: null };

export function usePersonSearch(text: string): PersonSearch {
  const term = text.trim();
  const isSearchable = term.length >= PERSON_SEARCH.MIN_CHARS;
  const [response, setResponse] = useState<SearchResponse>(EMPTY_RESPONSE);

  useEffect(() => {
    if (!isSearchable) return;
    let isCurrent = true;
    const timer = setTimeout(() => {
      searchUsers(term).then(
        (results) => {
          if (isCurrent) setResponse({ term, results, error: null });
        },
        (error: unknown) => {
          if (isCurrent) setResponse({ term, results: [], error: error instanceof Error ? error.message : String(error) });
        }
      );
    }, PERSON_SEARCH.DEBOUNCE_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [term, isSearchable]);

  const isLoading = isSearchable && response.term !== term;
  const isFresh = isSearchable && !isLoading;
  return {
    isSearchable,
    isLoading,
    results: isFresh ? response.results : [],
    error: isFresh ? response.error : null,
  };
}
