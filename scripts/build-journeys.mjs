import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("tsx"))("esbuild");
const outdir = resolve(
  process.argv[2] ?? "/private/tmp/goalmaxxing-journeys/dist",
);
await mkdir(outdir, { recursive: true });
await build({
  entryPoints: ["src/features/ux-journeys/standalone.tsx"],
  outdir,
  entryNames: "study",
  bundle: true,
  minify: true,
  format: "esm",
  jsx: "automatic",
  target: ["es2022"],
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
});
await writeFile(
  resolve(outdir, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Goalmaxxing — Journeys</title><link rel="stylesheet" href="./study.css"><style>body{margin:0}button,input{font:inherit}</style></head><body><div id="root"></div><script type="module" src="./study.js"></script></body></html>`,
);
console.log(`Built Journeys into ${outdir}`);

const [html, css, script] = await Promise.all([
  readFile(resolve(outdir, "index.html"), "utf8"),
  readFile(resolve(outdir, "study.css"), "utf8"),
  readFile(resolve(outdir, "study.js"), "utf8"),
]);
await writeFile(
  resolve(outdir, "journeys.html"),
  html
    .replace(
      '<link rel="stylesheet" href="./study.css">',
      () => `<style>${css}</style>`,
    )
    .replace(
      '<script type="module" src="./study.js"></script>',
      () =>
        `<script type="module">${script.replaceAll("</script", "<\\/script")}</script>`,
    ),
);
