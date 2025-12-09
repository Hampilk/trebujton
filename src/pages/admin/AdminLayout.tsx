import React from 'react';
import styled from 'styled-components';

const AdminContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${props => props.theme.theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
`;

const AdminHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const AdminTitle = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
`;

const AdminSubtitle = styled.p`
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 0.95rem;
`;

const AdminContent = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title, 
  subtitle 
}) => {
  return (
    <AdminContainer>
      <AdminHeader>
        <AdminTitle>{title}</AdminTitle>
        {subtitle && <AdminSubtitle>{subtitle}</AdminSubtitle>}
      </AdminHeader>
      <AdminContent>
        {children}
      </AdminContent>
    </AdminContainer>
  );
};

export default AdminLayout;