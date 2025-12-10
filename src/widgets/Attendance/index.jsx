// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import AnimatedCount from '@components/AnimatedCount';

// hooks
import {useThemeProvider} from '@contexts/themeContext';

const Attendance = ({ 
  attendance = 82754, 
  stadiumName = "Santiago Bernabéu Stadium", 
  location = "Madrid", 
  title = "Today attendance",
  showBackground = true 
}) => {
    const {theme} = useThemeProvider();

    return (
        <Spring className="card h-1 d-flex flex-column justify-content-between g-12 p-relative">
            <div className="card_header d-flex flex-column p-relative z-2">
                <AnimatedCount className="h2 text-20" count={attendance} separator="."/>
                <span className="text-12 text-overflow">{title}</span>
            </div>
            {showBackground && <div className={`${styles.media} ${styles[theme]}`}/>}
            <div className="card_footer p-relative z-2">
                <h3>{stadiumName}</h3>
                <span className="text-12">{location}</span>
            </div>
        </Spring>
    )
}

Attendance.meta = {
  id: "attendance",
  name: "Stadium Attendance",
  category: "Football",
  defaultSize: { w: 2, h: 2 },
  props: {
    attendance: { type: "number", default: 82754, description: "Current attendance number" },
    stadiumName: { type: "string", default: "Santiago Bernabéu Stadium", description: "Stadium name" },
    location: { type: "string", default: "Madrid", description: "Stadium location" },
    title: { type: "string", default: "Today attendance", description: "Attendance title" },
    showBackground: { type: "boolean", default: true, description: "Whether to show background image" }
  }
};

export default Attendance