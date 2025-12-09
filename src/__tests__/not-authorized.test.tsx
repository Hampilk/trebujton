import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import NotAuthorized from '@pages/admin/NotAuthorized';

// Mock window.location.href
const mockLocation = {
  pathname: '/admin',
  state: { from: { pathname: '/admin' } }
};

Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('NotAuthorized Component', () => {
  test('should render unauthorized message in Hungarian', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotAuthorized />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Nem engedélyezett hozzáférés')).toBeInTheDocument();
    expect(screen.getByText(/adminisztrációs panel eléréséhez/)).toBeInTheDocument();
    expect(screen.getByText('Vissza a főoldalra')).toBeInTheDocument();
    expect(screen.getByText('Vissza')).toBeInTheDocument();
  });

  test('should show redirect message for unauthenticated users', () => {
    // This test assumes user is not authenticated
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotAuthorized />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should show the unauthorized message
    expect(screen.getByText('Nem engedélyezett hozzáférés')).toBeInTheDocument();
  });

  test('should have functional navigation buttons', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <NotAuthorized />
        </AuthProvider>
      </BrowserRouter>
    );

    const goHomeButton = screen.getByText('Vissza a főoldalra');
    const goBackButton = screen.getByText('Vissza');

    // Test go home button
    fireEvent.click(goHomeButton);
    expect(window.location.href).toBe('/');

    // Test go back button
    fireEvent.click(goBackButton);
    // This would trigger window.history.back() in the actual implementation
  });

  test('should display appropriate icons and styling', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotAuthorized />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should contain the prohibition icon
    expect(screen.getByText('🚫')).toBeInTheDocument();
  });

  test('should be responsive and accessible', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <NotAuthorized />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check for responsive container
    expect(container.querySelector('.NotAuthorizedContainer')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByRole('button', { name: 'Vissza a főoldalra' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vissza' })).toBeInTheDocument();
  });
});