import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["src/i18n-test-setup.ts"],
    },
    plugins: [
        react({
            plugins: [["@lingui/swc-plugin", {}]],
        }),
        lingui(),
    ],
    resolve: {
        alias: [{ find: /^bundle-text:(.*)/, replacement: "$1" }],
    },
});
