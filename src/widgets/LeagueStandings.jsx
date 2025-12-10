// styling
import styled from 'styled-components';
import theme from 'styled-theming';

// components
import Spring from '@components/Spring';
import LeagueHeader from '@components/LeagueHeader';
import TeamScoreRow, {StyledRow} from '@components/TeamScoreRow';

// hooks
import {useThemeProvider} from '@contexts/themeContext';

// assets
import english_premier from '@assets/clubs/english_premier.webp';

const TableHeader = styled(StyledRow)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme('theme', {
    light: 'var(--body)',
    dark: '#414D55'
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
      dark: '#414D55'
    })};
  }

  .points {
    margin-right: 4px;
  }
`;

const LeagueStandings = ({ 
  leagueId = 'premier-league',
  title = 'English Premier League',
  showLogos = true,
  maxTeams = 20
}) => {
    const {direction} = useThemeProvider();
    
    // Mock data for now since the hook doesn't exist
    const mockData = [
      { name: 'Manchester City', color: 'manchester-city', pts: 67, w: 21, d: 4, l: 3 },
      { name: 'Arsenal', color: 'arsenal', pts: 65, w: 20, d: 5, l: 3 },
      { name: 'Liverpool', color: 'liverpool', pts: 63, w: 19, d: 6, l: 3 },
      { name: 'Aston Villa', color: 'aston-villa', pts: 57, w: 17, d: 6, l: 5 },
      { name: 'Tottenham', color: 'tottenham', pts: 53, w: 16, d: 5, l: 7 },
    ];

    return (
        <Spring className="card d-flex flex-column g-20 card-padded">
            <LeagueHeader title={<>{title.split(' ')[0]} <span className="d-block">{title.split(' ').slice(1).join(' ')}</span></>}
                          img={english_premier}
                          variant="compact"/>
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
                    {
                        mockData.slice(0, maxTeams).map((item, index) => (
                            <TeamScoreRow key={item.name} data={item} index={index} variant="league"/>
                        ))
                    }
                </div>
            </div>
        </Spring>
    )
}

LeagueStandings.meta = {
  id: "league_standings",
  name: "League Standings",
  category: "Football",
  defaultSize: { w: 3, h: 4 },
  props: {
    leagueId: { type: "string", default: "premier-league", description: "League identifier" },
    title: { type: "string", default: "English Premier League", description: "League title" },
    showLogos: { type: "boolean", default: true, description: "Whether to show team logos" },
    maxTeams: { type: "number", default: 20, description: "Maximum number of teams to display" }
  }
};

export default LeagueStandings;