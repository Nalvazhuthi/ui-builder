import React, { useState } from "react";
import styles from "./LogicInspector.module.scss";
import Section from "../../ui/Section/Section";
import type { AppNode, LogicFlow, LogicNode } from "../../../types";

interface LogicInspectorProps {
  node: AppNode;
  onUpdateLogic: (eventType: string, logic: any) => void;
}

const EVENTS = [
  { id: "onClick", label: "On Click", icon: "👆" },
  { id: "onMouseEnter", label: "On Hover Enter", icon: "🎯" },
  { id: "onMouseLeave", label: "On Hover Leave", icon: "💨" },
  { id: "onChange", label: "On Change", icon: "✍️" },
  { id: "onMount", label: "On Mount", icon: "🌱" },
];

const ACTIONS = [
  { id: "navigate", label: "Navigate", icon: "🔗", defaultData: { url: "/home" } },
  { id: "alert", label: "Show Alert", icon: "⚠️", defaultData: { message: "Hello!" } },
  { id: "setStyle", label: "Change Style", icon: "🎨", defaultData: { style: { opacity: 0.5 } } },
  { id: "setContent", label: "Update Text", icon: "📝", defaultData: { content: "New Content" } },
  { id: "setVar", label: "Set Variable", icon: "📤", defaultData: { varName: "myVar", value: "123" } },
];

const LogicInspector: React.FC<LogicInspectorProps> = ({ node, onUpdateLogic }) => {
  const [selectedEvent, setSelectedEvent] = useState("onClick");

  const interactions = node.logic || {};
  const currentFlow = interactions[selectedEvent] as LogicFlow | undefined;

  const handleAddInteraction = (actionType: string) => {
    const action = ACTIONS.find(a => a.id === actionType);
    if (!action) return;

    const triggerNode: LogicNode = {
      id: `trigger-${Date.now()}`,
      type: "trigger",
      position: { x: 250, y: 100 },
      data: { label: "Start", icon: "🚀" }
    };

    const actionNode: LogicNode = {
      id: `${action.id}-${Date.now()}`,
      type: action.id,
      position: { x: 250, y: 250 },
      data: { label: action.label, icon: action.icon, ...action.defaultData }
    };

    const newFlow: LogicFlow = {
      id: `${node.id}-${selectedEvent}`,
      nodes: [triggerNode, actionNode],
      edges: [{
        id: `e-${triggerNode.id}-${actionNode.id}`,
        source: triggerNode.id,
        target: actionNode.id
      }]
    };

    onUpdateLogic(selectedEvent, newFlow);
  };

  const handleRemoveInteraction = () => {
    onUpdateLogic(selectedEvent, null);
  };

  return (
    <div className={styles.container}>
      <Section label="Event Trigger" open={true} onToggle={() => {}}>
        <div className={styles.eventGrid}>
          {EVENTS.map(ev => (
            <button 
              key={ev.id}
              className={`${styles.eventBtn} ${selectedEvent === ev.id ? styles.eventActive : ""} ${interactions[ev.id] ? styles.hasLogic : ""}`}
              onClick={() => setSelectedEvent(ev.id)}
            >
              <span className={styles.evIcon}>{ev.icon}</span>
              <span className={styles.evLabel}>{ev.label}</span>
              {interactions[ev.id] && <span className={styles.dot}>●</span>}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Action Configuration" open={true} onToggle={() => {}}>
        {currentFlow ? (
          <div className={styles.actionCard}>
            <div className={styles.cardHeader}>
              <span className={styles.actionIcon}>{currentFlow.nodes[1]?.data.icon || "⚙️"}</span>
              <div className={styles.actionMeta}>
                <strong>{currentFlow.nodes[1]?.data.label || "Action"}</strong>
                <span>Run when {selectedEvent} fires</span>
              </div>
              <button className={styles.removeBtn} onClick={handleRemoveInteraction}>×</button>
            </div>
            
            <div className={styles.cardContent}>
              <p className={styles.hint}>This interaction is also visible in the full Workflow Editor.</p>
              {/* Common fields could go here */}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No actions defined for <strong>{selectedEvent}</strong></p>
            <div className={styles.quickAdd}>
              <span>Quick Add:</span>
              <div className={styles.actionGrid}>
                {ACTIONS.map(a => (
                  <button key={a.id} onClick={() => handleAddInteraction(a.id)} title={a.label}>
                    {a.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      <div className={styles.workflowLink}>
        <p>Need complex branching or logic?</p>
        <button disabled className={styles.linkBtn}>Open in Logic Workflow Editor →</button>
      </div>
    </div>
  );
};

export default LogicInspector;
