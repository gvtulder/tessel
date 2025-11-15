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

async function captureScreenshot() {
    const targetUrl = "http://127.0.0.1:1234/";

    let server;

    console.log("Starting server...");
    try {
        const serve = serveStatic(`${__dirname}/../dist`);
        server = http.createServer((req, res) =>
            serve(req, res, finalhandler(req, res)),
        );
        server.listen(1234);
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
                await new Promise((resolve) => setTimeout(resolve, 500));

                if (screenshot.js) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    await page.evaluate(screenshot.js);
                    await new Promise((resolve) => setTimeout(resolve, 500));
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
