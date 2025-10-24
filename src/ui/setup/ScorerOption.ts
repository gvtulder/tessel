/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Scorer, ScorerType } from "../../game/scorers/Scorer";
import { SettingRowOption } from "./SettingRowOption";
import SVG_CONVEX from "bundle-text:../svgs/scorer-convex.svg";
import SVG_HOLES from "bundle-text:../svgs/scorer-holes.svg";
import SVG_SHAPE from "bundle-text:../svgs/scorer-shape.svg";
import SVG_SINGLE_TILE from "bundle-text:../svgs/scorer-single-tile.svg";
import SVG_VERTEX from "bundle-text:../svgs/scorer-vertex.svg";
import { createElement } from "../shared/html";
import { UniqueIdSource } from "../shared/uniqueSvgId";

const uniqueIdSource = new UniqueIdSource("scorer");

export class ScorerOption extends SettingRowOption {
    scorer: ScorerType;

    constructor(key: string, scorer: ScorerType) {
        super(key);
        this.scorer = scorer;
        console.log(scorer.friendlyName);
        this.title = scorer.friendlyName;

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
        // make unique IDs for masks and gradients
        const prefix = uniqueIdSource.getUniqueIdPrefix();
        svg = svg.replaceAll("url(#", `url(#${prefix}`);
        svg = svg.replaceAll('id="', `id="${prefix}`);
        const el = createElement("div");
        el.innerHTML = svg;
        this.element.appendChild(el.firstChild!);
    }

    cloneForDisplay(): ThisType<this> {
        return new ScorerOption(this.key, this.scorer);
    }
}
