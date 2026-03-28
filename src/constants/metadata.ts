import type { ComponentMetadata, LibraryCategories, DefaultStyles, ThreeDComponent } from "../types";
import { THEME } from "./theme";

export const META: Record<string, ComponentMetadata> = {
  section:    { label:"Section",    tag:"section", cat:"Layout",     icon:"▤",  color:"#4f6ef7", content:"" },
  container:  { label:"Container",  tag:"div",     cat:"Layout",     icon:"▣",  color:"#4f6ef7", content:"" },
  grid:       { label:"Grid",       tag:"div",     cat:"Layout",     icon:"⊞",  color:"#4f6ef7", content:"" },
  "flex-row": { label:"Flex Row",   tag:"div",     cat:"Layout",     icon:"↔",  color:"#4f6ef7", content:"" },
  "flex-col": { label:"Flex Col",   tag:"div",     cat:"Layout",     icon:"↕",  color:"#4f6ef7", content:"" },
  div:        { label:"Div",        tag:"div",     cat:"Layout",     icon:"◻",  color:"#4f6ef7", content:"" },
  navbar:     { label:"Navbar",     tag:"nav",     cat:"Navigation", icon:"▬",  color:"#06b6d4", content:"" },
  sidebar:    { label:"Sidebar",    tag:"aside",   cat:"Navigation", icon:"▤",  color:"#06b6d4", content:"" },
  footer:     { label:"Footer",     tag:"footer",  cat:"Navigation", icon:"▬",  color:"#06b6d4", content:"" },
  text:       { label:"Text",       tag:"p",       cat:"Basic",      icon:"T",  color:"#22d3ee", content:"Text block" },
  heading:    { label:"Heading",    tag:"h2",      cat:"Basic",      icon:"H",  color:"#22d3ee", content:"Heading" },
  image:      { label:"Image",      tag:"img",     cat:"Basic",      icon:"⬚",  color:"#f59e0b", content:"" },
  button:     { label:"Button",     tag:"button",  cat:"Basic",      icon:"⬛", color:"#ec4899", content:"Button" },
  input:      { label:"Input",      tag:"input",   cat:"Basic",      icon:"▭",  color:"#ec4899", content:"" },
  card:       { label:"Card",       tag:"div",     cat:"Basic",      icon:"▪",  color:"#8b5cf6", content:"" },
  modal:      { label:"Modal",      tag:"div",     cat:"Advanced",   icon:"◫",  color:"#f43f5e", content:"" },
  tabs:       { label:"Tabs",       tag:"div",     cat:"Advanced",   icon:"⊟",  color:"#f43f5e", content:"" },
  accordion:  { label:"Accordion",  tag:"div",     cat:"Advanced",   icon:"≡",  color:"#f43f5e", content:"" },
};

export const LIB: LibraryCategories = {
  Layout:     ["section","container","grid","flex-row","flex-col","div"],
  Navigation: ["navbar","sidebar","footer"],
  Basic:      ["text","heading","image","button","input","card"],
  Advanced:   ["modal","tabs","accordion"],
};

export const DEF: DefaultStyles = {
  section:    { width:"100%", minHeight:"120px", padding:"24px", backgroundColor:"transparent" },
  container:  { width:"100%", maxWidth:"1200px", padding:"16px", margin:"0 auto" },
  grid:       { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px", padding:"16px" },
  "flex-row": { display:"flex", flexDirection:"row", gap:"12px", padding:"12px", alignItems:"flex-start" },
  "flex-col": { display:"flex", flexDirection:"column", gap:"12px", padding:"12px" },
  div:        { padding:"8px", minWidth:"80px", minHeight:"40px" },
  navbar:     { width:"100%", height:"64px", backgroundColor:"#1a1a2e", display:"flex", alignItems:"center", padding:"0 24px", gap:"16px" },
  sidebar:    { width:"240px", minHeight:"400px", backgroundColor:"#16213e", padding:"16px" },
  footer:     { width:"100%", height:"80px", backgroundColor:"#1a1a2e", display:"flex", alignItems:"center", padding:"0 24px" },
  text:       { fontSize:"14px", color:"#e0e0e0", lineHeight:"1.6" },
  heading:    { fontSize:"28px", fontWeight:"700", color:"#ffffff", lineHeight:"1.2" },
  image:      { width:"200px", height:"150px", backgroundColor:"#2a2a3e", borderRadius:"8px" },
  button:     { padding:"10px 20px", backgroundColor:THEME.A, color:"#fff", borderRadius:"6px", fontWeight:"600", cursor:"pointer", border:"none", fontSize:"14px", display:"inline-flex", alignItems:"center", justifyContent:"center" },
  input:      { padding:"10px 14px", backgroundColor:"#1a1a2e", border:"1px solid #3a3a5e", borderRadius:"6px", color:"#e0e0e0", width:"220px", fontSize:"14px" },
  card:       { padding:"20px", backgroundColor:"#1e1e32", borderRadius:"12px", border:"1px solid #2a2a4e", minWidth:"200px", minHeight:"120px" },
  modal:      { padding:"24px", backgroundColor:"#1e1e32", borderRadius:"16px", border:"1px solid #3a3a5e", minWidth:"320px" },
  tabs:       { width:"100%", borderBottom:"2px solid #3a3a5e" },
  accordion:  { width:"100%", borderRadius:"8px", overflow:"hidden" },
};

export const COMP3D: ThreeDComponent[] = [
  { type:"card3d",    label:"3D Card",        icon:"⬡", desc:"Perspective depth card" },
  { type:"panel3d",   label:"3D Panel",       icon:"◈", desc:"Floating glass panel" },
  { type:"floatBtn",  label:"Float Button",   icon:"◎", desc:"Elevated action button" },
  { type:"glassCard", label:"Glass Card",     icon:"◻", desc:"Frosted glass surface" },
  { type:"holoCard",  label:"Holo Card",      icon:"✦", desc:"Holographic iridescent" },
  { type:"sphere3d",  label:"3D Sphere",      icon:"●", desc:"Sphere primitive" },
  { type:"text3d",    label:"3D Text",        icon:"T", desc:"Extruded 3D typography" },
];
