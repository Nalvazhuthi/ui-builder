import React, { useRef } from "react";
import styles from "./Canvas.module.scss";
import type { AppNode, Breakpoint } from "../../../types";
import CNode from "./CNode";
import SelectionOverlay from "./SelectionOverlay";
import { getAllNodes } from "../../../utils/treeUtils";

interface CanvasProps {
  tree: AppNode;
  selIds: string[];
  hovId: string | null;
  setHovId: (id: string | null) => void;
  onSel: (id: string | null, multi: boolean) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
  onContent: (id: string, content: string) => void;
  onDropInto: (compType: string, targetId: string, position: "before" | "inside" | "after", masterId?: string) => void;
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
  setPanX: (x: number) => void;
  setPanY: (y: number) => void;
  panning: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isResizing: boolean;
  setIsResizing: (val: boolean) => void;
  dragPreview: { type?: string; srcId?: string; targetId: string; position: 'before' | 'inside' | 'after' } | null;
  setDragPreview: (preview: { type?: string; srcId?: string; targetId: string; position: 'before' | 'inside' | 'after' } | null) => void;
  draggingType: string | null;
  breakpoint: Breakpoint;
}

const Canvas: React.FC<CanvasProps> = ({
  tree, selIds, hovId, setHovId, onSel, editId, setEditId, onContent, 
  onDropInto, onMove, onStyle, preview, grid, cdId, setCdId, zoom, setZoom, panX, panY, setPanX, setPanY, panning, 
  onMouseDown, onMouseMove, onMouseUp, breakpoint, isResizing, setIsResizing,
  dragPreview, setDragPreview, draggingType
}) => {
  const canRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null); 
  const [frameHeight, setFrameHeight] = React.useState(0);
  const bpWidths: Record<Breakpoint, number> = { default: 1440, mobile: 375, tablet: 768, desktop: 1200, tv: 1440 };

  React.useEffect(() => {
    if (!frameRef.current) return;
    const observer = new ResizeObserver(entries => {
      setFrameHeight(Math.round(entries[0].contentRect.height));
    });
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);
  const currentWidth = bpWidths[breakpoint] || 1200;
  
  const [rootDrop, setRootDrop] = React.useState(false);

  // Auto-fit logic when breakpoint changes
  React.useEffect(() => {
    if (!canRef.current || preview) return;
    
    // Use a small timeout to ensure the container dimensions are ready
    const timer = setTimeout(() => {
      const containerWidth = canRef.current?.offsetWidth || 0;
      const containerHeight = canRef.current?.offsetHeight || 0;
      const padding = 100; // Ensure some breathing room
      
      const availableWidth = containerWidth - padding;
      const availableHeight = containerHeight - padding;
      const frameHeight = 820; // Matches fixed height in SCSS

      const zoomW = availableWidth / currentWidth;
      const zoomH = availableHeight / frameHeight;
      const optimalZoom = Math.min(1, zoomW, zoomH);
      
      setZoom(Number(optimalZoom.toFixed(2)));
      setPanX(0);
      setPanY(0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [breakpoint, preview, currentWidth, setZoom, setPanX, setPanY]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ct = e.dataTransfer.getData("componentType");
    const mt = e.dataTransfer.getData("masterId");
    if (ct || mt) onDropInto(ct, "root", "inside", mt);
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
          onSel(null, false);
          setEditId(null);
        } else if (t.classList.contains(styles.canvasContent)) {
          onSel("root", false); 
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
                {breakpoint} · {currentWidth} × {frameHeight} px · {Math.round(zoom * 100)}%
              </span>
            </div>
          )}
          
          <div 
            ref={contentRef}
            data-node-id="root"
            className={`${styles.canvasContent} custom-scroll`}
            style={(tree.style as any)}
            onDragOver={e => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              setRootDrop(true); 
              if (draggingType) setDragPreview({ type: draggingType, targetId: "root", position: "inside" });
              else if (cdId) setDragPreview({ srcId: cdId, targetId: "root", position: "inside" });
            }}
            onDragLeave={() => { setRootDrop(false); setDragPreview(null); }}
            onClick={(e) => { 
              if (isResizing) return;
              const t = e.target as HTMLElement;
              const isOuter = t === e.currentTarget || t.classList.contains(styles.grid) || t.classList.contains(styles.frameContainer);
              
              if (isOuter) {
                onSel(null, false);
                setEditId(null);
              } else if (t.classList.contains(styles.canvasContent)) {
                onSel("root", false); 
                setEditId(null); 
              }
            }}
            onDrop={e => {
              e.preventDefault(); e.stopPropagation(); setRootDrop(false);
              setDragPreview(null);
              const ct = e.dataTransfer.getData("componentType");
              if (ct) onDropInto(ct, "root", "inside");
              else if (cdId) onMove(cdId, "root", "inside");
            }}
          >
            {tree.children.map((c: AppNode) => (
              <CNode 
                key={c.id} 
                node={c} 
                selIds={preview ? [] : selIds} 
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
                setDragPreview={setDragPreview}
                dragPreview={dragPreview}
                draggingType={draggingType}
              />
            ))}
            
             {tree.children.length === 0 && (
              <div className={styles.emptyCanvas} style={rootDrop ? { borderColor: '#7c5cfc', backgroundColor: 'rgba(124, 92, 252, 0.05)' } : {}}>

                <div className={styles.emptyIcon}>◈</div>
                <div className={styles.emptyTitle}>Drop components here</div>
                <div className={styles.emptySub}>Drag from left panel · Esc to cancel</div>
              </div>
            )}
          </div>

          {!preview && getAllNodes(tree).map((n: AppNode) => {
              const s = n.style || {};
              const extractVal = (v: any) => parseFloat(String(v || 0)) || 0;
              const m = {
                t: extractVal(s.marginTop),
                r: extractVal(s.marginRight),
                b: extractVal(s.marginBottom),
                l: extractVal(s.marginLeft)
              };
              const p = {
                t: extractVal(s.paddingTop),
                r: extractVal(s.paddingRight),
                b: extractVal(s.paddingBottom),
                l: extractVal(s.paddingLeft)
              };
              
              return (
                <React.Fragment key={n.id}>
                  {selIds.includes(n.id) && !preview && (
                    <SelectionOverlay 
                      selId={n.id}
                      zoom={zoom}
                      panX={panX}
                      panY={panY}
                      frameRef={frameRef}
                      onStyle={onStyle}
                      setIsResizing={setIsResizing}
                      padding={p}
                      margin={m}
                      snap={true}
                    />
                  )}

                  {/* Logic Indicator */}
                  {n.logic && Object.keys(n.logic).length > 0 && !preview && (
                    <div 
                      className={styles.logicBadge} 
                      style={{ 
                        position: "absolute",
                        left: "4px",
                        top: "4px",
                        zIndex: 10
                      }}
                      title="Has Interactions"
                    >
                      ⚡
                    </div>
                  )}
                </React.Fragment>
              );
            })}
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
