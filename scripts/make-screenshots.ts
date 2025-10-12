/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import childProcess from "child_process";
import fs from "fs";
import { execArgv } from "process";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [
    {
        name: "wide",
        viewport: { width: 1024, height: 768, deviceScaleFactor: 2 },
    },
    {
        name: "portrait",
        viewport: { width: 375, height: 667, deviceScaleFactor: 2 },
    },
];

type ScreenshotTask = {
    filename: string;
    dirname?: string;
    viewport?: { width: number; height: number; deviceScaleFactor: number };
    path?: string;
    js?: string;
    css?: string;
    elements?: ([string, string] | [string, string, string[]])[];
    demoGame?: object;
};

const screenshots: ScreenshotTask[] = [
    {
        filename: "main-menu",
        path: "",
    },
    {
        filename: "square",
        path: "#square",
    },
    {
        filename: "setup",
        path: "#setup",
        js: `
            localStorage.setItem("setup-atlas", "penrose");
            window.location.reload();
          `,
    },
    {
        filename: "paint-triangle",
        path: "#paint-triangle",
    },
    {
        filename: "play-triangle",
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
    {
        viewport: { width: 1024, height: 768, deviceScaleFactor: 2 },
        dirname: `${__dirname}/../docs/images/`,
        filename: "settings",
        path: "#square",
        css: `
          body, .screen {
            background: transparent !important;
            box-shadow: none !important;
          }
          .screen.game-display .main-grid,
          .screen.game-display .fill,
          .screen.game-display .tile-stack,
          .screen.game-display .tile-counter-and-score {
              display: none;
          }
          .screen.game-display .dropout-menu {
              border-radius: 0;
              background: transparent !important;
          }
        `,
        js: `
          document.getElementsByClassName("dropout-menu")[0].classList.add("expanded");
        `,
        elements: [
            ["full-menu", ".dropout-menu"],
            ["backtomenu", ".dropout-menu .backtomenu"],
            ["setup", ".dropout-menu .setup"],
            ["restart", ".dropout-menu .restart"],
            [
                "toggle",
                ".dropout-menu .game-toggle .icon",
                ["placeholder", "autorotate", "check", "snap"],
            ],
        ],
    },
    {
        viewport: { width: 1024, height: 768, deviceScaleFactor: 2 },
        dirname: `${__dirname}/../docs/images/`,
        filename: "setup-option",
        path: "#setup",
        css: `
          body, .screen {
            background: transparent !important;
          }
          .screen.game-setup {
            background: transparent !important;
          }
          .setting-row-option {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }
        `,
        js: `
          for (const el of document.getElementsByClassName("setting-row-option")) {
            el.classList.remove("selected");
          }
        `,
        elements: [
            ["square", `.setting-row-option[title*="Square"]`],
            ["triangle", `.setting-row-option[title^="Triangle"]`],
            ["rhombus", `.setting-row-option[title^="Rhombus"]`],
            ["pentagon", `.setting-row-option[title^="Cairo pentagon"]`],
            ["hexagon", `.setting-row-option[title^="Hexagon"]`],
            ["deltotrihex", `.setting-row-option[title^="Deltoidal"]`],
            ["penrose", `.setting-row-option[title^="Penrose"]`],
            ["snubsquare", `.setting-row-option[title^="Snub-square"]`],
            ["ammannbeenker", `.setting-row-option[title^="Ammann-Beenker"]`],
            ["six-colors", `.setting-row-option[title="Six colors"]`],
            ["five-colors", `.setting-row-option[title="Five colors"]`],
            ["four-colors", `.setting-row-option[title="Four colors"]`],
            ["three-colors", `.setting-row-option[title="Three colors"]`],
            ["two-colors", `.setting-row-option[title="Two colors"]`],
            [
                "tile-color-all",
                `.setting-row-option[title^="All color combinations"]`,
            ],
            [
                "tile-color-unique",
                `.setting-row-option[title^="All colors must be unique"]`,
            ],
            [
                "tile-color-two",
                `.setting-row-option[title^="Two colors per tile"]`,
            ],
            [
                "tile-color-single",
                `.setting-row-option[title^="Single color per tile"]`,
            ],
            ["rule-same-color", `.setting-row-option[title$="same color"]`],
            [
                "rule-different-color",
                `.setting-row-option[title$="different colors"]`,
            ],
            [
                "score-connected",
                `.setting-row-option[title$="connected segments"]`,
            ],
            [
                "score-connected",
                `.setting-row-option[title$="connected segments"]`,
            ],
            ["score-single-tile", `.setting-row-option[title$="single tiles"]`],
            [
                "score-convex-shape",
                `.setting-row-option[title$="convex shapes"]`,
            ],
            [
                "score-full-vertex",
                `.setting-row-option[title$="full vertices"]`,
            ],
            ["score-holes", `.setting-row-option[title$="holes"]`],
        ],
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
        server = childProcess.spawn("python3", [
            "-m",
            "http.server",
            "1234",
            "-d",
            `${__dirname}/../dist`,
        ]);
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
                    `${__dirname}/../assets/src/screenshots/`;
                if (!screenshot.viewport) {
                    out += `${size.name}-`;
                }
                out += screenshot.filename;

                console.log(`${size.name} ${screenshot.filename}`);

                // Create a new page
                const context = await browser.createBrowserContext();
                const page = await context.newPage();

                // Set viewport width and height
                await page.setViewport(screenshot.viewport || size.viewport);

                let path = screenshot.path;
                if (screenshot.demoGame) {
                    path = "#" + btoa(JSON.stringify(screenshot.demoGame));
                }

                // Navigate to the target URL
                await page.goto(targetUrl + path);
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
        server.kill();
    }
}

captureScreenshot();
