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
import AdvancedPanel from "./AdvancedPanel";
import LogicInspector from "./LogicInspector";

import AlignmentGrid from "./components/AlignmentGrid";

import { find } from "../../../utils/treeUtils";

interface InspectorProps {
  selIds: string[];
  tree: AppNode;
  onStyle: (id: string, style: StyleProps) => void;
  onContent: (id: string, content: string) => void;
  onRename: (id: string, name: string) => void;
  onReset: (id: string) => void;
  onUpdateLogic: (id: string, eventType: string, logic: any) => void;
}

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
      <div className={styles.grid2}>
        <div className={styles.compactField}>
          <span className={styles.fieldLabel}>X</span>
          <PropertyInput value={x} onChange={(v) => update(v, y, b, s, c)} />
        </div>
        <div className={styles.compactField}>
          <span className={styles.fieldLabel}>Y</span>
          <PropertyInput value={y} onChange={(v) => update(x, v, b, s, c)} />
        </div>
        <div className={styles.compactField}>
          <span className={styles.fieldLabel}>Blur</span>
          <PropertyInput value={b} onChange={(v) => update(x, y, v, s, c)} />
        </div>
        <div className={styles.compactField}>
          <span className={styles.fieldLabel}>Spread</span>
          <PropertyInput value={s} onChange={(v) => update(x, y, b, v, c)} />
        </div>
      </div>
      <div className={styles.colorSwatchRow}>
        <div className={styles.swatchPreview} style={{ backgroundColor: c }} />
        <ColorPicker value={c} onChange={(v) => update(x, y, b, s, v)} />
      </div>
    </div>
  );
};

const BoxModel: React.FC<{ prefix: string, label: string, style: StyleProps, onChange: (s: StyleProps) => void }> = ({
  prefix, label, style, onChange
}) => {
  const sides = [["T", "Top"], ["R", "Right"], ["B", "Bottom"], ["L", "Left"]];
  return (
    <div className={styles.compactField}>
      <span className={styles.fieldLabel} style={{ marginBottom: "2px", opacity: 0.6 }}>{label}</span>
      <div className={styles.spacingGrid}>
        {sides.map(([l, full]) => {
          const k = prefix === "border" ? `border${full}Width` : `${prefix}${full}`;
          return (
            <div key={k} className={styles.spacingItem}>
              <span className={styles.sideLabel}>{l}</span>
              <PropertyInput 
                value={style[k] || "0"} 
                onChange={(v) => onChange({ [k]: v })} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Inspector: React.FC<InspectorProps> = ({ 
  selIds, tree, onStyle, onContent, onRename, onReset, onUpdateLogic 
}) => {
  const [panel, setPanel] = useState<"design" | "adv" | "logic">("design");
  const [open, setOpen] = useState({
    layout: true, size: true, spacing: true, fill: true, stroke: false, typo: false, effects: false
  });

  const toggle = (k: keyof typeof open) => setOpen(o => ({ ...o, [k]: !o[k] }));

  if (selIds.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✦</div>
        <div className={styles.emptyText}>Select an element<br />to edit its properties</div>
      </div>
    );
  }

  if (selIds.length > 1) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📑</div>
        <div className={styles.emptyText}>{selIds.length} elements selected<br />Press Ctrl+G to Group</div>
      </div>
    );
  }

  const node = find(tree, selIds[0]);
  if (!node) return null;

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
            spellCheck={false}
          />
          <div className={styles.headerActions}>
            <button onClick={handleExport} className={styles.typeBadge} title="Export as ZIP">
              Export
            </button>
          </div>
        </div>
        
        <div className={styles.panelTabs}>
          {[["design", "Design"], ["logic", "Logic"], ["adv", "Vars"]].map(([p, l]) => (
            <button
              key={p}
              onClick={() => setPanel(p as "design" | "adv" | "logic")}
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
            {["text", "heading", "button", "image", "icon"].includes(node.type) && (
              <Section label="Content" open={true} onToggle={() => { }}>
                <div className={styles.contentEditor}>
                  {node.type === "image" ? (
                    <div className={styles.imageUploadGrp}>
                      <div className={styles.propRow}>
                        <span className={styles.propLabel}>URL</span>
                        <div className={styles.propValue}>
                          <Input 
                            value={node.content} 
                            onChange={(e) => onContent(node.id, e.target.value)} 
                            placeholder="https://..."
                            variant="ghost"
                          />
                        </div>
                      </div>
                      <div className={styles.uploadRow}>
                        <input 
                          type="file" accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => onContent(node.id, re.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : node.type === "icon" ? (
                    <div className={styles.imageUploadGrp}>
                      <div className={styles.propRow}>
                        <span className={styles.propLabel}>Icon</span>
                        <div className={styles.propValue}>
                          <Select 
                            value={node.content || "user"} 
                            options={["user", "home", "search", "settings", "bell"]} 
                            onChange={(e) => onContent(node.id, e.target.value)} 
                            variant="ghost"
                          />
                        </div>
                      </div>
                      <div className={styles.uploadRow}>
                        <input 
                          type="file" accept=".svg" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => onContent(node.id, `svg:${re.target?.result as string}`);
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={node.content}
                      onChange={(e) => onContent(node.id, e.target.value)}
                      className={styles.contentTextArea}
                      placeholder="Type content..."
                      spellCheck={false}
                    />
                  )}
                </div>
              </Section>
            )}

            {node.type === "image" && (
              <Section label="Image Scaling" open={true} onToggle={() => { }}>
                <div className={styles.fieldGrp}>
                  <Field label="Object Fit">
                    <Select 
                      value={s.objectFit || "cover"} 
                      options={["cover", "contain", "fill", "none", "scale-down"]} 
                      onChange={(e) => set("objectFit", e.target.value)} 
                    />
                  </Field>
                  <Field label="Object Position">
                    <Input 
                      value={s.objectPosition || "center"} 
                      onChange={(e) => set("objectPosition", e.target.value)} 
                      placeholder="e.g. center or 50% 50%"
                    />
                  </Field>
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

            <Section label="Layout" open={open.layout} onToggle={() => toggle("layout")}>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Display</span>
                <div className={styles.propValue}>
                  <Select 
                    value={s.display || "block"} 
                    options={["block", "flex", "grid", "inline", "none"]} 
                    onChange={(e) => set("display", e.target.value)} 
                    variant="ghost"
                  />
                </div>
              </div>
              
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Position</span>
                <div className={styles.propValue}>
                  <Select 
                    value={s.position || "relative"} 
                    options={["relative", "absolute", "fixed", "sticky", "static"]} 
                    onChange={(e) => set("position", e.target.value)} 
                    variant="ghost"
                  />
                </div>
              </div>

              {(s.display === "flex" || s.display === "inline-flex") && (
                <div style={{ padding: "8px 0" }}>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Direction</span>
                    <div className={styles.propValue}>
                      <TogGrp 
                        val={(s.flexDirection as string) || "row"} 
                        ch={(v) => set("flexDirection", v)} 
                        opts={[["row", "→", "Horizontal"], ["column", "↓", "Vertical"]]} 
                      />
                    </div>
                  </div>

                  <div className={styles.propRow} style={{ alignItems: "flex-start", marginTop: "8px" }}>
                    <span className={styles.propLabel}>Alignment</span>
                    <div className={styles.propValue} style={{ justifyContent: "space-between", width: "100%" }}>
                      <AlignmentGrid 
                        justify={(s.justifyContent as string) || "flex-start"}
                        align={(s.alignItems as string) || "stretch"}
                        onChange={(j, a) => sm({ justifyContent: j, alignItems: a })}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                         <Field label="Gap">
                          <PropertyInput 
                            value={s.gap || "0"} 
                            onChange={(v) => set("gap", v)} 
                          />
                        </Field>
                        <TogGrp 
                          val={(s.flexWrap as string) || "nowrap"} 
                          ch={(v) => set("flexWrap", v)} 
                          opts={[
                            ["nowrap", "→", "No Wrap"],
                            ["wrap", "↩", "Wrap"]
                          ]} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {s.display === "grid" && (
                <div className={styles.gridConfig}>
                  <div className={styles.grid2}>
                    <Field label="Cols">
                      <Input value={(s.gridTemplateColumns as string) || "1fr 1fr"} onChange={(e) => set("gridTemplateColumns", e.target.value)} variant="ghost" />
                    </Field>
                    <Field label="Gap">
                      <PropertyInput value={s.gap || "0px"} onChange={(v) => set("gap", v)} />
                    </Field>
                  </div>
                </div>
              )}
            </Section>
            <Section label="Frame" open={open.size} onToggle={() => toggle("size")}>
              <div className={styles.grid2}>
                <div className={styles.compactField}>
                  <span className={styles.fieldLabel}>W</span>
                  <PropertyInput value={s.width || "auto"} onChange={(v) => set("width", v)} />
                </div>
                <div className={styles.compactField}>
                  <span className={styles.fieldLabel}>H</span>
                  <PropertyInput value={s.height || "auto"} onChange={(v) => set("height", v)} />
                </div>
              </div>
              {["absolute", "fixed"].includes(s.position as string) && (
                <div className={styles.grid2}>
                  <div className={styles.compactField}>
                    <span className={styles.fieldLabel}>X (Left)</span>
                    <PropertyInput value={s.left || "0"} onChange={(v) => set("left", v)} />
                  </div>
                  <div className={styles.compactField}>
                    <span className={styles.fieldLabel}>Y (Top)</span>
                    <PropertyInput value={s.top || "0"} onChange={(v) => set("top", v)} />
                  </div>
                </div>
              )}
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Radius</span>
                <div className={styles.propValue}>
                  <PropertyInput value={s.borderRadius || "0"} onChange={(v) => set("borderRadius", v)} />
                </div>
              </div>
            </Section>

            {/* Flex Child Section - Only show if parent has flex/grid */}
            <Section label="Flex Item" open={true} onToggle={() => { }}>
              <div className={styles.grid2}>
                <div className={styles.compactField}>
                  <span className={styles.fieldLabel}>Flex</span>
                  <Input 
                    value={(s.flex as string) || ""} 
                    onChange={(e) => set("flex", e.target.value)} 
                    placeholder="e.g. 1"
                    variant="ghost"
                  />
                </div>
                <div className={styles.compactField}>
                  <span className={styles.fieldLabel}>Align</span>
                  <Select 
                    value={(s.alignSelf as string) || "auto"} 
                    options={["auto", "flex-start", "center", "flex-end", "stretch"]} 
                    onChange={(e) => set("alignSelf", e.target.value)} 
                    variant="ghost" 
                  />
                </div>
              </div>
            </Section>

            <Section label="Spacing" open={open.spacing} onToggle={() => toggle("spacing")}>
              <BoxModel prefix="padding" label="Padding" style={s} onChange={sm} />
              <div style={{ marginTop: "12px" }}>
                <BoxModel prefix="margin" label="Margin" style={s} onChange={sm} />
              </div>
            </Section>

            <Section label="Fill" open={open.fill} onToggle={() => toggle("fill")}>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Background</span>
                <div className={styles.propValue}>
                   <div className={styles.colorSwatchRow}>
                    <div className={styles.swatchPreview} style={{ backgroundColor: (s.backgroundColor as string) || "transparent" }} />
                    <ColorPicker 
                      value={(s.backgroundColor as string) || ""} 
                      onChange={(v) => set("backgroundColor", v)} 
                      showNone 
                    />
                  </div>
                </div>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Opacity</span>
                <div className={styles.propValue}>
                  <div className={styles.rangeContainer}>
                    <input 
                      type="range" min={0} max={1} step={0.01}
                      value={parseFloat((s.opacity as string) ?? "1")}
                      onChange={(e) => set("opacity", +e.target.value)}
                      className={styles.range}
                    />
                    <span className={styles.rangeVal}>{Math.round(parseFloat((s.opacity as string) ?? "1") * 100)}%</span>
                  </div>
                </div>
              </div>
            </Section>

            <Section label="Stroke" open={open.stroke} onToggle={() => toggle("stroke")}>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Color</span>
                <div className={styles.propValue}>
                  <div className={styles.colorSwatchRow}>
                    <div className={styles.swatchPreview} style={{ backgroundColor: (s.borderColor as string) || "transparent" }} />
                    <ColorPicker value={(s.borderColor as string) || ""} onChange={(v) => set("borderColor", v)} />
                  </div>
                </div>
              </div>
              <div className={styles.grid2}>
                <div className={styles.compactField}>
                  <span className={styles.fieldLabel}>Width</span>
                  <PropertyInput 
                    value={s.borderWidth || "0"} 
                    onChange={(v) => set("borderWidth", v)} 
                  />
                </div>
                <div className={styles.compactField}>
                  <span className={styles.fieldLabel}>Style</span>
                  <Select 
                    value={(s.borderStyle as string) || "none"} 
                    options={["none", "solid", "dashed", "dotted"]} 
                    onChange={(e) => set("borderStyle", e.target.value)} 
                    variant="ghost"
                  />
                </div>
              </div>
            </Section>

            <Section label="Effects" open={open.effects} onToggle={() => toggle("effects")}>
              <div className={styles.propRow} style={{ alignItems: "flex-start", paddingTop: "8px" }}>
                <span className={styles.propLabel}>Shadow</span>
                <div className={styles.propValue}>
                  <ShadowEditor value={(s.boxShadow as string) || ""} onChange={(v) => set("boxShadow", v)} />
                </div>
              </div>
            </Section>

            {["text", "heading", "button", "input"].includes(node.type) && (
              <Section label="Type" open={open.typo} onToggle={() => toggle("typo")}>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Font</span>
                  <div className={styles.propValue}>
                    <Select 
                      value={(s.fontFamily as string) || "inherit"} 
                      options={["Inter", "Outfit", "system-ui", "monospace"]} 
                      onChange={(e) => set("fontFamily", e.target.value)} 
                      variant="ghost"
                    />
                  </div>
                </div>
                <div className={styles.grid2}>
                   <div className={styles.compactField}>
                    <span className={styles.fieldLabel}>Weight</span>
                    <Select 
                      value={(s.fontWeight as string) || "400"} 
                      options={["100", "200", "300", "400", "500", "600", "700", "800", "900"]} 
                      onChange={(e) => set("fontWeight", e.target.value)} 
                      variant="ghost"
                    />
                  </div>
                  <div className={styles.compactField}>
                    <span className={styles.fieldLabel}>Size</span>
                    <PropertyInput value={s.fontSize || "14px"} onChange={(v) => set("fontSize", v)} />
                  </div>
                </div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Align</span>
                  <div className={styles.propValue}>
                    <TogGrp 
                      val={(s.textAlign as string) || "left"} 
                      ch={(v) => set("textAlign", v)} 
                      opts={[["left", "≡"], ["center", "≣"], ["right", "≡"], ["justify", "≋"]]} 
                    />
                  </div>
                </div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Color</span>
                  <div className={styles.propValue}>
                    <div className={styles.colorSwatchRow}>
                      <div className={styles.swatchPreview} style={{ backgroundColor: (s.color as string) || "#fff" }} />
                      <ColorPicker value={(s.color as string) || "#fff"} onChange={(v) => set("color", v)} />
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* Reset Button */}
            <div className={styles.resetContainer}>
              <Button variant="danger" onClick={() => onReset(node.id)} className={styles.resetBtn}>
                ↺ Reset all styles
              </Button>
            </div>
          </>
        ) : panel === "logic" ? (
          <LogicInspector 
            node={node} 
            onUpdateLogic={(eventType: string, logic: any) => onUpdateLogic(node.id, eventType, logic)} 
          />
        ) : (
          <AdvancedPanel node={node} onStyle={onStyle} />
        )}
      </div>
    </div>
  );
};


export default Inspector;
