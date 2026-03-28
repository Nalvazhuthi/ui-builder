import React, { useEffect } from "react";
import styles from "./CtxMenu.module.scss";

interface CtxMenuProps {
  x: number;
  y: number;
  items: (([string, () => void] | null))[];
  onClose: () => void;
}

const CtxMenu: React.FC<CtxMenuProps> = ({ x, y, items, onClose }) => {
  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener("mousedown", handleClose, { once: true });
    return () => window.removeEventListener("mousedown", handleClose);
  }, [onClose]);

  return (
    <div
      className={styles.menu}
      style={{ top: y, left: x }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        item === null ? (
          <div key={i} className={styles.divider} />
        ) : (
          <div
            key={i}
            onClick={item[1]}
            className={styles.item}
          >
            {item[0]}
          </div>
        )
      ))}
    </div>
  );
};

export default CtxMenu;
