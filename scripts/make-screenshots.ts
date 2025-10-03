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

const screenshots = [
    {
        filename: "main-menu.png",
        path: "",
    },
    {
        filename: "square.png",
        path: "#square",
    },
    {
        filename: "setup.png",
        path: "#setup",
        js: `
      localStorage.setItem("setup-atlas", "penrose");
      window.location.reload();
    `,
    },
    {
        filename: "paint-triangle.png",
        path: "#paint-triangle",
    },
];

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
    } catch (err) {
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

        // Create a new page
        const page = await browser.newPage();

        for (const size of sizes) {
            for (const screenshot of screenshots) {
                // Set viewport width and height
                await page.setViewport(size.viewport);

                // Navigate to the target URL
                await page.goto(targetUrl + screenshot.path);
                await new Promise((resolve) => setTimeout(resolve, 500));

                if (screenshot.js) {
                    await page.evaluate(screenshot.js);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }

                // Capture screenshot and save it
                await page.screenshot({
                    path: `${__dirname}/../screenshots/screenshot-${size.name}-${screenshot.filename}` as `${string}.png`,
                });
            }
        }

        await browser.close();
        console.log("Screenshots captured successfully.");
    } catch (err) {
        console.log("Error: ", err.message);
    }

    if (server) {
        console.log("Stopping server...");
        server.kill();
    }
}

captureScreenshot();
