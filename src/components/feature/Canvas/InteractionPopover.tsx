import React, { useState } from "react";
import styles from "./InteractionPopover.module.scss";
import type { LogicFlow, LogicNode } from "../../../types";

interface InteractionPopoverProps {
  selId: string;
  tree: any;
  onUpdateLogic: (logic: LogicFlow) => void;
  onClose: () => void;
}

const TRIGGERS = [
  { id: "onClick", label: "On Click", icon: "👆" },
  { id: "onMouseEnter", label: "On Hover Enter", icon: "🎯" },
  { id: "onMouseLeave", label: "On Hover Leave", icon: "💨" },
  { id: "onChange", label: "On Change", icon: "✍️" },
  { id: "onMount", label: "On Mount", icon: "🌱" },
];

const ACTIONS = [
  { id: "navigate", label: "Navigate to Page", icon: "🔗", defaultData: { url: "/home" } },
  { id: "alert", label: "Show Alert", icon: "⚠️", defaultData: { message: "Hello!" } },
  { id: "setStyle", label: "Change Style", icon: "🎨", defaultData: { style: { opacity: 0.5 } } },
  { id: "setContent", label: "Update Text", icon: "📝", defaultData: { content: "New Content" } },
  { id: "setVar", label: "Set Variable", icon: "📤", defaultData: { varName: "myVar", value: "123" } },
];

const InteractionPopover: React.FC<InteractionPopoverProps> = ({ 
  selId, onUpdateLogic, onClose 
}) => {
  const [step, setStep] = useState<"trigger" | "action" | "config">("trigger");
  const [selectedTrigger, setSelectedTrigger] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const handleSelectTrigger = (id: string) => {
    setSelectedTrigger(id);
    setStep("action");
  };

  const handleSelectAction = (action: any) => {
    setSelectedAction(action);
    setStep("config");
  };

  const handleSave = () => {
    // Create a simple linear flow for the selected trigger
    const triggerNode: LogicNode = {
      id: `trigger-${Date.now()}`,
      type: "trigger",
      position: { x: 250, y: 100 },
      data: { label: "Start Flow", icon: "🚀" }
    };

    const actionNode: LogicNode = {
      id: `${selectedAction.id}-${Date.now()}`,
      type: selectedAction.id,
      position: { x: 250, y: 250 },
      data: { label: selectedAction.label, icon: selectedAction.icon, ...selectedAction.defaultData }
    };

    const flow: LogicFlow = {
      id: `${selId}-${selectedTrigger}`,
      nodes: [triggerNode, actionNode],
      edges: [{
        id: `e-${triggerNode.id}-${actionNode.id}`,
        source: triggerNode.id,
        target: actionNode.id
      }]
    };

    onUpdateLogic(flow);
    onClose();
  };

  return (
    <div className={styles.popover}>
      <header className={styles.header}>
        <h3>
          {step === "trigger" && "Select Trigger"}
          {step === "action" && "Select Action"}
          {step === "config" && "Configure Action"}
        </h3>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </header>

      <div className={styles.content}>
        {step === "trigger" && (
          <div className={styles.grid}>
            {TRIGGERS.map(t => (
              <button key={t.id} className={styles.item} onClick={() => handleSelectTrigger(t.id)}>
                <span className={styles.icon}>{t.icon}</span>
                <span className={styles.label}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === "action" && (
          <div className={styles.grid}>
            {ACTIONS.map(a => (
              <button key={a.id} className={styles.item} onClick={() => handleSelectAction(a)}>
                <span className={styles.icon}>{a.icon}</span>
                <span className={styles.label}>{a.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === "config" && (
          <div className={styles.config}>
            <div className={styles.actionSummary}>
              <span className={styles.summaryIcon}>{selectedAction.icon}</span>
              <span className={styles.summaryLabel}>{selectedAction.label}</span>
            </div>
            
            <div className={styles.fields}>
              <p>When <strong>{selectedTrigger}</strong> occurs, <strong>{selectedAction.label}</strong> will run.</p>
              {/* Dynamic fields based on action type would go here */}
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>Add Interaction</button>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        {step !== "trigger" && (
          <button className={styles.backBtn} onClick={() => setStep(step === "config" ? "action" : "trigger")}>
            ← Back
          </button>
        )}
      </footer>
    </div>
  );
};

export default InteractionPopover;
