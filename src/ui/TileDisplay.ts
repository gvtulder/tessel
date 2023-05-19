import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { SCALE } from '../settings.js';
import { OrientedColors, Tile } from "../grid/Tile.js";
import { TriangleDisplay } from './TriangleDisplay.js';
import { GridDisplay } from './GridDisplay.js';
import { shrinkOutline } from 'src/utils.js';
import { DraggableTileHTMLDivElement } from './TileStackDisplay.js';


export class TileDisplay {
    tile : Tile;

    gridDisplay : GridDisplay;
    triangleDisplays : TriangleDisplay[];

    element : HTMLDivElement;
    svgGroup : SVGElement;
    svgTriangles : SVGElement;

    dropzone : Interactable;

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

        // add in correct order to make the overlapping work
        const sortedTriangles = [...this.tile.triangles].sort((a, b) => {
            return (a.y != b.y) ? (a.y - b.y) : (a.x - b.x);
        });
        for (const triangle of sortedTriangles) {
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

    makeDropzone(ondrop: (target : Tile, orientedColors : OrientedColors, indexOnStack : number) => void) {
        if (this.dropzone || !this.tile.isPlaceholder()) return;

        this.dropzone = interact(this.element).dropzone({
            overlap: 0.6, // center',
        }).on('drop', (evt: DragEvent) => {
            console.log('drop', evt, evt.target, evt.relatedTarget);
            console.log('dropped tile', (evt.relatedTarget as DraggableTileHTMLDivElement).tileDisplay);

            const rel = (evt.relatedTarget as DraggableTileHTMLDivElement);
            ondrop(this.tile, rel.orientedColors, rel.indexOnStack);
        }).on('dropactivate', (evt: DragEvent) => {
            evt.target.classList.add('drop-activated');
            /*
            if (this.gameManager.settings.hints) {
                console.log('dropactivate', (evt.relatedTarget as TileUIHTMLDivElement).tile.colors);
                if (this.gameManager.board.checkFitWithRotations((evt.relatedTarget as TileUIHTMLDivElement).tile.colors,
                    (evt.target as TileUIHTMLDivElement).tile.col,
                    (evt.target as TileUIHTMLDivElement).tile.row) == null) {
                    evt.target.classList.add('drop-hint-would-not-fit');
                } else {
                    evt.target.classList.add('drop-hint-would-fit');
                }
            }
            */
        }).on('dropdeactivate', (evt: DragEvent) => {
            evt.target.classList.remove('drop-activated');
            evt.target.classList.remove('drop-hint-would-fit');
            evt.target.classList.remove('drop-hint-would-not-fit');
        }).on('dragenter', (evt: DragEvent) => {
            console.log('dragenter', evt.target);
            /*
            (evt.relatedTarget as TileUIHTMLDivElement).tile.autoRotate((evt.target as TileUIHTMLDivElement).tile);
            */
        }).on('dragleave', (evt: DragEvent) => {
            console.log('dragleave', evt.target);
            /*
            (evt.relatedTarget as TileUIHTMLDivElement).tile.resetAutoRotate();
            */
        });
    }

    removeDropzone() {
        if (this.dropzone) {
            this.dropzone.unset();
            this.dropzone = null;
        }
    }
}
