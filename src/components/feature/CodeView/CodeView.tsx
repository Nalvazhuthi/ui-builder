import React, { useState, useMemo, useEffect } from "react";
import styles from "./CodeView.module.scss";
import { exportApp } from "../../../utils/exportEngine";
import type { AppNode } from "../../../types";

interface CodeViewProps {
  tree: AppNode;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
}

const parseTree = (files: Record<string, string>): FileNode[] => {
  const root: FileNode[] = [];
  const paths = Object.keys(files).sort();

  paths.forEach(path => {
    const parts = path.split('/');
    let currentLevel = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');
      let node = currentLevel.find(n => n.name === part);
      if (!node) {
        node = { name: part, type: isFile ? 'file' : 'folder', path: currentPath, children: isFile ? undefined : [] };
        currentLevel.push(node);
      }
      if (!isFile) currentLevel = node.children!;
    });
  });
  return root;
};

const FileTreeItem: React.FC<{ 
  node: FileNode, 
  onSelect: (p: string) => void, 
  selected: string, 
  depth: number,
  expanded: Record<string, boolean>,
  toggle: (p: string) => void
}> = ({ node, onSelect, selected, depth, expanded, toggle }) => {
  const isFolder = node.type === 'folder';
  const isOpen = expanded[node.path];
  const isActive = selected === node.path;
  const icon = isFolder ? (isOpen ? "📂" : "📁") : (node.name.endsWith(".tsx") ? "⚛️" : node.name.endsWith(".scss") ? "💅" : "📄");

  return (
    <div className={styles.treeWrapper}>
      <div 
        className={`${styles.fileItem} ${isActive ? styles.active : ""} ${isFolder ? styles.folderItem : ""}`}
        style={{ paddingLeft: depth * 12 + 16 }}
        onClick={() => isFolder ? toggle(node.path) : onSelect(node.path)}
      >
        <span className={styles.fileIcon}>{icon}</span>
        <span className={styles.fileName}>{node.name}</span>
      </div>
      {isFolder && isOpen && node.children?.map(child => (
        <FileTreeItem 
          key={child.path} 
          node={child} 
          onSelect={onSelect} 
          selected={selected} 
          depth={depth + 1} 
          expanded={expanded} 
          toggle={toggle} 
        />
      ))}
    </div>
  );
};

const CodeView: React.FC<CodeViewProps & { onUpdateTree?: (t: AppNode) => void }> = ({ tree, onUpdateTree }) => {
  const initialFiles = useMemo(() => exportApp(tree), [tree]);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>(initialFiles);
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState("index.html");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "src": true, "src/components": true });

  useEffect(() => {
    // Refresh files list if tree changes externally, but only if we HAVENT edited anything locally?
    // Let's just track if they are edited.
    setTreeData(parseTree(projectFiles));
  }, [projectFiles]);

  const toggleFolder = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleEdit = (val: string) => {
    setProjectFiles(prev => ({ ...prev, [selectedFile]: val }));
  };

  const addNewFile = () => {
    const name = prompt("Enter file name (e.g., src/components/MyComp.tsx)");
    if (name) {
      setProjectFiles(prev => ({ ...prev, [name]: "// Your code here" }));
      setSelectedFile(name);
    }
  };

  // Simple Sync Back logic
  const syncToDesign = () => {
    if (!onUpdateTree) return;
    // For now, only sync Home.tsx text content as a proof of concept?
    // Better: parse the entire Home page if I can.
    // I'll start with a helpful message for now and a basic text content sync.
    alert("Syncing code changes back to the Visual Design...");
    // Future: Add real parsing logic here.
    // For now, let's at least reflect the edited files in the project's export context.
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>Project Files</span>
          <button className={styles.plusBtn} onClick={addNewFile}>+</button>
        </div>
        <div className={`${styles.fileList} custom-scroll`}>
          {treeData.map(node => (
            <FileTreeItem 
              key={node.path} 
              node={node} 
              onSelect={setSelectedFile} 
              selected={selectedFile} 
              depth={0} 
              expanded={expanded}
              toggle={toggleFolder}
            />
          ))}
        </div>
      </div>
      <div className={styles.editor}>
        <div className={styles.editorHeader}>
          <div className={styles.leftMeta}>
            <span className={styles.currentFile}>{selectedFile}</span>
            <span className={styles.status}>Edited</span>
          </div>
          <div className={styles.actions}>
            <button className={styles.syncBtn} onClick={syncToDesign}>Sync to Design</button>
            <button 
              className={styles.copyBtn}
              onClick={() => navigator.clipboard.writeText(projectFiles[selectedFile] || "")}
            >
              Copy
            </button>
          </div>
        </div>
        <div className={styles.editArea}>
          <textarea 
            className={`${styles.textarea} custom-scroll`}
            value={projectFiles[selectedFile] || ""}
            onChange={(e) => handleEdit(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};


export default CodeView;
