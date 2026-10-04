import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local worktrees created during stacked-PR workflows.
    ".worktrees/**",
    // Generated Playwright HTML trace assets.
    "playwright-report/**",
    // Expo Metro config is CommonJS by convention.
    "apps/mobile/metro.config.js",
    // Expo Router type generation writes declarations here before mobile typecheck.
    "apps/mobile/.expo/**",
  ]),
  {
    files: ["packages/shared/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "navigator",
        "localStorage",
        "sessionStorage",
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: ["react-dom"],
          patterns: [
            "next/*",
            "@radix-ui/*",
            "@dnd-kit/*",
            "sonner",
            "lucide-react",
          ],
        },
      ],
    },
  },
  {
    // Next 16.2 enables React Compiler diagnostics through its preset. The
    // application is not yet compiled with the React Compiler, so these
    // migration-only rules would reject established effect/ref patterns
    // without changing runtime behavior. Keep the regular hooks rules active.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
