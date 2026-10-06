import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { RequestProvider } from './state/requestStore';
import { FluentThemeProvider } from './theme/FluentThemeProvider';

function App() {
  return (
    <FluentThemeProvider>
      <RequestProvider>
        <RouterProvider router={router} />
      </RequestProvider>
    </FluentThemeProvider>
  );
}

export default App;
