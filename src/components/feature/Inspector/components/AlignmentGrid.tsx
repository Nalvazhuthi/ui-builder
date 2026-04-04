import React from "react";
import styles from "../Inspector.module.scss";

interface AlignmentGridProps {
  justify: string;
  align: string;
  onChange: (justify: string, align: string) => void;
}

const AlignmentGrid: React.FC<AlignmentGridProps> = ({ justify, align, onChange }) => {
  // Map flex values to grid positions
  const getPos = (j: string, a: string) => {
    let x = 1; // center
    if (j === "flex-start" || j === "start") x = 0;
    if (j === "flex-end" || j === "end") x = 2;
    
    let y = 1; // center
    if (a === "flex-start" || a === "start") y = 0;
    if (a === "flex-end" || a === "end") y = 2;
    
    return y * 3 + x;
  };

  const gridValues = [
    { j: "flex-start", a: "flex-start" }, { j: "center", a: "flex-start" }, { j: "flex-end", a: "flex-start" },
    { j: "flex-start", a: "center" },     { j: "center", a: "center" },     { j: "flex-end", a: "center" },
    { j: "flex-start", a: "flex-end" },   { j: "center", a: "flex-end" },   { j: "flex-end", a: "flex-end" }
  ];

  const currentPos = getPos(justify, align);

  return (
    <div className={styles.alignmentGrid}>
      {gridValues.map((val, i) => (
        <button
          key={i}
          className={`${styles.gridDot} ${currentPos === i ? styles.active : ""}`}
          onClick={() => onChange(val.j, val.a)}
          title={`${val.j} / ${val.a}`}
        />
      ))}
    </div>
  );
};

export default AlignmentGrid;
