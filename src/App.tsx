import React, { useState, useEffect } from "react";
import styles from "./App.module.scss";

// Types & Constants
import type { AppNode } from "./types";

// Hooks & Utils
import { useCanvas } from "./hooks/useCanvas";
import { META } from "./constants/metadata";

// Components
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import Inspector from "./components/feature/Inspector";
import Canvas from "./components/feature/Canvas";
import CodePanel from "./components/feature/CodePanel";
import ExportModal from "./components/feature/ExportModal";
import ThreeDView from "./components/feature/ThreeDView";

import LogicView from "./components/feature/LogicView/LogicView";
import CodeView from "./components/feature/CodeView/CodeView";
import PreviewView from "./components/feature/PreviewView/PreviewView";
import Button from "./components/ui/Button/Button";

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
    minHeight: "100%", 
    padding: "0px", 
    backgroundColor: "#ffffff",
    gap: "0px"
  },
  children: []
};

const App: React.FC = () => {
  const canvas = useCanvas(initialTree);
  
  // UI State
  const [viewMode, setViewMode] = useState<"design" | "logic" | "code" | "preview">("design");
  const [tab, setTab] = useState<"2d" | "3d">("2d");
  const [leftTab, setLeftTab] = useState<"comps" | "layers" | "library">("comps");
  const [rightPanel, setRightPanel] = useState<"insp" | "code">("insp");
  const [preview, setPreview] = useState(false);
  const [grid, setGrid] = useState(true);
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
      if (e.key === "g" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        canvas.groupNodes();
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        const isEdit = document.activeElement?.tagName === "INPUT" || 
                       document.activeElement?.tagName === "TEXTAREA" ||
                       (document.activeElement as HTMLElement)?.isContentEditable;
        if (canvas.selId && !isEdit) {
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
  const onDropInto = canvas.onDropInto;
  const onMove = canvas.onMove;

  const renderContent = () => {
    switch (viewMode) {
      case "logic": return (
        <div className={styles.main}>
          <LogicView 
            canvas={canvas} 
            onDropInto={onDropInto}
            onMove={onMove}
            leftTab={leftTab}
            setLeftTab={setLeftTab}
            libExpanded={libExpanded}
            setLibExpanded={setLibExpanded}
            preview={preview}
            grid={grid}
            cdId={cdId}
            setCdId={setCdId}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
            ghostType={ghostType}
            setGhostType={setGhostType}
            ghostPos={ghostPos}
            setGhostPos={setGhostPos}
            dragging={dragging}
            setDragging={setDragging}
          />
        </div>
      );
      case "code": return <CodeView tree={canvas.tree} onUpdateTree={canvas.setTree} />;
      case "preview": return <PreviewView tree={canvas.tree} />;
      case "design":
      default:
        return (
          <div className={styles.main}>
            {!preview && (
              <Sidebar 
                leftTab={leftTab} setLeftTab={setLeftTab}
                libExpanded={libExpanded} setLibExpanded={setLibExpanded}
                tree={canvas.tree}
                selIds={canvas.selIds}
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
                onGroup={canvas.groupNodes}
              />
            )}

            <div className={styles.canvasArea}>
              {tab === "3d" ? (
                <ThreeDView />
              ) : (
                <Canvas 
                  tree={canvas.tree}
                  selIds={canvas.selIds}
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
                  grid={grid}
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
                  <span style={{ color: META[ghostType]?.color || '#fff' }}>{META[ghostType]?.icon || "❖"}</span>
                  <span>{META[ghostType]?.label || ghostType}</span>
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
                      selIds={canvas.selIds}
                      tree={canvas.tree}
                      onStyle={canvas.updateStyle}
                      onContent={canvas.updateContent}
                      onRename={canvas.renameNode}
                      onReset={(id) => canvas.resetStyles(id, initialTree.style)}
                      onUpdateLogic={canvas.updateLogic}
                    />
                  ) : (
                    <CodePanel tree={canvas.tree} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.topHeader}>
        <div className={styles.logo}>UI Forge</div>
        <nav className={styles.viewTabs}>
          {[
            { id: "design", label: "Design", icon: "🎨" },
            { id: "logic", label: "Logic", icon: "⚡" },
            { id: "code", label: "Code", icon: "⚛️" },
            { id: "preview", label: "Preview", icon: "👁" },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id as any)}
              className={`${styles.viewTab} ${viewMode === v.id ? styles.viewTabActive : ""}`}
            >
              <span className={styles.tabIcon}>{v.icon}</span>
              {v.label}
            </button>
          ))}
        </nav>
        <div className={styles.headerRight}>
          <Button variant="tb" size="sm" onClick={() => setShowExport(true)}>Export</Button>
        </div>
      </header>

      {viewMode === "design" && (
        <Navbar 
          tab={tab} setTab={setTab}
          breakpoint={canvas.breakpoint} setBreakpoint={canvas.setBreakpoint}
          zoom={canvas.zoom}
          preview={preview} setPreview={setPreview}
          grid={grid} setGrid={setGrid}
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

      {renderContent()}

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