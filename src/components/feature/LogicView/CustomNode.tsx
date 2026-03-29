import { Handle, Position } from "@xyflow/react";
import styles from "./CustomNode.module.scss";

const CustomNode = ({ data, type }: any) => {
  const isTrigger = type === "trigger" || type === "onMount" || type === "timer";

  return (
    <div className={`${styles.node} ${styles[type] || styles.default}`}>
      {!isTrigger && (
        <Handle type="target" position={Position.Left} className={styles.handle} />
      )}
      <div className={styles.header}>
        <span className={styles.icon}>{data.icon}</span>
        <span className={styles.label}>{data.label}</span>
      </div>
      {data.value && <div className={styles.value}>{data.value}</div>}
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
};

export default CustomNode;
