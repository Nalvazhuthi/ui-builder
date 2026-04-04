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
  value, onChange, units = ["px", "%", "rem", "em", "vh", "vw", "calc", "auto", "fit-content"], onClear, showClear 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startVal = useRef(0);
  const [localValue, setLocalValue] = useState<string | null>(null);

  let valStr = String(value ?? "");
  let isCalc = false;
  if (valStr.startsWith("calc(")) {
    isCalc = true;
    const end = valStr.endsWith(")") ? valStr.length - 1 : valStr.length;
    valStr = valStr.substring(5, end);
  }

  const keywords = ["auto", "fit-content", "fit", "normal", "inherit", "initial", "unset", "none"];
  const isKeyword = keywords.includes(valStr);
  const isComplex = valStr.includes('(') || valStr.includes(')') || valStr.includes(' ') || valStr.includes('+') || valStr.includes('-') || valStr.startsWith('--');

  const numMatch = !isKeyword ? valStr.match(/^[-+]?[0-9]*\.?[0-9]+/) : null;
  const currentNum = numMatch ? parseFloat(numMatch[0]) : 0;
  
  let currentUnit = units[0] || "";
  const activeUnits = [...units];
  if (isCalc && !activeUnits.includes("calc")) activeUnits.push("calc");

  if (isCalc) {
    currentUnit = "calc";
  } else if (isKeyword) {
    currentUnit = valStr === "fit" ? "fit-content" : valStr;
  } else {
    const extracted = valStr.replace(numMatch ? numMatch[0] : "", "");
    if (extracted !== "" && activeUnits.includes(extracted)) {
      currentUnit = extracted;
    } else if (extracted !== "") {
      currentUnit = extracted;
      if (!activeUnits.includes(extracted) && extracted.length < 5) activeUnits.push(extracted);
    } else if (activeUnits.includes("")) {
      currentUnit = "";
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isKeyword || isComplex || isCalc || currentUnit === "calc") return; 
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

  const displayValue = localValue !== null ? localValue : (isKeyword ? "—" : (isCalc || isComplex ? valStr : (currentNum ? currentNum.toString() : (valStr === "0" ? "0" : ""))));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (localValue === null) return;
    const v = localValue;
    setLocalValue(null);
    
    if (v === "") {
      if (onClear) onClear(); 
      else onChange("");
      return;
    }

    if (currentUnit === "calc") {
      onChange(`calc(${v})`);
      return;
    }

    const isVComplex = v.includes('(') || v.includes(')') || v.includes(' ') || v.includes('+') || v.includes('-') || v.startsWith('--');
    
    if (isVComplex) {
      onChange(v);
    } else {
      const targetUnit = (currentUnit === "auto" || currentUnit === "fit-content" || currentUnit === "0" || currentUnit === "calc") ? "" : currentUnit;
      const hasUnit = /[a-z%]/.test(v);
      onChange(`${v}${hasUnit ? "" : targetUnit}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
  };

  const handleUnitChange = (u: string) => {
    if (u === "auto" || u === "fit-content") {
      onChange(u);
    } else if (u === "calc") {
      onChange(`calc(${valStr})`);
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
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isKeyword}
        />
        {showClear && !isKeyword && !!valStr && valStr !== "0" && ( 
          <span className={styles.clear} onClick={onClear}>✕</span>
        )}
      </div>
      
      {activeUnits.length > 0 && (
        <select 
          className={styles.unitSelect}
          value={currentUnit}
          onChange={(e) => handleUnitChange(e.target.value)}
        >
          {activeUnits.filter(Boolean).map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default PropertyInput;
