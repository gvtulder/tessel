import { Scorer } from "../../game/scorers/Scorer";
import { SettingRowOption } from "./SettingRowOption";
import SVG_CONVEX from "bundle-text:./svgs/scorer-convex.svg";
import SVG_HOLES from "bundle-text:./svgs/scorer-holes.svg";
import SVG_SHAPE from "bundle-text:./svgs/scorer-shape.svg";
import SVG_SINGLE_TILE from "bundle-text:./svgs/scorer-single-tile.svg";
import SVG_VERTEX from "bundle-text:./svgs/scorer-vertex.svg";

export class ScorerOption extends SettingRowOption {
    scorer: Scorer;

    constructor(key: string, scorer: Scorer) {
        super(key);
        this.scorer = scorer;
        this.element.title = scorer.name;

        let svg = "";
        if (key == "convex") {
            svg = SVG_CONVEX;
        } else if (key == "holes") {
            svg = SVG_HOLES;
        } else if (key == "shape") {
            svg = SVG_SHAPE;
        } else if (key == "single-tile") {
            svg = SVG_SINGLE_TILE;
        } else if (key == "vertex") {
            svg = SVG_VERTEX;
        }
        this.element.innerHTML = svg;
    }
}
