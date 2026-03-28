import React, { useState, useEffect } from "react";
import styles from "./App.module.scss";

// Types & Constants
import type { AppNode } from "./types";

// Hooks & Utils
import { useCanvas } from "./hooks/useCanvas";
import { mkNode, ins, insBefore, insAfter, del, find, ids } from "./utils/treeUtils";

// Components
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import Inspector from "./components/feature/Inspector";
import Canvas from "./components/feature/Canvas";
import CodePanel from "./components/feature/CodePanel";
import ExportModal from "./components/feature/ExportModal";
import ThreeDView from "./components/feature/ThreeDView";

const initialTree: AppNode = {
  id: "root",
  type: "root",
  name: "Root",
  content: "",
  locked: false,
  hidden: false,
  style: { 
    display: "flex", 
    flexDirection: "column", 
    height: "100%", 
    padding: "0px", 
    backgroundColor: "#ffffff",
    gap: "20px"
  },
  children: []
};

const App: React.FC = () => {
  const canvas = useCanvas(initialTree);
  
  // UI State
  const [tab, setTab] = useState<"2d" | "3d">("2d");
  const [leftTab, setLeftTab] = useState<"comps" | "layers" | "library">("comps");
  const [rightPanel, setRightPanel] = useState<"insp" | "code">("insp");
  const [preview, setPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [libExpanded, setLibExpanded] = useState<Record<string, boolean>>({
    "Structure": true, "Basic": true, "Forms": true
  });

  // Drag & Drop State
  const [ghostType, setGhostType] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number, y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cdId, setCdId] = useState<string | null>(null);

  // Global Key Handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        if (e.shiftKey) canvas.redo();
        else canvas.undo();
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        if (canvas.selId && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          canvas.deleteNode(canvas.selId);
        }
      }
      if (e.key === "Escape") {
        canvas.setSelId(null);
        canvas.setEditId(null);
        setGhostType(null);
        setDragging(false);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [canvas]);

  // Panning Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.altKey || e.button === 1) {
      canvas.setPanning(true);
      canvas.setPanStart({ x: e.clientX - canvas.panX, y: e.clientY - canvas.panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvas.panning && canvas.panStart) {
      canvas.setPanX(e.clientX - canvas.panStart.x);
      canvas.setPanY(e.clientY - canvas.panStart.y);
    }
    if (dragging) {
      setGhostPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    canvas.setPanning(false);
    canvas.setPanStart(null);
  };

  // Node Actions
  const onDropInto = (compType: string, targetId: string, position: "before" | "inside" | "after") => {
    const newNode = mkNode(compType);
    if (position === "inside") {
      canvas.push(ins(canvas.tree, targetId, newNode));
    } else if (position === "before") {
      canvas.push(insBefore(canvas.tree, targetId, newNode));
    } else {
      canvas.push(insAfter(canvas.tree, targetId, newNode));
    }
    canvas.setSelId(newNode.id);
  };

  const onMove = (srcId: string, targetId: string, position: "before" | "inside" | "after") => {
    if (srcId === targetId) return;
    const srcNode = find(canvas.tree, srcId);
    if (!srcNode) return;
    if (ids(srcNode).includes(targetId)) return;
    
    let next = del(canvas.tree, srcId);
    if (position === "inside") {
      next = ins(next, targetId, srcNode);
    } else if (position === "before") {
      next = insBefore(next, targetId, srcNode);
    } else {
      next = insAfter(next, targetId, srcNode);
    }
    canvas.push(next);
  };

  return (
    <div className={styles.app}>
      {!preview && (
        <Navbar 
          tab={tab} setTab={setTab}
          breakpoint={canvas.breakpoint} setBreakpoint={canvas.setBreakpoint}
          zoom={canvas.zoom}
          preview={preview} setPreview={setPreview}
          undo={canvas.undo} redo={canvas.redo}
          canUndo={canvas.historyIndex > 0} 
          canRedo={canvas.historyIndex < canvas.history.length - 1}
          onSave={() => {
            const blob = new Blob([JSON.stringify(canvas.tree, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "uiforge-project.json"; a.click();
          }}
          onClear={() => { if (confirm("Clear canvas?")) canvas.push(initialTree); }}
          onExport={() => setShowExport(true)}
        />
      )}

      {preview && (
        <button 
          onClick={() => setPreview(false)}
          style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999, background: '#7c5cfc', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
        >
          <span style={{ fontSize: '18px' }}>✕</span> Exit Preview
        </button>
      )}

      <div className={styles.main}>
        {!preview && (
          <Sidebar 
            leftTab={leftTab} setLeftTab={setLeftTab}
            libExpanded={libExpanded} setLibExpanded={setLibExpanded}
            tree={canvas.tree}
            selId={canvas.selId}
            hovId={canvas.hovId}
            setHovId={canvas.setHovId}
            onSelect={canvas.setSelId}
            collapsed={canvas.collapsed}
            setCollapsed={(id) => canvas.setCollapsed({ ...canvas.collapsed, [id]: !canvas.collapsed[id] })}
            onDeleteNode={canvas.deleteNode}
            onDuplicateNode={canvas.duplicateNode}
            onToggleHide={canvas.toggleHide}
            onToggleLock={canvas.toggleLock}
            cdId={cdId} setCdId={setCdId}
            setTree={canvas.setTree}
            setGhostType={setGhostType}
            setDragging={setDragging}
            setGhostPos={setGhostPos}
            onCreateComponent={canvas.createComponent}
            onUseComponent={canvas.useComponent}
            onRename={canvas.renameNode}
          />
        )}

        <div className={styles.canvasArea}>
          {tab === "3d" ? (
            <ThreeDView />
          ) : (
            <Canvas 
              tree={canvas.tree}
              selId={canvas.selId}
              hovId={canvas.hovId}
              setHovId={canvas.setHovId}
              onSel={canvas.setSelId}
              editId={canvas.editId}
              setEditId={canvas.setEditId}
              onContent={canvas.updateContent}
              onDropInto={onDropInto}
              onMove={onMove}
              onStyle={canvas.updateStyle}
              preview={preview}
              cdId={cdId} setCdId={setCdId}
              zoom={canvas.zoom}
              setZoom={canvas.setZoom}
              panX={canvas.panX}
              panY={canvas.panY}
              panning={canvas.panning}
              isResizing={canvas.isResizing}
              setIsResizing={canvas.setIsResizing}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              breakpoint={canvas.breakpoint}
            />
          )}

          {/* Ghost for DND */}
          {dragging && ghostType && ghostPos && (
            <div 
              className={styles.ghost}
              style={{ left: ghostPos.x, top: ghostPos.y }}
            >
              {ghostType}
            </div>
          )}
        </div>

        {!preview && (
          <div className={styles.rightPanel}>
            <div className={styles.rightTabs}>
              {[["insp", "Inspector"], ["code", "Code"]].map(([p, l]) => (
                <button
                  key={p}
                  onClick={() => setRightPanel(p as any)}
                  className={`${styles.rightTab} ${rightPanel === p ? styles.rightTabActive : ""}`}
                >
                  {l}
                </button>
              ))}
            </div>
            
            <div className={styles.rightContent}>
              {rightPanel === "insp" ? (
                <Inspector 
                  node={find(canvas.tree, canvas.selId || "")}
                  onStyle={canvas.updateStyle}
                  onContent={canvas.updateContent}
                  onRename={canvas.renameNode}
                  onReset={(id) => canvas.resetStyles(id, initialTree.style)}
                />
              ) : (
                <CodePanel tree={canvas.tree} />
              )}
            </div>
          </div>
        )}
      </div>

      {showExport && (
        <ExportModal 
          tree={canvas.tree}
          selId={canvas.selId}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default App;