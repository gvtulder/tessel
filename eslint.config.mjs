// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config([
  {
    files: ["src/**/*.ts", "webpack.config.js", "eslint.config.mjs", "packages*.json"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);
