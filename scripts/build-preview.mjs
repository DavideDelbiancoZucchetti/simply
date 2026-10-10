// Genera l'anteprima single-file per Claude (preview/SimplyCompanion.jsx) dagli stessi sorgenti TS.
// - JSX preservato, react esterno, react-dom sostituito da uno shim (l'anteprima non lo espone)
// - un solo import da "react" e `export default`, come si aspetta l'ambiente di anteprima
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const out = "preview/SimplyCompanion.jsx";
mkdirSync("preview", { recursive: true });
await build({
  entryPoints: ["demo/SimplyDemo.tsx"], bundle: true, format: "esm", jsx: "preserve",
  external: ["react"], alias: { "react-dom": "./demo/no-portal-shim.ts" }, legalComments: "none", outfile: out, logLevel: "error",
});
let s = readFileSync(out, "utf8");
const names = [];
const aliases = [];
s = s.replace(/^import \{([^}]*)\} from "react";\n/gm, (_, list) => {
  for (const n of list.split(",").map((x) => x.trim()).filter(Boolean)) {
    const [orig, alias] = n.split(/\s+as\s+/);
    if (alias) aliases.push([alias, orig]);
    if (!names.includes(orig)) names.push(orig);
  }
  return "";
});
// useEffect2, useState9… -> useEffect, useState (stesse funzioni di React: un solo import pulito)
for (const [alias, orig] of aliases) s = s.replace(new RegExp(`\\b${alias}\\b`, "g"), orig);
s = s.replace(/export \{\s*(\w+) as default\s*\};?\s*$/, "export default $1;\n");
const header = "/**\n * Simply — anteprima generata da simply-tsx (src/ + demo/) con `npm run preview`. Non modificare a mano.\n */\n";
writeFileSync(out, header + `import { ${names.join(", ")} } from "react";\n` + s);
console.log("ok:", out);
