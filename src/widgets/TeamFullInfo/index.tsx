// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import ClubFullInfo from '@components/ClubFullInfo';
import PlayerRow from '@components/PlayerRow';
import Lineups from '@components/Lineups';
import { Loader2 } from 'lucide-react';

// hooks
import { usePlayers } from '@hooks/usePlayers';
import { useTeam } from '@hooks/useTeams';
import { getErrorMessage } from '@utils/error';

// utils
import PropTypes from 'prop-types';

// constants
import CLUBS from '@constants/clubs';

interface TeamFullInfoProps {
  id: string;
}

const TeamFullInfo = ({ id }: TeamFullInfoProps) => {
  const { data: team, isLoading: isTeamLoading, error: teamError } = useTeam(id);
  const { data: players, isLoading: isPlayersLoading, error: playersError } = usePlayers(id);

  const isLoading = isTeamLoading || isPlayersLoading;
  const error = teamError || playersError;

  const club = CLUBS.find((club) => club.id === id) || team;

  // Transform player data to match expected format
  const transformPlayerData = (player: any) => ({
    name: player.name,
    number: player.number,
    substitutes: false, // This would need to come from the API
    avatar: player.photo_url,
    isCaptain: player.is_captain || false
  });

  if (isLoading) {
    return (
      <Spring className={`${styles.container} card`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Spring>
    );
  }

  if (error || !players) {
    return (
      <Spring className={`${styles.container} card`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Unable to load team information</h3>
            <p className="text-sm text-gray-500">
              {error ? getErrorMessage(error) : 'Team data not available'}
            </p>
          </div>
        </div>
      </Spring>
    );
  }

  const dataArr = players
    .map(transformPlayerData)
    .sort((a, b) => {
      if (a.isCaptain) return -1;
      if (b.isCaptain) return 1;
      return a.number - b.number;
    });

  return (
    <Spring className={`${styles.container} card`}>
      <div className="d-flex flex-column g-20">
        <ClubFullInfo club={club}/>
        <div className="d-flex flex-column g-1">
          {
            dataArr.map((player, index) => (
              <PlayerRow key={index} player={player} index={index}/>
            ))
          }
        </div>
      </div>
      <div className="d-flex flex-column g-20">
        <h3>Lineups</h3>
        <Lineups wrapperClass={styles.field} withField/>
      </div>
    </Spring>
  );
};

TeamFullInfo.propTypes = {
    id: PropTypes.string.isRequired,
}

export default TeamFullInfo