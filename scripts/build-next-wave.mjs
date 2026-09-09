import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const tooling = createRequire(require.resolve("tsx"));
const { build } = tooling("esbuild");
const outdir = resolve(
  process.argv[2] ?? "/private/tmp/goalmaxxing-next-wave-site/dist",
);
await mkdir(outdir, { recursive: true });
await build({
  entryPoints: ["src/features/ux-next-wave/standalone.tsx"],
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
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#e7eeea"><meta name="description" content="Five interactive Goalmaxxing concepts: Prism, Tempo, Weave, Mosaic and Script. Explore planning, progress and community."><title>Goalmaxxing — Next Wave</title><link rel="stylesheet" href="./study.css"><style>body{margin:0}button,input{font:inherit}button{touch-action:manipulation}::selection{background:#cbdcd2}</style></head><body><div id="root"></div><script type="module" src="./study.js"></script></body></html>`,
);
console.log(`Built Next Wave into ${outdir}`);
