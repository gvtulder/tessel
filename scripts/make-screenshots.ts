/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import childProcess from "child_process";
import puppeteer from "puppeteer";
import finalhandler from "finalhandler";
import http from "http";
import serveStatic from "serve-static";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ViewportDef = { width: number; height: number; deviceScaleFactor: number };

const sizes = [
    {
        name: "wide",
        prefix: "wide-",
        viewport: { width: 1024, height: 768, deviceScaleFactor: 2 },
    },
    {
        name: "portrait",
        prefix: "portrait-",
        viewport: { width: 480, height: 800, deviceScaleFactor: 2 },
    },
] as {
    name: string;
    prefix?: string;
    viewport: ViewportDef;
    dirname?: string;
}[];

for (const [name, width, height] of [
    ["IPHONE_67", 1290, 2796],
    ["IPHONE_65", 1284, 2778],
    // ["IPHONE_63", 1206, 2622],
    ["IPHONE_58", 1170, 2532],
    ["IPHONE_55", 1242, 2208],
    ["IPHONE_47", 750, 1334],
    ["IPHONE_40", 640, 1136],
    ["IPAD", 2048, 1536],
    ["IPAD_10_5", 2224, 1668],
    ["IPAD_11", 2388, 1668],
    ["IPAD_PRO", 2732, 2048],
    ["IPAD_PRO_3GEN_129", 2732, 2048],
] as [string, number, number][]) {
    sizes.push({
        name: name,
        prefix: `${name}-`,
        viewport: { width: width, height: height, deviceScaleFactor: 1 },
        dirname: `${__dirname}/../fastlane/ios/screenshots/en-US/`,
    });
}

for (const [name, width, height] of [
    ["phoneScreenshots", 1080, 1920],
    ["sevenInchScreenshots", 1920, 1080],
    ["tenInchScreenshots", 1920, 1080],
] as [string, number, number][]) {
    sizes.push({
        name: name,
        viewport: { width: width, height: height, deviceScaleFactor: 1 },
        dirname: `${__dirname}/../fastlane/metadata/android/en-US/images/${name}/`,
    });
}

type ScreenshotTask = {
    filename: string;
    dirname?: string;
    viewport?: ViewportDef;
    path?: string;
    js?: string;
    css?: string;
    elements?: ([string, string] | [string, string, string[]])[];
    demoGame?: object;
};

const screenshots: ScreenshotTask[] = [
    {
        filename: "01-main-menu",
        path: "",
    },
    {
        filename: "03-square",
        path: "#square",
    },
    {
        filename: "04-setup",
        path: "#setup",
        js: `
            localStorage.setItem("setup-atlas", "penrose");
            window.location.reload();
          `,
    },
    {
        filename: "05-paint-triangle",
        path: "#paint-triangle",
    },
    {
        filename: "02-play-triangle",
        demoGame: {
            atlas: "triangle",
            colors: "wong4",
            segments: 0,
            uniqueTileColors: false,
            rules: "same",
            scorer: "shape",
            demoGame: {
                seed: 124,
                numberOfTiles: 15,
                tileCenterWeight: 1,
                points: 22,
            },
        },
    },
];

for (const atlas of [
    "square",
    "triangle",
    "rhombus",
    "pentagon",
    "hexagon",
    "deltotrihex",
    "penrose",
    "snubsquare",
    "ammannbeenker",
]) {
    screenshots.push({
        viewport: { width: 1024, height: 768, deviceScaleFactor: 1 },
        dirname: `${__dirname}/../docs/images/`,
        filename: `example-${atlas}`,
        path: "#setup",
        js: `
            localStorage.setItem("setup-atlas", "${atlas}");
            window.location.reload();
          `,
        css: `
          .screen.game-setup {
              grid-template: "example" 1fr / 1fr;
          }
          .screen.game-setup .game-button,
          .screen.game-setup .settings {
              display: none;
          }
        `,
        elements: [["grid", ".screen.game-setup .example-grid"]],
    });
}

const weblateDefaults = {
    viewport: { width: 960, height: 1600, deviceScaleFactor: 1 },
    dirname: `${__dirname}/../weblate-screenshots/`,
};
screenshots.push(
    {
        ...weblateDefaults,
        filename: "main",
        path: "#main",
    },
    {
        ...weblateDefaults,
        filename: "game",
        path: "#square",
    },
    {
        ...weblateDefaults,
        filename: "game-menu",
        path: "#square",
        js: `gameController.currentScreen.menu.expand()`,
    },
    {
        ...weblateDefaults,
        filename: "game-finished",
        path: "#square",
        js: `gameController.currentScreen.getAutoPlayer().playAllTiles()`,
    },
    {
        ...weblateDefaults,
        filename: "all-games",
        path: "#all-games",
    },
    {
        ...weblateDefaults,
        filename: "paint",
        path: "#paint",
    },
    {
        ...weblateDefaults,
        filename: "setup",
        path: "#setup",
    },
    {
        ...weblateDefaults,
        filename: "setup-atlas",
        path: "#setup",
        js: `gameController.currentScreen.settingAtlas.open();`,
    },
    {
        ...weblateDefaults,
        filename: "setup-colors",
        path: "#setup",
        js: `gameController.currentScreen.settingColors.open();`,
    },
    {
        ...weblateDefaults,
        filename: "setup-segments",
        path: "#setup",
        js: `gameController.currentScreen.settingSegments.open();`,
    },
    {
        ...weblateDefaults,
        filename: "setup-rules",
        path: "#setup",
        js: `gameController.currentScreen.settingRules.open();`,
    },
    {
        ...weblateDefaults,
        filename: "setup-scorer",
        path: "#setup",
        js: `gameController.currentScreen.settingScorer.open();`,
    },
    {
        ...weblateDefaults,
        filename: "settings",
        path: "#settings",
    },
    {
        ...weblateDefaults,
        filename: "about",
        path: "#about",
    },
    {
        ...weblateDefaults,
        filename: "statistics-empty",
        path: "#statistics",
    },
    {
        ...weblateDefaults,
        filename: "statistics-filled",
        path: "#statistics",
        js: `
        localStorage.setItem("statistics", atob("eyJHYW1lU3RhcnRlZCI6OSwiR2FtZVN0YXJ0ZWQuc3F1YXJlIjoxLCJIaWdoU2"+
            "NvcmUiOjg2LCJIaWdoU2NvcmUue1wiYXRsYXNcIjpcInNxdWFyZVwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic2VnbWVudHNc"+
            "IjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIn0iOj"+
            "g2LCJTaGFwZUNvbXBsZXRlZCI6NjAsIlNoYXBlQ29tcGxldGVkLntcImF0bGFzXCI6XCJzcXVhcmVcIixcImNvbG9yc1wiOlwi"+
            "d29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY2"+
            "9yZXJcIjpcInNoYXBlXCJ9IjozMCwiU2hhcGVUaWxlQ291bnQiOjYsIlNoYXBlVGlsZUNvdW50LntcImF0bGFzXCI6XCJzcXVh"+
            "cmVcIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bG"+
            "VzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9Ijo2LCJUaWxlUGxhY2VkIjo5OSwiVGlsZVBsYWNlZC5zcXVhcmUi"+
            "OjU1LCJHYW1lU3RhcnRlZC50cmlhbmdsZSI6MSwiVGlsZVBsYWNlZC50cmlhbmdsZSI6MjQsIkhpZ2hTY29yZS57XCJhdGxhc1"+
            "wiOlwidHJpYW5nbGVcIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpm"+
            "YWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9IjoyLCJTaGFwZUNvbXBsZXRlZC57XCJhdGxhc1"+
            "wiOlwidHJpYW5nbGVcIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpm"+
            "YWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9IjoxLCJTaGFwZVRpbGVDb3VudC57XCJhdGxhc1"+
            "wiOlwidHJpYW5nbGVcIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpm"+
            "YWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9IjoyLCJHYW1lU3RhcnRlZC5yaG9tYnVzIjoxLC"+
            "JIaWdoU2NvcmUue1wiYXRsYXNcIjpcInJob21idXNcIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVu"+
            "aXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9IjoyLCJTaGFwZU"+
            "NvbXBsZXRlZC57XCJhdGxhc1wiOlwicmhvbWJ1c1wiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic2VnbWVudHNcIjowLFwidW5p"+
            "cXVlVGlsZUNvbG9yc1wiOmZhbHNlLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIn0iOjEsIlNoYXBlVG"+
            "lsZUNvdW50LntcImF0bGFzXCI6XCJyaG9tYnVzXCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlx"+
            "dWVUaWxlQ29sb3JzXCI6ZmFsc2UsXCJydWxlc1wiOlwic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwifSI6MiwiVGlsZVBsYW"+
            "NlZC5yaG9tYnVzIjoxMSwiR2FtZVN0YXJ0ZWQuaGV4YWdvbiI6MSwiSGlnaFNjb3JlLntcImF0bGFzXCI6XCJoZXhhZ29uXCIs"+
            "XCJjb2xvcnNcIjpcIndvbmc0XCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2UsXCJydWxlc1wiOl"+
            "wic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwifSI6NCwiU2hhcGVDb21wbGV0ZWQue1wiYXRsYXNcIjpcImhleGFnb25cIixc"+
            "ImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bGVzXCI6XC"+
            "JzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9IjoyLCJTaGFwZVRpbGVDb3VudC57XCJhdGxhc1wiOlwiaGV4YWdvblwiLFwi"+
            "Y29sb3JzXCI6XCJ3b25nNFwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlLFwicnVsZXNcIjpcIn"+
            "NhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIn0iOjIsIlRpbGVQbGFjZWQuaGV4YWdvbiI6MiwiR2FtZVN0YXJ0ZWQucGVudGFn"+
            "b24iOjEsIkhpZ2hTY29yZS57XCJhdGxhc1wiOlwicGVudGFnb25cIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXC"+
            "I6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9Ijoy"+
            "LCJTaGFwZUNvbXBsZXRlZC57XCJhdGxhc1wiOlwicGVudGFnb25cIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXC"+
            "I6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9Ijox"+
            "LCJTaGFwZVRpbGVDb3VudC57XCJhdGxhc1wiOlwicGVudGFnb25cIixcImNvbG9yc1wiOlwid29uZzRcIixcInNlZ21lbnRzXC"+
            "I6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCJ9Ijoy"+
            "LCJUaWxlUGxhY2VkLnBlbnRhZ29uIjoxLCJHYW1lU3RhcnRlZC5kZWx0b3RyaWhleCI6MSwiVGlsZVBsYWNlZC5raXRlIjo2LC"+
            "JIaWdoU2NvcmUue1wiYXRsYXNcIjpcImRlbHRvdHJpaGV4XCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJzZWdtZW50c1wiOjAs"+
            "XCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2UsXCJydWxlc1wiOlwic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwifSI6MiwiU2"+
            "hhcGVDb21wbGV0ZWQue1wiYXRsYXNcIjpcImRlbHRvdHJpaGV4XCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJzZWdtZW50c1wi"+
            "OjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2UsXCJydWxlc1wiOlwic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwifSI6MS"+
            "wiU2hhcGVUaWxlQ291bnQue1wiYXRsYXNcIjpcImRlbHRvdHJpaGV4XCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJzZWdtZW50"+
            "c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2UsXCJydWxlc1wiOlwic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwifS"+
            "I6MiwiR2FtZVN0YXJ0ZWQucGVucm9zZSI6MSwiSGlnaFNjb3JlLntcImF0bGFzXCI6XCJwZW5yb3NlXCIsXCJjb2xvcnNcIjpc"+
            "Indvbmc0XCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2UsXCJydWxlc1wiOlwic2FtZVwiLFwic2"+
            "NvcmVyXCI6XCJzaGFwZVwifSI6MiwiU2hhcGVDb21wbGV0ZWQue1wiYXRsYXNcIjpcInBlbnJvc2VcIixcImNvbG9yc1wiOlwi"+
            "d29uZzRcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZSxcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY2"+
            "9yZXJcIjpcInNoYXBlXCJ9IjoxLCJTaGFwZVRpbGVDb3VudC57XCJhdGxhc1wiOlwicGVucm9zZVwiLFwiY29sb3JzXCI6XCJ3"+
            "b25nNFwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3"+
            "JlclwiOlwic2hhcGVcIn0iOjIsIkdhbWVTdGFydGVkLnNudWJzcXVhcmUiOjEsIkhpZ2hTY29yZS57XCJhdGxhc1wiOlwic251"+
            "YnNxdWFyZVwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlLF"+
            "wicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIn0iOjQ0LCJTaGFwZUNvbXBsZXRlZC57XCJhdGxhc1wiOlwi"+
            "c251YnNxdWFyZVwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbH"+
            "NlLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIn0iOjE2LCJTaGFwZVRpbGVDb3VudC57XCJhdGxhc1wi"+
            "Olwic251YnNxdWFyZVwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOm"+
            "ZhbHNlLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIn0iOjQsIkdhbWVTdGFydGVkLmFtbWFubmJlZW5r"+
            "ZXIiOjEsIkhpZ2hTY29yZS57XCJhdGxhc1wiOlwiYW1tYW5uYmVlbmtlclwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic2VnbW"+
            "VudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVc"+
            "In0iOjIxLCJTaGFwZUNvbXBsZXRlZC57XCJhdGxhc1wiOlwiYW1tYW5uYmVlbmtlclwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLF"+
            "wic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwi"+
            "c2hhcGVcIn0iOjcsIlNoYXBlVGlsZUNvdW50LntcImF0bGFzXCI6XCJhbW1hbm5iZWVua2VyXCIsXCJjb2xvcnNcIjpcIndvbm"+
            "c0XCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2UsXCJydWxlc1wiOlwic2FtZVwiLFwic2NvcmVy"+
            "XCI6XCJzaGFwZVwifSI6NH0="));
        JSON.parse(localStorage.statistics);
        gameController.stats.unserialize(localStorage.statistics);
        gameController.showStatisticsDisplay();
        `,
    },
);

async function captureScreenshot() {
    const targetUrl = "http://127.0.0.1:2134/";

    let server;

    console.log("Starting server...");
    try {
        const serve = serveStatic(`${__dirname}/../dist`);
        server = http.createServer((req, res) =>
            serve(req, res, finalhandler(req, res)),
        );
        server.listen(2134);
    } catch (err: any) {
        console.log("Error starting server.", err.message);
        return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("Making screenshots...");
    try {
        // Launch headless Chromium browser
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"],
        });

        for (const size of sizes) {
            for (const screenshot of screenshots) {
                if (screenshot.viewport && size != sizes[0]) {
                    continue;
                }

                let out =
                    screenshot.dirname ||
                    size.dirname ||
                    `${__dirname}/../assets/src/screenshots/`;
                if (!screenshot.viewport) {
                    out += size.prefix || "";
                }
                out += screenshot.filename;

                if (fs.existsSync(`${out}.png`)) {
                    continue;
                }

                fs.mkdirSync(path.dirname(out), { recursive: true });

                console.log(`${size.name} ${screenshot.filename}`);

                // Create a new page
                const context = await browser.createBrowserContext();
                const page = await context.newPage();

                // Set viewport width and height
                await page.setViewport(screenshot.viewport || size.viewport);

                let screenshotPath = screenshot.path;
                if (screenshot.demoGame) {
                    screenshotPath =
                        "#" + btoa(JSON.stringify(screenshot.demoGame));
                }

                // Navigate to the target URL
                await page.goto(targetUrl + screenshotPath);
                await new Promise((resolve) => setTimeout(resolve, 1000));

                if (screenshot.js) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    await page.evaluate(screenshot.js);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }

                if (screenshot.css) {
                    await page.addStyleTag({ content: screenshot.css });
                }

                // Capture screenshot and save it
                if (screenshot.elements) {
                    for (const [key, selector, names] of screenshot.elements) {
                        const elements = await page.$$(selector);
                        for (let i = 0; i < elements.length; i++) {
                            const name = names ? `${key}-${names[i]}` : key;
                            await elements[i].screenshot({
                                path: `${out}-${name}.png` as `${string}.png`,
                                omitBackground: true,
                            });
                        }
                    }
                } else {
                    await page.screenshot({
                        path: `${out}.png` as `${string}.png`,
                    });
                }

                await context.close();
            }
        }

        await browser.close();

        console.log("Screenshots captured successfully.");
    } catch (err: any) {
        console.log("Error: ", err.message);
    }

    if (server) {
        console.log("Stopping server...");
        server.close();
    }
}

captureScreenshot();
