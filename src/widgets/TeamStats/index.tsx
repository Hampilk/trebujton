// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import StatsBadge from '@ui/StatsBadge';
import { Loader2 } from 'lucide-react';

// hooks
import { useThemeProvider } from '@contexts/themeContext';
import { useWindowSize } from 'react-use';
import { useTeam, useTeamStats } from '@hooks/useTeams';
import { getErrorMessage } from '@utils/error';

// assets
import cover from '@assets/team_stats.webp';

interface TeamStatsProps {
  teamId: string;
  fallbackTeamId?: string;
}

const TeamStats = ({ teamId, fallbackTeamId = 'bayern' }: TeamStatsProps) => {
  const { theme } = useThemeProvider();
  const { width } = useWindowSize();
  
  // Use fallback team ID if main teamId is not provided
  const actualTeamId = teamId || fallbackTeamId;

  // Fetch team data
  const { data: team, isLoading: isTeamLoading, error: teamError } = useTeam(actualTeamId);
  const { data: teamStats, isLoading: isStatsLoading, error: statsError } = useTeamStats(actualTeamId);

  const isLoading = isTeamLoading || isStatsLoading;
  const error = teamError || statsError;

  if (isLoading) {
    return (
      <Spring className={`${styles.container} ${theme === 'light' ? styles.light : styles.dark} card no-shadow card-padded text-black`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Spring>
    );
  }

  if (error || !team || !teamStats) {
    return (
      <Spring className={`${styles.container} ${theme === 'light' ? styles.light : styles.dark} card no-shadow card-padded text-black`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Unable to load team stats</h3>
            <p className="text-sm text-gray-500">
              {error ? getErrorMessage(error) : 'Team data not available'}
            </p>
          </div>
        </div>
      </Spring>
    );
  }

  const data = [
    { label: 'Wins', shortLabel: 'W', value: teamStats.wins },
    { label: 'Draws', shortLabel: 'D', value: teamStats.draws },
    { label: 'Losses', shortLabel: 'L', value: teamStats.losses },
  ];

  return (
    <Spring
      className={`${styles.container} ${theme === 'light' ? styles.light : styles.dark} card no-shadow card-padded text-black`}>
      <img className={`${styles.cover} cover`} src={cover} alt="media"/>
      <div className={`${styles.content} d-flex flex-column align-items-start justify-content-between h-100`}>
        {team.logo_url ? (
          <img className="club-logo" src={team.logo_url} alt={team.name}/>
        ) : (
          <div className="club-logo bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
            <span className="text-gray-500 text-xl font-bold">
              {team.short_name?.charAt(0) || team.name.charAt(0)}
            </span>
          </div>
        )}
        <div className={`${styles.content_header} d-flex flex-column g-4 flex-1`}>
          <h2 className={`${styles.club} text-20 text-black text-overflow`}>{team.name}</h2>
          <h4 className="text-black text-overflow">{team.country}</h4>
        </div>
        <div className="d-flex flex-wrap g-20">
          {
            data.map((item, index) => (
              <StatsBadge key={index}
                          label={width >= 1024 ? (width >= 1500 && width < 1920 ? item.shortLabel : item.label) : item.shortLabel}
                          value={item.value}/>
            ))
          }
        </div>
      </div>
    </Spring>
  );
};

export default TeamStats