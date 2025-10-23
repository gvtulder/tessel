/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { RuleSet } from "../../grid/rules/RuleSet";
import { TileColors } from "../../grid/Tile";
import { SVG } from "../shared/svg";
import { SettingRowOption } from "./SettingRowOption";

export class RulesOption extends SettingRowOption {
    rules: RuleSet;
    colorIndex: [number, number];
    colors?: TileColors;
    segmentA: SVGPolygonElement;
    segmentB: SVGPolygonElement;

    constructor(key: string, rules: RuleSet, colorIndex: [number, number]) {
        super(key);
        this.rules = rules;
        this.colorIndex = colorIndex;
        this.title = rules.name;

        const svg = SVG("svg", "rules", this.element, {
            viewBox: "0 0 1 1",
        });

        // gradient
        const defs = SVG("defs", null, svg);
        let linearGradient;
        linearGradient = SVG("linearGradient", null, defs, {
            id: "gradientH",
            x1: "0",
            x2: "0",
            y1: "0",
            y2: "1",
        });
        let stop;
        stop = SVG("stop", null, linearGradient, {
            offset: "4%",
            "stop-color": "black",
        });
        stop = SVG("stop", null, linearGradient, {
            offset: "15%",
            "stop-opacity": "0",
        });
        stop = SVG("stop", null, linearGradient, {
            offset: "85%",
            "stop-opacity": "0",
        });
        stop = SVG("stop", null, linearGradient, {
            offset: "96%",
            "stop-color": "black",
        });
        linearGradient = SVG("linearGradient", null, defs, {
            id: "gradientV",
            x1: "0",
            x2: "1",
            y1: "0",
            y2: "0",
        });
        stop = SVG("stop", null, linearGradient, {
            offset: "4%",
            "stop-color": "black",
        });
        stop = SVG("stop", null, linearGradient, {
            offset: "15%",
            "stop-color": "white",
        });
        stop = SVG("stop", null, linearGradient, {
            offset: "85%",
            "stop-color": "white",
        });
        stop = SVG("stop", null, linearGradient, {
            offset: "96%",
            "stop-color": "black",
        });

        const g = SVG("g", null, svg, {
            mask: "url(#mask)",
        });

        // segments
        this.segmentA = SVG("polygon", null, g, {
            points: "0.1 0 1 0 1 0.9",
        });
        this.segmentB = SVG("polygon", null, g, {
            points: "0 0.1 0.9 1 0 1",
        });

        // mask
        const mask = SVG("mask", null, svg, {
            id: "mask",
        });
        SVG("rect", null, mask, {
            x: "0",
            y: "0",
            width: "1",
            height: "1",
            fill: "url(#gradientV)",
        });
        SVG("rect", null, mask, {
            x: "0",
            y: "0",
            width: "1",
            height: "1",
            fill: "url(#gradientH)",
        });

        // checkmark
        const checkG = SVG("g", null, svg, {
            transform: "translate(0.63 0.63) scale(0.15)",
        });

        // checkmark circle background mask
        SVG("circle", null, mask, {
            cx: "0.5",
            cy: "0.45",
            r: "1.2",
            fill: "black",
            transform: "translate(0.63 0.63) scale(0.15)",
        });

        // checkmark circle
        SVG("circle", "checkmark", checkG, {
            cx: "0.5",
            cy: "0.45",
            r: "1",
            "stroke-width": "0.15",
        });

        // checkmark
        SVG("path", "checkmark", checkG, {
            d:
                "M 0.87780016,0.02563948 0.35927277,0.65986061 0.12219998,0.36989528 " +
                "c -0.02795756,-0.0341881 -0.07327848,-0.0341881 -0.10123613,0 " +
                "-0.0279518,0.0341952 -0.0279518,0.0896274 0,0.12382263 " +
                "l 0.2876909,0.35187666 c 0.0139788,0.0170905 0.0322984,0.0256428 " +
                "0.050618,0.0256428 0.0183197,0 0.0366392,-0.008552 0.0506181,-0.0256428" +
                " L 0.97903606,0.149469 c 0.0279519,-0.0341952 0.0279519,-0.0896275 " +
                "0,-0.12382256 -0.0279575,-0.03419526 " +
                "-0.073284,-0.03419526 -0.1012359,0 z",
        });
    }

    updateColors(colors: TileColors) {
        this.segmentA.setAttribute("fill", colors[this.colorIndex[0]]);
        this.segmentB.setAttribute("fill", colors[this.colorIndex[1]]);
        this.colors = colors;
    }

    cloneForDisplay(): ThisType<this> {
        const clone = new RulesOption(this.key, this.rules, this.colorIndex);
        if (this.colors) {
            clone.updateColors(this.colors);
        }
        return clone;
    }
}
