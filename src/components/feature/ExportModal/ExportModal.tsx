import React, { useState } from "react";
import styles from "./ExportModal.module.scss";
import type { AppNode } from "../../../types";
import { find, toPascal } from "../../../utils/treeUtils";
import { exportApp, exportComp, dlFiles } from "../../../utils/exportEngine";
import Button from "../../ui/Button/Button";

interface ExportModalProps {
  tree: AppNode;
  selId: string | null;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ tree, selId, onClose }) => {
  const [mode, setMode] = useState<"app" | "comps" | "sel">("app");
  const [busy, setBusy] = useState(false);
  const selNode = selId && selId !== "root" ? find(tree, selId) : null;
  const selNm = selNode ? toPascal(selNode.name) : null;

  const opts = [
    {
      id: "app", icon: "⊞", title: "Export as App",
      desc: "Full Vite + React 18 + TypeScript project with proper folder structure, SCSS modules, variables, mixins & config files",
      files: [
        "src/components/Card/Card.tsx",
        "src/layouts/MainLayout.tsx",
        "src/pages/Home/Home.tsx",
        "src/styles/_variables.scss",
        "src/App.tsx",
        "vite.config.ts",
        "package.json",
      ]
    },
    {
      id: "comps", icon: "⬡", title: "Export as Components",
      desc: "Each root element as an individual component folder with co-located SCSS module and barrel index.ts",
      files: tree.children.flatMap(n => {
        const nm = toPascal(n.name);
        return [`${nm}/${nm}.tsx`, `${nm}/index.ts`];
      }).slice(0, 8)
    },
    {
      id: "sel", icon: "◻", title: "Export Selected",
      desc: selNm ? `Export "${selNode?.name}" as a standalone component folder` : "Select an element on the canvas first",
      files: selNm ? [`${selNm}/${selNm}.tsx`, `${selNm}/index.ts`] : ["No selection"]
    },
  ];

  const [showAppPopup, setShowAppPopup] = useState(false);
  const [appName, setAppName] = useState("my-awesome-app");

  const handleInitialExportClick = () => {
    if (mode === "sel" && !selNode) return;
    if (mode === "app") {
      setShowAppPopup(true);
    } else {
      handleExport();
    }
  };

  const handleExport = async () => {
    if (mode === "sel" && !selNode) return;
    setBusy(true);
    
    // Simulate build time for UX
    setTimeout(async () => {
      try {
        if (mode === "app") {
          await dlFiles(exportApp(tree, appName), `${appName}.zip`);
        } else if (mode === "comps") {
          const files: Record<string, string> = {};
          for (const n of tree.children) {
            const { nm, tsx, idx, scss } = exportComp(n);
            files[`${nm}/${nm}.tsx`] = tsx;
            files[`${nm}/${nm}.module.scss`] = scss;
            files[`${nm}/index.ts`] = idx;
          }
          await dlFiles(files, "components-export.zip");
        } else if (mode === "sel" && selNode) {
          const { nm, tsx, idx, scss } = exportComp(selNode);
          await dlFiles({
            [`${nm}/${nm}.tsx`]: tsx,
            [`${nm}/${nm}.module.scss`]: scss,
            [`${nm}/index.ts`]: idx
          }, `${nm}.zip`);
        }
      } finally {
        setBusy(false);
        onClose();
      }
    }, 400);
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {showAppPopup ? (
          <>
            <div className={styles.header}>
              <div>
                <div className={styles.title}>Name your App</div>
                <div className={styles.subtitle}>Choose a package name for your project</div>
              </div>
              <button onClick={() => setShowAppPopup(false)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.options} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                autoFocus
                style={{ padding: '12px', background: '#0b0b14', border: '1px solid #7c5cfc', color: '#fff', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="my-awesome-app"
                onKeyDown={(e) => e.key === 'Enter' && !!appName.trim() && handleExport()}
              />
            </div>
            <div className={styles.footer}>
              <div className={styles.footerNote}>Use a web-friendly name (e.g. my-app)</div>
              <div className={styles.footerActions}>
                <Button variant="secondary" size="sm" onClick={() => setShowAppPopup(false)}>Back</Button>
                <Button variant="primary" size="sm" onClick={handleExport} disabled={busy || !appName.trim()}>
                  {busy ? "⟳ Building…" : "↓ Download App"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <div>
                <div className={styles.title}>Export Project</div>
                <div className={styles.subtitle}>Vite · React 18 · TypeScript · SCSS Modules</div>
              </div>
              <button onClick={onClose} className={styles.closeBtn}>✕</button>
            </div>

            <div className={styles.options}>
              {opts.map(opt => {
                const disabled = opt.id === "sel" && !selNode;
                const active = mode === opt.id && !disabled;
                return (
                  <div 
                    key={opt.id} 
                    onClick={() => !disabled && setMode(opt.id as any)}
                    className={`${styles.option} ${active ? styles.optionActive : ""} ${disabled ? styles.optionDisabled : ""}`}
                  >
                    <div className={styles.optionTop}>
                      <span className={styles.optionIcon}>{opt.icon}</span>
                      <div className={styles.optionInfo}>
                        <div className={styles.optionTitle}>{opt.title}</div>
                        <div className={styles.optionDesc}>{opt.desc}</div>
                      </div>
                      <div className={`${styles.radio} ${active ? styles.radioActive : ""}`}>
                        {active && <div className={styles.radioInner} />}
                      </div>
                    </div>
                    
                    <div className={styles.filePreview}>
                      {opt.files.map((f, i) => {
                        const fname = f.split("/").pop();
                        const ext = fname?.split(".").pop();
                        const colorClass = styles[`ext_${ext}`] || "";
                        return (
                          <span key={i} className={`${styles.fileName} ${colorClass}`}>
                            {fname}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.footer}>
              <div className={styles.footerNote}>Downloads as a .zip archive with proper structure</div>
              <div className={styles.footerActions}>
                <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleInitialExportClick} 
                  disabled={busy || (mode === "sel" && !selNode)}
                >
                  {busy ? "⟳ Building…" : (mode === "app" ? "Next →" : "↓ Export")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportModal;
