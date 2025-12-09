import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminNav from '@pages/admin/AdminNav';

describe('AdminNav Component', () => {
  test('should render breadcrumbs and section title', () => {
    render(
      <BrowserRouter>
        <AdminNav 
          title="Test Title" 
          description="Test Description" 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('should generate breadcrumbs from current path', () => {
    render(
      <BrowserRouter>
        <AdminNav title="Users" />
      </BrowserRouter>
    );

    // Should show Admin > Users breadcrumbs
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  test('should accept custom breadcrumb path', () => {
    const customBreadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'Admin', path: '/admin' },
      { label: 'Users', path: '/admin/users' }
    ];

    render(
      <BrowserRouter>
        <AdminNav 
          title="User Management" 
          breadcrumbPath={customBreadcrumbs}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  test('should have proper styling and accessibility', () => {
    render(
      <BrowserRouter>
        <AdminNav 
          title="Admin Dashboard" 
          description="Main administrative interface"
        />
      </BrowserRouter>
    );

    // Should have proper semantic structure
    const breadcrumbs = screen.getByRole('navigation');
    expect(breadcrumbs).toBeInTheDocument();
    
    const sectionTitle = screen.getByRole('heading', { level: 2 });
    expect(sectionTitle).toHaveTextContent('Admin Dashboard');
  });

  test('should work with Hungarian labels', () => {
    render(
      <BrowserRouter>
        <AdminNav 
          title="Felhasználók kezelése" 
          description="Felhasználói fiókok kezelése"
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Felhasználók kezelése')).toBeInTheDocument();
    expect(screen.getByText('Felhasználói fiókok kezelése')).toBeInTheDocument();
  });
});