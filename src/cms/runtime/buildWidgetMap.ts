import React from "react";
import { getWidgetById } from "../registry/widgetRegistry";
import { WidgetRenderer } from "./WidgetRenderer";

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
}

export interface WidgetInstance {
  type: string;
  props?: Record<string, any>;
  variant?: string;
}

export interface WidgetMap {
  [instanceId: string]: React.ReactNode;
}

/**
 * buildWidgetMap - Builds a widgets object from a layout definition
 * by pulling components from the registry instead of embedding JSX inline.
 *
 * This allows CMS layouts to be hydrated deterministically using registry entries.
 *
 * @param layout - Array of layout items from layouts.js or Supabase
 * @param instances - Map of instance IDs to widget instance definitions
 * @param options - Additional options for rendering
 * @returns Widget map ready for AppGrid/CmsPageRuntime
 */
export const buildWidgetMap = (
  layout: LayoutItem[],
  instances: Record<string, WidgetInstance>,
  options?: {
    isBuilderPreview?: boolean;
    fallbackComponent?: React.FC<{ type: string }>;
  }
): WidgetMap => {
  const widgets: WidgetMap = {};

  layout.forEach((layoutItem) => {
    const { i: instanceId } = layoutItem;
    const instance = instances[instanceId];

    if (!instance) {
      console.warn(`No instance found for layout item ${instanceId}`);
      return;
    }

    const { type, props = {}, variant = "default" } = instance;

    // Try to get widget from registry
    const widgetDef = getWidgetById(type);

    if (widgetDef) {
      // Use WidgetRenderer to handle errors and variants gracefully
      widgets[instanceId] = React.createElement(WidgetRenderer, {
        key: instanceId,
        type,
        props,
        variant,
        instanceId,
        isBuilderPreview: options?.isBuilderPreview || false,
      });
    } else {
      // Use fallback component or warn
      if (options?.fallbackComponent) {
        const FallbackComponent = options.fallbackComponent;
        widgets[instanceId] = React.createElement(FallbackComponent, {
          key: instanceId,
          type,
        });
      } else {
        console.warn(
          `Widget type "${type}" not found in registry for instance ${instanceId}. Falling back to WidgetRenderer.`
        );
        widgets[instanceId] = React.createElement(WidgetRenderer, {
          key: instanceId,
          type,
          props,
          variant,
          instanceId,
          isBuilderPreview: options?.isBuilderPreview || false,
        });
      }
    }
  });

  return widgets;
};

/**
 * buildWidgetMapFromLayoutId - Builds a widget map from a static layout definition
 * in layouts.js using the layout ID.
 *
 * @param layoutId - The layout ID from layouts.js (e.g., 'club_summary')
 * @param instances - Map of instance IDs to widget instance definitions
 * @param staticLayouts - The imported layouts object (defaults to importing layouts.js)
 * @returns Widget map ready for AppGrid
 */
export const buildWidgetMapFromLayoutId = async (
  layoutId: string,
  instances: Record<string, WidgetInstance>,
  staticLayouts?: Record<string, any>
): Promise<WidgetMap | null> => {
  let layouts = staticLayouts;

  if (!layouts) {
    try {
      // Dynamically import layouts if not provided
      const layoutsModule = await import("../../layouts");
      layouts = layoutsModule.default;
    } catch (error) {
      console.error("Failed to import layouts.js:", error);
      return null;
    }
  }

  const layoutDef = layouts[layoutId];
  if (!layoutDef) {
    console.warn(`Layout "${layoutId}" not found in layouts.js`);
    return null;
  }

  // Get the appropriate breakpoint layout (use 'xl' as default)
  const layout = layoutDef.xl || layoutDef.lg || layoutDef.md;
  if (!layout) {
    console.warn(`No valid breakpoint layout found for "${layoutId}"`);
    return null;
  }

  return buildWidgetMap(layout, instances);
};

export default buildWidgetMap;
