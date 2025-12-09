import React from 'react';
import styled from 'styled-components';
import AdminLayout from './AdminLayout';
import AdminNav from './AdminNav';

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const DashboardCard = styled.div`
  background: ${props => props.theme.theme === 'dark' ? '#2d3748' : '#ffffff'};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.theme === 'dark' ? '#fff' : '#2d3748'};
`;

const CardDescription = styled.p`
  margin: 0 0 1rem 0;
  color: ${props => props.theme.theme === 'dark' ? '#cbd5e0' : '#718096'};
  font-size: 0.95rem;
  line-height: 1.5;
`;

const CardStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.theme === 'dark' ? '#4a5568' : '#e2e8f0'};
`;

const StatNumber = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
`;

const StatLabel = styled.span`
  font-size: 0.85rem;
  color: ${props => props.theme.theme === 'dark' ? '#a0aec0' : '#718096'};
`;

const QuickActions = styled.div`
  background: ${props => props.theme.theme === 'dark' ? '#2d3748' : '#ffffff'};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const AdminDashboard: React.FC = () => {
  // Mock data for demonstration
  const stats = {
    totalUsers: 1247,
    activePredictions: 89,
    runningModels: 12,
    completedJobs: 156
  };

  return (
    <AdminLayout
      title="WinMixPro Admin"
      subtitle="Futball előrejelzési platform vezérlőpultja"
    >
      <AdminNav
        title="Adminisztrációs áttekintés"
        description="A WinMixPro rendszer központi vezérlőpultja"
      />

      <DashboardGrid>
        <DashboardCard>
          <CardTitle>👥 Felhasználók</CardTitle>
          <CardDescription>
            Felhasználói fiókok és jogosultságok kezelése
          </CardDescription>
          <CardStats>
            <div>
              <StatNumber>{stats.totalUsers.toLocaleString()}</StatNumber>
              <StatLabel>Összes felhasználó</StatLabel>
            </div>
            <ActionButton
              onClick={() => window.location.href = '/admin/users'}
            >
              Kezelés
            </ActionButton>
          </CardStats>
        </DashboardCard>

        <DashboardCard>
          <CardTitle>🎯 Előrejelzések</CardTitle>
          <CardDescription>
            Futball meccs előrejelzések és statisztikák
          </CardDescription>
          <CardStats>
            <div>
              <StatNumber>{stats.activePredictions}</StatNumber>
              <StatLabel>Aktív előrejelzés</StatLabel>
            </div>
            <ActionButton
              onClick={() => window.location.href = '/admin/predictions'}
            >
              Kezelés
            </ActionButton>
          </CardStats>
        </DashboardCard>

        <DashboardCard>
          <CardTitle>🤖 Modellek</CardTitle>
          <CardDescription>
            Gépi tanulási modellek és konfigurációk
          </CardDescription>
          <CardStats>
            <div>
              <StatNumber>{stats.runningModels}</StatNumber>
              <StatLabel>Aktív modell</StatLabel>
            </div>
            <ActionButton
              onClick={() => window.location.href = '/admin/models'}
            >
              Kezelés
            </ActionButton>
          </CardStats>
        </DashboardCard>

        <DashboardCard>
          <CardTitle>⚙️ Folyamatok</CardTitle>
          <CardDescription>
            Háttérfolyamatok és automatikus feladatok
          </CardDescription>
          <CardStats>
            <div>
              <StatNumber>{stats.completedJobs}</StatNumber>
              <StatLabel>Befejezett feladat</StatLabel>
            </div>
            <ActionButton
              onClick={() => window.location.href = '/admin/jobs'}
            >
              Kezelés
            </ActionButton>
          </CardStats>
        </DashboardCard>
      </DashboardGrid>

      <QuickActions>
        <CardTitle>🚀 Gyors műveletek</CardTitle>
        <CardDescription style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Gyakran használt adminisztrációs funkciók
        </CardDescription>
        <ActionsGrid>
          <ActionButton onClick={() => window.location.href = '/admin/monitoring'}>
            Rendszer állapot
          </ActionButton>
          <ActionButton onClick={() => window.location.href = '/admin/settings'}>
            Rendszer beállítások
          </ActionButton>
          <ActionButton onClick={() => alert('Adatok exportálása...')}>
            Adatok exportálása
          </ActionButton>
          <ActionButton onClick={() => alert('Rendszer mentés...')}>
            Rendszer mentés
          </ActionButton>
        </ActionsGrid>
      </QuickActions>
    </AdminLayout>
  );
};

export default AdminDashboard;