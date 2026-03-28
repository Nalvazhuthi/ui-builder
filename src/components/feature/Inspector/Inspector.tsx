import React, { useState } from "react";
import styles from "./Inspector.module.scss";
import type { AppNode, StyleProps } from "../../../types";
import { META } from "../../../constants/metadata";
import { exportComp, dlFiles } from "../../../utils/exportEngine";
import Button from "../../ui/Button/Button";
import Section from "../../ui/Section/Section";
import Field from "../../ui/Field/Field";
import Input from "../../ui/Input/Input";
import Select from "../../ui/Select/Select";
import ColorPicker from "../../ui/ColorPicker/ColorPicker";
import TogGrp from "../../ui/TogGrp/TogGrp";
import PropertyInput from "../../ui/PropertyInput/PropertyInput";
import AdvancedPanel from "./AdvancedPanel.tsx";

interface InspectorProps {
  node: AppNode | null;
  onStyle: (id: string, style: StyleProps) => void;
  onContent: (id: string, content: string) => void;
  onRename: (id: string, name: string) => void;
  onReset: (id: string) => void;
}

const Inspector: React.FC<InspectorProps> = ({ node, onStyle, onContent, onRename, onReset }) => {
  const [panel, setPanel] = useState<"design" | "adv">("design");
  const [open, setOpen] = useState({
    layout: true, size: true, spacing: true, fill: true, stroke: false, typo: false, effects: false
  });

  const toggle = (k: keyof typeof open) => setOpen(o => ({ ...o, [k]: !o[k] }));

  if (!node) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>◻</div>
        <div className={styles.emptyText}>Select an element<br />to edit its properties</div>
      </div>
    );
  }

  const s = node.style || {};
  const m = META[node.type] || {};

  const set = (k: string, v: any) => onStyle(node.id, { ...s, [k]: v });
  const clr = (k: string) => {
    const ns = { ...s };
    delete ns[k];
    onStyle(node.id, ns);
  };
  const sm = (o: StyleProps) => onStyle(node.id, { ...s, ...o });

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { nm, tsx, idx, scss } = exportComp(node);
    await dlFiles({
      [`${nm}/${nm}.tsx`]: tsx,
      [`${nm}/${nm}.module.scss`]: scss,
      [`${nm}/index.ts`]: idx
    }, `${nm}.zip`);
  };

  return (
    <div className={styles.inspector}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.nodeInfo}>
          <span className={styles.icon} style={{ color: m.color }}>{m.icon || "◻"}</span>
          <input
            value={node.name}
            onChange={(e) => onRename(node.id, e.target.value)}
            className={styles.nameInput}
          />
          <div className={styles.headerActions}>
            <Button variant="tb" size="sm" onClick={handleExport} className={styles.zipBtn}>
              ↓ ZIP
            </Button>
            <span className={styles.typeBadge}>{node.type}</span>
          </div>
        </div>
        
        <div className={styles.panelTabs}>
          {[["design", "Design"], ["adv", "Variables"]].map(([p, l]) => (
            <button
              key={p}
              onClick={() => setPanel(p as "design" | "adv")}
              className={`${styles.tab} ${panel === p ? styles.tabActive : ""}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.scrollContent} custom-scroll`}>
        {panel === "design" ? (
          <>
            {/* Content Section */}
            {["text", "heading", "button"].includes(node.type) && (
              <Section label="Content" open={true} onToggle={() => { }}>
                <div className={styles.contentEditor}>
                  <textarea
                    value={node.content}
                    onChange={(e) => onContent(node.id, e.target.value)}
                    className={styles.contentTextArea}
                    placeholder="Type content..."
                  />
                  <div className={styles.contentFooter}>
                    <span>{node.content?.length || 0} chars</span>
                  </div>
                </div>
              </Section>
            )}

            {node.id === "root" && (
              <Section label="Design Variables" open={open.layout} onToggle={() => toggle("layout")}>
                <div className={styles.fieldGrp}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                    Define CSS variables (e.g., --primary) and their values here. You can then use var(--primary) in any style input!
                  </div>
                  {Object.keys(s).filter(k => k.startsWith("--")).map(k => (
                    <div key={k} className={styles.grid2} style={{ marginBottom: '8px', alignItems: 'center' }}>
                      <Input 
                        value={k} 
                        onChange={(e) => {
                          const val = s[k];
                          const newK = e.target.value.trim();
                          if (newK !== k) {
                            onStyle(node.id, { [k]: undefined, [newK || k]: val });
                          }
                        }} 
                        placeholder="--name"
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Input 
                          value={s[k] || ""} 
                          onChange={(e) => sm({ [k]: e.target.value })} 
                          placeholder="value"
                        />
                        <button className={styles.actionBtn} onClick={() => clr(k)}>✕</button>
                      </div>
                    </div>
                  ))}
                  <button 
                    style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px dashed #444', color: '#aaa', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}
                    onClick={() => sm({ [`--var-${Math.floor(Math.random()*1000)}`]: "#ffffff" })}
                  >
                    + Add Variable
                  </button>
                </div>
              </Section>
            )}

            {/* Layout Section */}
            <Section label="Layout" open={open.layout} onToggle={() => toggle("layout")}>
              <div className={styles.grid2}>
                <Field label="Display">
                  <Select 
                    value={s.display || "block"} 
                    options={["block", "flex", "grid", "inline", "inline-flex", "none"]} 
                    onChange={(e) => set("display", e.target.value)} 
                  />
                </Field>
                <Field label="Position">
                  <Select 
                    value={s.position || "relative"} 
                    options={["relative", "absolute", "fixed", "sticky", "static"]} 
                    onChange={(e) => set("position", e.target.value)} 
                  />
                </Field>
              </div>
              
              {(s.display === "flex" || s.display === "inline-flex") && (
                <div className={styles.flexConfig}>
                  <TogGrp 
                    label="Direction" 
                    val={(s.flexDirection as string) || "row"} 
                    ch={(v) => set("flexDirection", v)} 
                    opts={[["row", "→", "Row"], ["column", "↓", "Column"], ["row-reverse", "←", "Row Reverse"], ["column-reverse", "↑", "Column Reverse"]]} 
                  />
                  <div className={styles.flexConfig}>
                    <TogGrp 
                      label="Justify" 
                      val={(s.justifyContent as string) || "flex-start"} 
                      ch={(v) => set("justifyContent", v)} 
                      opts={[
                        ["flex-start", "◰", "Start"],
                        ["center", "◩", "Center"],
                        ["flex-end", "◱", "End"],
                        ["space-between", "◫", "Between"],
                        ["space-around", "⊞", "Around"]
                      ]}
                    />
                    <TogGrp 
                      label="Align" 
                      val={(s.alignItems as string) || "stretch"} 
                      ch={(v) => set("alignItems", v)} 
                      opts={[
                        ["flex-start", "⌅", "Start"],
                        ["center", "⌯", "Center"],
                        ["flex-end", "⌆", "End"],
                        ["stretch", "〓", "Stretch"]
                      ]}
                    />
                    <div className={styles.grid2}>
                      <Field label="Gap">
                        <PropertyInput 
                          value={s.gap || "0px"} 
                          onChange={(v) => set("gap", v)} 
                          onClear={() => clr("gap")}
                          showClear={!!s.gap}
                        />
                      </Field>
                      <Field label="Wrap">
                        <TogGrp 
                          val={(s.flexWrap as string) || "nowrap"} 
                          ch={(v) => set("flexWrap", v)} 
                          opts={[
                            ["nowrap", "→", "No Wrap"],
                            ["wrap", "↩", "Wrap"]
                          ]}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {s.display === "grid" && (
                <div className={styles.gridConfig}>
                  <div className={styles.grid2}>
                    <Field label="Cols">
                      <Input value={(s.gridTemplateColumns as string) || "1fr 1fr"} onChange={(e) => set("gridTemplateColumns", e.target.value)} />
                    </Field>
                    <Field label="Rows">
                      <Input value={(s.gridTemplateRows as string) || ""} onChange={(e) => set("gridTemplateRows", e.target.value)} placeholder="auto" />
                    </Field>
                    <Field label="Gap">
                      <PropertyInput 
                        value={s.gap || "0px"} 
                        onChange={(v) => set("gap", v)} 
                        onClear={() => clr("gap")}
                        showClear={!!s.gap}
                      />
                    </Field>
                  </div>
                </div>
              )}
              
              {(s.position === "absolute" || s.position === "fixed") && (
                <div className={styles.grid4}>
                  {[["T", "top"], ["R", "right"], ["B", "bottom"], ["L", "left"]].map(([l, k]) => (
                    <Field key={k} label={l}>
                      <PropertyInput 
                        value={s[k] || "0px"} 
                        onChange={(v) => set(k, v)} 
                        onClear={() => clr(k)}
                        showClear={s[k] !== undefined}
                      />
                    </Field>
                  ))}
                </div>
              )}
            </Section>

            {/* Size Section */}
            <Section label="Size" open={open.size} onToggle={() => toggle("size")}>
              <div className={styles.grid2}>
                <Field label="Width">
                  <PropertyInput 
                    value={s.width || "auto"} 
                    onChange={(v) => set("width", v)} 
                    onClear={() => clr("width")}
                    showClear={!!s.width}
                  />
                </Field>
                <Field label="Height">
                  <PropertyInput 
                    value={s.height || "auto"} 
                    onChange={(v) => set("height", v)} 
                    onClear={() => clr("height")}
                    showClear={!!s.height}
                  />
                </Field>
                <Field label="Min W">
                  <PropertyInput 
                    value={s.minWidth || "—"} 
                    onChange={(v) => set("minWidth", v)} 
                    onClear={() => clr("minWidth")}
                    showClear={!!s.minWidth}
                  />
                </Field>
                <Field label="Min H">
                  <PropertyInput 
                    value={s.minHeight || "—"} 
                    onChange={(v) => set("minHeight", v)} 
                    onClear={() => clr("minHeight")}
                    showClear={!!s.minHeight}
                  />
                </Field>
              </div>
              <div className={styles.grid2} style={{ marginTop: '8px' }}>
                <Field label="Max W">
                  <PropertyInput 
                    value={s.maxWidth || "—"} 
                    onChange={(v) => set("maxWidth", v)} 
                    onClear={() => clr("maxWidth")}
                    showClear={!!s.maxWidth}
                  />
                </Field>
                <Field label="Max H">
                  <PropertyInput 
                    value={s.maxHeight || "—"} 
                    onChange={(v) => set("maxHeight", v)} 
                    onClear={() => clr("maxHeight")}
                    showClear={!!s.maxHeight}
                  />
                </Field>
              </div>
            </Section>

            {/* Spacing Section */}
            <Section label="Spacing" open={open.spacing} onToggle={() => toggle("spacing")}>
              <BoxModel prefix="padding" label="Padding" style={s} onChange={sm} onClear={clr} />
              <div style={{ marginTop: '16px' }}>
                <BoxModel prefix="margin" label="Margin" style={s} onChange={sm} onClear={clr} />
              </div>
            </Section>

            {/* Fill Section */}
            <Section label="Fill" open={open.fill} onToggle={() => toggle("fill")}>
              <Field label="BG">
                <ColorPicker 
                  value={(s.backgroundColor as string) || ""} 
                  onChange={(v) => set("backgroundColor", v)} 
                  showNone 
                />
              </Field>
              <div className={styles.grid2}>
                <Field label="Radius">
                  <PropertyInput 
                    value={s.borderRadius || "0px"} 
                    onChange={(v) => set("borderRadius", v)} 
                    onClear={() => clr("borderRadius")}
                    showClear={s.borderRadius !== undefined}
                  />
                </Field>
                <Field label="Opacity">
                   <div className={styles.rangeContainer}>
                    <input 
                      type="range" min={0} max={1} step={0.01}
                      value={parseFloat((s.opacity as string) ?? "1")}
                      onChange={(e) => set("opacity", +e.target.value)}
                      className={styles.range}
                    />
                    <span className={styles.rangeVal}>{Math.round(parseFloat((s.opacity as string) ?? "1") * 100)}%</span>
                  </div>
                </Field>
              </div>
            </Section>

            {/* Stroke Section */}
            <Section label="Stroke" open={open.stroke} onToggle={() => toggle("stroke")}>
              <div className={styles.grid2}>
                <Field label="Width">
                  <PropertyInput 
                    value={s.borderWidth || s.borderBottomWidth || s.borderTopWidth || s.borderLeftWidth || s.borderRightWidth || "0px"} 
                    onChange={(v) => {
                      const side = (s as any)._borderSide || "all";
                      sm({
                        borderWidth: side === "all" ? v : "0px",
                        borderTopWidth: side === "top" ? v : undefined,
                        borderBottomWidth: side === "bottom" ? v : undefined,
                        borderLeftWidth: side === "left" ? v : undefined,
                        borderRightWidth: side === "right" ? v : undefined,
                      });
                    }} 
                    onClear={() => sm({ borderWidth: undefined, borderTopWidth: undefined, borderBottomWidth: undefined, borderLeftWidth: undefined, borderRightWidth: undefined })}
                    showClear={!!(s.borderWidth || s.borderBottomWidth || s.borderTopWidth || s.borderLeftWidth || s.borderRightWidth)}
                  />
                </Field>
                <Field label="Side">
                  <Select 
                    value={(s as any)._borderSide || "all"} 
                    options={["all", "top", "bottom", "left", "right"]} 
                    onChange={(e) => {
                      const side = e.target.value;
                      const w = s.borderWidth && s.borderWidth !== "0px" ? s.borderWidth : (s.borderBottomWidth || s.borderTopWidth || s.borderLeftWidth || s.borderRightWidth || "1px");
                      sm({
                        _borderSide: side,
                        borderWidth: side === "all" ? w : "0px",
                        borderTopWidth: side === "top" ? w : undefined,
                        borderBottomWidth: side === "bottom" ? w : undefined,
                        borderLeftWidth: side === "left" ? w : undefined,
                        borderRightWidth: side === "right" ? w : undefined,
                      });
                    }} 
                  />
                </Field>
              </div>
              <div className={styles.grid2} style={{ marginTop: '16px' }}>
                <Field label="Style">
                  <Select 
                    value={(s.borderStyle as string) || "none"} 
                    options={["none", "solid", "dashed", "dotted", "double"]} 
                    onChange={(e) => set("borderStyle", e.target.value)} 
                  />
                </Field>
                <Field label="Color">
                  <ColorPicker value={(s.borderColor as string) || ""} onChange={(v) => set("borderColor", v)} />
                </Field>
              </div>
              
              <div className={styles.grid2} style={{ marginTop: '12px' }}>
                <Field label="Color Opacity">
                   <div className={styles.rangeContainer}>
                    <input 
                      type="range" min={0} max={1} step={0.01}
                      value={(() => {
                        const bc = (s.borderColor as string) || "";
                        if (bc.startsWith("rgba")) {
                          const m = bc.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/);
                          if (m) return parseFloat(m[1]);
                        }
                        return 1;
                      })()}
                      onChange={(e) => {
                        const alpha = e.target.value;
                        let hex = (s.borderColor as string) || "#000000";
                        if (hex.startsWith("rgba")) {
                          set("borderColor", hex.replace(/([0-9.]+)(?=\))/, alpha));
                        } else {
                          hex = hex.replace("#", "");
                          if (hex.length === 3) hex = hex.split("").map(c => c+c).join("");
                          const r = parseInt(hex.substring(0, 2), 16) || 0;
                          const g = parseInt(hex.substring(2, 4), 16) || 0;
                          const b = parseInt(hex.substring(4, 6), 16) || 0;
                          set("borderColor", `rgba(${r}, ${g}, ${b}, ${alpha})`);
                        }
                      }}
                      className={styles.range}
                    />
                  </div>
                </Field>
              </div>
              <div style={{ marginTop: '12px' }}>
                <Field label="Shadow">
                  <ShadowEditor value={(s.boxShadow as string) || ""} onChange={(v) => set("boxShadow", v)} />
                </Field>
              </div>
            </Section>

            {/* Typography Section */}
            {["text", "heading", "button", "input"].includes(node.type) && (
              <Section label="Typography" open={open.typo} onToggle={() => toggle("typo")}>
              <div className={styles.grid2}>
                <Field label="Size">
                  <PropertyInput 
                    value={s.fontSize || "auto"} 
                    onChange={(v) => set("fontSize", v)} 
                    onClear={() => clr("fontSize")}
                    showClear={!!s.fontSize}
                  />
                </Field>
                <Field label="Weight">
                  <Select 
                    value={(s.fontWeight as string) || "400"} 
                    options={["100", "200", "300", "400", "500", "600", "700", "800", "900"]} 
                    onChange={(e) => set("fontWeight", e.target.value)} 
                  />
                </Field>
                <Field label="Line H">
                  <PropertyInput 
                    value={s.lineHeight || "auto"} 
                    units={["px", "%", "em", "rem", ""]}
                    onChange={(v) => set("lineHeight", v)} 
                    onClear={() => clr("lineHeight")}
                    showClear={!!s.lineHeight}
                  />
                </Field>
                <Field label="Letter Spc">
                  <PropertyInput 
                    value={s.letterSpacing || "normal"} 
                    onChange={(v) => set("letterSpacing", v)} 
                    onClear={() => clr("letterSpacing")}
                    showClear={!!s.letterSpacing}
                  />
                </Field>
              </div>
              <Field label="Align">
                <TogGrp 
                  val={(s.textAlign as string) || "left"} 
                  ch={(v) => set("textAlign", v)} 
                  opts={[
                    ["left", "≡", "Left"],
                    ["center", "≣", "Center"],
                    ["right", "≡", "Right"],
                    ["justify", "≋", "Justify"]
                  ]}
                />
              </Field>
              <Field label="Color">
                <ColorPicker 
                  value={(s.color as string) || "#000000"} 
                  onChange={(v) => set("color", v)} 
                />
              </Field>
              <Field label="Font">
                <Select 
                  value={(s.fontFamily as string) || "inherit"} 
                  options={["inherit", "Inter", "Arial", "Roboto", "Georgia", "Courier New", "system-ui"]} 
                  onChange={(e) => set("fontFamily", e.target.value)} 
                />
              </Field>
              <div className={styles.grid2}>
                <Field label="Style">
                  <Select 
                    value={(s.fontStyle as string) || "normal"} 
                    options={["normal", "italic", "oblique"]} 
                    onChange={(e) => set("fontStyle", e.target.value)} 
                  />
                </Field>
                <Field label="Transform">
                  <Select 
                    value={(s.textTransform as string) || "none"} 
                    options={["none", "uppercase", "lowercase", "capitalize"]} 
                    onChange={(e) => set("textTransform", e.target.value)} 
                  />
                </Field>
              </div>
              <Field label="Decoration">
                  <TogGrp 
                    val={(s.textDecoration as string) || "none"} 
                    ch={(v) => set("textDecoration", v)} 
                    opts={[
                      ["none", "✕", "None"],
                      ["underline", "U̲", "Underline"],
                      ["line-through", "S̶", "Strikethrough"]
                    ]}
                  />
              </Field>
            </Section>
            )}

            {/* Reset Button */}
            <div className={styles.resetContainer}>
              <Button variant="danger" onClick={() => onReset(node.id)} className={styles.resetBtn}>
                ↺ Reset all styles
              </Button>
            </div>
          </>
        ) : (
          <AdvancedPanel node={node} onStyle={onStyle} />
        )}
      </div>
    </div>
  );
};

const ShadowEditor: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => {
  const parts = (value || "0px 4px 12px 0px rgba(0,0,0,0.3)").split(/(?!\(.*)\s+(?![^(]*?\))/g);
  const x = parts[0] || "0px";
  const y = parts[1] || "4px";
  const b = parts[2] || "12px";
  const isExtended = parts.length >= 5;
  const s = isExtended ? parts[3] : "0px";
  const c = isExtended ? parts.slice(4).join(" ") : parts[3] || "rgba(0,0,0,0.3)";

  const update = (nx: string, ny: string, nb: string, ns: string, nc: string) => {
    onChange(`${nx || "0px"} ${ny || "0px"} ${nb || "0px"} ${ns || "0px"} ${nc || "rgba(0,0,0,0)"}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div className={styles.grid4}>
        <div>
          <div className={styles.sideLabel}>X</div>
          <PropertyInput value={x} onChange={(v) => update(v, y, b, s, c)} />
        </div>
        <div>
          <div className={styles.sideLabel}>Y</div>
          <PropertyInput value={y} onChange={(v) => update(x, v, b, s, c)} />
        </div>
        <div>
          <div className={styles.sideLabel}>Blur</div>
          <PropertyInput value={b} onChange={(v) => update(x, y, v, s, c)} />
        </div>
        <div>
          <div className={styles.sideLabel}>Spread</div>
          <PropertyInput value={s} onChange={(v) => update(x, y, b, v, c)} />
        </div>
      </div>
      <ColorPicker value={c} onChange={(v) => update(x, y, b, s, v)} />
    </div>
  );
};

// Internal sub-component for Box Model
const BoxModel: React.FC<{ prefix: string, label: string, style: StyleProps, onChange: (s: StyleProps) => void, onClear: (k: string) => void }> = ({
  prefix, label, style, onChange, onClear
}) => {
  const sides = [["T", "Top"], ["R", "Right"], ["B", "Bottom"], ["L", "Left"]];
  return (
    <div className={styles.boxModel}>
      <div className={styles.boxLabel}>{label}</div>
      <div className={styles.grid4}>
        {sides.map(([l, full]) => {
          const k = prefix === "border" ? `border${full}Width` : `${prefix}${full}`;
          return (
            <div key={k}>
              <div className={styles.sideLabel}>{l}</div>
              <PropertyInput 
                value={style[k] || "0"} 
                onChange={(v) => onChange({ [k]: v })} 
                onClear={() => onClear(k)}
                showClear={style[k] !== undefined && style[k] !== "0"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inspector;
