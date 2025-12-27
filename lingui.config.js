import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  locales: [
    "ca",
    "de",
    "en",
    "es",
    "fr",
    "gl",
    "nl",
    "pt-BR",
    "tr",
    "zh-Hans",
    "zh-Hant",
  ],
  catalogs: [
    {
      path: "<rootDir>/i18n/{locale}",
      include: ["src"],
    },
  ],
  orderBy: "messageId",
});
