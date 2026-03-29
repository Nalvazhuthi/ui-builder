import React, { useState, useRef } from "react";
import styles from "./CNode.module.scss";
import type { AppNode } from "../../../types";
import { META } from "../../../constants/metadata";

interface CNodeProps {
  node: AppNode;
  selIds: string[];
  hovId: string | null;
  setHovId: (id: string | null) => void;
  onSel: (id: string, multi: boolean) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
  onContent: (id: string, content: string) => void;
  onDrop: (compType: string, targetId: string, position: "before" | "inside" | "after") => void;
  onMove: (srcId: string, targetId: string, position: "before" | "inside" | "after") => void;
  preview?: boolean;
  cdId: string | null;
  setCdId: (id: string | null) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  user:     <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  home:     <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  search:   <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  bell:     <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
};

const CNode: React.FC<CNodeProps> = ({
  node, selIds, hovId, setHovId, onSel, editId, setEditId, onContent, onDrop, onMove, preview, cdId, setCdId
}) => {
  if (node.hidden) return null;
  
  const isSel = selIds.includes(node.id);
  const isPrimary = selIds[selIds.length - 1] === node.id;
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

  const h = node.style?.height as string || "";
  const mh = node.style?.minHeight as string || "";
  const isPreciseHeight = /vh|%|calc|px|rem|em/.test(h) || /vh|%|calc|px|rem|em/.test(mh);

  const baseStyle: any = {
    position: "relative",
    boxSizing: "border-box",
    minWidth: 16,
    minHeight: 16,
    transition: "all 0.1s ease",
    cursor: preview ? "default" : node.locked ? "not-allowed" : "pointer",
    ...node.style,
    flexShrink: node.style?.flexShrink ?? (isPreciseHeight ? 0 : 1),
    whiteSpace: "pre-wrap",
    backgroundColor: node.style?.backgroundColor,
    outline: preview ? "none" : dropPos === "inside" ? `2px dashed #7c5cfc` : isHov ? `2px solid #a78bfa` : isSel ? `1px solid transparent` : (isContainer ? "1px dashed transparent" : "1px solid transparent"),
    outlineOffset: -1,
    boxShadow: isHov ? `inset 0 0 0 9999px rgba(167, 139, 250, 0.1)` : node.style?.boxShadow,
    opacity: drag ? 0.35 : (node.style?.opacity !== undefined ? parseFloat(node.style.opacity as string) : 1),
  };

  const renderContent = () => {
    if (node.type === "image") {
      if (!node.content) return <div className={styles.imagePlaceholder}>⬚</div>;
      return <img src={node.content} alt={node.name} style={{ width: '100%', height: '100%', objectFit: (node.style as any).objectFit || 'cover', objectPosition: (node.style as any).objectPosition || 'center', borderRadius: 'inherit' }} />;
    }
    
    if (node.type === "icon") {
      const isCustom = node.content?.startsWith("svg:");
      if (isCustom) {
        return (
          <div 
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: node.content!.replace("svg:", "") }}
          />
        );
      }
      const iconKey = (node.content || "user").toLowerCase();
      return (
        <svg 
          viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
          style={{ width: '100%', height: '100%' }}
        >
          {ICONS[iconKey] || ICONS.user}
        </svg>
      );
    }

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

    let content = node.content;
    const style = node.style || {};
    if ((style as any).textTransform === 'titlecase' && content) {
      content = content.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
    }
    return content || null;
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
      onClick={e => { if (!preview && !node.locked) { e.stopPropagation(); onSel(node.id, e.ctrlKey || e.metaKey); } }}
      onDoubleClick={e => { if (!preview && !node.locked) { e.stopPropagation(); setEditId(node.id); } }}
    >
      {!preview && dropPos === "before" && <div className={`${styles.insertLine} ${styles.before}`} />}
      {!preview && dropPos === "after" && <div className={`${styles.insertLine} ${styles.after}`} />}
      {!preview && isPrimary && <div className={styles.selBadge}><span>{m.icon}</span><span>{node.name}</span></div>}
      {!preview && isHov && !isSel && <div className={styles.hovBadge}>{node.name}</div>}
      {!preview && dropPos === "inside" && <div className={styles.dropInside}><span className={styles.dropText}>Drop inside "{node.name}"</span></div>}
      
      {renderContent()}
      
      {(node.children || []).map(c => (
        <CNode 
          key={c.id} 
          node={c} 
          selIds={selIds} 
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
