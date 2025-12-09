import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const NavContainer = styled.nav`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${props => props.theme.theme === 'dark' ? '#333' : '#e9ecef'};
`;

const Breadcrumbs = styled.ol`
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.9rem;
`;

const BreadcrumbItem = styled.li`
  display: flex;
  align-items: center;
  
  &:not(:last-child)::after {
    content: '/';
    margin: 0 0.5rem;
    color: ${props => props.theme.theme === 'dark' ? '#999' : '#6c757d'};
  }

  &:last-child {
    color: ${props => props.theme.theme === 'dark' ? '#fff' : '#212529'};
    font-weight: 500;
  }
`;

const BreadcrumbLink = styled(Link)`
  color: ${props => props.theme.theme === 'dark' ? '#999' : '#6c757d'};
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.theme === 'dark' ? '#fff' : '#212529'};
  }
`;

const SectionTitle = styled.h2`
  margin: 1rem 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.theme === 'dark' ? '#fff' : '#212529'};
`;

const SectionDescription = styled.p`
  margin: 0;
  color: ${props => props.theme.theme === 'dark' ? '#ccc' : '#6c757d'};
  font-size: 0.95rem;
`;

interface AdminNavProps {
  title: string;
  description?: string;
  breadcrumbPath?: Array<{ label: string; path: string }>;
}

const AdminNav: React.FC<AdminNavProps> = ({ 
  title, 
  description, 
  breadcrumbPath 
}) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if not provided
  const generateBreadcrumbs = () => {
    if (breadcrumbPath) return breadcrumbPath;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; path: string }> = [
      { label: 'Admin', path: '/admin' }
    ];

    let currentPath = '/admin';
    pathSegments.slice(1).forEach(segment => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <NavContainer>
      <Breadcrumbs>
        {breadcrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.path}>
            {index === breadcrumbs.length - 1 ? (
              <span>{crumb.label}</span>
            ) : (
              <BreadcrumbLink to={crumb.path}>
                {crumb.label}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
      
      <SectionTitle>{title}</SectionTitle>
      {description && <SectionDescription>{description}</SectionDescription>}
    </NavContainer>
  );
};

export default AdminNav;