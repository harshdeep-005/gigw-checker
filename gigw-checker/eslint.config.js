// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disallow `any` — use `unknown` and narrow instead (rules.md §5)
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      // Enforce consistent naming (rules.md §5)
      "@typescript-eslint/naming-convention": [
        "error",
        { "selector": "variable", "format": ["camelCase"] },
        { "selector": "function", "format": ["camelCase"] },
        { "selector": "typeLike", "format": ["PascalCase"] }
      ]
    }
  },
  {
    // Test files get slightly relaxed rules
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off"
    }
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.js"]
  }
);
