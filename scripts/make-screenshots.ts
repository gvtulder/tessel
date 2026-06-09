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
    lang?: string;
}[];

for (const [langCode, langDir] of [
    ["ca", "ca"],
    ["de", "de-DE"],
    ["en", "en-US"],
    ["es", "es-ES"],
    ["fr", "fr-FR"],
    ["it", "it-IT"],
    ["nl", "nl-NL"],
    ["pt-BR", "pt-BR"],
    ["ro", "ro"],
    ["sv", "sv"],
    ["tr", "tr"],
    ["uk", "uk"],
    ["zh-Hans", "zh-Hans"],
    ["zh-Hant", "zh-Hant"],
]) {
    for (const [name, width, height, scaleFactor] of [
        ["IPHONE_67", 1290, 2796, 2],
        ["IPHONE_65", 1284, 2778, 2],
        // ["IPHONE_63", 1206, 2622, 2],
        ["IPHONE_58", 1170, 2532, 2],
        ["IPHONE_55", 1242, 2208, 2],
        ["IPHONE_47", 750, 1334, 1],
        ["IPHONE_40", 640, 1136, 1],
        ["IPAD", 2048, 1536, 2],
        ["IPAD_10_5", 2224, 1668, 2],
        ["IPAD_11", 2388, 1668, 2],
        ["IPAD_PRO", 2732, 2048, 2],
        ["IPAD_PRO_3GEN_129", 2732, 2048, 2],
    ] as [string, number, number, number][]) {
        sizes.push({
            name: name,
            prefix: `${name}-`,
            viewport: {
                width: width / scaleFactor,
                height: height / scaleFactor,
                deviceScaleFactor: scaleFactor,
            },
            dirname: `${__dirname}/../fastlane/ios/screenshots/${langDir}/`,
            lang: langCode,
        });
    }
}

for (const [langCode, langDir] of [
    ["ca", "ca"],
    ["de", "de-DE"],
    ["en", "en-US"],
    ["es", "es-ES"],
    ["fr", "fr-FR"],
    ["gl", "gl-ES"],
    ["it", "it-IT"],
    ["nl", "nl-NL"],
    ["pt-BR", "pt-BR"],
    ["ro", "ro"],
    ["sv", "sv-SE"],
    ["tr", "tr-TR"],
    ["uk", "uk"],
    ["zh-Hans", "zh-CN"],
    ["zh-Hant", "zh-TW"],
]) {
    for (const [name, width, height, scaleFactor] of [
        ["phoneScreenshots", 1080, 1920, 2],
        ["sevenInchScreenshots", 1920, 1080, 2],
        ["tenInchScreenshots", 1920, 1080, 2],
    ] as [string, number, number, number][]) {
        sizes.push({
            name: name,
            viewport: {
                width: width / scaleFactor,
                height: height / scaleFactor,
                deviceScaleFactor: scaleFactor,
            },
            dirname: `${__dirname}/../fastlane/metadata/android/${langDir}/images/${name}/`,
            lang: langCode,
        });
    }
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
    {
        filename: "06-statistics",
        path: "#statistics",
        js: `
        localStorage.setItem("statistics", atob("eyJHYW1lU3RhcnRlZCI6OTIsIkdhbWVTdGFydGVkLnNxdWFyZSI6NTYsIkdhbW"+
            "VTdGFydGVkLnJob21idXMiOjExLCJIaWdoU2NvcmUue1wiYXRsYXNcIjpcInJob21idXNcIixcImNvbG9yc1wiOlwid29uZzRcI"+
            "ixcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3Jz"+
            "XCI6ZmFsc2V9IjoyNDcsIlNoYXBlQ29tcGxldGVkIjoxMTc4LCJTaGFwZUNvbXBsZXRlZC57XCJhdGxhc1wiOlwicmhvbWJ1c1w"+
            "iLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXC"+
            "I6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZX0iOjIwMywiU2hhcGVUaWxlQ291bnQue1wiYXRsYXNcIjpcInJob21idXNcI"+
            "ixcImNvbG9yc1wiOlwid29uZzRcIixcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCIsXCJzZWdtZW50c1wi"+
            "OjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2V9Ijo5LCJUaWxlUGxhY2VkIjoxNzM0LCJUaWxlUGxhY2VkLnJob21idXMiOjQ"+
            "zMiwiR2FtZVN0YXJ0ZWQuYW1tYW5uYmVlbmtlciI6NiwiSGlnaFNjb3JlLntcImF0bGFzXCI6XCJzcXVhcmVcIixcImNvbG9yc1"+
            "wiOlwid29uZzRcIixcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxd"+
            "WVUaWxlQ29sb3JzXCI6ZmFsc2V9IjoxMCwiU2hhcGVDb21wbGV0ZWQue1wiYXRsYXNcIjpcInNxdWFyZVwiLFwiY29sb3JzXCI6"+
            "XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVR"+
            "pbGVDb2xvcnNcIjpmYWxzZX0iOjU5MiwiU2hhcGVUaWxlQ291bnQue1wiYXRsYXNcIjpcInNxdWFyZVwiLFwiY29sb3JzXCI6XC"+
            "J3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpb"+
            "GVDb2xvcnNcIjpmYWxzZX0iOjIsIlRpbGVQbGFjZWQuc3F1YXJlIjo5NjEsIkdhbWVDb21wbGV0ZWQiOjIwLCJHYW1lQ29tcGxl"+
            "dGVkLnNxdWFyZSI6MTAsIkdhbWVTdGFydGVkLnNudWJzcXVhcmUiOjUsIkhpZ2hTY29yZS57XCJhdGxhc1wiOlwiYW1tYW5uYmV"+
            "lbmtlclwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ2"+
            "1lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZX0iOjIyMSwiU2hhcGVDb21wbGV0ZWQue1wiYXRsYXNcIjpcImFtb"+
            "WFubmJlZW5rZXJcIixcImNvbG9yc1wiOlwid29uZzRcIixcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCIs"+
            "XCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2V9Ijo5MywiU2hhcGVUaWxlQ291bnQue1wiYXRsYXNcIjp"+
            "cImFtbWFubmJlZW5rZXJcIixcImNvbG9yc1wiOlwid29uZzRcIixcInJ1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYX"+
            "BlXCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2V9Ijo3LCJHYW1lU3RhcnRlZC5oZXhhZ29uIjoxL"+
            "CJIaWdoU2NvcmUue1wiYXRsYXNcIjpcImhleGFnb25cIixcImNvbG9yc1wiOlwid29uZzRcIixcInJ1bGVzXCI6XCJzYW1lXCIs"+
            "XCJzY29yZXJcIjpcInNoYXBlXCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6ZmFsc2V9Ijo0LCJTaGFwZUN"+
            "vbXBsZXRlZC57XCJhdGxhc1wiOlwiaGV4YWdvblwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcIn"+
            "Njb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZX0iOjIsIlNoYXBlVGlsZ"+
            "UNvdW50LntcImF0bGFzXCI6XCJoZXhhZ29uXCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJydWxlc1wiOlwic2FtZVwiLFwic2Nv"+
            "cmVyXCI6XCJzaGFwZVwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlfSI6MiwiVGlsZVBsYWNlZC5"+
            "oZXhhZ29uIjozLCJHYW1lU3RhcnRlZC50cmlhbmdsZSI6NSwiSGlnaFNjb3JlLntcImF0bGFzXCI6XCJ0cmlhbmdsZVwiLFwiY2"+
            "9sb3JzXCI6XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcI"+
            "nVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZX0iOjE4MiwiU2hhcGVDb21wbGV0ZWQue1wiYXRsYXNcIjpcInRyaWFuZ2xlXCIsXCJj"+
            "b2xvcnNcIjpcIndvbmc0XCIsXCJydWxlc1wiOlwic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwiLFwic2VnbWVudHNcIjowLFw"+
            "idW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlfSI6NDgsIlNoYXBlVGlsZUNvdW50LntcImF0bGFzXCI6XCJ0cmlhbmdsZVwiLFwiY2"+
            "9sb3JzXCI6XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcI"+
            "nVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZX0iOjcsIlRpbGVQbGFjZWQudHJpYW5nbGUiOjI1NywiR2FtZUNvbXBsZXRlZC50cmlh"+
            "bmdsZSI6MSwiSGlnaFNjb3JlLntcImF0bGFzXCI6XCJzbnVic3F1YXJlXCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJydWxlc1w"+
            "iOlwic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlfS"+
            "I6MTk2LCJTaGFwZUNvbXBsZXRlZC57XCJhdGxhc1wiOlwic251YnNxdWFyZVwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwicnVsZ"+
            "XNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxz"+
            "ZX0iOjEyNSwiU2hhcGVUaWxlQ291bnQue1wiYXRsYXNcIjpcInNudWJzcXVhcmVcIixcImNvbG9yc1wiOlwid29uZzRcIixcInJ"+
            "1bGVzXCI6XCJzYW1lXCIsXCJzY29yZXJcIjpcInNoYXBlXCIsXCJzZWdtZW50c1wiOjAsXCJ1bmlxdWVUaWxlQ29sb3JzXCI6Zm"+
            "Fsc2V9Ijo5LCJHYW1lQ29tcGxldGVkLnNudWJzcXVhcmUiOjMsIkdhbWVTdGFydGVkLmRlbHRvdHJpaGV4IjoyLCJHYW1lQ29tc"+
            "GxldGVkLnJob21idXMiOjMsIkdhbWVDb21wbGV0ZWQuYW1tYW5uYmVlbmtlciI6MSwiR2FtZVN0YXJ0ZWQucGVucm9zZSI6NSwi"+
            "SGlnaFNjb3JlLntcImF0bGFzXCI6XCJwZW5yb3NlXCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJydWxlc1wiOlwic2FtZVwiLFw"+
            "ic2NvcmVyXCI6XCJzaGFwZVwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOmZhbHNlfSI6MTM0LCJTaGFwZU"+
            "NvbXBsZXRlZC57XCJhdGxhc1wiOlwicGVucm9zZVwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcI"+
            "nNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZX0iOjU1LCJTaGFwZVRp"+
            "bGVDb3VudC57XCJhdGxhc1wiOlwicGVucm9zZVwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwicnVsZXNcIjpcInNhbWVcIixcInN"+
            "jb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpmYWxzZX0iOjEwLCJHYW1lU3Rhcn"+
            "RlZC5wZW50YWdvbiI6MSwiSGlnaFNjb3JlLntcImF0bGFzXCI6XCJwZW50YWdvblwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic"+
            "nVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpm"+
            "YWxzZX0iOjE0OCwiU2hhcGVDb21wbGV0ZWQue1wiYXRsYXNcIjpcInBlbnRhZ29uXCIsXCJjb2xvcnNcIjpcIndvbmc0XCIsXCJ"+
            "ydWxlc1wiOlwic2FtZVwiLFwic2NvcmVyXCI6XCJzaGFwZVwiLFwic2VnbWVudHNcIjowLFwidW5pcXVlVGlsZUNvbG9yc1wiOm"+
            "ZhbHNlfSI6NjAsIlNoYXBlVGlsZUNvdW50LntcImF0bGFzXCI6XCJwZW50YWdvblwiLFwiY29sb3JzXCI6XCJ3b25nNFwiLFwic"+
            "nVsZXNcIjpcInNhbWVcIixcInNjb3JlclwiOlwic2hhcGVcIixcInNlZ21lbnRzXCI6MCxcInVuaXF1ZVRpbGVDb2xvcnNcIjpm"+
            "YWxzZX0iOjYsIlRpbGVQbGFjZWQucGVudGFnb24iOjgxLCJHYW1lQ29tcGxldGVkLnBlbnRhZ29uIjoxLCJHYW1lQ29tcGxldGV"+
            "kLnBlbnJvc2UiOjEsIkhpZ2hTY29yZSI6MTAsIlNoYXBlVGlsZUNvdW50IjoyfQ=="));
        JSON.parse(localStorage.statistics);
        window.location.reload();
        // gameController.stats.unserialize(localStorage.statistics);
        // gameController.run("statistics", true);
        `,
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
        gameController.run("statistics", true);
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

                console.log(
                    `${size.lang || ""} ${size.name} ${screenshot.filename}`,
                );

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

                if (size.lang) {
                    // Navigate to the target URL to set language
                    await page.goto(targetUrl + screenshotPath);
                    await page.evaluate(
                        `localStorage.setItem("language", "${size.lang}");`,
                    );
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
