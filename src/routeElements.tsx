// Route helper components used by routes.tsx.
import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ROUTES } from './config';
import type { NavState } from './hooks/useAppNavigate';
import { SimplePlaceholder } from './pages/PlaceholderPage';
import { guardRedirect, type GuardedPage } from './state/guards';
import { useRequest } from './state/requestStore';

const REDIRECT_STATE: NavState = { direction: 'back' };

/** Renders the page, or redirects to the first incomplete step (spec section 13, F15). */
export function Guard({ page, children }: { page: GuardedPage; children: ReactNode }) {
  const { state } = useRequest();
  // F08 passes "just submitted" for Success; until then Success always redirects Home.
  const redirect = guardRedirect(page, state);
  return redirect ? <Navigate to={redirect} replace state={REDIRECT_STATE} /> : children;
}

const HELP_TOPIC_TITLES: Record<string, string> = {
  onboarding: 'Help Page - Onboarding',
  offboarding: 'Help Page - Offboarding',
  updating: 'Help Page - Updating Users',
};

export function HelpTopicRoute() {
  const { topic = '' } = useParams();
  const title = HELP_TOPIC_TITLES[topic];
  if (!title) return <Navigate to={ROUTES.HELP} replace state={REDIRECT_STATE} />;
  return <SimplePlaceholder title={title} backTo={ROUTES.HELP} builtIn="F09" />;
}
