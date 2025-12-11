import { useState, useEffect, useMemo } from 'react';

// layout components
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// widgets
import LeagueRating from '@widgets/LeagueRating';
import MatchesOverview from '@widgets/MatchesOverview';
import TeamPulse from '@widgets/TeamPulse';
import GamesCalendar from '@widgets/GamesCalendar';
import Standings from '../widgets/Standings';
import BallPossessionAreaChart from '@widgets/BallPossessionAreaChart';
import LineDotsChart from '@widgets/LineDotsChart';

// components
import TeamStatsCard from '@components/TeamStatsCard';

// services
import { supabase } from '../integrations/supabase/client';
import { LEAGUE_METADATA } from '../data/teamOptions';

const LeagueOverview = () => {
    const [selectedLeague, setSelectedLeague] = useState('angol');
    const [standingsData, setStandingsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                setLoading(true);
                
                // Fetch league standings from Supabase
                const { data, error } = await supabase
                    .from('league_standings')
                    .select(`
                        *,
                        team:teams(id, name)
                    `)
                    .eq('league_key', selectedLeague)
                    .order('position', { ascending: true });

                if (error) {
                    console.error('Error fetching standings:', error);
                    // Fallback to mock data
                    setStandingsData([]);
                } else {
                    setStandingsData(data || []);
                }
            } catch (err) {
                console.error('Error fetching standings:', err);
                setStandingsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStandings();
    }, [selectedLeague]);

    const widgets = useMemo(() => ({
        league_rating: <LeagueRating />,
        matches_overview: <MatchesOverview />,
        team_stats: (
            <WidgetGroup>
                <TeamStatsCard id="manunited" value={14} />
                <TeamStatsCard id="chelsea" value={12} />
            </WidgetGroup>
        ),
        team_pulse: <TeamPulse />,
        calendar: <GamesCalendar />,
        standings: (
            <Standings 
                teams={standingsData}
                title={`${LEAGUE_METADATA[selectedLeague].displayName} Standings`}
                showForm={true}
                showRelegation={true}
                loading={loading}
            />
        ),
        ball_possession: <BallPossessionAreaChart />,
        dots_chart: <LineDotsChart />
    }), [standingsData, selectedLeague, loading]);

    return (
        <>
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mt-2 mb-4">Select League</h2>
                <div className="inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border">
                    <button
                        onClick={() => setSelectedLeague('angol')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                            selectedLeague === 'angol'
                                ? 'bg-card text-foreground ring-1 ring-border shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        English Premier League
                    </button>
                    <button
                        onClick={() => setSelectedLeague('spanyol')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                            selectedLeague === 'spanyol'
                                ? 'bg-card text-foreground ring-1 ring-border shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Spanish La Liga
                    </button>
                </div>
            </div>
            <PageHeader 
                title={`${LEAGUE_METADATA[selectedLeague].displayName} Overview`}
                metaDescription={`Live standings, matches, and analytics for ${LEAGUE_METADATA[selectedLeague].displayName}`}
            />
            <AppGrid id="league_overview" widgets={widgets}/>
        </>
    )
}

export default LeagueOverview;