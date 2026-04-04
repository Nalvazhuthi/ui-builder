import React from "react";
import styles from "./Input.module.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClear?: boolean;
  variant?: "default" | "ghost";
}

const Input: React.FC<InputProps> = ({ onClear, showClear, className = "", variant = "default", ...props }) => {
  return (
    <div className={`${styles.container} ${styles[variant]} ${className}`}>
      <input className={styles.input} {...props} />
      {showClear && (
        <span 
          onClick={onClear} 
          className={styles.clear} 
          title="Clear"
        >
          ✕
        </span>
      )}
    </div>
  );
};

export default Input;
