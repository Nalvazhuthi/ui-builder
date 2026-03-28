import React from "react";
import styles from "./Navbar.module.scss";
import type { Breakpoint } from "../../../types";
import Button from "../../ui/Button/Button";

interface NavbarProps {
  tab: "2d" | "3d";
  setTab: (tab: "2d" | "3d") => void;
  breakpoint: Breakpoint;
  setBreakpoint: (bp: Breakpoint) => void;
  zoom: number;
  preview: boolean;
  setPreview: (p: boolean) => void;
  grid: boolean;
  setGrid: (g: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onClear: () => void;
  onExport: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  tab, setTab, breakpoint, setBreakpoint, zoom, preview, setPreview,
  grid, setGrid,
  undo, redo, canUndo, canRedo, onSave, onClear, onExport
}) => {
  return (
    <div className={styles.navbar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⬡</div>
          <span className={styles.logoText}>UIForge</span>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.group}>
          <div className={styles.tabGroup}>
            {[["2d", "2D"], ["3d", "3D ✦"]].map(([t, l]) => (
              <button
                key={t}
                onClick={() => setTab(t as "2d" | "3d")}
                className={`${styles.tabButton} ${tab === t ? styles.active : ""}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        {tab === "2d" && (
          <>
            <div className={styles.group}>
              <div className={styles.breakpointGroup}>
                {[["mobile", "📱"], ["tablet", "▣"], ["desktop", "⊞"], ["tv", "⬛"]].map(([b, ic]) => (
                  <button
                    key={b}
                    onClick={() => setBreakpoint(b as Breakpoint)}
                    title={b}
                    className={`${styles.bpButton} ${breakpoint === b ? styles.active : ""}`}
                  >
                    {ic}
                  </button>
                ))}
                
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                
                <button
                  onClick={() => setGrid(!grid)}
                  title="Toggle Grid & Snapping"
                  className={`${styles.bpButton} ${grid ? styles.active : ""}`}
                >
                  ⊞
                </button>
              </div>
            </div>
            
            <div className={styles.divider} />

            <div className={styles.group}>
              <span className={styles.zoomText}>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setPreview(!preview)}
                className={`${styles.previewButton} ${preview ? styles.previewActive : ""}`}
              >
                <span>{preview ? "◎" : "▷"}</span>
                {preview ? "Live" : "Preview"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.actions}>
          <Button variant="tb" onClick={undo} disabled={!canUndo} title="Undo ⌘Z">↩</Button>
          <Button variant="tb" onClick={redo} disabled={!canRedo} title="Redo ⌘⇧Z">↪</Button>
          <div className={styles.divider} />
          <Button variant="tb" onClick={onSave} title="Save JSON">⊙</Button>
          <Button variant="danger" size="sm" onClick={onClear}>✕ Clear</Button>
          <Button variant="primary" size="sm" onClick={onExport} className={styles.exportBtn}>
            ↓ Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
