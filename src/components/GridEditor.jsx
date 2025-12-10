import React, { useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./GridEditor.scss";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Memoized grid item to prevent unnecessary re-renders
const MemoizedGridItem = React.memo(({ item, instance, isDragging }) => {
  const itemType = instance?.type || item.i;
  const hasTitle = Boolean(instance?.title);
  const description = instance?.description || "Widget Preview";

  return (
    <div
      key={item.i}
      className={`
        grid-item bg-white rounded-lg border-2 border-dashed border-gray-300 
        hover:border-blue-400 transition-colors p-4
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex flex-col h-full">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          {itemType}
        </div>
        {hasTitle && (
          <div className="text-xs text-gray-500">{instance.title}</div>
        )}
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
          {description}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.item === nextProps.item &&
    prevProps.instance === nextProps.instance &&
    prevProps.isDragging === nextProps.isDragging
  );
});

MemoizedGridItem.displayName = 'MemoizedGridItem';

// Memoized grid layout configuration
const createGridConfig = React.useMemo(() => ({
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 120,
  width: 1200,
  containerPadding: [16, 16],
  margin: [16, 16],
  compactType: "vertical",
  preventCollision: false,
  useCSSTransforms: true,
}), []);

/**
 * GridEditor Component
 * Optimized grid layout for page builder with memoization
 */
function GridEditor({ pageId, layout, onLayoutChange }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleLayoutChange = useCallback(
    (newLayout, layouts) => {
      if (onLayoutChange && layout) {
        onLayoutChange({
          ...layout,
          layout: newLayout,
        });
      }
    },
    [layout, onLayoutChange],
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Memoized grid layout items to prevent re-renders
  const memoizedGridItems = useMemo(() => {
    if (!layout || !layout.instances) return [];
    
    const gridLayout = layout.layout || [];
    const instances = layout.instances || {};
    
    return gridLayout.map(item => ({
      item,
      instance: instances[item.i]
    }));
  }, [layout]);

  if (!layout || !layout.instances) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No layout data available</p>
      </div>
    );
  }

  return (
    <div className="grid-editor">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout.layout || [] }}
        isDraggable={true}
        isResizable={true}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        {...createGridConfig}
      >
        {memoizedGridItems.map(({ item, instance }) => (
          <MemoizedGridItem
            key={item.i}
            item={item}
            instance={instance}
            isDragging={isDragging}
          />
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

export default GridEditor;
