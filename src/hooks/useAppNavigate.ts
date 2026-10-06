// Navigation that records direction, so page transitions slide the right way (spec section 11).
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export type NavDirection = 'forward' | 'back';

export interface NavState {
  direction?: NavDirection;
}

export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: string, direction: NavDirection = 'forward', replace = false) => {
      const state: NavState = { direction };
      navigate(to, { state, replace });
    },
    [navigate]
  );
}
