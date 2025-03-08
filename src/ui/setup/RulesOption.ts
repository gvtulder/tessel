import { RuleSet } from "../../grid/RuleSet";
import { TileColors } from "../../grid/Tile";
import { Color } from "../score/ScoreOverlayDisplay";
import { SVG } from "../svg";
import { SettingRowOption } from "./SettingRowOption";

export class RulesOption extends SettingRowOption {
    rules: RuleSet;
    colorIndex: [number, number];
    segmentA: SVGPolygonElement;
    segmentB: SVGPolygonElement;

    constructor(key: string, rules: RuleSet, colorIndex: [number, number]) {
        super(key);
        this.rules = rules;
        this.colorIndex = colorIndex;

        const svg = SVG("svg", "rules", this.element);
        svg.setAttribute("viewBox", "0 0 1 1");

        // gradient
        const defs = SVG("defs", null, svg);
        const radialGradient = SVG("radialGradient", null, defs);
        radialGradient.setAttribute("id", "gradient");
        radialGradient.setAttribute("cx", "0.5");
        radialGradient.setAttribute("cy", "0.5");
        radialGradient.setAttribute("r", "0.4");
        const start = SVG("stop", null, radialGradient);
        start.setAttribute("offset", "70%");
        start.setAttribute("stop-color", "white");
        const stop = SVG("stop", null, radialGradient);
        stop.setAttribute("offset", "100%");
        stop.setAttribute("stop-color", "black");

        const g = SVG("g", null, svg);

        // segments
        const segmentA = SVG("polygon", null, g);
        segmentA.setAttribute("points", "0.1 0 1 0 1 0.9");
        this.segmentA = segmentA;
        const segmentB = SVG("polygon", null, g);
        segmentB.setAttribute("points", "0 0.1 0.9 1 0 1");
        this.segmentB = segmentB;

        // mask
        const mask = SVG("mask", null, svg);
        mask.setAttribute("id", "mask");
        const maskSquare = SVG("rect", null, mask);
        maskSquare.setAttribute("x", "0");
        maskSquare.setAttribute("y", "0");
        maskSquare.setAttribute("width", "1");
        maskSquare.setAttribute("height", "1");
        maskSquare.setAttribute("fill", "url(#gradient)");
        g.setAttribute("mask", "url(#mask)");

        // checkmark
        const checkG = SVG("g", null, svg);
        checkG.setAttribute("transform", "translate(0.70 0.7) scale(0.15)");

        // checkmark circle
        const circleBG = SVG("circle", null, mask);
        circleBG.setAttribute("cx", "0.5");
        circleBG.setAttribute("cy", "0.45");
        circleBG.setAttribute("r", "1.2");
        circleBG.setAttribute("fill", "black");
        circleBG.setAttribute("transform", "translate(0.70 0.7) scale(0.15)");

        // checkmark circle
        const circle = SVG("circle", null, checkG);
        circle.setAttribute("cx", "0.5");
        circle.setAttribute("cy", "0.45");
        circle.setAttribute("r", "1");
        circle.setAttribute("fill", Color.light);
        circle.setAttribute("stroke", Color.dark);
        circle.setAttribute("stroke-width", "0.15");

        // checkmark
        const checkmark = SVG("path", null, checkG);
        checkmark.setAttribute(
            "d",
            "M 0.87780016,0.02563948 0.35927277,0.65986061 0.12219998,0.36989528 " +
                "c -0.02795756,-0.0341881 -0.07327848,-0.0341881 -0.10123613,0 " +
                "-0.0279518,0.0341952 -0.0279518,0.0896274 0,0.12382263 " +
                "l 0.2876909,0.35187666 c 0.0139788,0.0170905 0.0322984,0.0256428 " +
                "0.050618,0.0256428 0.0183197,0 0.0366392,-0.008552 0.0506181,-0.0256428" +
                " L 0.97903606,0.149469 c 0.0279519,-0.0341952 0.0279519,-0.0896275 " +
                "0,-0.12382256 -0.0279575,-0.03419526 " +
                "-0.073284,-0.03419526 -0.1012359,0 z",
        );
        checkmark.setAttribute("fill", Color.dark);
    }

    updateColors(colors: TileColors) {
        this.segmentA.setAttribute("fill", colors[this.colorIndex[0]]);
        this.segmentB.setAttribute("fill", colors[this.colorIndex[1]]);
    }
}
