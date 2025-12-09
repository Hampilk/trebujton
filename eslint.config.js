import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react": react,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // Disabled since we're using TypeScript
      "react/no-unescaped-entities": "warn", // Relaxed to warning for apostrophes
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": "off", // Disable unused vars warnings
      "@typescript-eslint/no-explicit-any": "off", // Allow explicit any for gradual adoption
      "@typescript-eslint/no-unused-expressions": "off", // Disable expressions warnings
      "@typescript-eslint/no-require-imports": "off", // Allow require in config files
      "no-constant-binary-expression": "off", // Disable constant binary expressions warnings
    },
  },
);
