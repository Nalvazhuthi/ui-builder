import React from "react";
import styles from "./PreviewView.module.scss";
import Canvas from "../Canvas/Canvas";
import type { AppNode } from "../../../types";

interface PreviewViewProps {
  tree: AppNode;
}

const PreviewView: React.FC<PreviewViewProps> = ({ tree }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Canvas 
          tree={tree}
          selIds={[]}
          hovId={null}
          setHovId={() => {}}
          onSel={() => {}}
          editId={null}
          setEditId={() => {}}
          onContent={() => {}}
          onDropInto={() => {}}
          onMove={() => {}}
          onStyle={() => {}}
          preview={true}
          grid={false}
          cdId={null}
          setCdId={() => {}}
          zoom={1}
          setZoom={() => {}}
          panX={0}
          panY={0}
          panning={false}
          isResizing={false}
          setIsResizing={() => {}}
          onMouseDown={() => {}}
          onMouseMove={() => {}}
          onMouseUp={() => {}}
          breakpoint="desktop"
        />
      </div>
    </div>
  );
};

export default PreviewView;
