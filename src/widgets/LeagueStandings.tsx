import { useState } from 'react';
import styled from 'styled-components';
import theme from 'styled-theming';

import Spring from '@components/Spring';
import LeagueHeader from '@components/LeagueHeader';
import TeamScoreRow, { StyledRow } from '@components/TeamScoreRow';
import { DataStateMessage } from '@components/DataStateMessage';
import { SkeletonLoader } from '@components/SkeletonLoader';

import { useThemeProvider } from '@contexts/themeContext';
import { useLeagueStandings, useLeagues } from '@/hooks/useLeagues';

import english_premier from '@assets/clubs/english_premier.webp';

const TableHeader = styled(StyledRow)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme('theme', {
    light: 'var(--body)',
    dark: '#414D55',
  })};
  color: var(--btn-text) !important;

  &.ltr {
    padding: 0 4px 0 10px;
  }

  &.rtl {
    padding: 0 10px 0 4px;
  }

  div {
    background: ${theme('theme', {
      light: 'var(--body)',
      dark: '#414D55',
    })};
  }

  .points {
    margin-right: 4px;
  }
`;

const LeagueStandings = () => {
  const { direction } = useThemeProvider();
  const { data: leagues = [] } = useLeagues();
  
  const [selectedLeagueId] = useState<string>(
    leagues.length > 0 ? leagues[0].id : ''
  );

  const {
    data: standings = [],
    isLoading,
    error,
  } = useLeagueStandings(selectedLeagueId);

  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);

  const transformStandingData = (standing: any, index: number) => ({
    ...standing,
    name: standing.team_name,
    w: standing.won,
    d: standing.drawn,
    l: standing.lost,
    pts: standing.points,
    color: 'transparent',
  });

  if (isLoading) {
    return (
      <Spring className="card d-flex flex-column g-20 card-padded">
        <LeagueHeader
          title={
            <>
              {selectedLeague?.name || 'League'}{' '}
              <span className="d-block">Standings</span>
            </>
          }
          img={english_premier}
          variant="compact"
        />
        <div style={{ padding: '20px' }}>
          <SkeletonLoader count={5} height={40} />
        </div>
      </Spring>
    );
  }

  if (error) {
    return (
      <Spring className="card d-flex flex-column g-20 card-padded">
        <LeagueHeader
          title={
            <>
              {selectedLeague?.name || 'League'}{' '}
              <span className="d-block">Standings</span>
            </>
          }
          img={english_premier}
          variant="compact"
        />
        <DataStateMessage state="error" error={error} />
      </Spring>
    );
  }

  if (standings.length === 0) {
    return (
      <Spring className="card d-flex flex-column g-20 card-padded">
        <LeagueHeader
          title={
            <>
              {selectedLeague?.name || 'League'}{' '}
              <span className="d-block">Standings</span>
            </>
          }
          img={english_premier}
          variant="compact"
        />
        <DataStateMessage state="empty" message="No standings data available" />
      </Spring>
    );
  }

  return (
    <Spring className="card d-flex flex-column g-20 card-padded">
      <LeagueHeader
        title={
          <>
            {selectedLeague?.name || 'League'}{' '}
            <span className="d-block">Standings</span>
          </>
        }
        img={english_premier}
        variant="compact"
      />
      <div className="d-flex flex-column g-4">
        <TableHeader className={`label h6 ${direction}`}>
          <span className="flex-1">Club</span>
          <div className="points">
            <span>W</span>
            <span>D</span>
            <span>L</span>
          </div>
          <span>PTS</span>
        </TableHeader>
        <div className="d-flex flex-column g-1">
          {standings.map((item, index) => (
            <TeamScoreRow
              key={index}
              data={transformStandingData(item, index)}
              index={index}
              variant="league"
            />
          ))}
        </div>
      </div>
    </Spring>
  );
};

export default LeagueStandings;