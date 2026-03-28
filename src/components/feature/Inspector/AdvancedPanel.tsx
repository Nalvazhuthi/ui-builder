import React, { useState } from "react";
import styles from "./Inspector.module.scss";
import type { AppNode, StyleProps } from "../../../types";
import Section from "../../ui/Section/Section";
import Field from "../../ui/Field/Field";
import Select from "../../ui/Select/Select";
import Input from "../../ui/Input/Input";

interface AdvancedPanelProps {
  node: AppNode;
  onStyle: (id: string, style: StyleProps) => void;
}

const AdvancedPanel: React.FC<AdvancedPanelProps> = ({ node, onStyle }) => {
  const s = node.style || {};
  const set = (k: string, v: any) => onStyle(node.id, { ...s, [k]: v });

  // Derive "slots" based on node type
  const isCard = node.type === "card";
  const isButton = node.type === "button";
  const isInput = node.type === "input";
  const isImage = node.type === "image";
  const isContainer = ["section", "container", "grid", "flex-row", "flex-col", "div", "card", "modal", "navbar", "sidebar", "footer"].includes(node.type);

  const [vars, setVarsRaw] = useState(() => {
    try { 
      const v = (node as any)._vars || "{}";
      return JSON.parse(v); 
    } catch { return {}; }
  });

  const setVar = (k: string, v: string) => {
    const nv = { ...vars, [k]: v };
    setVarsRaw(nv);
    onStyle(node.id, { ...s, _vars: JSON.stringify(nv) } as any);
  };

  const remVar = (k: string) => {
    const nv = { ...vars };
    delete nv[k];
    setVarsRaw(nv);
    onStyle(node.id, { ...s, _vars: JSON.stringify(nv) } as any);
  };

  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const addVar = () => {
    if (newKey.trim()) {
      setVar(newKey.trim(), newVal);
      setNewKey("");
      setNewVal("");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <Section label="Component Role" open={true} onToggle={() => { }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <Field label="Role">
            <Select 
              value={(s._role as string) || "ui"} 
              options={["ui", "data", "layout", "navigation", "form", "display"]} 
              onChange={(e) => set("_role", e.target.value)} 
            />
          </Field>
          <Field label="Variant">
            <Select 
              value={(s._variant as string) || "default"} 
              options={["default", "primary", "secondary", "ghost", "danger", "success"]} 
              onChange={(e) => set("_variant", e.target.value)} 
            />
          </Field>
        </div>
      </Section>

      {/* Conditional sections based on type */}
      {isCard && (
        <Section label="Card Slots" open={true} onToggle={() => { }}>
          {[["hasImage", "Has image slot"], ["hasTitle", "Has title slot"], ["hasBody", "Has body slot"]].map(([k, l]) => (
            <SlotToggle key={k} label={l} active={!!vars[k]} onToggle={(v) => v ? setVar(k, "true") : remVar(k)} />
          ))}
        </Section>
      )}

      {/* Custom CSS Variables */}
      <Section label="CSS Variables" open={true} onToggle={() => { }}>
        <div style={{ fontSize: 10, color: "#444455", marginBottom: 8, lineHeight: 1.5 }}>Custom CSS variables scope.</div>
        {Object.entries(vars).filter(([k]) => !k.startsWith("has") && !k.startsWith("is")).map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "#7c5cfc", fontFamily: "monospace", flexShrink: 0 }}>--</span>
            <input value={k} readOnly className={styles.varLabel} />
            <input value={v as string} onChange={e => setVar(k, e.target.value)} className={styles.varValue} />
            <span onClick={() => remVar(k)} className={styles.remVar}>✕</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
          <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="var-name" />
          <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="value" />
          <button onClick={addVar} className={styles.addVarBtn}>+</button>
        </div>
      </Section>
    </div>
  );
};

// Internal toggle component (could be moved to UI if used elsewhere)
const SlotToggle: React.FC<{ label: string, active: boolean, onToggle: (v: boolean) => void }> = ({
  label, active, onToggle
}) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
    <span style={{ fontSize: 11, color: active ? "#f0f0ff" : "#888899" }}>{label}</span>
    <button
      onClick={() => onToggle(!active)}
      className={`${styles.toggle} ${active ? styles.toggleActive : ""}`}
    >
      <div className={`${styles.toggleHandle} ${active ? styles.handleActive : ""}`} />
    </button>
  </div>
);

export default AdvancedPanel;
