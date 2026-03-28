import React, { useState, useRef } from "react";
import styles from "./PropertyInput.module.scss";

interface PropertyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  units?: string[];
  label?: string;
  onClear?: () => void;
  showClear?: boolean;
}

const PropertyInput: React.FC<PropertyInputProps> = ({ 
  value, onChange, units = ["px", "%", "rem", "em", "vh", "vw", "auto", "fit-content"], onClear, showClear 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startVal = useRef(0);
  
  // Parse value and unit
  const valStr = value.toString();
  const isKeyword = valStr === "auto" || valStr === "fit-content" || valStr === "fit";
  const numMatch = !isKeyword ? valStr.match(/^[-+]?[0-9]*\.?[0-9]+/) : null;
  const currentNum = numMatch ? parseFloat(numMatch[0]) : 0;
  
  let currentUnit = units[0];
  if (isKeyword) {
    currentUnit = valStr === "fit" ? "fit-content" : valStr;
  } else if (valStr.replace(numMatch ? numMatch[0] : "", "")) {
    currentUnit = valStr.replace(numMatch ? numMatch[0] : "", "");
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isKeyword) return; // Prevent dragging for keyword values
    if (typeof currentNum !== "number") return;
    setIsDragging(true);
    startX.current = e.clientX;
    startVal.current = currentNum;
    
    const handleMouseMove = (em: MouseEvent) => {
      const delta = em.clientX - startX.current;
      const step = em.shiftKey ? 10 : em.altKey ? 0.1 : 1;
      const newVal = startVal.current + delta * step;
      onChange(`${Math.round(newVal * 100) / 100}${currentUnit}`);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "") {
       if (onClear) onClear(); 
       else onChange("");
       return;
    }
    const targetUnit = (currentUnit === "auto" || currentUnit === "fit-content") ? "px" : currentUnit;
    onChange(`${v}${targetUnit}`);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const u = e.target.value;
    if (u === "auto" || u === "fit-content") {
      onChange(u);
    } else {
      onChange(`${currentNum || 0}${u}`);
    }
  };

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.inputWrapper} ${isDragging ? styles.dragging : ""} ${(currentUnit === "auto" || currentUnit === "fit-content") ? styles.disabledInput : ""}`}
        onMouseDown={handleMouseDown}
        title={isKeyword ? "" : "Drag to adjust"}
      >
        <input 
          type="text"
          className={styles.input}
          value={isKeyword ? "—" : (currentNum || "")}
          onChange={handleInputChange}
          disabled={isKeyword}
        />
        {showClear && !isKeyword && currentNum !== 0 && ( /* Only show clear if it's a number to avoid collision */
          <span className={styles.clear} onClick={onClear}>✕</span>
        )}
      </div>
      
      {units.length > 0 && (
        <select 
          className={styles.unitSelect}
          value={currentUnit}
          onChange={handleUnitChange}
        >
          {units.map(u => <option key={u} value={u}>{u === "fit-content" ? "fit" : u}</option>)}
        </select>
      )}
    </div>
  );
};

export default PropertyInput;
