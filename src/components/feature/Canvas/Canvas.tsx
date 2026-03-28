import React, { useRef } from "react";
import styles from "./Canvas.module.scss";
import type { AppNode, Breakpoint } from "../../../types";
import CNode from "./CNode";
import SelectionOverlay from "./SelectionOverlay";
import { find, getParentId } from "../../../utils/treeUtils";

interface CanvasProps {
  tree: AppNode;
  selId: string | null;
  hovId: string | null;
  setHovId: (id: string | null) => void;
  onSel: (id: string | null) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
  onContent: (id: string, content: string) => void;
  onDropInto: (compType: string, targetId: string, position: "before" | "inside" | "after") => void;
  onMove: (srcId: string, targetId: string, position: "before" | "inside" | "after") => void;
  onStyle: (id: string, style: any) => void;
  preview: boolean;
  grid: boolean;
  cdId: string | null;
  setCdId: (id: string | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
  panX: number;
  panY: number;
  panning: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  breakpoint: Breakpoint;
  isResizing: boolean;
  setIsResizing: (val: boolean) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  tree, selId, hovId, setHovId, onSel, editId, setEditId, onContent, 
  onDropInto, onMove, onStyle, preview, grid, cdId, setCdId, zoom, setZoom, panX, panY, panning, 
  onMouseDown, onMouseMove, onMouseUp, breakpoint, isResizing, setIsResizing
}) => {
  const canRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null); 
  const bpWidths: Record<Breakpoint, number> = { mobile: 375, tablet: 768, desktop: 1200, tv: 1440 };
  const currentWidth = bpWidths[breakpoint] || 1200;
  
  const [rootDrop, setRootDrop] = React.useState(false);

  // Auto-fit logic when breakpoint changes
  React.useEffect(() => {
    if (!canRef.current || preview) return;
    
    // Use a small timeout to ensure the container dimensions are ready
    const timer = setTimeout(() => {
      const containerWidth = canRef.current?.offsetWidth || 0;
      const padding = 120; // Ensure some breathing room
      const availableWidth = containerWidth - padding;
      
      if (currentWidth > availableWidth && availableWidth > 0) {
        const optimalZoom = Math.min(1, availableWidth / currentWidth);
        setZoom(Number(optimalZoom.toFixed(2)));
      } else {
        setZoom(1);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [breakpoint, preview, currentWidth, setZoom]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ct = e.dataTransfer.getData("componentType");
    if (ct) onDropInto(ct, "root", "inside");
    else if (cdId) onMove(cdId, "root", "inside");
  };

  return (
    <div 
      ref={canRef} 
      className={`${styles.container} ${panning ? styles.panning : ""}`}
      onMouseDown={onMouseDown} 
      onMouseMove={onMouseMove} 
      onMouseUp={onMouseUp}
      onClick={(e) => { 
        if (isResizing) return;
        const t = e.target as HTMLElement;
        const isOuter = t === e.currentTarget || t.classList.contains(styles.grid) || t.classList.contains(styles.frameContainer);
        
        if (isOuter) {
          onSel(null);
          setEditId(null);
        } else if (t.classList.contains(styles.canvasContent)) {
          onSel("root"); 
          setEditId(null); 
        }
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Grid Background */}
      {grid && (
        <div 
          className={styles.grid} 
          style={{ 
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`, 
            backgroundPosition: `${panX}px ${panY}px` 
          }} 
        />
      )}

      {/* Frame Container */}
      <div 
        className={`${styles.frameContainer} ${preview ? styles.previewContainer : ""}`}
        style={preview ? {} : { 
          transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})` 
        }}
      >
        <div 
          ref={frameRef}
          className={`${styles.frame} ${preview ? styles.previewMode : ""}`}
          style={{ width: currentWidth }}
        >
          {!preview && (
            <div className={styles.frameHeader}>
              <div className={styles.frameControls}>
                {["#ff5f57", "#ffbd2e", "#28c840"].map(c => (
                  <div key={c} className={styles.dot} style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className={styles.frameInfo}>
                {breakpoint} · {currentWidth}px · {Math.round(zoom * 100)}%
              </span>
            </div>
          )}
          
          <div 
            ref={contentRef}
            data-node-id="root"
            className={`${styles.canvasContent} custom-scroll`}
            style={(tree.style as any)}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setRootDrop(true); }}
            onDragLeave={() => setRootDrop(false)}
            onDrop={e => {
              e.preventDefault(); e.stopPropagation(); setRootDrop(false);
              const ct = e.dataTransfer.getData("componentType");
              if (ct) onDropInto(ct, "root", "inside");
              else if (cdId) onMove(cdId, "root", "inside");
            }}
          >
            {tree.children.map((c: AppNode) => (
              <CNode 
                key={c.id} 
                node={c} 
                selId={preview ? null : selId} 
                hovId={hovId} 
                setHovId={setHovId}
                onSel={onSel} 
                editId={editId} 
                setEditId={setEditId} 
                onContent={onContent}
                onDrop={onDropInto} 
                onMove={onMove} 
                preview={preview} 
                cdId={cdId} 
                setCdId={setCdId} 
              />
            ))}
            
            {!preview && rootDrop && tree.children.length > 0 && (
              <div 
                style={{ 
                  height: '2px', backgroundColor: '#7c5cfc', width: '100%', 
                  position: 'relative', marginTop: '1px', zIndex: 9999,
                  boxShadow: '0 0 0 2px rgba(124, 92, 252, 0.25)' 
                }} 
              />
            )}

            {tree.children.length === 0 && (
              <div className={styles.emptyCanvas} style={rootDrop ? { borderColor: '#7c5cfc', backgroundColor: 'rgba(124, 92, 252, 0.05)' } : {}}>

                <div className={styles.emptyIcon}>◈</div>
                <div className={styles.emptyTitle}>Drop components here</div>
                <div className={styles.emptySub}>Drag from left panel · Esc to cancel</div>
              </div>
            )}

            {!preview && selId && (() => {
                const selNode = selId ? find(tree, selId) : null;
                const parentId = selId ? getParentId(tree, selId) : null;
                const parentNode = parentId ? find(tree, parentId) : null;
                const s = selNode?.style || {};
                const extract = (v: any) => parseFloat(String(v || 0)) || 0;
                
                return (
                  <SelectionOverlay 
                    selId={selId} 
                    zoom={zoom} 
                    panX={panX} 
                    panY={panY} 
                    frameRef={contentRef} 
                    onStyle={onStyle}
                    snap={grid}
                    setIsResizing={setIsResizing}
                    parentType={parentNode?.type}
                    padding={{
                      t: extract(s.paddingTop),
                      r: extract(s.paddingRight),
                      b: extract(s.paddingBottom),
                      l: extract(s.paddingLeft)
                    }}
                    margin={{
                      t: extract(s.marginTop),
                      r: extract(s.marginRight),
                      b: extract(s.marginBottom),
                      l: extract(s.marginLeft)
                    }}
                  />
                );
              })()}
          </div>
        </div>
      </div>

      <div className={styles.controlsHint}>
        <span>⌘Scroll → Zoom</span>
        <span>Shift+Scroll → Horiz. Pan</span>
        <span>Scroll → Vert. Pan</span>
        <span>Alt+Drag → Pan</span>
      </div>
    </div>
  );
};

export default Canvas;
