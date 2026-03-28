import React, { useState, useRef } from "react";
import styles from "./CNode.module.scss";
import type { AppNode } from "../../../types";
import { META } from "../../../constants/metadata";

interface CNodeProps {
  node: AppNode;
  selId: string | null;
  hovId: string | null;
  setHovId: (id: string | null) => void;
  onSel: (id: string) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
  onContent: (id: string, content: string) => void;
  onDrop: (compType: string, targetId: string, position: "before" | "inside" | "after") => void;
  onMove: (srcId: string, targetId: string, position: "before" | "inside" | "after") => void;
  preview?: boolean;
  cdId: string | null;
  setCdId: (id: string | null) => void;
}

const CNode: React.FC<CNodeProps> = ({
  node, selId, hovId, setHovId, onSel, editId, setEditId, onContent, onDrop, onMove, preview, cdId, setCdId
}) => {
  if (node.hidden) return null;
  
  const isSel = selId === node.id;
  const isHov = hovId === node.id && !isSel;
  const [dropPos, setDropPos] = useState<"before" | "inside" | "after" | null>(null);
  const [drag, setDrag] = useState(false);
  const isEd = editId === node.id;
  const m = META[node.type] || {};
  const nodeRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLSpanElement>(null);
  const isContainer = ["section", "container", "grid", "flex-row", "flex-col", "div", "navbar", "sidebar", "footer", "card", "modal", "tabs", "accordion"].includes(node.type);

  React.useEffect(() => {
    if (isEd && editRef.current) {
      editRef.current.focus();
      // Select all text on double click
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEd]);

  const getZone = (e: React.DragEvent) => {
    const el = nodeRef.current;
    if (!el) return "inside";
    const rect = el.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    if (relY < 0.25) return "before";
    if (relY > 0.75) return "after";
    return "inside";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cdId === node.id) return;
    const zone = getZone(e);
    const effectiveZone = (zone === "inside" && !isContainer) ? "after" as const : zone as "before" | "inside" | "after";
    setDropPos(effectiveZone);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = dropPos || "inside";
    setDropPos(null);
    const ct = e.dataTransfer.getData("componentType");
    if (ct) onDrop(ct, node.id, pos);
    else if (cdId && cdId !== node.id) onMove(cdId, node.id, pos);
  };

  const baseStyle = {
    ...node.style,
    position: "relative" as const,
    boxSizing: "border-box" as const,
    minWidth: 24,
    minHeight: 24,
    outline: preview ? "none" : dropPos === "inside" ? `2px dashed #7c5cfc` : isHov ? `1.5px dashed rgba(124, 92, 252, 0.6)` : isSel ? `1px solid transparent` : "1px solid transparent",
    outlineOffset: -1,
    boxShadow: isHov ? `inset 0 0 0 9999px rgba(124, 92, 252, 0.05)` : node.style?.boxShadow,
    opacity: drag ? 0.35 : 1,
    transition: "all 0.1s ease",
    cursor: preview ? "default" : node.locked ? "not-allowed" : "pointer"
  };

  const renderContent = () => {
    if (node.type === "image") return <div className={styles.imagePlaceholder}>⬚</div>;
    if (node.type === "input") return <input placeholder={node.content || "Input…"} className={styles.inputPreview} style={node.style as any} readOnly />;
    if (isEd) return (
      <span 
        ref={editRef}
        contentEditable 
        suppressContentEditableWarning 
        onBlur={e => { onContent(node.id, e.currentTarget.innerText); setEditId(null); }}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
        className={styles.editable}
      >
        {node.content}
      </span>
    );
    return node.content || null;
  };

  return (
    <div
      ref={nodeRef}
      data-node-id={node.id}
      style={baseStyle as any}
      draggable={!preview && !node.locked}
      onDragStart={e => { if (preview || node.locked) { e.preventDefault(); return; } e.stopPropagation(); setDrag(true); setCdId(node.id); }}
      onDragEnd={() => { setDrag(false); setCdId(null); setDropPos(null); }}
      onDragOver={handleDragOver}
      onDragLeave={e => { if (!nodeRef.current?.contains(e.relatedTarget as Node)) setDropPos(null); }}
      onDrop={handleDrop}
      onMouseEnter={e => { if (!preview) { e.stopPropagation(); setHovId(node.id); } }}
      onMouseLeave={e => { if (!preview) { e.stopPropagation(); setHovId(null); } }}
      onClick={e => { if (!preview && !node.locked) { e.stopPropagation(); onSel(node.id); } }}
      onDoubleClick={e => { if (!preview && !node.locked) { e.stopPropagation(); setEditId(node.id); } }}
    >
      {!preview && dropPos === "before" && <div className={`${styles.insertLine} ${styles.before}`} />}
      {!preview && dropPos === "after" && <div className={`${styles.insertLine} ${styles.after}`} />}
      {!preview && isSel && <div className={styles.selBadge}><span>{m.icon}</span><span>{node.name}</span></div>}
      {!preview && isHov && !isSel && <div className={styles.hovBadge}>{node.name}</div>}
      {!preview && dropPos === "inside" && <div className={styles.dropInside}><span className={styles.dropText}>Drop inside "{node.name}"</span></div>}
      
      {renderContent()}
      
      {(node.children || []).map(c => (
        <CNode 
          key={c.id} 
          node={c} 
          selId={selId} 
          hovId={hovId} 
          setHovId={setHovId} 
          onSel={onSel} 
          editId={editId} 
          setEditId={setEditId} 
          onContent={onContent} 
          onDrop={onDrop} 
          onMove={onMove} 
          preview={preview} 
          cdId={cdId} 
          setCdId={setCdId} 
        />
      ))}
      
      {!preview && dropPos === "after" && <div className={`${styles.insertLine} ${styles.after}`} />}
    </div>
  );
};

export default CNode;
