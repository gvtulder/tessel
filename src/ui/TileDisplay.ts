import type { Interactable } from '@interactjs/types';

import { Triangle } from 'src/grid/Triangle.js';
import { dist, shrinkOutline } from 'src/utils.js';
import { Tile } from "../grid/Tile.js";
import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { DEBUG, SCALE } from '../settings.js';
import { GridDisplay } from './GridDisplay.js';
import { TriangleDisplay } from './TriangleDisplay.js';


export type TriangleOnScreenPosition = {
    triangle : Triangle,
    clientCenterCoord : [number, number],
}
export type TriangleOnScreenMatch = {
    moving: TriangleOnScreenPosition,
    fixed: TriangleOnScreenPosition,
    dist: number,
};

export class TileDisplay extends EventTarget {
    static events = {
        UpdateTile: 'updatetile',
    };

    tile : Tile;

    gridDisplay : GridDisplay;
    triangleDisplays : Map<Triangle, TriangleDisplay>;

    svgTriangles : SVGElement;

    constructor(gridDisplay: GridDisplay, tile: Tile) {
        super();
        this.gridDisplay = gridDisplay;
        this.triangleDisplays = new Map<Triangle, TriangleDisplay>();
        this.tile = tile;
        this.build();

        this.tile.addEventListener(Tile.events.UpdateTriangles, () => {
            this.dispatchEvent(new Event(TileDisplay.events.UpdateTile));
            this.redraw();
        });
    }

    build() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-tile');
        this.svgTriangles = group;

        this.redraw();
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

    getTriangleOnScreenPosition() : TriangleOnScreenPosition[] {
        return [...this.triangleDisplays.values()].map((td) => ({
            triangle: td.triangle,
            clientCenterCoord: td.getClientCenterCoord(),
        }));
    }

    findClosestTriangleFromScreenPosition(pos : TriangleOnScreenPosition[]) : TriangleOnScreenMatch {
        // check if the points are inside this tile
        const rect = this.svgTriangles.getBoundingClientRect();
        pos = pos.filter((p) => (
            rect.left <= p.clientCenterCoord[0] &&
            p.clientCenterCoord[0] <= rect.left + rect.width &&
            rect.top <= p.clientCenterCoord[1] &&
            p.clientCenterCoord[1] <= rect.top + rect.height
        ));

        // look for matching triangles
        let closestDist = 0;
        let closestPair : TriangleOnScreenMatch = null;
        for (const thisPos of this.getTriangleOnScreenPosition()) {
            for (const p of pos) {
                const d = dist(thisPos.clientCenterCoord, p.clientCenterCoord);
                if (closestPair === null || d < closestDist) {
                    closestPair = { moving: p, fixed: thisPos, dist: d }
                    closestDist = d;
                }

            }
        }
        return closestPair;
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
