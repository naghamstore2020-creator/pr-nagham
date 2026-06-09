import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Relaxed for sessionStorage restore patterns in useEffect
      "react-hooks/set-state-in-effect": "off",
      // allow any for Excel/Prisma dynamic patterns
      "@typescript-eslint/no-explicit-any": "off",
      // require() needed for dynamic adapter loading
      "@typescript-eslint/no-require-imports": "off",
      // allow " in Arabic JSX text
      "react/no-unescaped-entities": "off",
    },
  },
  { name: "ignores", ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
]);
