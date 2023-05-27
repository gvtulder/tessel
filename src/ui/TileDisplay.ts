import type { Interactable } from '@interactjs/types';

import { Triangle } from 'src/grid/Triangle.js';
import { shrinkOutline } from 'src/utils.js';
import { Tile } from "../grid/Tile.js";
import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { DEBUG, SCALE } from '../settings.js';
import { GridDisplay } from './GridDisplay.js';
import { TriangleDisplay } from './TriangleDisplay.js';


export type TriangleOnScreenMatch = {
    moving: Triangle,
    fixed: Triangle,
};

export class TileDisplay {
    tile : Tile;

    gridDisplay : GridDisplay;
    triangleDisplays : Map<Triangle, TriangleDisplay>;

    svgTriangles : SVGElement;

    constructor(gridDisplay: GridDisplay, tile: Tile) {
        this.gridDisplay = gridDisplay;
        this.triangleDisplays = new Map<Triangle, TriangleDisplay>();
        this.tile = tile;
        this.build();
    }

    build() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-tile');
        this.svgTriangles = group;

        this.redraw();
    }

    destroy() {
        for (const td of this.triangleDisplays.values()) {
            td.destroy();
        }
        this.svgTriangles.remove();
    }

    redraw() {
        this.drawTriangles();
        this.drawOutline();

        const left = this.tile.left * SCALE;
        const top = this.tile.top * SCALE;
        this.svgTriangles.setAttribute('transform', `translate(${left} ${top})`);
    }

    drawTriangles() {
        // add in correct order to make the overlapping work
        const sortedTriangles = [...this.tile.triangles].sort((a, b) => {
            return (a.y != b.y) ? (a.y - b.y) : (a.x - b.x);
        });
        for (const c of [...this.svgTriangles.childNodes]) {
            this.svgTriangles.removeChild(c);
        }
        for (const triangle of sortedTriangles) {
            let triangleDisplay = this.triangleDisplays.get(triangle);
            if (!triangleDisplay) {
                triangleDisplay = new TriangleDisplay(triangle);
                this.triangleDisplays.set(triangle, triangleDisplay);
                this.gridDisplay.triangleDisplays.set(triangle, triangleDisplay);
            }
            const left = (triangle.left - this.tile.left) * SCALE ;
            const top = (triangle.top - this.tile.top) * SCALE
            triangleDisplay.element.setAttribute('transform', `translate(${left} ${top})`);
            this.svgTriangles.appendChild(triangleDisplay.element);
        }
    }

    drawOutline() {
        if (DEBUG.HIDE_TILE_OUTLINE) return;

        let outline = this.tile.computeOutline();
        outline = shrinkOutline(outline, 0.95);

        let path = outline.map((p) => `${p[0] * SCALE} ${p[1] * SCALE}`).join(' L ');
        path = `M ${path} Z`;
        const roundPath = roundPathCorners(path, 8, false);

        this.svgTriangles.setAttribute('clip-path', `path('${roundPath}')`);
    }

    hide() {
        this.svgTriangles.classList.add('hide');
    }

    highlightHint(ok: boolean) {
        this.svgTriangles.classList.toggle('highlight-hint-ok', ok);
        this.svgTriangles.classList.toggle('highlight-hint-notok', !ok);
    }

    removeHighlightHint() {
        this.svgTriangles.classList.remove('highlight-hint-ok');
        this.svgTriangles.classList.remove('highlight-hint-notok');
    }
}
