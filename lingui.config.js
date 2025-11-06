import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "nl", "tr", "zh-Hant"],
  catalogs: [
    {
      path: "<rootDir>/i18n/{locale}",
      include: ["src"],
    },
  ],
  orderBy: "messageId",
});
