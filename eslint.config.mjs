// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import licenseHeader from "eslint-plugin-license-header";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config([
  {
    ignores: ["android/", "coverage/", "dist/"],
  },
  {
    files: ["src/**/*.ts", "eslint.config.mjs"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/lib/*.ts"],
    plugins: {
      "license-header": licenseHeader,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "license-header/header": [
        "error",
        [
          "/**",
          " * SPDX-License-Identifier: GPL-3.0-or-later",
          " * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder",
          " */",
        ],
      ],
    },
  },
]);
