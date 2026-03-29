import React from "react";
import styles from "./SimpleLogicEditor.module.scss";
import { find } from "../../../utils/treeUtils";
import type { LogicFlow, LogicNode } from "../../../types";

interface SimpleLogicEditorProps {
  selId: string;
  tree: any;
  eventType: string;
  onUpdateLogic: (flow: LogicFlow) => void;
  onSwitchToAdvanced: () => void;
}

const ACTION_TEMPLATES = [
  { type: "navigate", label: "Navigate to Page", icon: "🔗", defaultData: { url: "/home" } },
  { type: "alert", label: "Show Alert", icon: "⚠️", defaultData: { message: "Hello!" } },
  { type: "setStyle", label: "Change Style", icon: "🎨", defaultData: { style: { opacity: 0.5 } } },
  { type: "setContent", label: "Update Text", icon: "📝", defaultData: { content: "New Content" } },
  { type: "setVar", label: "Set Variable", icon: "📤", defaultData: { varName: "myVar", value: "123" } },
];

const SimpleLogicEditor: React.FC<SimpleLogicEditorProps> = ({ 
  selId, tree, eventType, onUpdateLogic, onSwitchToAdvanced 
}) => {
  const node = find(tree, selId);
  const flow = node?.logic?.[eventType] || { id: `${selId}-${eventType}`, nodes: [], edges: [] };
  
  // Ensure we have a trigger node
  React.useEffect(() => {
    if (flow.nodes.length === 0) {
      onUpdateLogic({
        id: `${selId}-${eventType}`,
        nodes: [{
          id: `trigger-${Date.now()}`,
          type: "trigger",
          position: { x: 250, y: 100 },
          data: { label: "Start Flow", icon: "🚀" }
        }],
        edges: []
      });
    }
  }, [flow.nodes.length, selId, eventType, onUpdateLogic]);

  // Linear check: Start -> Node1 -> Node2 ...
  const isLinear = React.useMemo(() => {
    if (flow.nodes.length === 0) return true;
    if (flow.nodes.length === 1 && flow.nodes[0].type === "trigger") return true;
    
    // Check if there are any branches or cycles (simplified)
    const trigger = flow.nodes.find((n: any) => n.type === "trigger");
    if (!trigger) return false;
    
    // Very basic check for now: each node has at most one outgoing edge
    const edgeCount: Record<string, number> = {};
    flow.edges.forEach((e: any) => {
      edgeCount[e.source] = (edgeCount[e.source] || 0) + 1;
    });
    
    return Object.values(edgeCount).every(count => count <= 1);
  }, [flow]);

  const addAction = (template: typeof ACTION_TEMPLATES[0]) => {
    const lastNode = flow.nodes.length > 0 ? flow.nodes[flow.nodes.length - 1] : null;
    const newNodeId = `${template.type}-${Date.now()}`;
    
    const newNode: LogicNode = {
      id: newNodeId,
      type: template.type,
      position: { x: 250, y: (flow.nodes.length * 150) + 100 },
      data: { label: template.label, icon: template.icon, ...template.defaultData }
    };
    
    const newEdges = [...(flow.edges || [])];
    if (lastNode) {
      newEdges.push({
        id: `e-${lastNode.id}-${newNodeId}`,
        source: lastNode.id,
        target: newNodeId
      });
    }
    
    onUpdateLogic({
      id: flow.id || `${selId}-${eventType}`,
      nodes: [...flow.nodes, newNode],
      edges: newEdges
    });
  };

  const removeAction = (id: string) => {
    const newNodes = flow.nodes.filter((n: any) => n.id !== id);
    const newEdges = flow.edges.filter((e: any) => e.source !== id && e.target !== id);
    
    // Re-link if we removed a node in the middle
    // (Simplified: just clear edges and link sequentially for now if we want to keep it linear)
    onUpdateLogic({ 
      id: flow.id || `${selId}-${eventType}`,
      nodes: newNodes, 
      edges: newEdges 
    });
  };

  if (!isLinear) {
    return (
      <div className={styles.container}>
        <div className={styles.complexMsg}>
          <div className={styles.icon}>⚡</div>
          <h3>Complex Logic Detected</h3>
          <p>This interaction contains branching or advanced logic that cannot be edited in Simple Mode.</p>
          <button className={styles.switchBtn} onClick={onSwitchToAdvanced}>
            Open Advanced Editor
          </button>
        </div>
      </div>
    );
  }

  const actions = flow.nodes.filter((n: any) => n.type !== "trigger");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Interaction Flow</h2>
        <p>Define what happens when <strong>{eventType}</strong> occurs.</p>
      </div>

      <div className={styles.flowList}>
        <div className={styles.triggerNode}>
          <span className={styles.nodeIcon}>🚀</span>
          <span className={styles.nodeLabel}>{eventType} Trigger</span>
        </div>

        {actions.map((n: any) => (
          <React.Fragment key={n.id}>
            <div className={styles.arrow}>↓</div>
            <div className={styles.actionNode}>
              <div className={styles.actionMain}>
                <span className={styles.nodeIcon}>{n.data.icon}</span>
                <div className={styles.nodeInfo}>
                  <span className={styles.nodeLabel}>{n.data.label}</span>
                  <div className={styles.nodeData}>
                    {n.type === "navigate" && <span>Target: {n.data.url}</span>}
                    {n.type === "alert" && <span>Message: {n.data.message}</span>}
                    {n.type === "setVar" && <span>{n.data.varName} = {n.data.value}</span>}
                  </div>
                </div>
              </div>
              <button className={styles.removeBtn} onClick={() => removeAction(n.id)}>×</button>
            </div>
          </React.Fragment>
        ))}

        <div className={styles.addSection}>
          <div className={styles.arrow}>↓</div>
          <div className={styles.templateGrid}>
            {ACTION_TEMPLATES.map(t => (
              <button key={t.type} className={t.type === 'navigate' ? styles.primaryTemplate : styles.templateBtn} onClick={() => addAction(t)}>
                <span className={styles.templateIcon}>{t.icon}</span>
                <span className={styles.templateLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogicEditor;
