import type { Interactable } from '@interactjs/types';

import { Triangle } from 'src/grid/Triangle.js';
import { shrinkOutline } from 'src/utils.js';
import { Tile, TileType } from "../grid/Tile.js";
import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { DEBUG, PLACEHOLDER, SCALE } from '../settings.js';
import { GridDisplay } from './GridDisplay.js';
import { TriangleDisplay } from './TriangleDisplay.js';
import offsetPolygon from 'src/lib/offset-polygon.js';


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
        let className = 'svg-tile';
        if (this.tile.type === TileType.PatternExample) {
            className = `${className} svg-tile-PatternExample`;
        }
        group.setAttribute('class', className);
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

        const left = (this.tile.left * SCALE).toFixed(5);
        const top = (this.tile.top * SCALE).toFixed(5);
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
            const left = ((triangle.left - this.tile.left) * SCALE).toFixed(5);
            const top = ((triangle.top - this.tile.top) * SCALE).toFixed(5);
            triangleDisplay.element.setAttribute('transform', `translate(${left} ${top})`);
            this.svgTriangles.appendChild(triangleDisplay.element);
        }
        const removedTriangles = [...this.triangleDisplays.keys()].filter(
            (t) => t.tile !== this.tile);
        for (const triangle of removedTriangles) {
            this.triangleDisplays.get(triangle).destroy();
            this.triangleDisplays.delete(triangle);
            this.gridDisplay.triangleDisplays.delete(triangle);
        }
    }

    drawOutline() {
        let outline = this.tile.computeOutline();

        outline = offsetPolygon(outline.reverse().map((p) => ({x: p[0], y: p[1]})), 0.03).map((v) => [v.x, v.y]);
        // outline = shrinkOutline(outline, 0.95);

        let path = outline.map((p) => `${p[0] * SCALE} ${p[1] * SCALE}`).join(' L ');
        path = `M ${path} Z`;
        const roundPath = roundPathCorners(path, 8, false);

        if (this.tile.type === TileType.Placeholder) {
            const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            outline.setAttribute('d', roundPath);
            outline.setAttribute('fill', PLACEHOLDER);
            if (DEBUG.HIDE_TILE_OUTLINE) {
                outline.setAttribute('fill-opacity', '0.0');
            } else {
                outline.setAttribute('fill-opacity', '0.5');
            }
            outline.setAttribute('stroke', PLACEHOLDER);
            this.svgTriangles.appendChild(outline);
        } else {
            if (DEBUG.HIDE_TILE_OUTLINE) return;
            this.svgTriangles.setAttribute('clip-path', `path('${roundPath}')`);
        }
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
