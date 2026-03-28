import React from "react";
import styles from "./TogGrp.module.scss";

interface TogGrpProps {
  label?: string;
  val: string;
  ch: (val: string) => void;
  opts: [string, React.ReactNode, string?][]; // [value, content/icon, title?]
}

const TogGrp: React.FC<TogGrpProps> = ({ label, val, ch, opts }) => {
  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.group}>
        {opts.map(([v, l, t]) => (
          <button
            key={v}
            onClick={() => ch(v)}
            className={`${styles.button} ${val === v ? styles.active : ""}`}
            title={t || v}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TogGrp;
