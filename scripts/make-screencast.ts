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

const sizes: {
    name: string;
    viewport: ViewportDef;
    dirname?: string;
}[] = [];

// https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications
for (const [w, h] of [
    [1900, 1080], // google play
    [886, 1920], // portrait: iphone 69 65 63 61
    [1080, 1920], // portrait: iphone 55 40
    [750, 1334], // portrait: iphone 47
    [1600, 1200], // landscape: ipad 13 129 11 105
    [1200, 900], // landscape: ipad 97
]) {
    sizes.push({
        name: `${w}x${h}`,
        viewport: { width: w, height: h, deviceScaleFactor: 1 },
    });
}

const demoGames = [
    {
        name: "square",
        index: 1,
        demoGame: {
            atlas: "square",
            colors: "wong4",
            segments: 0,
            uniqueTileColors: false,
            rules: "same",
            scorer: "shape",
            seed: 12345,
        },
    },
    {
        name: "triangle",
        index: 0,
        demoGame: {
            atlas: "triangle",
            colors: "wong4",
            segments: 0,
            uniqueTileColors: false,
            rules: "same",
            scorer: "shape",
            seed: 12345,
        },
    },
    {
        name: "snubsquare",
        index: 7,
        demoGame: {
            atlas: "snubsquare",
            colors: "wong4",
            segments: 0,
            uniqueTileColors: false,
            rules: "same",
            scorer: "shape",
            seed: 12347,
        },
    },
];

const videoScripts = [
    {
        suffix: "",
        games: demoGames,
        sizes: [sizes[0]], // "1920x1080"
    },
    {
        suffix: "-a",
        games: [demoGames[0]],
        sizes: sizes,
    },
    {
        suffix: "-b",
        games: [demoGames[1]],
        sizes: sizes,
    },
    {
        suffix: "-c",
        games: [demoGames[2]],
        sizes: sizes,
    },
];

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

        for (const script of videoScripts) {
            for (const size of script.sizes) {
                let out = `${__dirname}/../screencasts/screencast-${size.name}${script.suffix}.webm`;

                if (fs.existsSync(`${out}`)) {
                    // TODO
                    // continue;
                }

                fs.mkdirSync(path.dirname(out), { recursive: true });

                // Create a new page
                const context = await browser.createBrowserContext();
                const page = await context.newPage();

                // Set viewport width and height
                await page.setViewport(size.viewport);

                // Navigate to the target URL
                await page.goto(targetUrl);
                await new Promise((resolve) => setTimeout(resolve, 100));

                console.log("Start recording");
                const recorder = await page.screencast({
                    path: out as `${string}.webm`,
                    speed: 2,
                    quality: 10,
                    fps: 30,
                });

                for (const game of script.games) {
                    if (game.name == "square") {
                        console.log("Navigate main");
                        await page.evaluate(
                            `gameController.navigation.navigate("${targetUrl}")`,
                        );
                    } else {
                        console.log("Navigate all games");
                        await page.evaluate(
                            `gameController.navigation.navigate("${targetUrl}#all-games")`,
                        );
                    }
                    await new Promise((resolve) => setTimeout(resolve, 2000));

                    for (const i of game.name == "square"
                        ? [0, 2, 3, game.index]
                        : [1, 3, 6, game.index]) {
                        console.log(`Mouseover ${i}`);
                        await new Promise((resolve) =>
                            setTimeout(
                                resolve,
                                game.name == "square" ? 300 : 100,
                            ),
                        );
                        const xy = (await page.evaluate(
                            `rect=gameController.currentScreen.gridDisplays[${i}].element.getBoundingClientRect();[rect.x+0.5*rect.width,rect.y+0.5*rect.height]`,
                        )) as [number, number];
                        page.mouse.move(xy[0], xy[1]);
                        await new Promise((resolve) =>
                            setTimeout(
                                resolve,
                                game.name == "square" ? 300 : 100,
                            ),
                        );
                    }
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    console.log(`Navigate to ${game.name}`);
                    const gameSettings = btoa(JSON.stringify(game.demoGame));
                    await page.evaluate(
                        `gameController.navigation.navigate("${targetUrl}#${gameSettings}")`,
                    );
                    await new Promise((resolve) => setTimeout(resolve, 2000));

                    console.log("Play game");
                    await page.evaluate(
                        "player = gameController.currentScreen.getAnimatedAutoPlayer(1234);",
                    );
                    for (let i = 0; i < 15; i++) {
                        const oldPoints = await page.evaluate(
                            "gameController.game.points",
                        );
                        console.log(` - tile ${i}: ${oldPoints} points`);
                        await page.evaluate("player.playOneTile();");
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000),
                        );
                        const newPoints = await page.evaluate(
                            "gameController.game.points",
                        );
                        if (oldPoints != newPoints) {
                            await new Promise((resolve) =>
                                setTimeout(resolve, 1500),
                            );
                        }
                    }
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }

                console.log("Navigate main");
                await page.evaluate(
                    `gameController.navigation.navigate("${targetUrl}")`,
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));

                console.log("Stop recording");
                await recorder.stop();

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
