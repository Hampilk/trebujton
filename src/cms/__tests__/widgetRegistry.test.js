import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  widgetRegistry,
  getWidgetById,
  getWidgetsByCategory,
  getCategories,
} from "../registry/widgetRegistry";

describe("Widget Registry", () => {
  beforeEach(() => {
    // Clear console mocks before each test
    vi.clearAllMocks();
  });

  it("should have widgets registered", () => {
    expect(widgetRegistry).toBeDefined();
    expect(Array.isArray(widgetRegistry)).toBe(true);
    expect(widgetRegistry.length).toBeGreaterThan(0);
  });

  it("should have TeamStats widget", () => {
    const teamStats = getWidgetById("team_stats");
    expect(teamStats).toBeDefined();
    expect(teamStats?.name).toBe("Team Statistics");
    expect(teamStats?.category).toBe("Football");
  });

  it("should have LeagueTable widget", () => {
    const leagueTable = getWidgetById("league_table");
    expect(leagueTable).toBeDefined();
    expect(leagueTable?.name).toBe("League Table");
    expect(leagueTable?.category).toBe("Football");
  });

  it("should have newly added widgets with meta", () => {
    const accountSettings = getWidgetById("account_settings");
    expect(accountSettings).toBeDefined();
    expect(accountSettings?.name).toBe("Account Settings");
    expect(accountSettings?.category).toBe("User");

    const activeActionsChart = getWidgetById("active_actions_chart");
    expect(activeActionsChart).toBeDefined();
    expect(activeActionsChart?.name).toBe("Active Actions Chart");

    const brandProducts = getWidgetById("brand_products");
    expect(brandProducts).toBeDefined();
    expect(brandProducts?.name).toBe("Brand Products");
    expect(brandProducts?.category).toBe("Shop");
  });

  it("should get widgets by category", () => {
    const footballWidgets = getWidgetsByCategory("Football");
    expect(footballWidgets.length).toBeGreaterThan(0);

    const teamStats = footballWidgets.find((w) => w.id === "team_stats");
    const leagueTable = footballWidgets.find((w) => w.id === "league_table");

    expect(teamStats).toBeDefined();
    expect(leagueTable).toBeDefined();
  });

  it("should get all categories", () => {
    const categories = getCategories();
    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories).toContain("Football");
    // Should also have newly added categories
    expect(categories).toContain("User");
    expect(categories).toContain("Shop");
  });

  it("should return undefined for unknown widget id", () => {
    const unknown = getWidgetById("non_existent_widget");
    expect(unknown).toBeUndefined();
  });

  it("widgets should have required fields", () => {
    widgetRegistry.forEach((widget) => {
      expect(widget.id).toBeDefined();
      expect(widget.name).toBeDefined();
      expect(widget.category).toBeDefined();
      expect(widget.defaultSize).toBeDefined();
      expect(widget.defaultSize.w).toBeDefined();
      expect(widget.defaultSize.h).toBeDefined();
      expect(widget.props).toBeDefined();
      expect(widget.Component).toBeDefined();
      expect(typeof widget.Component).toBe("function");
    });
  });

  describe("Metadata validation", () => {
    it("all widgets should have valid meta blocks", () => {
      widgetRegistry.forEach((widget) => {
        expect(widget.meta).toBeDefined();
        expect(widget.meta.id).toBe(widget.id);
        expect(widget.meta.name).toBe(widget.name);
        expect(widget.meta.category).toBe(widget.category);
      });
    });

    it("widgets should have defaultSize in meta", () => {
      widgetRegistry.forEach((widget) => {
        expect(widget.meta.defaultSize).toBeDefined();
        expect(widget.meta.defaultSize.w).toBeGreaterThan(0);
        expect(widget.meta.defaultSize.h).toBeGreaterThan(0);
      });
    });

    it("widgets should have props definition", () => {
      widgetRegistry.forEach((widget) => {
        expect(widget.meta.props).toBeDefined();
        // Props can be empty but should be an object
        expect(typeof widget.meta.props).toBe("object");
      });
    });
  });

  describe("Static fallback rendering", () => {
    it("should gracefully handle missing widgets in rendering", () => {
      // This test verifies that the registry doesn't break when
      // a widget is referenced but not found
      const missingWidget = getWidgetById("definitely_does_not_exist");
      expect(missingWidget).toBeUndefined();
    });

    it("should support multiple widget categories", () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThan(0);
      // Verify each category has at least one widget
      categories.forEach((category) => {
        const widgets = getWidgetsByCategory(category);
        expect(widgets.length).toBeGreaterThan(0);
      });
    });
  });
});
