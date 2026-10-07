// The current environment's (project's) display name, read once per app load and shared.
// Returns null until loaded, or if it can't be read (the error is logged).
import { useEffect, useState } from 'react';
import { getEnvironmentName } from '../data/dataService';

let request: Promise<string | null> | null = null;

function loadOnce(): Promise<string | null> {
  request ??= getEnvironmentName().catch((error: unknown) => {
    console.error('Environment name could not be read.', error);
    return null;
  });
  return request;
}

export function useEnvironmentName(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    let isCurrent = true;
    void loadOnce().then((value) => {
      if (isCurrent) setName(value);
    });
    return () => {
      isCurrent = false;
    };
  }, []);
  return name;
}
