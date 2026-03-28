import React, { useState } from "react";
import styles from "./CodePanel.module.scss";
import type { AppNode } from "../../../types";
import { buildScss, buildJsx } from "../../../utils/exportEngine";

interface CodePanelProps {
  tree: AppNode;
}

const CodePanel: React.FC<CodePanelProps> = ({ tree }) => {
  const [lang, setLang] = useState<"jsx" | "scss">("jsx");
  const [copied, setCopied] = useState(false);

  // For the code panel, we generate a simplified JSX and SCSS preview
  const code = lang === "jsx" 
    ? buildJsx(tree, "canvas", 0) 
    : buildScss(tree, "canvas", 0);

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          {["jsx", "scss"].map(l => (
            <button
              key={l}
              onClick={() => setLang(l as "jsx" | "scss")}
              className={`${styles.tab} ${lang === l ? styles.tabActive : ""}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={copy} className={styles.copyBtn}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className={`${styles.code} custom-scroll`}>{code}</pre>
    </div>
  );
};

export default CodePanel;
