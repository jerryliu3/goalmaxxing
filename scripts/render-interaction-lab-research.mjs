import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// This small renderer supports the deliberately limited Markdown used by this report.
const escape = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const inline = (text) =>
  escape(text)
    .replace(
      /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export async function renderResearch(outdir) {
  const source = await readFile(
    "docs/ux/goalmaxxing-interaction-lab-study.md",
    "utf8",
  );
  const blocks = source.trim().split(/\n\s*\n/);
  const links = [];
  const html = blocks
    .map((block) => {
      if (block.startsWith("#")) {
        const [, marks, title] = block.match(/^(#{1,3}) (.+)$/);
        if (marks.length === 2)
          links.push(`<a href="#${slug(title)}">${inline(title)}</a>`);
        return `<h${marks.length} id="${slug(title)}">${inline(title)}</h${marks.length}>`;
      }
      if (block.startsWith("|")) {
        const rows = block
          .split("\n")
          .filter((_, i) => i !== 1)
          .map((row) =>
            row
              .split("|")
              .slice(1, -1)
              .map((s) => s.trim()),
          );
        return `<div class="table-scroll"><table><thead><tr>${rows[0].map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>${rows
          .slice(1)
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table></div>`;
      }
      if (/^\d+\. /.test(block))
        return `<ol>${block
          .split("\n")
          .map((line) => `<li>${inline(line.replace(/^\d+\. /, ""))}</li>`)
          .join("")}</ol>`;
      return `<p>${inline(block.replaceAll("\n", " "))}</p>`;
    })
    .join("\n");
  await writeFile(
    resolve(outdir, "research.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Goalmaxxing Interaction Lab — Research</title><style>*{box-sizing:border-box}body{margin:0;color:#252a27;background:#fff;font:17px/1.7 Georgia,serif}header{border-bottom:1px solid #ddd;padding:18px 5vw;font:14px/1.5 Arial,sans-serif}a{color:#315a48;text-underline-offset:3px}header a{font-weight:600}.layout{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:220px minmax(0,860px);gap:55px;padding:50px 30px}nav{position:sticky;top:28px;align-self:start;font:14px/1.6 Arial,sans-serif}nav a{display:block;margin-bottom:12px;color:#59645e;text-decoration:none}h1{font-size:46px;line-height:1.15;font-weight:400;letter-spacing:-.04em;margin:0 0 28px}h2{font:600 24px/1.35 Arial,sans-serif;letter-spacing:-.025em;padding-top:36px;border-top:1px solid #ddd;margin-top:42px;scroll-margin-top:24px}h3{font:600 19px/1.4 Arial,sans-serif;margin-top:32px}p{margin:18px 0}code{font:13px/1.5 monospace;overflow-wrap:anywhere}table{border-collapse:collapse;min-width:640px;font:14px/1.5 Arial,sans-serif}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd;vertical-align:top}th{background:#f2f4f2}.table-scroll{overflow:auto;margin:28px 0}li{margin:12px 0}main{min-width:0}@media(max-width:850px){.layout{display:block;padding:30px 22px}nav{position:static;border-bottom:1px solid #ddd;padding-bottom:20px;margin-bottom:30px;columns:2}h1{font-size:36px}}@media print{header,nav{display:none}.layout{display:block;padding:0}h1{font-size:30px}body{font-size:11pt}.table-scroll{overflow:visible}table{min-width:0;font-size:9pt}h2,h3{break-after:avoid}tr{break-inside:avoid}}</style></head><body><header><a href="./">← Explore the five prototypes</a></header><div class="layout"><nav aria-label="Report contents">${links.join("")}</nav><main>${html}</main></div></body></html>`,
  );
}
