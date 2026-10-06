// Hash routes for every page (spec section 13, F15). Guards send incomplete steps to the first
// incomplete step, or Home when no person is chosen.
import { Navigate, createHashRouter } from 'react-router-dom';
import { ROUTES } from './config';
import { AppShell } from './components/AppShell';
import { EXISTING_PATH_STEPS, NEW_PATH_STEPS } from './components/WizardLayout';
import { HomePage } from './pages/HomePage';
import { SimplePlaceholder, WizardPlaceholder } from './pages/PlaceholderPage';
import { UnderConstructionPage } from './pages/UnderConstructionPage';
import { Guard, HelpTopicRoute } from './routeElements';
export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.UNDER_CONSTRUCTION, element: <UnderConstructionPage /> },
      {
        path: ROUTES.PERSON,
        element: <WizardPlaceholder title="Onboard User" steps={NEW_PATH_STEPS} current={0} backTo={ROUTES.HOME} builtIn="F05" />,
      },
      {
        path: ROUTES.STATUS,
        element: (
          <Guard page="status">
            <SimplePlaceholder title="Onboard Team Member" backTo={ROUTES.PERSON} builtIn="F05" />
          </Guard>
        ),
      },
      {
        path: ROUTES.NEW_DETAILS,
        element: (
          <Guard page="newDetails">
            <WizardPlaceholder title="Onboard User" steps={NEW_PATH_STEPS} current={1} backTo={ROUTES.PERSON} builtIn="F06" />
          </Guard>
        ),
      },
      {
        path: ROUTES.NEW_PROJECTS,
        element: (
          <Guard page="newProjects">
            <WizardPlaceholder title="Onboard User" steps={NEW_PATH_STEPS} current={2} backTo={ROUTES.NEW_DETAILS} builtIn="F06" />
          </Guard>
        ),
      },
      {
        path: ROUTES.NEW_REVIEW,
        element: (
          <Guard page="newReview">
            <WizardPlaceholder title="Onboard User" steps={NEW_PATH_STEPS} current={3} backTo={ROUTES.NEW_DETAILS} builtIn="F06" />
          </Guard>
        ),
      },
      {
        path: ROUTES.EXISTING_PROJECTS,
        element: (
          <Guard page="existingProjects">
            <WizardPlaceholder title="Project Onboard" steps={EXISTING_PATH_STEPS} current={1} backTo={ROUTES.STATUS} builtIn="F08" />
          </Guard>
        ),
      },
      {
        path: ROUTES.EXISTING_REVIEW,
        element: (
          <Guard page="existingReview">
            <WizardPlaceholder
              title="Project Onboard"
              steps={EXISTING_PATH_STEPS}
              current={2}
              backTo={ROUTES.EXISTING_PROJECTS}
              builtIn="F08"
            />
          </Guard>
        ),
      },
      {
        path: ROUTES.SUCCESS,
        element: (
          <Guard page="success">
            <SimplePlaceholder title="Team Management App" backTo={ROUTES.HOME} builtIn="F08" />
          </Guard>
        ),
      },
      { path: ROUTES.HELP, element: <SimplePlaceholder title="Help Page" backTo={ROUTES.HOME} builtIn="F09" /> },
      { path: ROUTES.HELP_TOPIC, element: <HelpTopicRoute /> },
      { path: '*', element: <Navigate to={ROUTES.HOME} replace /> },
    ],
  },
]);
