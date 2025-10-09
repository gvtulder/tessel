import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "net.vantulder.tessel",
    appName: "Tessel",
    webDir: "dist-capacitor",
    plugins: {
        StatusBar: {
            "overlaysWebView": true,
            "style": "DARK",
            "backgroundColor": "#00000000"
        }
    }
};

export default config;
