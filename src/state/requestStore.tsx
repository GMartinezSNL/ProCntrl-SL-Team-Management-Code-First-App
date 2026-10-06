// React provider for the request-in-progress store. Nothing here is persisted.
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { DEFAULT_REQUEST, isRequestDirty, requestReducer, type RequestAction, type RequestState } from './request';

interface RequestContextValue {
  state: RequestState;
  dispatch: (action: RequestAction) => void;
  reset: () => void;
  isDirty: boolean;
}

const RequestContext = createContext<RequestContextValue | null>(null);

export function RequestProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(requestReducer, DEFAULT_REQUEST);
  const value = useMemo(
    () => ({ state, dispatch, reset: () => dispatch({ type: 'reset' }), isDirty: isRequestDirty(state) }),
    [state]
  );
  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRequest(): RequestContextValue {
  const value = useContext(RequestContext);
  if (!value) throw new Error('useRequest must be used inside RequestProvider');
  return value;
}
