// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import StatsBadge from '@ui/StatsBadge';

// hooks
import {useThemeProvider} from '@contexts/themeContext';
import {useWindowSize} from 'react-use';

// assets
import cover from '@assets/team_stats.webp';
import bvb from '@assets/clubs/bvb.webp';

const TeamStats = ({ 
  teamId = "bvb", 
  teamName = "Borussia Dortmund", 
  teamLocation = "Dortmund, Germany", 
  wins = 17, 
  draws = 29, 
  losses = 74,
  showTeamLogo = true 
}) => {
    const {theme} = useThemeProvider();
    const {width} = useWindowSize();

    const data = [
        {label: 'Wins', shortLabel: 'W', value: wins},
        {label: 'Draws', shortLabel: 'D', value: draws},
        {label: 'Losses', shortLabel: 'L', value: losses},
    ]

    // Dynamic team logo based on teamId
    const getTeamLogo = (id) => {
        const teamLogos = {
            'bvb': bvb,
            'real-madrid': null,
            'barcelona': null,
            'manchester-city': null,
        };
        return teamLogos[id] || bvb; // fallback to bvb
    };

    return (
        <Spring
            className={`${styles.container} ${theme === 'light' ? styles.light : styles.dark} card no-shadow card-padded text-black`}>
            <img className={`${styles.cover} cover`} src={cover} alt="media"/>
            <div className={`${styles.content} d-flex flex-column align-items-start justify-content-between h-100`}>
                {showTeamLogo && <img className="club-logo" src={getTeamLogo(teamId)} alt={teamName}/>}
                <div className={`${styles.content_header} d-flex flex-column g-4 flex-1`}>
                    <h2 className={`${styles.club} text-20 text-black text-overflow`}>{teamName}</h2>
                    <h4 className="text-black text-overflow">{teamLocation}</h4>
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
    )
}

TeamStats.meta = {
  id: "team_stats",
  name: "Team Statistics",
  category: "Football",
  defaultSize: { w: 2, h: 2 },
  props: {
    teamId: { type: "string", default: "bvb", description: "Team identifier" },
    teamName: { type: "string", default: "Borussia Dortmund", description: "Team display name" },
    teamLocation: { type: "string", default: "Dortmund, Germany", description: "Team location" },
    wins: { type: "number", default: 17, description: "Number of wins" },
    draws: { type: "number", default: 29, description: "Number of draws" },
    losses: { type: "number", default: 74, description: "Number of losses" },
    showTeamLogo: { type: "boolean", default: true, description: "Whether to show team logo" }
  }
};

export default TeamStats