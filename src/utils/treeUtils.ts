import type { AppNode } from "../types";
import { META, DEF } from "../constants/metadata";

export const uid = () => `n${Date.now()}${Math.floor(Math.random() * 1000000)}`;

export const mkNode = (t: string): AppNode => ({
  id: uid(),
  type: t,
  name: META[t]?.label || t,
  content: META[t]?.content ?? "",
  style: { ...(DEF[t] || {}) },
  locked: false,
  hidden: false,
  children: []
});

export const find = (t: AppNode, id: string): AppNode | null => {
  if (t.id === id) return t;
  for (const c of t.children || []) {
    const r = find(c, id);
    if (r) return r;
  }
  return null;
};

export const upd = (t: AppNode, id: string, fn: (n: AppNode) => AppNode): AppNode =>
  t.id === id ? fn(t) : { ...t, children: (t.children || []).map(c => upd(c, id, fn)) };

export const del = (t: AppNode, id: string): AppNode => ({
  ...t,
  children: (t.children || []).filter(c => c.id !== id).map(c => del(c, id))
});

export const ins = (t: AppNode, pid: string, n: AppNode): AppNode =>
  t.id === pid ? { ...t, children: [...(t.children || []), n] } : { ...t, children: (t.children || []).map(c => ins(c, pid, n)) };

export const insBefore = (t: AppNode, siblingId: string, newNode: AppNode): AppNode => {
  const ch = t.children || [];
  const idx = ch.findIndex(c => c.id === siblingId);
  if (idx !== -1) {
    const next = [...ch];
    next.splice(idx, 0, newNode);
    return { ...t, children: next };
  }
  return { ...t, children: ch.map(c => insBefore(c, siblingId, newNode)) };
};

export const insAfter = (t: AppNode, siblingId: string, newNode: AppNode): AppNode => {
  const ch = t.children || [];
  const idx = ch.findIndex(c => c.id === siblingId);
  if (idx !== -1) {
    const next = [...ch];
    next.splice(idx + 1, 0, newNode);
    return { ...t, children: next };
  }
  return { ...t, children: ch.map(c => insAfter(c, siblingId, newNode)) };
};

export const ids = (n: AppNode): string[] => [n.id, ...(n.children || []).flatMap(ids)];

export const getAllNodes = (n: AppNode): AppNode[] => [n, ...(n.children || []).flatMap(getAllNodes)];

export const getParentId = (t: AppNode, cid: string): string | null => {
  if ((t.children || []).some(c => c.id === cid)) return t.id;
  for (const c of t.children || []) {
    const r = getParentId(c, cid);
    if (r) return r;
  }
  return null;
};

export const dup = (n: AppNode): AppNode => ({
  ...n,
  id: uid(),
  name: n.name + " Copy",
  children: (n.children || [])?.map(dup)
});

export const toPascal = (raw: string) => {
  const s = raw.replace(/\s+/g, " ").trim().replace(/[^a-zA-Z0-9 ]/g, "");
  return s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("") || "Component";
};

export const groupNodesInTree = (t: AppNode, ids: string[], groupNode: AppNode): AppNode => {
  // If this level contains any of the target IDs, filter them out
  const containsAny = (t.children || []).some(c => ids.includes(c.id));
  
  if (containsAny) {
    const firstIdx = (t.children || []).findIndex(c => ids.includes(c.id));
    const nextChildren = (t.children || []).filter(c => !ids.includes(c.id));
    // Insert group at the position of the first found sibling
    nextChildren.splice(firstIdx, 0, groupNode);
    return { ...t, children: nextChildren };
  }

  return { ...t, children: (t.children || []).map(c => groupNodesInTree(c, ids, groupNode)) };
};
