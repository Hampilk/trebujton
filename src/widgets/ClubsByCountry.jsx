// styling
import styled from 'styled-components';
import theme from 'styled-theming';

// components
import Spring from '@components/Spring';
import TeamScoreRow, {StyledRow} from '@components/TeamScoreRow';

// hooks
import {useThemeProvider} from '@contexts/themeContext';

const ClubsByCountry = ({ 
  title = 'Clubs by Country',
  maxCountries = 10,
  showCounts = true
}) => {
    const {direction} = useThemeProvider();
    
    // Mock data for now
    const mockData = [
      { country: 'England', count: 20, color: '#FF0000' },
      { country: 'Spain', count: 18, color: '#FFA500' },
      { country: 'Germany', count: 16, color: '#000000' },
      { country: 'Italy', count: 15, color: '#008000' },
      { country: 'France', count: 14, color: '#0000FF' },
    ];

    return (
        <Spring className="card d-flex flex-column g-20 card-padded">
            <h3>{title}</h3>
            <div className="d-flex flex-column g-1">
                {
                    mockData.slice(0, maxCountries).map((item, index) => (
                        <div key={item.country} className="d-flex justify-between align-items-center p-2">
                            <div className="d-flex align-items-center g-2">
                                <div style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: '50%' }} />
                                <span>{item.country}</span>
                            </div>
                            {showCounts && <span className="text-muted">{item.count} clubs</span>}
                        </div>
                    ))
                }
            </div>
        </Spring>
    )
}

ClubsByCountry.meta = {
  id: "clubs_by_country",
  name: "Clubs by Country",
  category: "Analytics",
  defaultSize: { w: 2, h: 3 },
  props: {
    title: { type: "string", default: "Clubs by Country", description: "Widget title" },
    maxCountries: { type: "number", default: 10, description: "Maximum countries to display" },
    showCounts: { type: "boolean", default: true, description: "Whether to show club counts" }
  }
};

export default ClubsByCountry;