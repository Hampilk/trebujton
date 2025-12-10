// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import ClubFullInfo from '@components/ClubFullInfo';
import Lineups from '@components/Lineups';

// utils
import PropTypes from 'prop-types';

// constants
import CLUBS from '@constants/clubs';

const TeamFullInfo = ({ 
  id = "bvb",
  showLineups = true,
  showHeader = true,
  title = "Team Information" 
}) => {
    const club = CLUBS.find((club) => club.id === id);
    
    // Show basic club information
    const dataArr = []; // We'll add mock data for now

    return (
        <Spring className={`${styles.container} card`}>
            <div className="d-flex flex-column g-20">
                {showHeader && <h3 className={styles.header}>{title}</h3>}
                {club && <ClubFullInfo club={club}/>}
                <div className="d-flex flex-column g-1">
                    <div className="text-center text-gray-500 py-8">
                        Team roster for {club?.name || 'Unknown Team'}
                    </div>
                </div>
            </div>
            {showLineups && (
                <div className="d-flex flex-column g-20">
                    <h3>Lineups</h3>
                    <Lineups wrapperClass={styles.field} withField/>
                </div>
            )}
        </Spring>
    )
}

TeamFullInfo.propTypes = {
    id: PropTypes.string.isRequired,
}

TeamFullInfo.meta = {
  id: "team_full_info",
  name: "Team Full Information",
  category: "Football",
  defaultSize: { w: 4, h: 3 },
  props: {
    id: { type: "string", default: "bvb", description: "Team identifier" },
    showLineups: { type: "boolean", default: true, description: "Whether to show lineups" },
    showHeader: { type: "boolean", default: true, description: "Whether to show header" },
    title: { type: "string", default: "Team Information", description: "Widget title" }
  }
};

export default TeamFullInfo