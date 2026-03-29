import React, { useState } from "react";
import styles from "./LogicView.module.scss";
import LogicCanvas from "./LogicCanvas";

interface LogicViewProps {
  canvas: any;
  onDropInto: any;
  onMove: any;
  leftTab: "comps" | "layers" | "library";
  setLeftTab: (tab: "comps" | "layers" | "library") => void;
  libExpanded: Record<string, boolean>;
  setLibExpanded: (expanded: Record<string, boolean>) => void;
  preview: boolean;
  grid: boolean;
  cdId: string | null;
  setCdId: (id: string | null) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  ghostType: string | null;
  setGhostType: (type: string | null) => void;
  ghostPos: { x: number; y: number } | null;
  setGhostPos: (pos: { x: number; y: number } | null) => void;
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
}

const LogicView: React.FC<LogicViewProps> = ({ 
  canvas
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string>("onClick");

  return (
    <div className={styles.container}>
      <div className={styles.workflowHeader}>
        <div className={styles.workflowTitle}>
          <span className={styles.wfIcon}>⚡</span>
          <h2>Workflow Editor</h2>
          <span className={styles.wfNode}>{canvas.selId ? `Editing: ${canvas.selId}` : "Select a component to view logic"}</span>
        </div>
        
        {canvas.selId && (
          <div className={styles.eventTabs}>
            {["onClick", "onMouseEnter", "onMouseLeave", "onChange", "onMount"].map(ev => (
              <button 
                key={ev}
                className={`${styles.evTab} ${selectedEvent === ev ? styles.evActive : ""}`}
                onClick={() => setSelectedEvent(ev)}
              >
                {ev}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.workflowArea}>
        {canvas.selId ? (
          <LogicCanvas 
            selId={canvas.selId} 
            tree={canvas.tree} 
            eventType={selectedEvent}
            onUpdateLogic={(flow: any) => canvas.updateLogic(canvas.selId, selectedEvent, flow)}
          />
        ) : (
          <div className={styles.noSelection}>
            <div className={styles.emptyIcon}>🧬</div>
            <h3>Workflow Map</h3>
            <p>Select a component in the design tab to view and edit its entire logic workflow here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogicView;
