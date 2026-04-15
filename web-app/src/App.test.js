import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './components/Auth/Login';
import { ThemeProvider } from './context/ThemeContext';
import { formatTaskDuration } from './utils/formatTaskDuration';
import { useAuth } from './context/AuthContext';

jest.mock('./context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const renderLogin = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Login />
      </ThemeProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  useAuth.mockReturnValue({
    isAuthenticated: false,
    loading: false,
    login: jest.fn(),
  });
});

test('renders Login and shows TaskFlow AI', () => {
  renderLogin();
  expect(screen.getByText('TaskFlow AI')).toBeInTheDocument();
});

test('renders Login with email placeholder input', () => {
  renderLogin();
  expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
});

test('formatTaskDuration returns expected values', () => {
  expect(formatTaskDuration(90)).toBe('1.5h');
  expect(formatTaskDuration(60)).toBe('1h');
  expect(formatTaskDuration(30)).toBe('30m');
});
