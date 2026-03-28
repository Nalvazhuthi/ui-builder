import React from "react";
import styles from "./Section.module.scss";

interface SectionProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ label, open, onToggle, children }) => {
  return (
    <div className={styles.section}>
      <div onClick={onToggle} className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.arrow} ${open ? styles.open : ""}`}>▼</span>
      </div>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default Section;
