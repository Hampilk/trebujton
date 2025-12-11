import React from "react";

export interface WidgetStyleVariant {
  slug: string;
  label: string;
  description?: string;
  supportedTokens?: string[];
  cssClass?: string;
  overrides?: Record<string, any>;
}

export interface WidgetPropsDefinition {
  type: string;
  default: any;
  description?: string;
  required?: boolean;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  category: string;
  preview?: string;
  defaultSize: { w: number; h: number };
  props: Record<string, WidgetPropsDefinition>;
  Component: React.FC<any>;
  styleVariants?: WidgetStyleVariant[];
  meta?: Record<string, any>; // Raw meta block for builder UIs
}

// Use Vite's glob import to auto-discover all widget components
// Glob both directory indexes and flat widget files
const directoryModules = import.meta.glob("/src/widgets/**/index.{jsx,tsx}", {
  eager: true,
});

const flatWidgetModules = import.meta.glob("/src/widgets/**/*.{jsx,tsx}", {
  eager: true,
});

// Merge both module sets, preferring directory index files
const widgetModules = { ...flatWidgetModules, ...directoryModules };

// Build the widget registry by extracting metadata from each component
export const widgetRegistry: WidgetDefinition[] = [];

Object.entries(widgetModules).forEach(([path, module]: [string, any]) => {
  try {
    // Skip non-index files if a corresponding index.jsx/index.tsx exists
    if (!path.includes("/index.") && directoryModules[path.replace(/\.(jsx|tsx)$/, "/index.$1")]) {
      return;
    }

    // Get the default export (the component)
    const Component = module.default;

    if (!Component) {
      return;
    }

    // Check if the component has metadata attached
    if (Component.meta) {
      const meta = Component.meta;

      // Validate required fields
      if (!meta.id || !meta.name || !meta.category) {
        console.warn(
          `Widget at ${path} is missing required metadata fields (id, name, or category)`,
        );
        return;
      }

      // Create the widget definition
      const widgetDef: WidgetDefinition = {
        id: meta.id,
        name: meta.name,
        category: meta.category,
        preview: meta.preview,
        defaultSize: meta.defaultSize || { w: 2, h: 2 },
        props: meta.props || {},
        Component: Component,
        styleVariants: meta.styleVariants || [],
        meta: meta, // Store the raw meta block
      };

      widgetRegistry.push(widgetDef);
    } else {
      // Log graceful fallback for components missing meta
      console.debug(
        `Widget component at ${path} does not have meta attached. The widget will not be registered in the CMS.`,
      );
    }
  } catch (error) {
    console.error(`Error loading widget from ${path}:`, error);
  }
});

// Helper function to get a widget by ID
export const getWidgetById = (id: string): WidgetDefinition | undefined => {
  return widgetRegistry.find((widget) => widget.id === id);
};

// Helper function to get widgets by category
export const getWidgetsByCategory = (category: string): WidgetDefinition[] => {
  return widgetRegistry.filter((widget) => widget.category === category);
};

// Helper function to get all available categories
export const getCategories = (): string[] => {
  const categories = new Set(widgetRegistry.map((widget) => widget.category));
  return Array.from(categories).sort();
};

// Helper function to get widget prop schema for builder UIs
export const getWidgetPropSchema = (widgetId: string): Record<string, WidgetPropsDefinition> | undefined => {
  const widget = getWidgetById(widgetId);
  return widget?.props;
};
