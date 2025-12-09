// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import LazyImage from '@components/LazyImage';
import InfoTabsNav from '@components/InfoTabsNav';
import Goal from '@assets/goal.svg?react';
import { Loader2 } from 'lucide-react';

// hooks
import { useThemeProvider } from '@contexts/themeContext';
import { usePlayer } from '@hooks/usePlayers';
import { getErrorMessage } from '@utils/error';

interface PlayerFullInfoProps {
  playerId: string;
  fallbackPlayerId?: string;
}

const PlayerFullInfo = ({ playerId, fallbackPlayerId = 'toni-kroos' }: PlayerFullInfoProps) => {
  const { direction } = useThemeProvider();
  
  // Use fallback player ID if main playerId is not provided
  const actualPlayerId = playerId || fallbackPlayerId;

  // Fetch player data
  const { data: player, isLoading, error } = usePlayer(actualPlayerId);

  if (isLoading) {
    return (
      <Spring className="card h-2 d-flex flex-column">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <InfoTabsNav />
      </Spring>
    );
  }

  if (error || !player) {
    return (
      <Spring className="card h-2 d-flex flex-column">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Player not found</h3>
            <p className="text-sm text-gray-500">
              {error ? getErrorMessage(error) : 'Unable to load player information'}
            </p>
          </div>
        </div>
        <InfoTabsNav />
      </Spring>
    );
  }

  // Use player photo if available, otherwise fallback to default
  const playerImage = player.photo_url || '/assets/players/default-player.webp';

  return (
    <Spring className="card h-2 d-flex flex-column">
      <div className="p-relative flex-1">
        <div className={`${styles.main} ${styles[direction]} d-flex flex-column g-16`}>
          <span className="player-number">{player.number}</span>
          <div className="d-flex flex-column">
            <h2 className="text-20">{player.name}</h2>
            <span className="text-12">{player.position}</span>
          </div>
        </div>
        <LazyImage 
          className={`${styles.media} ${styles[direction]}`} 
          src={playerImage} 
          alt={player.name} 
        />
        <Goal className={styles.goal}/>
      </div>
      <InfoTabsNav/>
    </Spring>
  );
};

export default PlayerFullInfo