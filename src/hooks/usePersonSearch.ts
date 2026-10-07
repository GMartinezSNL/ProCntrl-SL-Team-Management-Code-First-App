// Server-side person type-ahead (spec section 6, F13); limits from PERSON_SEARCH in config.ts.
import { PERSON_SEARCH } from '../config';
import { searchUsers } from '../data/dataService';
import type { PersonResult } from '../data/types';
import { useServerSearch, type ServerSearch } from './useServerSearch';

export type PersonSearch = ServerSearch<PersonResult>;

export function usePersonSearch(text: string): PersonSearch {
  return useServerSearch(text, searchUsers, PERSON_SEARCH);
}
