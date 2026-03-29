import React from "react";
import styles from "./Sidebar.module.scss";
import type { AppNode, ComponentMetadata } from "../../../types";
import { LIB, META } from "../../../constants/metadata";
import LayerItem from "../../feature/LayerItem/LayerItem";

const CAT_ICONS: Record<string, string> = {
  Structure: "📐",
  Basic: "⚡",
  Typography: "T",
  Forms: "☑",
  Interactive: "👆",
  Advanced: "⚙",
  "Tailwind UI": "🌊"
};

interface SidebarProps {
  leftTab: "comps" | "layers" | "library";
  setLeftTab: (tab: "comps" | "layers" | "library") => void;
  libExpanded: Record<string, boolean>;
  setLibExpanded: (expanded: Record<string, boolean>) => void;
  tree: AppNode;
  selIds: string[];
  hovId: string | null;
  setHovId: (id: string | null) => void;
  onSelect: (id: string, multi: boolean) => void;
  collapsed: Record<string, boolean>;
  setCollapsed: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onToggleHide: (id: string) => void;
  onToggleLock: (id: string) => void;
  cdId: string | null;
  setCdId: (id: string | null) => void;
  setTree: (tree: AppNode) => void;
  setGhostType: (type: string | null) => void;
  setDragging: (dragging: boolean) => void;
  setGhostPos: (pos: { x: number, y: number } | null) => void;
  onCreateComponent: (id: string) => void;
  onUseComponent: (masterId: string, parentId: string) => void;
  onRename: (id: string, name: string) => void;
  onGroup: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  leftTab, setLeftTab, libExpanded, setLibExpanded, tree, selIds, hovId, 
  setHovId, onSelect, collapsed, setCollapsed, onDeleteNode, onDuplicateNode, 
  onToggleHide, onToggleLock, cdId, setCdId, setTree, setGhostType, setDragging, setGhostPos,
  onCreateComponent, onUseComponent, onRename, onGroup
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.tabs}>
        {[["comps", "Elements"], ["library", "Assets"], ["layers", "Layers"]].map(([t, l]) => (
          <button
            key={t}
            onClick={() => setLeftTab(t as any)}
            className={`${styles.tab} ${leftTab === t ? styles.tabActive : ""}`}
          >
            {l}
          </button>
        ))}
      </div>
      
      <div className={`${styles.content} custom-scroll`}>
        {leftTab === "comps" && Object.entries(LIB).map(([cat, types]) => (
          <div key={cat} className={styles.category}>
            <div 
              onClick={() => setLibExpanded({ ...libExpanded, [cat]: !libExpanded[cat] })} 
              className={styles.categoryHeader}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={styles.categoryIcon}>{CAT_ICONS[cat] || "❖"}</span>
                <span className={styles.categoryLabel}>{cat}</span>
              </div>
              <span className={`${styles.arrow} ${libExpanded[cat] ? styles.arrowOpen : ""}`}>▼</span>
            </div>
            
            {libExpanded[cat] && types.map(type => {
              const m = META[type] || {} as ComponentMetadata;
              return (
                <div
                  key={type}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData("componentType", type);
                    setGhostType(type);
                    setDragging(true);
                    setGhostPos({ x: e.clientX, y: e.clientY });
                  }}
                  onDragEnd={() => {
                    setGhostType(null);
                    setGhostPos(null);
                    setDragging(false);
                  }}
                  className={styles.componentItem}
                >
                  <span className={styles.componentIcon} style={{ color: m.color }}>{m.icon}</span>
                  <span className={styles.componentLabel}>{m.label}</span>
                </div>
              );
            })}
          </div>
        ))}

        {leftTab === "library" && (
          <div className={styles.library}>
            <div className={styles.categoryLabel} style={{ padding: "12px 16px 8px", opacity: 0.5, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Main Components</div>
            {Object.entries(tree.masters || {}).length === 0 ? (
              <div className={styles.emptyLayers} style={{ marginTop: 20 }}>No components yet. Right click a layer to create one.</div>
            ) : (
              Object.entries(tree.masters || {}).map(([id, master]) => (
                <div 
                  key={id} 
                  className={styles.componentItem}
                  onClick={() => onUseComponent(id, selIds[0] || "root")}
                >
                  <span className={styles.componentIcon} style={{ color: "#7c5cfc" }}>◈</span>
                  <span className={styles.componentLabel}>{master.name.replace("Master: ", "")}</span>
                  <button className={styles.addBtn}>+</button>
                </div>
              ))
            )}
          </div>
        )}

        {leftTab === "layers" && (
          <div className={styles.layersList}>
            {tree.children.length === 0 ? (
              <div className={styles.emptyLayers}>Canvas is empty</div>
            ) : (
              tree.children.map(c => (
                <LayerItem 
                  key={c.id} 
                  node={c} 
                  depth={0} 
                  selIds={selIds} 
                  hovId={hovId} 
                  setHovId={setHovId}
                  onSel={onSelect} 
                  collapsed={collapsed} 
                  onCollapse={setCollapsed}
                  onDel={onDeleteNode} 
                  onDup={onDuplicateNode} 
                  onHide={onToggleHide} 
                  onLock={onToggleLock}
                  cdId={cdId} 
                  setCdId={setCdId} 
                  tree={tree} 
                  setTree={setTree} 
                  onMakeComponent={onCreateComponent}
                  onRename={onRename}
                  onGroup={onGroup}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
