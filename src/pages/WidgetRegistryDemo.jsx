import React, { useState } from "react";
import { widgetRegistry, getCategories } from "@cms/registry/widgetRegistry";
import WidgetRenderer from "@cms/runtime/WidgetRenderer";

const WidgetRegistryDemo = () => {
  const categories = getCategories();
  const [selectedWidget, setSelectedWidget] = useState(null);

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px" }}
        >
          Widget Registry Demo
        </h1>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "24px" }}>
          Testing the CMS Phase 1 - Widget Registry & Renderer
        </p>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            Registry Stats
          </h2>
          <div style={{ display: "flex", gap: "24px" }}>
            <div>
              <strong>Total Widgets:</strong> {widgetRegistry.length}
            </div>
            <div>
              <strong>Categories:</strong> {categories.join(", ")}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            Registered Widgets with Props
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {widgetRegistry.map((widget) => (
              <li
                key={widget.id}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  backgroundColor: "white",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedWidget(widget)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{widget.name}</strong>
                    <span
                      style={{
                        marginLeft: "12px",
                        color: "#666",
                        fontSize: "14px",
                      }}
                    >
                      ({widget.id})
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {widget.category}
                    </span>
                  </div>
                </div>
                <div
                  style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}
                >
                  Default size: {widget.defaultSize.w}x{widget.defaultSize.h} | 
                  Props: {Object.keys(widget.props || {}).length}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {selectedWidget && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Selected Widget Props Schema
            </h2>
            <pre
              style={{
                backgroundColor: "white",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "12px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(selectedWidget.props, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div>
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}
        >
          Widget Renderer Demo
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              TeamStats Widget
            </h3>
            <WidgetRenderer
              type="team_stats"
              props={{ 
                teamId: "real-madrid", 
                teamName: "Real Madrid",
                wins: 25,
                draws: 6,
                losses: 7
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              LeagueTable Widget
            </h3>
            <WidgetRenderer
              type="league_table"
              props={{ 
                league: "La Liga", 
                season: "2023-24" 
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              Attendance Widget
            </h3>
            <WidgetRenderer
              type="attendance"
              props={{ 
                attendance: 65000,
                stadiumName: "Camp Nou",
                location: "Barcelona",
                title: "Match attendance"
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              TrainingPace Widget
            </h3>
            <WidgetRenderer
              type="training_pace"
              props={{ 
                title: "Player Training Pace",
                timeSlots: ["6:00", "10:00", "14:00", "18:00", "22:00"]
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              MatchResult Widget
            </h3>
            <WidgetRenderer
              type="match_result"
              props={{ 
                selectedStage: "final",
                title: "Champions League Final"
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              Calendar Widget
            </h3>
            <WidgetRenderer
              type="calendar"
              props={{ 
                currentView: "week",
                showTime: false,
                title: "Team Schedule"
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              Messages Widget
            </h3>
            <WidgetRenderer
              type="messages"
              props={{ 
                title: "Team Chat",
                maxMessages: 10,
                showDateSeparator: false
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              Unknown Widget (Error Test)
            </h3>
            <WidgetRenderer type="non_existent_widget" props={{}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetRegistryDemo;
