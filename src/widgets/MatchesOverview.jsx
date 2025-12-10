// components
import React from 'react';
import Spring from '@components/Spring';
import ScrollContainer from '@components/ScrollContainer';
import {TabsList} from '@mui/base/TabsList';
import {TabPanel} from '@mui/base/TabPanel';
import {Tabs} from '@mui/base/Tabs';
import MatchCard from '@components/MatchCard';
import TabButton from '@ui/TabButton';
import LoadingScreen from '@components/LoadingScreen';

// hooks
import useMeasure from 'react-use-measure';
import {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import { useLiveMatches, useFinishedMatches } from '@/hooks/useWinmixQuery';

// Memoized match transformation function
const transformMatch = React.useCallback((match) => ({
    id: match.id,
    home_team: {
        name: match.home_team.name,
        short_name: match.home_team.short_name,
        logo_url: match.home_team.logo_url
    },
    away_team: {
        name: match.away_team.name,
        short_name: match.away_team.short_name,
        logo_url: match.away_team.logo_url
    },
    league: {
        name: match.league.name,
        logo_url: match.league.logo_url
    },
    home_score: match.home_score,
    away_score: match.away_score,
    match_date: match.match_date,
    venue: match.venue,
    status: match.status,
    active: match.status === 'live'
}), []);

// Memoized match card component to prevent unnecessary re-renders
const MemoizedMatchCard = React.memo(({ match, index }) => (
    <MatchCard 
        key={match.id} 
        match={match} 
        index={index}
    />
), (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
        prevProps.match.id === nextProps.match.id &&
        prevProps.match.home_score === nextProps.match.home_score &&
        prevProps.match.away_score === nextProps.match.away_score &&
        prevProps.match.status === nextProps.match.status &&
        prevProps.index === nextProps.index
    );
});

MemoizedMatchCard.displayName = 'MemoizedMatchCard';

// Empty state components
const EmptyLiveMatches = React.memo(() => (
    <div className="text-center text-gray-500 py-8">
        No live matches at the moment
    </div>
));

const EmptyFinishedMatches = React.memo(() => (
    <div className="text-center text-gray-500 py-8">
        No finished matches available
    </div>
));

// Tab panel content component
const MatchListPanel = React.memo(({ matches, emptyComponent: EmptyComponent }) => (
    <div className="d-flex flex-column g-24" style={{paddingBottom: 24}}>
        {matches.length > 0 ? (
            matches.map((match, index) => (
                <MemoizedMatchCard 
                    key={match.id} 
                    match={match} 
                    index={index}
                />
            ))
        ) : (
            <EmptyComponent />
        )}
    </div>
));

const MatchesOverview = () => {
    const [activeTab, setActiveTab] = useState('live');
    const [ref, {height}] = useMeasure();
    const trackRef = useRef(null);

    // Use real data from Supabase
    const { data: liveMatches, isLoading: liveLoading, error: liveError } = useLiveMatches();
    const { data: finishedMatches, isLoading: finishedLoading, error: finishedError } = useFinishedMatches();

    // Memoized scroll reset to prevent effect recreation
    const resetScroll = useCallback(() => {
        if (trackRef.current) {
            trackRef.current.scrollTo(0, 0);
        }
    }, []);

    useEffect(() => {
        resetScroll();
    }, [activeTab, resetScroll]);

    // Memoized error state
    const error = useMemo(() => {
        if (liveError) return { type: 'live', message: liveError.message };
        if (finishedError) return { type: 'finished', message: finishedError.message };
        return null;
    }, [liveError, finishedError]);

    // Memoized loading state
    const isLoading = useMemo(() => 
        liveLoading || finishedLoading, 
        [liveLoading, finishedLoading]
    );

    // Memoized processed matches data
    const processedLiveMatches = useMemo(() => 
        (liveMatches || []).map(transformMatch), 
        [liveMatches, transformMatch]
    );

    const processedFinishedMatches = useMemo(() => 
        (finishedMatches || []).slice(0, 10).map(transformMatch), 
        [finishedMatches, transformMatch]
    );

    const processedMatches = useMemo(() => ({
        live: processedLiveMatches,
        finished: processedFinishedMatches
    }), [processedLiveMatches, processedFinishedMatches]);

    // Memoized tab handlers
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <Spring className="card h-3">
                <div className="flex items-center justify-center h-32">
                    <LoadingScreen />
                </div>
            </Spring>
        );
    }

    // Show error state
    if (error) {
        return (
            <Spring className="card h-3">
                <div className="text-center text-red-500 p-4">
                    Error loading matches: {error.message}
                </div>
            </Spring>
        );
    }

    return (
        <Spring className="card h-3">
            <Tabs className="h-100" value={activeTab}>
                <div className="card-padded" ref={ref}>
                    <TabsList className="tab-nav col-2">
                        <TabButton 
                            title="Live"
                            onClick={() => handleTabChange('live')}
                            active={activeTab === 'live'}
                        />
                        <TabButton 
                            title="Finished"
                            onClick={() => handleTabChange('finished')}
                            active={activeTab === 'finished'}
                        />
                    </TabsList>
                </div>
                <ScrollContainer height={height}>
                    <div className="track" style={{padding: '0 var(--card-padding)'}} ref={trackRef}>
                        <TabPanel className="h-100" value="live">
                            <MatchListPanel 
                                matches={processedMatches.live} 
                                emptyComponent={EmptyLiveMatches}
                            />
                        </TabPanel>
                        <TabPanel className="h-100" value="finished">
                            <MatchListPanel 
                                matches={processedMatches.finished} 
                                emptyComponent={EmptyFinishedMatches}
                            />
                        </TabPanel>
                    </div>
                </ScrollContainer>
            </Tabs>
        </Spring>
    );
};

export default MatchesOverview