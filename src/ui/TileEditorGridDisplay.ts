import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { OrientedColors, Tile } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { shuffle } from '../utils.js';
import { GameDisplay } from './GameDisplay.js';
import { TileEditorDisplay } from './TileEditorDisplay.js';
import { Coord } from 'src/grid/Triangle.js';



// TODO merge with MainGridDisplay and PatternEditorGridDisplay

export class TileEditorGridEvent extends Event {
    triangleCoord : Coord;
    constructor(type : string, triangleCoord : Coord) {
        super(type);
        this.triangleCoord = triangleCoord;
    }
}

export class TileEditorGridDisplay extends GridDisplay {
    static events = {
        ClickTriangle: 'clicktriangle',
        DoubleClickTriangle: 'doubleclicktriangle',
    };
    container : HTMLElement;
    interactable : Interactable;

    constructor(grid: Grid, container : HTMLElement) {
        super(grid, container);

        this.interactable = interact(this.svgTriangles)
        .on('tap', (evt : PointerEvent) => {
            // find the triangle
            const triangleCoord = this.screenPositionToTriangleCoord([evt.clientX, evt.clientY]);
            console.log("clicked", triangleCoord);
            this.dispatchEvent(new TileEditorGridEvent(TileEditorGridDisplay.events.ClickTriangle, triangleCoord));
        })
        .on('doubletap', (evt : PointerEvent) => {
            const triangleCoord = this.screenPositionToTriangleCoord([evt.clientX, evt.clientY]);
            console.log("doubleclicked", triangleCoord);
            this.dispatchEvent(new TileEditorGridEvent(TileEditorGridDisplay.events.ClickTriangle, triangleCoord));
        });
    }

    destroy() {
        this.interactable.unset();
        super.destroy();
    }

    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
    }
}
