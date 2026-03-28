import React, { useEffect, useState, useRef } from "react";
import styles from "./SelectionOverlay.module.scss";

interface SelectionOverlayProps {
  selId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  frameRef: React.RefObject<HTMLDivElement | null>;
  onStyle: (id: string, style: any) => void;
  setIsResizing: (val: boolean) => void;
  parentType?: string;
  padding?: { t: number, r: number, b: number, l: number };
  margin?: { t: number, r: number, b: number, l: number };
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ 
  selId, zoom, panX, panY, frameRef, onStyle, setIsResizing, parentType, padding, margin 
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const startRef = useRef<{ x: number, y: number, w: number, h: number } | null>(null);

  useEffect(() => {
    if (!selId) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(`[data-node-id="${selId}"]`);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 30); // Faster polling during resizing
    return () => clearInterval(interval);
  }, [selId, zoom, panX, panY]);

  // Handle Resizing
  useEffect(() => {
    if (!resizing || !selId || !startRef.current) return;

    const onMove = (e: MouseEvent) => {
      if (!startRef.current || !rect) return;
      
      const dx = (e.clientX - startRef.current.x) / zoom;
      const dy = (e.clientY - startRef.current.y) / zoom;
      
      const newStyle: any = { flex: "none" };
      
      // Right & Bottom
      if (resizing.includes("right")) newStyle.width = Math.max(20, startRef.current.w + dx);
      if (resizing.includes("bottom")) newStyle.height = Math.max(20, startRef.current.h + dy);
      
      // Top & Left (Positioning adjustment for absolutely positioned items)
      if (resizing.includes("top")) {
        newStyle.height = Math.max(20, startRef.current.h - dy);
      }
      if (resizing.includes("left")) {
        newStyle.width = Math.max(20, startRef.current.w - dx);
      }
      
      onStyle(selId, newStyle);
    };

    const onUp = () => {
      setResizing(null);
      startRef.current = null;
      // Delay resetting isResizing state to allow trailing click events to be ignored
      setTimeout(() => setIsResizing(false), 50);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing, selId, zoom, onStyle, setIsResizing]);

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    const el = document.querySelector(`[data-node-id="${selId}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: r.width / zoom, // Store in design units
      h: r.height / zoom
    };
    setIsResizing(true);
    setResizing(handle);
  };

  if (!rect || !frameRef.current) return null;

  const frameRect = frameRef.current.getBoundingClientRect();

  // Position relative to the frame, dividing screen pixels by zoom to get CSS values
  const style = {
    left: (rect.left - frameRect.left) / zoom,
    top: (rect.top - frameRect.top) / zoom,
    width: rect.width / zoom,
    height: rect.height / zoom,
  };

  const handles = [
    "top-left", "top-center", "top-right",
    "middle-left", "middle-right",
    "bottom-left", "bottom-center", "bottom-right"
  ];

  return (
    <div className={styles.overlayContainer} style={style} ref={containerRef}>
      {/* Margins */}
      {margin && (
        <>
          <div className={`${styles.margin} ${styles.top}`} style={{ height: margin.t, top: -margin.t }} />
          <div className={`${styles.margin} ${styles.right}`} style={{ width: margin.r, right: -margin.r }} />
          <div className={`${styles.margin} ${styles.bottom}`} style={{ height: margin.b, bottom: -margin.b }} />
          <div className={`${styles.margin} ${styles.left}`} style={{ width: margin.l, left: -margin.l }} />
        </>
      )}

      {/* Paddings */}
      {padding && (
        <div className={styles.paddingContainer}>
          <div className={`${styles.padding} ${styles.top}`} style={{ height: padding.t }} />
          <div className={`${styles.padding} ${styles.right}`} style={{ width: padding.r }} />
          <div className={`${styles.padding} ${styles.bottom}`} style={{ height: padding.b }} />
          <div className={`${styles.padding} ${styles.left}`} style={{ width: padding.l }} />
        </div>
      )}

      <div className={styles.boundingBox} />
      
      {handles.map(h => (
        <div 
          key={h} 
          className={`${styles.handle} ${styles[h]}`} 
          onMouseDown={(e) => handleResizeStart(e, h)} 
          onClick={(e) => e.stopPropagation()}
        />
      ))}

      {parentType && (
        <div className={styles.parentBadge}>
          in {parentType}
        </div>
      )}

      <div className={styles.infoBadge}>
        {Math.round(rect.width / zoom)} x {Math.round(rect.height / zoom)}
      </div>
    </div>
  );
};

export default SelectionOverlay;
