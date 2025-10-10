// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import licenseHeader from "eslint-plugin-license-header";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config([
  {
    files: ["src/**/*.ts", "webpack.config.js", "eslint.config.mjs"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
  },
  {
    files: ["src/**/*.ts", "webpack.config.js", "eslint.config.mjs"],
    ignores: ["src/lib/*.ts"],
    plugins: {
      "license-header": licenseHeader,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "license-header/header": ["error", "./license-header.ts"],
    },
  },
]);
