import React from "react";
import styles from "./Field.module.scss";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => {
  return (
    <div className={styles.field}>
      <div className={styles.label}>{label}</div>
      {children}
    </div>
  );
};

export default Field;
