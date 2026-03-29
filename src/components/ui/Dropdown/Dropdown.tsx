import React, { useState, useRef, useEffect } from "react";
import styles from "./Dropdown.module.scss";

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  options: (string | Option)[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  icon?: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, className, icon }) => {
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

  return (
    <div className={`${styles.dropdown} ${className || ""}`} ref={containerRef}>
      <button 
        className={`${styles.trigger} ${isOpen ? styles.active : ""}`}
        onClick={toggle}
        type="button"
      >
        <div className={styles.labelArea}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.label}>{selected?.label || value}</span>
        </div>
        <span className={styles.chevron}>▾</span>
      </button>

      {isOpen && (
        <div 
          className={styles.menu} 
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
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
