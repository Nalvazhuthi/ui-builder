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
