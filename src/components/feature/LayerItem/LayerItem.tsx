import React, { useState } from "react";
import styles from "./LayerItem.module.scss";
import type { AppNode } from "../../../types";
import { META } from "../../../constants/metadata";
import { find, ids, del, ins, insBefore, insAfter } from "../../../utils/treeUtils";
import CtxMenu from "../CtxMenu/CtxMenu";

interface LayerItemProps {
  node: AppNode;
  depth: number;
  selIds: string[];
  hovId: string | null;
  setHovId: (id: string | null) => void;
  onSel: (id: string, multi: boolean) => void;
  collapsed: Record<string, boolean>;
  onCollapse: (id: string) => void;
  onDel: (id: string) => void;
  onDup: (id: string) => void;
  onHide: (id: string) => void;
  onLock: (id: string) => void;
  cdId: string | null;
  setCdId: (id: string | null) => void;
  tree: AppNode;
  setTree: (tree: AppNode) => void;
  onMakeComponent: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onGroup: () => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  node, depth, selIds, hovId, setHovId, onSel, collapsed, onCollapse, 
  onDel, onDup, onHide, onLock, cdId, setCdId, tree, setTree, onMakeComponent, onRename, onGroup
}) => {
  const has = (node.children || []).length > 0;
  const isSel = selIds.includes(node.id);
  const isCol = collapsed[node.id];
  const m = META[node.type] || {};
  const [ctx, setCtx] = useState<{ x: number, y: number } | null>(null);
  
  const [dropPos, setDropPos] = useState<"before" | "inside" | "after" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  const handleEditSubmit = () => {
    setIsEditing(false);
    if (editName.trim() && editName !== node.name) {
      onRename(node.id, editName.trim());
    } else {
      setEditName(node.name);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < rect.height * 0.25) setDropPos("before");
    else if (y > rect.height * 0.75) setDropPos("after");
    else setDropPos("inside");
  };

  return (
    <div className={styles.container}>
      <div
        draggable
        onDragStart={e => { e.stopPropagation(); setCdId(node.id); }}
        onDragEnd={() => setCdId(null)}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropPos(null)}
        onDrop={e => {
          e.preventDefault(); e.stopPropagation();
          const pos = dropPos || "inside";
          setDropPos(null);
          if (cdId && cdId !== node.id) {
            const src = find(tree, cdId);
            if (src && !ids(src).includes(node.id)) {
              const t1 = del(tree, cdId);
              if (pos === "before") setTree(insBefore(t1, node.id, src));
              else if (pos === "after") setTree(insAfter(t1, node.id, src));
              else setTree(ins(t1, node.id, src));
              setCdId(null);
            }
          }
        }}
        onClick={e => { e.stopPropagation(); onSel(node.id, e.ctrlKey || e.metaKey); }}
        onDoubleClick={e => { e.stopPropagation(); setIsEditing(true); setEditName(node.name); }}
        onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}
        onMouseEnter={() => setHovId(node.id)}
        onMouseLeave={() => setHovId(null)}
        className={`${styles.row} ${isSel ? styles.active : ""} ${dropPos === "inside" ? styles.dragOver : ""} ${node.hidden ? styles.hidden : ""}`}
        style={{ paddingLeft: 8 + depth * 18 }}
      >
        {dropPos === "before" && <div className={`${styles.dropLine} ${styles.dropBefore}`} />}
        {dropPos === "after" && <div className={`${styles.dropLine} ${styles.dropAfter}`} />}
        
        {Array.from({ length: depth }).map((_, i) => (
          <div 
            key={i} 
            className={styles.indentGuide} 
            style={{ left: 8 + i * 18 + 8 }} 
          />
        ))}

        <span 
          onClick={e => { e.stopPropagation(); has && onCollapse(node.id); }} 
          className={`${styles.collapse} ${isCol ? styles.isCollapsed : ""} ${!has ? styles.noChildren : ""}`}
        >
          {isCol ? "▸" : "▾"}
        </span>
        <span className={styles.icon} style={{ color: node.isMaster ? "#a855f7" : node.masterId ? "#7c5cfc" : m.color }}>
          {node.isMaster ? "❖" : node.masterId ? "◇" : (m.icon || "◻")}
        </span>
        {isEditing ? (
          <input 
            autoFocus
            className={styles.renameInput}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleEditSubmit();
              if (e.key === 'Escape') { setIsEditing(false); setEditName(node.name); }
            }}
          />
        ) : (
          <span className={`${styles.name} ${node.masterId ? styles.isInstance : ""}`} title={node.name}>{node.name}</span>
        )}
        
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onDup(node.id); }} title="Duplicate">
            📋
          </button>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onDel(node.id); }} title="Delete">
            🗑
          </button>
          <button className={`${styles.actionBtn} ${node.hidden ? styles.active : ""}`} onClick={(e) => { e.stopPropagation(); onHide(node.id); }} title="Hide">
            {node.hidden ? "👁‍🗨" : "👁"}
          </button>
          <button className={`${styles.actionBtn} ${node.locked ? styles.active : ""}`} onClick={(e) => { e.stopPropagation(); onLock(node.id); }} title="Lock">
            {node.locked ? "🔒" : "🔓"}
          </button>
        </div>
      </div>

      {ctx && (
        <CtxMenu 
          x={ctx.x} 
          y={ctx.y} 
          onClose={() => setCtx(null)} 
          items={[
            ["Duplicate", () => { onDup(node.id); setCtx(null); }],
            ["Delete", () => { onDel(node.id); setCtx(null); }],
            null,
            ["Group Selection", () => { onGroup(); setCtx(null); }],
            null,
            [node.hidden ? "Show" : "Hide", () => { onHide(node.id); setCtx(null); }],
            [node.locked ? "Unlock" : "Lock", () => { onLock(node.id); setCtx(null); }],
            null,
            ["Create Component", () => { onMakeComponent(node.id); setCtx(null); }],
          ]} 
        />
      )}

      {!isCol && has && node.children.map(c => (
        <LayerItem 
          key={c.id} 
          node={c} 
          depth={depth + 1} 
          selIds={selIds} 
          hovId={hovId} 
          setHovId={setHovId}
          onSel={onSel} 
          collapsed={collapsed} 
          onCollapse={onCollapse} 
          onDel={onDel} 
          onDup={onDup}
          onHide={onHide} 
          onLock={onLock} 
          cdId={cdId} 
          setCdId={setCdId} 
          tree={tree} 
          setTree={setTree} 
          onMakeComponent={onMakeComponent}
          onRename={onRename}
          onGroup={onGroup}
        />
      ))}
    </div>
  );
};

export default LayerItem;
