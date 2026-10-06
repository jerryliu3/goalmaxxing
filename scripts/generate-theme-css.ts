import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderThemeCss } from "../packages/shared/src/brand/css";

// Writes the web theme stylesheet from the shared theme registry.
const target = join(dirname(fileURLToPath(import.meta.url)), "../src/app/themes.css");
writeFileSync(target, renderThemeCss());
console.log(`Wrote ${target}`);
