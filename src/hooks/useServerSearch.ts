// Server-side type-ahead (spec section 6, F13): waits after typing stops, needs a minimum length,
// and drops responses for text the user has already changed. `search` must be stable (useCallback).
import { useEffect, useState } from 'react';

interface SearchLimits {
  MIN_CHARS: number;
  DEBOUNCE_MS: number;
}

interface SearchResponse<T> {
  term: string;
  results: T[];
  error: string | null;
}

export interface ServerSearch<T> {
  /** True when the text is long enough to search. */
  isSearchable: boolean;
  isLoading: boolean;
  results: T[];
  error: string | null;
}

export function useServerSearch<T>(
  text: string,
  search: (term: string) => Promise<T[]>,
  limits: SearchLimits
): ServerSearch<T> {
  const term = text.trim();
  const isSearchable = term.length >= limits.MIN_CHARS;
  const [response, setResponse] = useState<SearchResponse<T>>({ term: '', results: [], error: null });

  useEffect(() => {
    if (!isSearchable) return;
    let isCurrent = true;
    const timer = setTimeout(() => {
      search(term).then(
        (results) => {
          if (isCurrent) setResponse({ term, results, error: null });
        },
        (error: unknown) => {
          if (isCurrent) setResponse({ term, results: [], error: error instanceof Error ? error.message : String(error) });
        }
      );
    }, limits.DEBOUNCE_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [term, isSearchable, search, limits.DEBOUNCE_MS]);

  const isLoading = isSearchable && response.term !== term;
  const isFresh = isSearchable && !isLoading;
  return {
    isSearchable,
    isLoading,
    results: isFresh ? response.results : [],
    error: isFresh ? response.error : null,
  };
}
