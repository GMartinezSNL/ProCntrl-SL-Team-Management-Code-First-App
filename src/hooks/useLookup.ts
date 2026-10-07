// Loads a small lookup list once (Roles, Disciplines). `load` must be a stable module function.
import { useEffect, useState } from 'react';

export interface Lookup<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
}

export function useLookup<T>(load: () => Promise<T[]>): Lookup<T> {
  const [lookup, setLookup] = useState<Lookup<T>>({ items: [], isLoading: true, error: null });

  useEffect(() => {
    let isCurrent = true;
    load().then(
      (items) => {
        if (isCurrent) setLookup({ items, isLoading: false, error: null });
      },
      (error: unknown) => {
        if (isCurrent) setLookup({ items: [], isLoading: false, error: error instanceof Error ? error.message : String(error) });
      }
    );
    return () => {
      isCurrent = false;
    };
  }, [load]);

  return lookup;
}
