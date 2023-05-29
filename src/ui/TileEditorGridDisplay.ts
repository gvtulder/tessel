import interact from '@interactjs/interact/index';
import type { Interactable } from '@interactjs/types';

import { Grid } from "src/grid/Grid.js";
import { Coord } from 'src/grid/Triangle.js';
import { GridDisplay } from './GridDisplay.js';



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

        this.addBackgroundGrid();

        this.interactable = interact(this.svgTriangles)
        .on('tap', (evt : PointerEvent) => {
            // find the triangle
            const triangleCoord = this.screenPositionToTriangleCoord([evt.clientX, evt.clientY]);
            this.dispatchEvent(new TileEditorGridEvent(TileEditorGridDisplay.events.ClickTriangle, triangleCoord));
        })
        .on('doubletap', (evt : PointerEvent) => {
            // find the triangle
            const triangleCoord = this.screenPositionToTriangleCoord([evt.clientX, evt.clientY]);
            this.dispatchEvent(new TileEditorGridEvent(TileEditorGridDisplay.events.DoubleClickTriangle, triangleCoord));
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
