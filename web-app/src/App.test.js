import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './components/Auth/Login';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { formatTaskDuration } from './utils/formatTaskDuration';
import * as authAPI from './services/api';

// Mock the authAPI service
jest.mock('./services/api', () => ({
  authAPI: {
    login: jest.fn(),
    getMe: jest.fn(),
    resendVerificationEmail: jest.fn(),
  },
}));

// ============================================================================
// Tests for formatTaskDuration utility function
// ============================================================================
describe('formatTaskDuration', () => {
  it('should handle 0 minutes', () => {
    expect(formatTaskDuration(0)).toBe('0m');
  });

  it('should handle negative minutes', () => {
    expect(formatTaskDuration(-10)).toBe('0m');
  });

  it('should handle 59 minutes (just under 1 hour)', () => {
    expect(formatTaskDuration(59)).toBe('59m');
  });

  it('should handle 60 minutes (exactly 1 hour)', () => {
    expect(formatTaskDuration(60)).toBe('1h');
  });

  it('should handle 90 minutes (1.5 hours)', () => {
    expect(formatTaskDuration(90)).toBe('1.5h');
  });

  it('should handle 120 minutes (exactly 2 hours)', () => {
    expect(formatTaskDuration(120)).toBe('2h');
  });

  it('should handle 45 minutes', () => {
    expect(formatTaskDuration(45)).toBe('45m');
  });

  it('should handle 150 minutes (2.5 hours)', () => {
    expect(formatTaskDuration(150)).toBe('2.5h');
  });

  it('should return 0m for non-numeric values', () => {
    expect(formatTaskDuration('invalid')).toBe('0m');
    expect(formatTaskDuration(null)).toBe('0m');
    expect(formatTaskDuration(undefined)).toBe('0m');
  });

  it('should handle large hour values', () => {
    expect(formatTaskDuration(480)).toBe('8h');
  });
});

// ============================================================================
// Tests for Login component
// ============================================================================
describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getMe to reject by default (no authenticated user)
    authAPI.authAPI.getMe.mockRejectedValue({
      response: { status: 401 },
    });
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('should render the Login component correctly', () => {
    renderLogin();

    // Check for main elements
    expect(screen.getByText('TaskFlow AI')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display error message on failed login', async () => {
    // Mock a failed login response
    authAPI.authAPI.login.mockRejectedValue({
      response: {
        data: {
          message: 'Invalid email or password',
        },
      },
    });

    renderLogin();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // User enters credentials
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');

    // Submit form
    fireEvent.click(submitButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('should show loading state during login attempt', async () => {
    // Mock a login that takes time
    authAPI.authAPI.login.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderLogin();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });
  });

  it('should have email and password input fields', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText('your.email@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');
  });

  it('should show forgot password link', () => {
    renderLogin();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('should show sign up link', () => {
    renderLogin();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});

// ============================================================================
// Tests for AuthContext login function
// ============================================================================
describe('AuthContext login function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderWithAuth = (component) => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            {component}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('should call authAPI.login with correct email and password parameters', async () => {
    authAPI.authAPI.login.mockResolvedValue({
      data: {
        token: 'test-token',
        user: { id: '123', name: 'Test User', email: 'test@example.com' },
      },
    });

    authAPI.authAPI.getMe.mockRejectedValue({ response: { status: 401 } });

    renderWithAuth(
      <Login />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    const testEmail = 'testuser@example.com';
    const testPassword = 'correctpassword';

    await userEvent.type(emailInput, testEmail);
    await userEvent.type(passwordInput, testPassword);
    fireEvent.click(submitButton);

    // Wait for the authAPI.login to be called
    await waitFor(() => {
      expect(authAPI.authAPI.login).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
      });
    });

    // Verify exact call count and parameters
    expect(authAPI.authAPI.login).toHaveBeenCalledTimes(1);
    expect(authAPI.authAPI.login).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword,
    });
  });

  it('should store token in localStorage on successful login', async () => {
    const mockToken = 'mock-jwt-token-12345';
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };

    authAPI.authAPI.login.mockResolvedValue({
      data: {
        token: mockToken,
        user: mockUser,
      },
    });

    authAPI.authAPI.getMe.mockRejectedValue({ response: { status: 401 } });

    renderWithAuth(
      <Login />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    // Wait for token to be stored
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(mockToken);
    });
  });

  it('should return success: false on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    authAPI.authAPI.login.mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    authAPI.authAPI.getMe.mockRejectedValue({ response: { status: 401 } });

    renderWithAuth(
      <Login />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should handle login with different email formats', async () => {
    authAPI.authAPI.login.mockResolvedValue({
      data: {
        token: 'test-token',
        user: { id: '123', name: 'Test', email: 'test@example.com' },
      },
    });

    authAPI.authAPI.getMe.mockRejectedValue({ response: { status: 401 } });

    const testEmails = [
      'user@example.com',
      'first.last@company.org',
      'test+tag@domain.co.uk',
    ];

    for (const testEmail of testEmails) {
      jest.clearAllMocks();
      authAPI.authAPI.login.mockResolvedValue({
        data: {
          token: 'test-token',
          user: { id: '123', name: 'Test', email: testEmail },
        },
      });

      authAPI.authAPI.getMe.mockRejectedValue({ response: { status: 401 } });

      const { unmount } = renderWithAuth(<Login />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, testEmail);
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authAPI.authAPI.login).toHaveBeenCalledWith({
          email: testEmail,
          password: 'password123',
        });
      });

      unmount();
    }
  });
});
