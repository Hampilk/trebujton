import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '@pages/Login';
import { AuthProvider } from '@contexts/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText(/Sign in to WinMix TipsterHub/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('shows link to sign up page', () => {
    renderWithProviders(<Login />);
    
    const signUpLink = screen.getByText(/Sign up/i);
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/sign-up');
  });

  it('shows link to home page', () => {
    renderWithProviders(<Login />);
    
    const homeLink = screen.getByText(/Back to home/i);
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
  });
});
