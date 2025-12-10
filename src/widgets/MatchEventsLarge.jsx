// styling
import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';

// components
import Spring from '@components/Spring';
import ClubInfo from '@components/ClubInfo';
import Score from '@ui/Score';
import MatchTrack from '@ui/MatchTrack';
import MatchEventText from '@ui/MatchEventText';
import MatchProgress from '@ui/MatchProgress';

// hooks
import useMeasure from 'react-use-measure';

const Header = styled.div`
  .main {
    display: none;
    
    // tablet portrait
    @media screen and (min-width: 768px) {
        display: flex;
    }
  }
`;

// Static match data to prevent recreation on every render
const MATCH_DATA = {
    homeTeam: 'bayern',
    awayTeam: 'barcelona',
    homeScore: 0,
    awayScore: 2,
    currentMinute: 79,
    matchText: "Bayern attacks on the left"
};

// Static events data to prevent recreation
const STATIC_EVENTS = [
    { type: 'goal', minute: 6, count: 1 },
    { type: 'goal', minute: 20, count: 1 },
    { type: 'substitution', minute: 30, count: 2 },
    { type: 'goal', minute: 47, count: 1 },
    { type: 'goal', minute: 60, count: 1 },
    { type: 'substitution', minute: 70, count: 2 },
];

// Memoized match header component
const MemoizedMatchHeader = React.memo(({ homeTeam, awayTeam, homeScore, awayScore }) => (
    <Header className="d-flex align-items-center justify-content-between card-padded p-relative">
        <ClubInfo id={homeTeam} />
        <Score team1={homeScore} team2={awayScore} />
        <ClubInfo id={awayTeam} wrapperClass="flex-row-reverse text-right" />
    </Header>
), (prevProps, nextProps) => 
    prevProps.homeTeam === nextProps.homeTeam &&
    prevProps.awayTeam === nextProps.awayTeam &&
    prevProps.homeScore === nextProps.homeScore &&
    prevProps.awayScore === nextProps.awayScore
);

MemoizedMatchHeader.displayName = 'MemoizedMatchHeader';

// Memoized match content component
const MemoizedMatchContent = React.memo(({ 
    currentMinute, 
    matchText, 
    events, 
    width 
}) => (
    <div 
        className="d-flex flex-column g-20 flex-1 p-relative card-padded"
        style={{ paddingTop: 20 }}
    >
        <MatchProgress 
            currentMinute={currentMinute} 
            containerWidth={width} 
        />
        <MatchEventText 
            minute={currentMinute} 
            text={matchText} 
        />
        <MatchTrack 
            events={events} 
            currentMinute={currentMinute} 
        />
    </div>
), (prevProps, nextProps) =>
    prevProps.currentMinute === nextProps.currentMinute &&
    prevProps.matchText === nextProps.matchText &&
    prevProps.events === nextProps.events &&
    prevProps.width === nextProps.width
);

MemoizedMatchContent.displayName = 'MemoizedMatchContent';

const MatchEventsLarge = () => {
    const [ref, { width }] = useMeasure();

    // Memoize match data to prevent unnecessary recalculations
    const memoizedMatchData = useMemo(() => ({
        ...MATCH_DATA,
        events: STATIC_EVENTS
    }), []);

    // Memoize match components with stable references
    const MemoizedSpring = useMemo(() => React.memo(Spring), []);

    return (
        <MemoizedSpring className="card d-flex flex-column">
            <MemoizedMatchHeader
                homeTeam={memoizedMatchData.homeTeam}
                awayTeam={memoizedMatchData.awayTeam}
                homeScore={memoizedMatchData.homeScore}
                awayScore={memoizedMatchData.awayScore}
            />
            <MemoizedMatchContent
                currentMinute={memoizedMatchData.currentMinute}
                matchText={memoizedMatchData.matchText}
                events={memoizedMatchData.events}
                width={width}
            />
        </MemoizedSpring>
    );
};

export default MatchEventsLarge