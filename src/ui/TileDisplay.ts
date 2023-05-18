import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { SCALE, OFFSET } from '../settings.js';
import { Tile } from "../grid/Tile.js";

export class TileDisplay {
    tile: Tile;

    element: HTMLDivElement;
    svgGroup: SVGElement;

    constructor(tile: Tile) {
        this.tile = tile;
        this.build();
    }

    build() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${this.tile.left * SCALE + OFFSET}px`;
        div.style.top = `${this.tile.top * SCALE + OFFSET}px`;
        this.element = div;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', `${this.tile.width * SCALE + 10}`);
        svg.setAttribute('height', `${this.tile.height * SCALE + 10}`);
        this.element.appendChild(svg);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(group);
        this.svgGroup = group;

        this.drawOutline();
    }

    drawOutline() {
        const outline = this.tile.computeOutline();

        let path = outline.map((p) => `${p[0] * SCALE} ${p[1] * SCALE}`).join(' L ');
        path = `M ${path} Z`;
        const roundPath = roundPathCorners(path, 8, false);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', path);
        line.setAttribute('stroke', 'white');
        line.setAttribute('stroke-width', '6px');
        line.setAttribute('stroke-linejoin', 'round');
        line.setAttribute('fill', 'none');
        this.svgGroup.appendChild(line);

        const roundLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        roundLine.setAttribute('d', roundPath);
        roundLine.setAttribute('stroke', 'white');
        roundLine.setAttribute('stroke-width', '6px');
        roundLine.setAttribute('stroke-linejoin', 'round');
        roundLine.setAttribute('fill', 'none');
        this.svgGroup.appendChild(roundLine);
    }
}
