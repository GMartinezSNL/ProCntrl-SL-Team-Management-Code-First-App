import { useEffect, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router-dom';
import { RequestProvider, useRequest } from '../../state/requestStore';
import { NewDetailsPage } from './NewDetailsPage';

vi.mock('../../data/dataService', () => ({
  getRoles: vi.fn(async () => [{ id: 'r1', name: 'Engineer' }]),
  getSlDisciplines: vi.fn(async () => [{ id: 'd1', name: 'Civil' }]),
}));

vi.mock('../../theme/FluentThemeProvider', () => ({ useThemeMode: () => ({ colorScheme: 'light' }) }));
vi.mock('../../hooks/useMediaQuery', () => ({ useMediaQuery: () => true }));

function WithPerson({ children }: { children: ReactNode }) {
  const { dispatch } = useRequest();
  useEffect(() => {
    dispatch({ type: 'selectPerson', person: { id: 'u1', fullName: 'Jo Smith', email: null, status: 'none' } });
    dispatch({ type: 'setPath', path: 'new' });
  }, [dispatch]);
  return <>{children}</>;
}

function renderPage() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter>
        <RequestProvider>
          <WithPerson>
            <NewDetailsPage />
          </WithPerson>
        </RequestProvider>
      </MemoryRouter>
    </FluentProvider>
  );
}

describe('NewDetailsPage', () => {
  it('blocks Continue and shows every validation message, including part-time hours (F1, F8)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('switch', { name: 'Full Time' }));
    expect(screen.getByRole('switch', { name: 'Part Time' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Please select a role')).toBeInTheDocument();
    expect(screen.getByText('Please select a discipline')).toBeInTheDocument();
    expect(screen.getByText('Please select hours per week')).toBeInTheDocument();
  });
});
