// styling
import styles from './styles.module.scss';
import styled from 'styled-components';

// components
import Spring from '@components/Spring';
import ClubInfo from '@components/ClubInfo';
import {Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis} from 'recharts';
import ChartTooltip from '@ui/ChartTooltip';
import AnimatedCount from '@components/AnimatedCount';
import { Loader2 } from 'lucide-react';

// hooks
import useArrayNav from '@hooks/useArrayNav';
import { useThemeProvider } from '@contexts/themeContext';
import { useTeamComparisonStats, useTeam } from '@hooks/useTeams';
import { getErrorMessage } from '@utils/error';

// types
type ComparisonRange = 'week' | 'month' | 'year';

const StyledClubInfo = styled.div`
  .main {
    display: none !important;
  }

  // tablet portrait
  @media screen and (min-width: 768px) {
    .main {
      display: flex !important;
    }
    
    &:last-of-type .info {
      flex-direction: row-reverse;
      text-align: right;
    }
  }
`;

const CustomScatterShape = ({cx, cy, fill, ...props}) => {
    const color = fill === 'var(--red)' ? 'red' : 'purple';
    const isDominant = props.dom === props.dataKey;

    return (
        <svg width="10" height="222" viewBox="0 0 10 222" x={cx} y={cy} fill="none"
             xmlns="http://www.w3.org/2000/svg">
            {
                isDominant && (
                    <path opacity="0.5" d="M5 28.3799V220.38"
                          stroke={`url(#${color}_line)`} strokeWidth="2"
                          strokeLinecap="round"/>
                )
            }
            <path fillRule="evenodd" clipRule="evenodd"
                  d="M5 10C7.76142 10 10 7.76142 10 5C10 2.23858 7.76142 0 5 0C2.23858 0 0 2.23858 0 5C0 7.76142 2.23858 10 5 10Z"
                  fill={fill}/>
            <defs>
                <linearGradient id="red_line" x1="2" y1="128" x2="2" y2="1" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--widget)"/>
                    <stop offset="1" stopColor="#ED0423"/>
                </linearGradient>
                <linearGradient id="purple_line" x1="2" y1="128" x2="2" y2="1" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--widget)"/>
                    <stop offset="1" stopColor="var(--purple)"/>
                </linearGradient>
            </defs>
        </svg>
    );
}

interface TeamCompareChartProps {
  teamAId: string;
  teamBId: string;
  range?: ComparisonRange;
  fallbackTeamAId?: string;
  fallbackTeamBId?: string;
}

const TeamCompareChart = ({
  teamAId,
  teamBId,
  range = 'month',
  fallbackTeamAId = 'bayern',
  fallbackTeamBId = 'barcelona'
}: TeamCompareChartProps) => {
  const { theme, direction } = useThemeProvider();
  const { index, navigate } = useArrayNav(['goals', 'assists', 'passes', 'shots', 'defense']);
  const isRTL = direction === 'rtl';

  // Use fallback team IDs if main team IDs are not provided
  const actualTeamAId = teamAId || fallbackTeamAId;
  const actualTeamBId = teamBId || fallbackTeamBId;

  // Fetch team data
  const { data: teamA, isLoading: isTeamALoading, error: teamAError } = useTeam(actualTeamAId);
  const { data: teamB, isLoading: isTeamBLoading, error: teamBError } = useTeam(actualTeamBId);
  
  // Fetch comparison stats for both teams
  const { data: teamAStats, isLoading: isStatsALoading, error: statsAError } = useTeamComparisonStats(actualTeamAId, range);
  const { data: teamBStats, isLoading: isStatsBLoading, error: statsBError } = useTeamComparisonStats(actualTeamBId, range);

  const isLoading = isTeamALoading || isTeamBLoading || isStatsALoading || isStatsBLoading;
  const error = teamAError || teamBError || statsAError || statsBError;

  // Transform data for chart visualization
  const getComparisonData = () => {
    if (!teamAStats || !teamBStats) return [];

    const metricMap = {
      goals: 'goals',
      assists: 'assists', 
      passes: 'passes_completed',
      shots: 'shots',
      defense: 'tackles'
    };

    const currentMetric = Object.keys(metricMap)[index];
    const statField = metricMap[currentMetric as keyof typeof metricMap];

    const teamAValue = teamAStats.find(s => s.metric_name === statField)?.metric_value || 0;
    const teamBValue = teamBStats.find(s => s.metric_name === statField)?.metric_value || 0;

    // Create scatter plot data points
    return Array.from({ length: 10 }, (_, i) => ({
      a: teamAValue + (Math.random() - 0.5) * teamAValue * 0.2,
      b: teamBValue + (Math.random() - 0.5) * teamBValue * 0.2,
      name: `Point ${i + 1}`
    }));
  };

  const getAverageValues = (data: any[]) => {
    if (!data.length) return { averageA: 0, averageB: 0 };
    
    let totalA = 0, totalB = 0;
    data.forEach(item => {
      totalA += item.a;
      totalB += item.b;
    });

    return {
      averageA: totalA / data.length,
      averageB: totalB / data.length
    };
  };

  if (isLoading) {
    return (
      <Spring className="card h-2 d-flex flex-column g-30">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Spring>
    );
  }

  if (error || !teamA || !teamB) {
    return (
      <Spring className="card h-2 d-flex flex-column g-30">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Unable to load team comparison</h3>
            <p className="text-sm text-gray-500">
              {error ? getErrorMessage(error) : 'Team data not available'}
            </p>
          </div>
        </div>
      </Spring>
    );
  }

  const chartData = getComparisonData();
  const averages = getAverageValues(chartData);

  return (
    <Spring className="card h-2 d-flex flex-column g-30">
      <div className="card_header">
        <div className="d-flex align-items-center justify-content-between p-relative">
          <StyledClubInfo>
            <div className="d-flex align-items-center g-12">
              {teamA.logo_url && (
                <img src={teamA.logo_url} alt={teamA.name} className="w-8 h-8 rounded-full" />
              )}
              <ClubInfo id={actualTeamAId} />
            </div>
          </StyledClubInfo>
          <span className={`${styles.vs} h3`}>vs</span>
          <StyledClubInfo>
            <div className="d-flex align-items-center g-12">
              {teamB.logo_url && (
                <img src={teamB.logo_url} alt={teamB.name} className="w-8 h-8 rounded-full" />
              )}
              <ClubInfo id={actualTeamBId} />
            </div>
          </StyledClubInfo>
        </div>
      </div>
      <div className="d-flex flex-column border-top flex-1 card-padded">
        <div className="d-flex justify-content-between p-relative">
          <div className="d-flex align-items-center g-20">
            <button data-direction="prev" onClick={navigate} aria-label="Previous">
              <i className="icon-arrow-left"/>
            </button>
            <h2 className={`${styles.a} ${styles.num}`}>
              <AnimatedCount
                count={averages.averageA.toFixed(2)}
                decimals={2}/>
            </h2>
          </div>
          <span className={styles.separator}/>
          <div className="d-flex align-items-center g-20">
            <h2 className={`${styles.b} ${styles.num}`}>
              <AnimatedCount
                count={averages.averageB.toFixed(2)}
                decimals={2}/>
            </h2>
            <button data-direction="next" onClick={navigate} aria-label="Next">
              <i className="icon-arrow-right"/>
            </button>
          </div>
        </div>
        <ResponsiveContainer className="flex-1" width="100%" height="100%">
          <ScatterChart margin={false} data={chartData}>
            <XAxis reversed={isRTL} hide/>
            <YAxis orientation={isRTL ? 'right' : 'left'} hide/>
            <Scatter dataKey="a" shape={CustomScatterShape}>
              {
                chartData.map((entry, i) => {
                  return (
                    <Cell key={`cell-${i}`}
                          fill="var(--red)"
                          theme={theme}
                          dom={entry.a > entry.b ? 'a' : 'b'}
                          dataKey="a"/>
                  )
                })
              }
            </Scatter>
            <Scatter dataKey="b" shape={CustomScatterShape}>
              {
                chartData.map((entry, i) => {
                  return (
                    <Cell key={`cell-${i}`}
                          fill="var(--purple)"
                          theme={theme}
                          dom={entry.a > entry.b ? 'a' : 'b'}
                          dataKey="b"/>
                  )
                })
              }
            </Scatter>
            <Tooltip cursor={false} content={<ChartTooltip/>}/>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Spring>
  );
};

export default TeamCompareChart