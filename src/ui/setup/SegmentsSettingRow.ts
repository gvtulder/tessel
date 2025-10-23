/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { ColorPatternPerShape } from "../../grid/Shape";
import { Atlas } from "../../grid/Atlas";
import { TileColors } from "../../grid/Tile";
import { SegmentsOption } from "./SegmentsOption";
import { SettingRow } from "./SettingRow";

export class SegmentsSettingRow extends SettingRow<SegmentsOption> {
    constructor() {
        super("segments", "setup-segments", "Colors per tile");
    }

    showAtlas(atlas: Atlas, colors: TileColors) {
        // all shapes must have the same number of patterns
        const numPatterns = atlas.shapes[0].colorPatterns.length;
        for (const shape of atlas.shapes) {
            if (numPatterns !== shape.colorPatterns.length) {
                throw new Error(
                    "shapes with different numbers of color patterns",
                );
            }
        }

        // default option: all segments, non-unique colors
        if (this.options.length == 0) {
            const option = new SegmentsOption(`all`, 0, false);
            this.addOption(option);
        }
        this.options[0].showAtlas(
            atlas,
            colors,
            new ColorPatternPerShape(
                atlas.shapes.map((shape) => [shape, shape.colorPatterns[0]]),
            ),
        );

        // special options: specific segments, unique colors
        for (let i = 0; i < numPatterns; i++) {
            if (this.options.length <= i + 1) {
                const option = new SegmentsOption(`${i}`, i, i == 0);
                this.addOption(option);
            }
            this.options[i + 1].showAtlas(
                atlas,
                colors,
                new ColorPatternPerShape(
                    atlas.shapes.map((shape) => [
                        shape,
                        shape.colorPatterns[i],
                    ]),
                ),
            );
        }

        while (numPatterns + 1 < this.options.length) {
            this.popOption();
        }

        // update current selection
        if (this.currentOption) {
            this.currentOption.showAtlas(
                atlas,
                colors,
                this.options[this._selected || 0].colorPatternPerShape!,
            );
        }
    }
}
