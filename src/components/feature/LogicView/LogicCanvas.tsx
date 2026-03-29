import React, { useCallback, useEffect } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  SelectionMode,
  type OnConnect,
  ReactFlowProvider,
  useReactFlow
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import styles from "./LogicCanvas.module.scss";
import { find } from "../../../utils/treeUtils";
import type { LogicFlow, LogicNode, LogicEdge } from "../../../types";
import CustomNode from "./CustomNode";

const nodeTypes = {
  trigger: CustomNode,
  timer: CustomNode,
  setStyle: CustomNode,
  setContent: CustomNode,
  navigate: CustomNode,
  alert: CustomNode,
  log: CustomNode,
  ifElse: CustomNode,
  delay: CustomNode,
  api: CustomNode,
  js: CustomNode,
  getVar: CustomNode,
  setVar: CustomNode,
};

interface LogicCanvasProps {
  selId: string;
  tree: any;
  eventType: string;
  onUpdateLogic: (flow: LogicFlow) => void;
}

const LogicCanvasInner: React.FC<LogicCanvasProps> = ({ selId, tree, eventType, onUpdateLogic }) => {
  const node = find(tree, selId);
  const flow = node?.logic?.[eventType];

  const [nodes, setNodes, onNodesChange] = useNodesState<LogicNode>(flow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<LogicEdge>(flow?.edges || []);
  const { screenToFlowPosition } = useReactFlow();

  // Ref to track if the last update was internal (to avoid infinite loops)
  const lastSavedRef = React.useRef<string>("");

  // Load flow when eventType or selId changes, or when tree changes externally
  useEffect(() => {
    const currentFlow = find(tree, selId)?.logic?.[eventType];
    let incomingNodes = currentFlow?.nodes || [];
    let incomingEdges = currentFlow?.edges || [];
    
    // Automatically add a Start node if the flow is brand new/empty
    if (incomingNodes.length === 0) {
      incomingNodes = [{
        id: `trigger-${Date.now()}`,
        type: "trigger",
        position: { x: 250, y: 100 },
        data: { label: "Start Flow", icon: "🚀" }
      }];
    }
    
    // Create a signature to check for actual changes
    const signature = JSON.stringify({ nodes: incomingNodes, edges: incomingEdges });
    
    // Only update local state if the incoming data is actually different from what we last SAVED
    // This prevents the loop: internal change -> tree update -> re-render -> setNodes -> internal change...
    if (signature !== lastSavedRef.current) {
      setNodes(incomingNodes);
      setEdges(incomingEdges);
      lastSavedRef.current = signature;
    }
  }, [selId, eventType, tree, setNodes, setEdges]);

  // Save flow when nodes or edges change
  useEffect(() => {
    const signature = JSON.stringify({ nodes, edges });
    
    // Only trigger update if the signature is new
    if (signature !== lastSavedRef.current) {
      lastSavedRef.current = signature;
      onUpdateLogic({ id: `${selId}-${eventType}`, nodes, edges });
    }
  }, [nodes, edges, onUpdateLogic, selId, eventType]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const transfer = event.dataTransfer.getData("application/reactflow");
      if (!transfer) return;

      const { type: nodeType, label, icon } = JSON.parse(transfer);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: LogicNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { label, icon, value: "" },
      };

      setNodes((nds: LogicNode[]) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className={styles.canvasContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        selectionMode={SelectionMode.Partial}
        fitView
      >
        <Background gap={20} size={1} color="rgba(124, 92, 252, 0.15)" />
        <Controls />
        <MiniMap 
          nodeColor={(n) => (n.type === "trigger" ? "#7c5cfc" : "#1a1a2e")}
          maskColor="rgba(0,0,0,0.5)"
          style={{ background: "#12121e", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}
        />
      </ReactFlow>
    </div>
  );
};

const LogicCanvas: React.FC<LogicCanvasProps> = (props) => (
  <ReactFlowProvider>
    <LogicCanvasInner {...props} />
  </ReactFlowProvider>
);

export default LogicCanvas;
