import { useState, useMemo } from 'react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';

// Hooks
import { useMatches } from '@/hooks/useMatchesDirect';

// Widgets
import MatchesList from '@/widgets/MatchesList';

export default function MatchesPageComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: matches = [], isLoading, error } = useMatches({
    searchTerm,
    selectedStatus
  });

  const widgets = useMemo(() => ({
    matches: <MatchesList 
      matches={matches} 
      loading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedStatus={selectedStatus}
      onStatusChange={setSelectedStatus}
    />,
  }), [matches, isLoading, searchTerm, selectedStatus]);

  return (
    <>
      <PageHeader 
        title="Matches" 
        metaDescription="Manage and view all matches"
      />
      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
          Error loading matches: {error.message}
        </div>
      )}
      <AppGrid id="matches" widgets={widgets} />
    </>
  );
}