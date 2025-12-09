import { useState, useEffect, useRef } from 'react';
import Spring from '@components/Spring';
import ScrollContainer from '@components/ScrollContainer';
import { TabsList } from '@mui/base/TabsList';
import { TabPanel } from '@mui/base/TabPanel';
import { Tabs } from '@mui/base/Tabs';
import MatchCard from '@components/MatchCard';
import TabButton from '@ui/TabButton';
import { DataStateMessage } from '@components/DataStateMessage';
import { SkeletonLoader } from '@components/SkeletonLoader';

import useMeasure from 'react-use-measure';
import { useMatches } from '@/hooks/useMatches';

const MatchesOverview = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [ref, { height }] = useMeasure();
  const trackRef = useRef(null);

  const {
    data: liveMatches = [],
    isLoading: isLoadingLive,
    error: errorLive,
  } = useMatches({ status: 'live' });

  const {
    data: finishedMatches = [],
    isLoading: isLoadingFinished,
    error: errorFinished,
  } = useMatches({ status: 'finished' });

  useEffect(() => {
    trackRef.current && trackRef.current.scrollTo(0, 0);
  }, [activeTab]);

  const transformMatch = (match: any, index: number) => ({
    ...match,
    team1: {
      id: match.home_team_id,
      score: match.home_score,
    },
    team2: {
      id: match.away_team_id,
      score: match.away_score,
    },
    events: match.events || [
      {
        minute: 0,
        event: 'Match started',
      },
    ],
  });

  const renderTabContent = (matches: any[], isLoading: boolean, error: any) => {
    if (isLoading) {
      return (
        <div className="d-flex flex-column g-24" style={{ paddingBottom: 24 }}>
          <SkeletonLoader count={3} height={80} />
        </div>
      );
    }

    if (error) {
      return <DataStateMessage state="error" error={error} />;
    }

    if (matches.length === 0) {
      return <DataStateMessage state="empty" message="No matches available" />;
    }

    return (
      <div className="d-flex flex-column g-24" style={{ paddingBottom: 24 }}>
        {matches.map((match, index) => (
          <MatchCard
            key={match.id || index}
            match={transformMatch(match, index)}
            index={index}
          />
        ))}
      </div>
    );
  };

  return (
    <Spring className="card h-3">
      <Tabs className="h-100" value={activeTab}>
        <div className="card-padded" ref={ref}>
          <TabsList className="tab-nav col-2">
            <TabButton
              title="Live"
              onClick={() => setActiveTab('live')}
              active={activeTab === 'live'}
            />
            <TabButton
              title="Finished"
              onClick={() => setActiveTab('finished')}
              active={activeTab === 'finished'}
            />
          </TabsList>
        </div>
        <ScrollContainer height={height}>
          <div
            className="track"
            style={{ padding: '0 var(--card-padding)' }}
            ref={trackRef}
          >
            <TabPanel
              className="h-100"
              value="live"
              onClick={() => setActiveTab('live')}
            >
              {renderTabContent(liveMatches, isLoadingLive, errorLive)}
            </TabPanel>
            <TabPanel
              className="h-100"
              value="finished"
              onClick={() => setActiveTab('finished')}
            >
              {renderTabContent(finishedMatches, isLoadingFinished, errorFinished)}
            </TabPanel>
          </div>
        </ScrollContainer>
      </Tabs>
    </Spring>
  );
};

export default MatchesOverview;