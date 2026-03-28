import React from "react";
import styles from "./Select.module.scss";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: string[] | { value: string, label: string }[];
}

const Select: React.FC<SelectProps> = ({ options, className = "", ...props }) => {
  return (
    <select className={`${styles.select} ${className}`} {...props}>
      {options.map((opt) => {
        const value = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
};

export default Select;
