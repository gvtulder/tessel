import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en"],
  catalogs: [
    {
      path: "<rootDir>/i18n/{locale}",
      include: ["src"],
    },
  ],
  orderBy: "messageId",
});
