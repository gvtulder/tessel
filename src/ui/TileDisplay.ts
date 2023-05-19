import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { SCALE } from '../settings.js';
import { Tile } from "../grid/Tile.js";
import { TriangleDisplay } from './TriangleDisplay.js';
import { GridDisplay } from './GridDisplay.js';
import { shrinkOutline } from 'src/utils.js';


export class TileDisplay {
    tile : Tile;

    gridDisplay : GridDisplay;
    triangleDisplays : TriangleDisplay[];

    element : HTMLDivElement;
    svgGroup : SVGElement;
    svgTriangles : SVGElement;

    constructor(gridDisplay: GridDisplay, tile: Tile) {
        this.gridDisplay = gridDisplay;
        this.tile = tile;
        this.build();
    }

    build() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${this.tile.left * SCALE }px`;
        div.style.top = `${this.tile.top * SCALE}px`;
        div.style.width = `${this.tile.width * SCALE}px`;
        div.style.height = `${this.tile.height * SCALE}px`;
        this.element = div;

        this.drawTriangles();
        this.drawOutline();

        const left = this.tile.left * SCALE;
        const top = this.tile.top * SCALE;
        this.svgTriangles.setAttribute('transform', `translate(${left} ${top})`);
    }

    drawTriangles() {
        this.triangleDisplays = [];

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-tile');
        this.svgTriangles = group;

        for (const triangle of this.tile.triangles) {
            const left = (triangle.left - this.tile.left) * SCALE ;
            const top = (triangle.top - this.tile.top) * SCALE
            const triangleDisplay = new TriangleDisplay(triangle);
            triangleDisplay.element.setAttribute('transform', `translate(${left} ${top})`);
            this.triangleDisplays.push(triangleDisplay);
            group.appendChild(triangleDisplay.element);
        }
    }

    drawOutline() {
        let outline = this.tile.computeOutline();
        outline = shrinkOutline(outline, 0.95);

        let path = outline.map((p) => `${p[0] * SCALE} ${p[1] * SCALE}`).join(' L ');
        path = `M ${path} Z`;
        const roundPath = roundPathCorners(path, 8, false);

        this.svgTriangles.setAttribute('clip-path', `path('${roundPath}')`);
    }
}
