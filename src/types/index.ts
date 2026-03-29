export interface StyleProps {
  [key: string]: string | number | undefined;
}

export interface AppNode {
  id: string;
  type: string;
  name: string;
  content: string;
  style: StyleProps;
  locked: boolean;
  hidden: boolean;
  children: AppNode[];
  _vars?: string;
  isMaster?: boolean;
  masterId?: string;
  masters?: Record<string, AppNode>;
  logic?: Record<string, LogicFlow>; // eventType -> LogicFlow
  variables?: LogicVariable[]; // local variables
}

export interface LogicVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'any';
  defaultValue: any;
}

export interface LogicRegistry {
  globals: LogicVariable[];
  functions: Record<string, LogicFlow>;
}

export interface LogicFlow {
  id: string;
  nodes: LogicNode[];
  edges: LogicEdge[];
}

export interface LogicNode {
  id: string;
  type?: string;
  data: any;
  position: { x: number; y: number };
  [key: string]: any;
}

export interface LogicEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  [key: string]: any;
}

export interface ComponentMetadata {
  label: string;
  tag: string;
  cat: string;
  icon: string;
  color: string;
  content: string;
}

export interface LibraryCategories {
  [key: string]: string[];
}

export interface DefaultStyles {
  [key: string]: StyleProps;
}

export interface ThreeDComponent {
  type: string;
  label: string;
  icon: string;
  desc: string;
}

export type Breakpoint = "mobile" | "tablet" | "desktop" | "tv";
