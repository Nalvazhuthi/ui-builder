import React from "react";
import styles from "./ColorPicker.module.scss";
import Input from "../Input/Input";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  showNone?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, showNone }) => {
  const empty = !value || value === "transparent" || value === "";
  
  return (
    <div className={styles.container}>
      <div 
        className={styles.swatch} 
        style={{ background: empty ? "repeating-conic-gradient(#2a2a3e 0% 25%,#111 0% 50%) 0/8px 8px" : value }}
      >
        <input 
          type="color" 
          value={empty ? "#000000" : value?.startsWith("#") ? value : "#000000"} 
          onChange={(e) => onChange(e.target.value)} 
          className={styles.picker} 
        />
      </div>
      <Input 
        value={value || ""} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder="—" 
        onClear={() => onChange("")}
        showClear={showNone && !empty}
      />
    </div>
  );
};

export default ColorPicker;
