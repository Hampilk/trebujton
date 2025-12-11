import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { buildWidgetMap, buildWidgetMapFromLayoutId } from "../runtime/buildWidgetMap";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildWidgetMap", () => {
  describe("buildWidgetMap", () => {
    it("should create a widget map from layout and instances", () => {
      const layout = [
        { i: "widget1", x: 0, y: 0, w: 2, h: 2 },
        { i: "widget2", x: 2, y: 0, w: 2, h: 2 },
      ];

      const instances = {
        widget1: {
          type: "team_stats",
          props: { teamId: "bvb" },
          variant: "default",
        },
        widget2: {
          type: "league_table",
          props: { league: "Premier League" },
          variant: "compact",
        },
      };

      const result = buildWidgetMap(layout, instances);

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
      expect(result.widget1).toBeDefined();
      expect(result.widget2).toBeDefined();
    });

    it("should create React elements for each widget", () => {
      const layout = [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }];

      const instances = {
        widget1: {
          type: "team_stats",
          props: { teamId: "bvb" },
        },
      };

      const result = buildWidgetMap(layout, instances);

      expect(result.widget1).toBeDefined();
      // Should be a React element
      expect(result.widget1.type).toBeDefined();
    });

    it("should handle missing instances gracefully", () => {
      const layout = [
        { i: "widget1", x: 0, y: 0, w: 2, h: 2 },
        { i: "widget2", x: 2, y: 0, w: 2, h: 2 },
      ];

      const instances = {
        widget1: {
          type: "team_stats",
          props: {},
        },
      };

      const consoleSpy = vi.spyOn(console, "warn");
      const result = buildWidgetMap(layout, instances);

      expect(result).toBeDefined();
      expect(result.widget1).toBeDefined();
      expect(result.widget2).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should use default props when not provided", () => {
      const layout = [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }];

      const instances = {
        widget1: {
          type: "team_stats",
        },
      };

      const result = buildWidgetMap(layout, instances);

      expect(result.widget1).toBeDefined();
    });

    it("should use WidgetRenderer as fallback for unknown widgets", () => {
      const layout = [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }];

      const instances = {
        widget1: {
          type: "non_existent_widget",
          props: {},
        },
      };

      const consoleSpy = vi.spyOn(console, "warn");
      const result = buildWidgetMap(layout, instances);

      expect(result.widget1).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should support builder preview mode", () => {
      const layout = [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }];

      const instances = {
        widget1: {
          type: "team_stats",
          props: {},
        },
      };

      const result = buildWidgetMap(layout, instances, {
        isBuilderPreview: true,
      });

      expect(result.widget1).toBeDefined();
    });

    it("should support custom fallback component", () => {
      const layout = [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }];

      const instances = {
        widget1: {
          type: "non_existent_widget",
          props: {},
        },
      };

      const FallbackComponent = ({ type }) => (
        <div>Missing: {type}</div>
      );

      const result = buildWidgetMap(layout, instances, {
        fallbackComponent: FallbackComponent,
      });

      expect(result.widget1).toBeDefined();
    });
  });

  describe("buildWidgetMapFromLayoutId", () => {
    it("should build widget map from static layout ID", async () => {
      const instances = {
        team_stats: {
          type: "team_stats",
          props: { teamId: "bvb" },
        },
      };

      const mockLayouts = {
        test_layout: {
          xl: [{ i: "team_stats", x: 0, y: 0, w: 2, h: 2 }],
        },
      };

      const result = await buildWidgetMapFromLayoutId(
        "test_layout",
        instances,
        mockLayouts
      );

      expect(result).toBeDefined();
      expect(result?.team_stats).toBeDefined();
    });

    it("should return null for unknown layout ID", async () => {
      const instances = {};
      const mockLayouts = {
        test_layout: {
          xl: [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }],
        },
      };

      const consoleSpy = vi.spyOn(console, "warn");
      const result = await buildWidgetMapFromLayoutId(
        "unknown_layout",
        instances,
        mockLayouts
      );

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should fallback to lg layout if xl not available", async () => {
      const instances = {
        widget1: {
          type: "team_stats",
          props: {},
        },
      };

      const mockLayouts = {
        test_layout: {
          lg: [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }],
        },
      };

      const result = await buildWidgetMapFromLayoutId(
        "test_layout",
        instances,
        mockLayouts
      );

      expect(result).toBeDefined();
      expect(result?.widget1).toBeDefined();
    });

    it("should handle layouts with multiple breakpoints", async () => {
      const instances = {
        widget1: {
          type: "team_stats",
          props: {},
        },
      };

      const mockLayouts = {
        test_layout: {
          xl: [{ i: "widget1", x: 0, y: 0, w: 2, h: 2 }],
          lg: [{ i: "widget1", x: 0, y: 0, w: 1, h: 2 }],
          md: [{ i: "widget1", x: 0, y: 0, w: 1, h: 3 }],
        },
      };

      const result = await buildWidgetMapFromLayoutId(
        "test_layout",
        instances,
        mockLayouts
      );

      // Should use xl layout as default
      expect(result).toBeDefined();
      expect(result?.widget1).toBeDefined();
    });
  });
});
