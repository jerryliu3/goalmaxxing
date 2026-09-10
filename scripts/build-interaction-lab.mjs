import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const tooling = createRequire(require.resolve("tsx"));
const { build } = tooling("esbuild");
const outdir = resolve(
  process.argv[2] ?? "/private/tmp/goalmaxxing-interaction-lab-site/dist",
);
await mkdir(outdir, { recursive: true });
await build({
  entryPoints: ["src/features/ux-interaction-lab/standalone.tsx"],
  outdir,
  entryNames: "study",
  bundle: true,
  minify: true,
  sourcemap: false,
  format: "esm",
  jsx: "automatic",
  target: ["es2022"],
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
});
await writeFile(
  resolve(outdir, "index.html"),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#e7eeea"><meta name="description" content="Three practical interaction concepts: Fold, Switchboard and Glide. Explore planning, goals, progress and community."><title>Goalmaxxing — Interaction Lab</title><link rel="stylesheet" href="./study.css"><style>body{margin:0}button,input{font:inherit}button{touch-action:manipulation}::selection{background:#cbdcd2}</style></head><body><div id="root"></div><script type="module" src="./study.js"></script></body></html>`,
);
console.log(`Built Interaction Lab into ${outdir}`);
