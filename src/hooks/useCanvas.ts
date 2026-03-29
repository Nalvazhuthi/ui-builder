import { useState, useCallback, useEffect } from "react";
import type { AppNode, Breakpoint } from "../types";
import { find, upd, del, ins, dup, getParentId, uid, mkNode, groupNodesInTree, insBefore, insAfter, ids } from "../utils/treeUtils";

export const useCanvas = (initialTree: AppNode) => {
  const [tree, setTree] = useState<AppNode>(() => {
    try {
      const saved = localStorage.getItem("uibuilder_tree");
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Could not load from local storage", e); }
    return initialTree;
  });
  
  useEffect(() => {
    try {
      localStorage.setItem("uibuilder_tree", JSON.stringify(tree));
    } catch (e) { console.error("Could not save to local storage", e); }
  }, [tree]);

  const [history, setHistory] = useState<AppNode[]>([tree]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [selIds, setSelIds] = useState<string[]>([]);
  const selId = selIds[selIds.length - 1] || null;
  const [hovId, setHovId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);
  
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [isResizing, setIsResizing] = useState(false);

  const push = useCallback((t: AppNode) => {
    const nextHistory = [...history.slice(0, historyIndex + 1), t];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setTree(t);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(i => i - 1);
      setTree(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1);
      setTree(history[historyIndex + 1]);
    }
  };

  // Selection handlers
  const select = (id: string | null, multi: boolean = false) => {
    if (!id) { setSelIds([]); setEditId(null); return; }
    if (multi) {
      if (selIds.includes(id)) {
        setSelIds(selIds.filter(i => i !== id));
      } else {
        setSelIds([...selIds, id]);
      }
    } else {
      setSelIds([id]);
    }
    setEditId(null);
  };

  // Node manipulation handlers
  const updateStyle = (id: string, style: any) => push(upd(tree, id, n => ({ ...n, style: { ...n.style, ...style } })));
  const updateContent = (id: string, content: string) => push(upd(tree, id, n => ({ ...n, content })));
  const deleteNode = (id: string) => {
    if (selIds.includes(id)) setSelIds(selIds.filter(i => i !== id));
    push(del(tree, id));
  };
  const duplicateNode = (id: string) => {
    const n = find(tree, id);
    if (!n) return;
    const parentId = getParentId(tree, id);
    if (parentId) push(ins(tree, parentId, dup(n)));
  };
  const toggleHide = (id: string) => push(upd(tree, id, n => ({ ...n, hidden: !n.hidden })));
  const toggleLock = (id: string) => push(upd(tree, id, n => ({ ...n, locked: !n.locked })));
  const renameNode = (id: string, name: string) => push(upd(tree, id, n => ({ ...n, name })));
  const resetStyles = (id: string, defaultStyle: any) => push(upd(tree, id, n => ({ ...n, style: { ...defaultStyle } })));
  
  const updateLogic = (id: string, eventType: string, flow: any) => 
    push(upd(tree, id, n => ({ ...n, logic: { ...(n.logic || {}), [eventType]: flow } })));

  const updateVariables = (id: string, variables: any[]) => 
    push(upd(tree, id, n => ({ ...n, variables })));

  const groupNodes = () => {
    if (selIds.length < 1) return;
    const firstId = selIds[0];
    const parentId = getParentId(tree, firstId);
    if (!parentId) return;

    // Filter selection to only same-parent nodes
    const validIds = selIds.filter(id => getParentId(tree, id) === parentId);
    if (validIds.length === 0) return;

    const group = mkNode("div");
    group.name = "Group";
    group.children = validIds.map(id => find(tree, id)!).filter(Boolean);
    group.style = { display: 'flex', flexDirection: 'row', gap: '8px' }; 

    const nextTree = groupNodesInTree(tree, validIds, group);
    push(nextTree);
    setSelIds([group.id]);
  };

  const createComponent = (id: string) => {
    const node = find(tree, id);
    if (!node) return;
    const masterId = `m-${node.id}`;
    const master = { ...dup(node), id: masterId, isMaster: true, name: `Master: ${node.name}` };
    const instance = { ...dup(node), masterId };
    const nextTree = {
      ...upd(tree, id, () => instance),
      masters: { ...(tree.masters || {}), [masterId]: master }
    } as AppNode;
    push(nextTree);
    setSelIds([instance.id]);
  };

  const useComponent = (masterId: string, parentId: string) => {
    const master = tree.masters?.[masterId];
    if (!master) return;
    const instance = { ...dup(master), id: uid(), isMaster: false, masterId, name: master.name.replace("Master: ", "") };
    push(ins(tree, parentId, instance));
    setSelIds([instance.id]);
  };

  return {
    tree, setTree,
    history, historyIndex,
    undo, redo, push,
    selId, selIds, setSelId: select,
    hovId, setHovId,
    editId, setEditId,
    collapsed, setCollapsed,
    zoom, setZoom,
    panX, setPanX,
    panY, setPanY,
    panning, setPanning,
    panStart, setPanStart,
    isResizing, setIsResizing,
    breakpoint, setBreakpoint,
    updateStyle, updateContent, deleteNode, duplicateNode, toggleHide, toggleLock, renameNode, resetStyles,
    updateLogic, updateVariables,
    groupNodes, createComponent, useComponent,
    onDropInto: (compType: string, targetId: string, position: "before" | "inside" | "after") => {
      const newNode = mkNode(compType);
      if (position === "inside") {
        push(ins(tree, targetId, newNode));
      } else if (position === "before") {
        push(insBefore(tree, targetId, newNode));
      } else {
        push(insAfter(tree, targetId, newNode));
      }
      select(newNode.id);
    },
    onMove: (srcId: string, targetId: string, position: "before" | "inside" | "after") => {
      if (srcId === targetId) return;
      const srcNode = find(tree, srcId);
      if (!srcNode) return;
      if (ids(srcNode).includes(targetId)) return;
      
      let next = del(tree, srcId);
      if (position === "inside") {
        next = ins(next, targetId, srcNode);
      } else if (position === "before") {
        next = insBefore(next, targetId, srcNode);
      } else {
        next = insAfter(next, targetId, srcNode);
      }
      push(next);
    }
  };
};
