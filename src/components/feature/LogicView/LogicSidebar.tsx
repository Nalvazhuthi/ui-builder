import React from "react";
import styles from "./LogicSidebar.module.scss";
import { find } from "../../../utils/treeUtils";

interface LogicSidebarProps {
  selId: string | null;
  tree: any;
  selectedEvent: string;
  setSelectedEvent: (event: string) => void;
  onUpdateVariables: (vars: any[]) => void;
  onSelect: (id: string) => void;
  logicMode: "simple" | "advanced";
  setLogicMode: (mode: "simple" | "advanced") => void;
}

const EVENT_TYPES = [
  { id: "onClick", label: "On Click", icon: "👆" },
  { id: "onMouseEnter", label: "On Hover Enter", icon: "🎯" },
  { id: "onMouseLeave", label: "On Hover Leave", icon: "💨" },
  { id: "onChange", label: "On Change", icon: "✍️" },
  { id: "onMount", label: "On Mount", icon: "🌱" },
];

const NODE_LIBRARY = {
  Triggers: [
    { type: "trigger", label: "Start", icon: "🚀", color: "#7c5cfc" },
    { type: "timer", label: "Timer", icon: "⏰", color: "#7c5cfc" },
  ],
  Actions: [
    { type: "setStyle", label: "Set Styles", icon: "🎨", color: "#00d1ff" },
    { type: "setContent", label: "Set Content", icon: "📝", color: "#00d1ff" },
    { type: "navigate", label: "Navigate", icon: "🔗", color: "#ff4d4d" },
    { type: "alert", label: "Show Alert", icon: "⚠️", color: "#ffbc00" },
    { type: "log", label: "Console Log", icon: "📜", color: "#aaa" },
  ],
  "Advanced Logic": [
    { type: "ifElse", label: "If / Else", icon: "⚖️", color: "#ff7c00" },
    { type: "delay", label: "Delay", icon: "⏳", color: "#ff7c00" },
    { type: "api", label: "API Call", icon: "🌐", color: "#7c5cfc" },
    { type: "js", label: "Custom JS", icon: "js", color: "#f7df1e" },
  ],
  Variables: [
    { type: "getVar", label: "Get Variable", icon: "📥", color: "#10b981" },
    { type: "setVar", label: "Set Variable", icon: "📤", color: "#10b981" },
  ]
};

const LogicSidebar: React.FC<LogicSidebarProps> = ({ 
  selId, tree, selectedEvent, setSelectedEvent, onUpdateVariables, onSelect, logicMode, setLogicMode
}) => {
  const [tab, setTab] = React.useState<"logic" | "layers">("logic");
  const node = selId ? find(tree, selId) : null;
  const variables = node?.variables || [];

  const onDragStart = (e: React.DragEvent, nodeType: string, label: string, icon: string) => {
    e.dataTransfer.setData("application/reactflow", JSON.stringify({ type: nodeType, label, icon }));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTabs}>
        <button 
          className={`${styles.sidebarTab} ${tab === "logic" ? styles.sidebarTabActive : ""}`}
          onClick={() => setTab("logic")}
        >Logic</button>
        <button 
          className={`${styles.sidebarTab} ${tab === "layers" ? styles.sidebarTabActive : ""}`}
          onClick={() => setTab("layers")}
        >Layers</button>
      </div>

      {tab === "logic" ? (
        <>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h3>Logic Settings</h3>
              <div className={styles.modeToggle}>
                <button 
                  className={`${styles.modeBtn} ${logicMode === "simple" ? styles.modeBtnActive : ""}`}
                  onClick={() => setLogicMode("simple")}
                >Simple</button>
                <button 
                  className={`${styles.modeBtn} ${logicMode === "advanced" ? styles.modeBtnActive : ""}`}
                  onClick={() => setLogicMode("advanced")}
                >Advanced</button>
              </div>
            </div>
            {node && <p className={styles.nodeName}>Editing: {node.name}</p>}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Event Trigger</div>
            <div className={styles.eventList}>
              {EVENT_TYPES.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev.id)}
                  className={`${styles.eventItem} ${selectedEvent === ev.id ? styles.eventActive : ""}`}
                >
                  <span className={styles.eventIcon}>{ev.icon}</span>
                  <span className={styles.eventLabel}>{ev.label}</span>
                  {node?.logic?.[ev.id] && <span className={styles.hasLogic}>●</span>}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Variables</div>
            <div className={styles.variablesList}>
              {variables.map((v: any, idx: number) => (
                <div key={v.id || idx} className={styles.variableItem}>
                  <span className={styles.varLabel}>{v.name}</span>
                  <span className={styles.varValue}>{v.defaultValue}</span>
                  <button 
                    className={styles.delVar} 
                    onClick={() => onUpdateVariables(variables.filter((_: any, i: number) => i !== idx))}
                  >×</button>
                </div>
              ))}
              <button 
                className={styles.addVarBtn}
                onClick={() => {
                  const name = prompt("Variable Name:");
                  if (name) onUpdateVariables([...variables, { id: `var-${Date.now()}`, name, type: "any", defaultValue: "" }]);
                }}
              >+ Add Variable</button>
            </div>
          </div>

          {logicMode === "advanced" && (
            <>
              <div className={styles.divider} />

              <div className={`${styles.library} custom-scroll`}>
                <div className={styles.sectionTitle}>Node Library</div>
                <p className={styles.hint}>Drag nodes onto the canvas</p>
                
                {Object.entries(NODE_LIBRARY).map(([cat, nodes]) => (
                  <div key={cat} className={styles.category}>
                    <div className={styles.categoryTitle}>{cat}</div>
                    <div className={styles.nodeGrid}>
                      {nodes.map(n => (
                        <div
                          key={n.type}
                          className={styles.draggableNode}
                          draggable
                          onDragStart={(e) => onDragStart(e, n.type, n.label, n.icon)}
                        >
                          <div className={styles.nodeIcon} style={{ background: `${n.color}22`, color: n.color }}>
                            {n.icon}
                          </div>
                          <span className={styles.nodeLabel}>{n.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className={`${styles.layersList} custom-scroll`}>
          <div className={styles.header}>
            <h3>Layers</h3>
            <p className={styles.hint}>Select a component to edit logic</p>
          </div>
          <div className={styles.layerTree}>
            {renderLayerTree(tree.children, 0, selId, onSelect)}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to render a simple layer tree for selection
const renderLayerTree = (nodes: any[], depth: number, selId: string | null, onSelect: (id: string) => void): React.ReactNode => {
  return nodes.map(n => (
    <React.Fragment key={n.id}>
      <div 
        className={`${styles.layerItem} ${selId === n.id ? styles.layerActive : ""}`}
        style={{ paddingLeft: 16 + depth * 16 }}
        onClick={() => onSelect(n.id)}
      >
        <span className={styles.layerIcon}>◇</span>
        <span className={styles.layerLabel}>{n.name}</span>
      </div>
      {n.children && renderLayerTree(n.children, depth + 1, selId, onSelect)}
    </React.Fragment>
  ));
};

export default LogicSidebar;
