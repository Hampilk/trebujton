import React from 'react';
import BuilderLayout from '../../components/BuilderLayout';

const PageBuilder = () => {
  // For now, use a default page ID. In a real app, this would come from URL params
  const pageId = 'admin-page-builder';

  return (
    <div className="h-full">
      <BuilderLayout 
        pageId={pageId}
        initialLayout={{
          instances: {},
          layout: []
        }}
      />
    </div>
  );
};

export default PageBuilder;