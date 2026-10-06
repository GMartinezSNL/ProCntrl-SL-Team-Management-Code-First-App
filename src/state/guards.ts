// Route guards (spec section 13, F15): where to send the user when a page's required state is missing.
import { ROUTES } from '../config';
import { isDetailsValid, type RequestState } from './request';

export type GuardedPage =
  | 'status'
  | 'newDetails'
  | 'newProjects'
  | 'newReview'
  | 'existingProjects'
  | 'existingReview'
  | 'success';

const isAlreadyOnboarding = (state: RequestState) =>
  state.person?.status === 'onboard' || state.person?.status === 'inProgress';

/** Returns the route to redirect to, or null when the page may open. */
export function guardRedirect(page: GuardedPage, state: RequestState, hasJustSubmitted = false): string | null {
  if (page === 'success') return hasJustSubmitted ? null : ROUTES.HOME;
  if (!state.person) return ROUTES.HOME;

  switch (page) {
    case 'status':
      return isAlreadyOnboarding(state) ? null : ROUTES.PERSON;
    case 'newDetails':
      return state.path === 'new' ? null : ROUTES.PERSON;
    case 'newProjects':
    case 'newReview':
      if (state.path !== 'new') return ROUTES.PERSON;
      return isDetailsValid(state) ? null : ROUTES.NEW_DETAILS;
    case 'existingProjects':
      if (state.path === 'existing') return null;
      return isAlreadyOnboarding(state) ? ROUTES.STATUS : ROUTES.PERSON;
    case 'existingReview':
      if (state.path !== 'existing') return isAlreadyOnboarding(state) ? ROUTES.STATUS : ROUTES.PERSON;
      return state.existingProjects.length > 0 ? null : ROUTES.EXISTING_PROJECTS;
  }
}
