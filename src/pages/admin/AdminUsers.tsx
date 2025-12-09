import React from 'react';
import styled from 'styled-components';
import AdminLayout from './AdminLayout';
import AdminNav from './AdminNav';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${props => props.theme.theme === 'dark' ? '#ccc' : '#6c757d'};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${props => props.theme.theme === 'dark' ? '#333' : '#e9ecef'};
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin: 0;
  font-size: 1.1rem;
`;

const ContentSection = styled.div`
  background: ${props => props.theme.theme === 'dark' ? '#2d3748' : '#ffffff'};
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const PlaceholderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const PlaceholderCard = styled.div`
  background: ${props => props.theme.theme === 'dark' ? '#1a202c' : '#f8f9fa'};
  border: 2px dashed ${props => props.theme.theme === 'dark' ? '#4a5568' : '#dee2e6'};
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: #667eea;
    background: ${props => props.theme.theme === 'dark' ? '#2d3748' : '#f1f3f4'};
  }
`;

const PlaceholderIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const PlaceholderTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: ${props => props.theme.theme === 'dark' ? '#fff' : '#2d3748'};
`;

const PlaceholderDescription = styled.p`
  margin: 0;
  color: ${props => props.theme.theme === 'dark' ? '#a0aec0' : '#718096'};
  font-size: 0.9rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: ${props => props.theme.theme === 'dark' ? '#fff' : '#2d3748'};
`;

const ErrorDescription = styled.p`
  margin: 0;
  color: ${props => props.theme.theme === 'dark' ? '#a0aec0' : '#718096'};
  max-width: 500px;
  line-height: 1.5;
`;

const AdminUsers: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Simulate loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // Simulate potential error
      // setError('Hiba történt a felhasználói adatok betöltése során');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <AdminLayout
        title="WinMixPro Admin"
        subtitle="Futball előrejelzési platform vezérlőpultja"
      >
        <AdminNav
          title="Felhasználók kezelése"
          description="Felhasználói fiókok és jogosultságok kezelése"
        />
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Felhasználói adatok betöltése...</LoadingText>
        </LoadingContainer>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="WinMixPro Admin"
        subtitle="Futball előrejelzési platform vezérlőpultja"
      >
        <AdminNav
          title="Felhasználók kezelése"
          description="Felhasználói fiókok és jogosultságok kezelése"
        />
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Hiba történt</ErrorTitle>
          <ErrorDescription>{error}</ErrorDescription>
        </ErrorContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="WinMixPro Admin"
      subtitle="Futball előrejelzési platform vezérlőpultja"
    >
      <AdminNav
        title="Felhasználók kezelése"
        description="Felhasználói fiókok és jogosultságok kezelése"
      />
      <ContentSection>
        <PlaceholderGrid>
          <PlaceholderCard>
            <PlaceholderIcon>👥</PlaceholderIcon>
            <PlaceholderTitle>Felhasználói lista</PlaceholderTitle>
            <PlaceholderDescription>
              Itt jelennek majd meg az összes regisztrált felhasználó
            </PlaceholderDescription>
          </PlaceholderCard>
          
          <PlaceholderCard>
            <PlaceholderIcon>🔐</PlaceholderIcon>
            <PlaceholderTitle>Jogosultságok</PlaceholderTitle>
            <PlaceholderDescription>
              Felhasználói szerepkörök és hozzáférési jogok
            </PlaceholderDescription>
          </PlaceholderCard>
          
          <PlaceholderCard>
            <PlaceholderIcon>📊</PlaceholderIcon>
            <PlaceholderTitle>Statisztikák</PlaceholderTitle>
            <PlaceholderDescription>
              Felhasználói aktivitás és demográfiai adatok
            </PlaceholderDescription>
          </PlaceholderCard>
          
          <PlaceholderCard>
            <PlaceholderIcon>⚙️</PlaceholderIcon>
            <PlaceholderTitle>Bulk műveletek</PlaceholderTitle>
            <PlaceholderDescription>
              Tömeges felhasználói műveletek és automatizálás
            </PlaceholderDescription>
          </PlaceholderCard>
        </PlaceholderGrid>
      </ContentSection>
    </AdminLayout>
  );
};

export default AdminUsers;