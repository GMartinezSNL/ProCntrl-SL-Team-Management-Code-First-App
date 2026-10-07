import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MemoryRouter } from 'react-router-dom';
import { RequestProvider } from '../../state/requestStore';
import { PersonSearchPage } from './PersonSearchPage';

vi.mock('../../data/dataService', () => ({
  searchUsers: vi.fn(async () => [
    { id: '1', fullName: 'John Smith', email: 'john@x.com', status: 'onboard' },
    { id: '2', fullName: 'Joan Doe', email: null, status: 'none' },
  ]),
  getUserStatus: vi.fn(async () => 'none'),
}));

vi.mock('../../theme/FluentThemeProvider', () => ({ useThemeMode: () => ({ colorScheme: 'light' }) }));
vi.mock('../../hooks/useMediaQuery', () => ({ useMediaQuery: () => true }));

function renderPage() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <MemoryRouter>
        <RequestProvider>
          <PersonSearchPage />
        </RequestProvider>
      </MemoryRouter>
    </FluentProvider>
  );
}

describe('PersonSearchPage', () => {
  it('opens the list, shows server results, and selects a person', async () => {
    const user = userEvent.setup();
    renderPage();
    const box = screen.getByRole('combobox');
    await user.click(box);
    await user.type(box, 'jo');
    expect(await screen.findByRole('option', { name: /John Smith/ })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /John Smith/ }));
    expect(screen.getByRole('region', { name: 'Selected person' })).toHaveTextContent('John Smith');
  });
});
