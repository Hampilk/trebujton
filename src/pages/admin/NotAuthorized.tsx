import React from 'react';
import styled from 'styled-components';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const NotAuthorizedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #dc3545;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: ${props => props.theme.theme === 'dark' ? '#fff' : '#212529'};
`;

const ErrorDescription = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.theme === 'dark' ? '#ccc' : '#6c757d'};
  margin: 0 0 2rem 0;
  max-width: 500px;
  line-height: 1.5;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  ` : `
    background: transparent;
    color: ${props.theme.theme === 'dark' ? '#ccc' : '#6c757d'};
    border: 2px solid ${props.theme.theme === 'dark' ? '#555' : '#e9ecef'};
    
    &:hover {
      background: ${props.theme.theme === 'dark' ? '#333' : '#f8f9fa'};
      border-color: ${props.theme.theme === 'dark' ? '#666' : '#adb5bd'};
    }
  `}
`;

const NotAuthorized: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <NotAuthorizedContainer>
      <ErrorIcon>🚫</ErrorIcon>
      <ErrorTitle>Nem engedélyezett hozzáférés</ErrorTitle>
      <ErrorDescription>
        Ön nem rendelkezik megfelelő jogosultságokkal az adminisztrációs 
        panel eléréséhez. Ez a terület csak adminisztrátorok és elemzők 
        számára érhető el.
      </ErrorDescription>
      <ActionButtons>
        <Button variant="primary" onClick={handleGoHome}>
          Vissza a főoldalra
        </Button>
        <Button variant="secondary" onClick={handleGoBack}>
          Vissza
        </Button>
      </ActionButtons>
    </NotAuthorizedContainer>
  );
};

export default NotAuthorized;