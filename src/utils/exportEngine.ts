import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { AppNode } from "../types";
import { META } from "../constants/metadata";

export const pNum = (v: any) => {
  const n = parseFloat(String(v || "").replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
};

// camelCase → kebab-case
export const toKebab = (s: string) => s.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);

// Detect layout vs navigation components
const LAYOUT_TYPES = new Set(["navbar", "sidebar", "footer"]);
export const isLayoutType = (t: string) => LAYOUT_TYPES.has(t);

// Sanitise name → PascalCase component name
export const toPascal = (raw: string) => {
  const s = raw.replace(/\s+/g, " ").trim().replace(/[^a-zA-Z0-9 ]/g, "");
  return s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("") || "Component";
};

// Build SCSS for one node, with nested BEM-style children
export function buildScss(n: AppNode, cls: string, depth = 0): string {
  const indent = "  ".repeat(depth);
  const props = Object.entries(n.style || {})
    .filter(([k, v]) => !k.startsWith("_") && v !== undefined && v !== "")
    .map(([k, v]) => `${indent}  ${toKebab(k)}: ${v};`)
    .join("\n");
  
  let block = `${indent}.${cls} {\n${props}`;
  for (const c of n.children || []) {
    const childCls = `${cls}__${toPascal(c.name).toLowerCase()}`;
    block += "\n\n" + buildScss(c, childCls, depth + 1);
  }
  block += `\n${indent}}`;
  return block;
}

// Build JSX string for one node
export function buildJsx(n: AppNode, cls: string, ind = 2): string {
  const m = META[n.type] || {};
  const tag = m.tag || "div";
  const pad = "  ".repeat(ind);
  const childCls = (c: AppNode) => `${cls}__${toPascal(c.name).toLowerCase()}`;
  
  if (tag === "input") return `${pad}<input className={styles.${cls}} placeholder="${n.content || "…"}" />`;
  if (tag === "img") return `${pad}<img   className={styles.${cls}} alt="${n.name}" />`;
  
  const kids = (n.children || []).map(c => buildJsx(c, childCls(c), ind + 1)).join("\n");
  const body = n.content ? `\n${pad}  ${n.content}` : "";
  const childBlock = kids ? `\n${kids}` : "";
  
  return `${pad}<${tag} className={styles.${cls}}>${body}${childBlock}\n${pad}</${tag}>`;
}

// Export a single node as ComponentName/ComponentName.tsx + .module.scss + index.ts
export function exportComp(n: AppNode) {
  const nm = toPascal(n.name);
  const cls = nm.toLowerCase();
  const jsx = buildJsx(n, cls, 2);
  const tsx = `import React from 'react';
import styles from './${nm}.module.scss';

interface ${nm}Props {
  className?: string;
}

const ${nm}: React.FC<${nm}Props> = ({ className }) => {
  return (
${jsx}
  );
};

export default ${nm};
`;
  const idx = `export { default } from './${nm}';\n`;
  const scss = buildScss(n, cls);
  return { nm, tsx, idx, scss };
}

// Full Vite app scaffold
export function exportApp(tree: AppNode, appName: string = "my-awesome-app") {
  const files: Record<string, string> = {};
  const allNodes = tree.children;
  
  // Public directory
  files["public/.gitkeep"] = "";

  // Separate layout vs component nodes
  const layoutNodes = allNodes.filter(n => isLayoutType(n.type));
  const compNodes = allNodes.filter(n => !isLayoutType(n.type));

  // src/components/
  for (const n of compNodes) {
    const { nm, tsx, idx, scss } = exportComp(n);
    files[`src/components/${nm}/${nm}.tsx`] = tsx;
    files[`src/components/${nm}/${nm}.module.scss`] = scss;
    files[`src/components/${nm}/index.ts`] = idx;
  }

  // src/layouts/
  const layoutImports = layoutNodes.map(n => {
    const { nm } = exportComp(n);
    return `import ${nm} from './${nm}/${nm}';`;
  }).join("\n");
  const layoutUses = layoutNodes.map(n => {
    const { nm } = exportComp(n);
    return `      <${nm} />`;
  }).join("\n");
  
  for (const n of layoutNodes) {
    const { nm, tsx, idx, scss } = exportComp(n);
    files[`src/layouts/${nm}/${nm}.tsx`] = tsx;
    files[`src/layouts/${nm}/${nm}.module.scss`] = scss;
    files[`src/layouts/${nm}/index.ts`] = idx;
  }
  
  const mainLayoutTsx = `import React from 'react';
import styles from './MainLayout.module.scss';
${layoutImports}

interface MainLayoutProps { children: React.ReactNode; }

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <div className={styles.layout}>
${layoutUses}
    <main className={styles.main}>{children}</main>
  </div>
);

export default MainLayout;
`;
  files["src/layouts/MainLayout.tsx"] = mainLayoutTsx;
  files["src/layouts/MainLayout.module.scss"] = `.layout {\n  display: flex;\n  flex-direction: column;\n  min-height: 100vh;\n}\n.main {\n  flex: 1;\n  padding: 24px;\n}\n`;

  // src/pages/Home/
  const compImports = compNodes.map(n => {
    const { nm } = exportComp(n);
    return `import ${nm} from '../../components/${nm}';`;
  }).join("\n");
  const compUses = compNodes.map(n => {
    const { nm } = exportComp(n);
    return `      <${nm} />`;
  }).join("\n");
  
  files["src/pages/Home/Home.tsx"] = `import React from 'react';
import styles from './Home.module.scss';
${compImports}

const Home: React.FC = () => (
  <div className={styles.home}>
${compUses}
  </div>
);

export default Home;
`;
  files["src/pages/Home/Home.module.scss"] = `.home {\n  width: 100%;\n}\n`;

  // src/styles/
  files["src/styles/_variables.scss"] = `/* Variables */\n`;
  files["src/styles/_mixins.scss"] = `/* Mixins */\n`;
  files["src/styles/globals.scss"] = `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: sans-serif; }\n`;

  files["src/App.tsx"] = `import React from 'react';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home/Home';
import './styles/globals.scss';

const App: React.FC = () => (
  <MainLayout>
    <Home />
  </MainLayout>
);

export default App;
`;

  files["src/main.tsx"] = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

  files["src/vite-env.d.ts"] = `/// <reference types="vite/client" />`;

  files["index.html"] = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${toPascal(appName)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  files["package.json"] = `{
  "name": "${toKebab(appName)}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "sass": "^1.72.0",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}`;

  files["vite.config.ts"] = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;

  files["tsconfig.json"] = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;

  files["tsconfig.node.json"] = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;

  return files;
}


// Download: package as ZIP archive
export async function dlFiles(files: Record<string, string>, filename = "uiforge-export.zip") {
  const zip = new JSZip();
  Object.entries(files).forEach(([path, content]) => {
    zip.file(path, content);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, filename);
}
