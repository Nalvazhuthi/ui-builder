import React, { useState, useRef, useEffect } from "react";
import styles from "./Select.module.scss";

interface SelectProps {
  options: string[] | { value: string, label: string }[];
  value?: string | number;
  onChange?: (e: any) => void;
  className?: string;
  variant?: "default" | "ghost";
}

const Select: React.FC<SelectProps> = ({ options, value, onChange, className = "", variant = "default" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const formattedOptions = options.map(o => 
    typeof o === "string" ? { label: o, value: o } : o
  );

  const selected = formattedOptions.find(o => String(o.value) === String(value)) || formattedOptions[0];

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
      }
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const toggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div className={`${styles.dropdown} ${className}`} ref={containerRef}>
      <button 
        className={`${styles.trigger} ${styles[variant]} ${isOpen ? styles.triggerActive : ""}`}
        onClick={toggle}
        type="button"
      >
        <span className={styles.label}>{selected?.label || value}</span>
        <span className={styles.chevron}>▾</span>
      </button>

      {isOpen && (
        <div 
          className={`${styles.menu} custom-scroll`}
          style={{ 
            position: 'fixed', 
            top: coords.top + 4, 
            left: coords.left, 
            width: coords.width, 
            zIndex: 1000000 
          }}
        >
          {formattedOptions.map(opt => (
            <div 
              key={opt.value}
              className={`${styles.option} ${String(opt.value) === String(value) ? styles.optActive : ""}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;

