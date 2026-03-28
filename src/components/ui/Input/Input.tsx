import React from "react";
import styles from "./Input.module.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClear?: boolean;
}

const Input: React.FC<InputProps> = ({ onClear, showClear, className = "", ...props }) => {
  return (
    <div className={`${styles.container} ${className}`}>
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
