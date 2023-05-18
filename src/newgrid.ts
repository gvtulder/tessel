

const OFFSET = 50;
const SCALE = 100;
const COLORS = ['black', 'red', 'blue', 'grey', 'green', 'brown', 'orange', 'purple', 'pink'];


type Coord = [x : number, y : number];


abstract class Triangle {
    x : number;
    y : number;
    color : string;

    points : Coord[];
    left : number;
    top : number;

    neighborOffsets : Coord[];

    element : HTMLDivElement;

    constructor(x : number, y : number, color : string) {
        this.x = x;
        this.y = y;
        this.color = color;

        this.calc();
        this.build();
    }

    abstract calc();

    build() {
        const div = document.createElement('div');
        div.title = `(${this.x},${this.y})`;
        this.element = div;

        div.style.position = 'absolute';
        div.style.left = `${this.left * SCALE + OFFSET}px`;
        div.style.top = `${this.top * SCALE + OFFSET}px`;

        const svg = this.generateSvg();
        div.appendChild(svg);
    }

    generateSvg() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', `${SCALE}`);
        svg.setAttribute('height', `${SCALE}`);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(group);

        const coordinates = this.points.map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        el.setAttribute('points', coordinates.join(' '));
        el.setAttribute('opacity', '0.5');
        el.setAttribute('fill', this.color);
        el.setAttribute('stroke', 'white');
        el.setAttribute('stroke-width', '2px');
        group.append(el);

        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', `${this.center[0] * SCALE}`);
        center.setAttribute('cy', `${this.center[1] * SCALE}`);
        center.setAttribute('r', `${0.02 * SCALE}`);
        center.setAttribute('opacity', '0.5');
        center.setAttribute('fill', 'black');
        group.append(center);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', `${this.center[0] * SCALE}`);
        text.setAttribute('y', `${this.center[1] * SCALE}`);
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', 'white');
        text.appendChild(document.createTextNode(`(${this.x},${this.y})`));
        group.append(text);

        return svg;
    }

    get center() : Coord {
        // incenter coordinates
        const sideLength = (a : Coord, b : Coord) => (
            Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
        );
        const w0 = sideLength(this.points[1], this.points[2]),
              w1 = sideLength(this.points[0], this.points[2]),
              w2 = sideLength(this.points[0], this.points[1]);
        const x = (w0 * this.points[0][0] + w1 * this.points[1][0] + w2 * this.points[2][0]) / (w0 + w1 + w2);
        const y = (w0 * this.points[0][1] + w1 * this.points[1][1] + w2 * this.points[2][1]) / (w0 + w1 + w2);
        return [x, y];
    }

    get width() : number {
        return Math.max(...this.points.map((p) => p[0]));
    }

    get height() : number {
        return Math.max(...this.points.map((p) => p[1]));
    }
}


class HexGridTriangle extends Triangle {
    calc() {
        // equilateral triangle in a hexagonal grid
        if (this.x % 2 == this.y % 2) {
            // triangle pointing down
            this.points = [[0, 0], [0.5, Math.sqrt(3) / 2], [1, 0], [0, 0]];
            this.neighborOffsets = [[0, -1], [1, 0], [-1, 0]];
        } else {
            // triangle pointing up
            this.points = [[0.5, 0], [0, Math.sqrt(3) / 2], [1, Math.sqrt(3) / 2], [0.5, 0]];
            this.neighborOffsets = [[-1, 0], [1, 0], [0, 1]];
        }

        this.left = this.x * 0.5 * this.width;
        this.top = this.y * this.height;
    }
}

class SquareGridTriangle extends Triangle {
    calc() {
        // triangle in a square grid
        this.left = this.x;
        this.top = Math.floor(this.y / 4);
        if (this.y % 4 == 0) {
            // top triangle pointing down
            this.points = [[0, 0], [0.5, 0.5], [1, 0], [0, 0]];
            this.neighborOffsets = [[0, -1], [0, 1], [0, 2]];
        } else if (this.y % 4 == 1) {
            // left triangle pointing right
            this.points = [[0, 0], [0.5, 0.5], [0, 1], [0, 0]];
            this.neighborOffsets = [[-1, 1], [0, -1], [0, 2]];
        } else if (this.y % 4 == 2) {
            // right triangle pointing left
            this.left += 0.5;
            this.points = [[0.5, 0], [0, 0.5], [0.5, 1], [0.5, 0]];
            this.neighborOffsets = [[1, -1], [0, -2], [0, 1]];
        } else if (this.y % 4 == 3) {
            // bottom triangle pointing up
            this.top += 0.5;
            this.points = [[0, 0.5], [0.5, 0], [1, 0.5], [0, 0.5]];
            this.neighborOffsets = [[0, 1], [0, -1], [0, -2]];
        }
    }
}

class EquilateralGridTriangle extends Triangle {
    calc() {
        // triangle in a grid of equilateral triangles
        const height = Math.sqrt(3) / 2;
        const odd = this.y % 12 < 6;
        this.left = this.x + (odd ? 0 : 0.5);
        this.top = height * Math.floor(this.y / 6);
        if (this.y % 6 == 0) {
            // top triangle pointing down
            this.points = [[0, 0], [0.5, height / 3], [1, 0], [0, 0]];
            this.neighborOffsets = [[0, 1], [0, 2], [(odd ? -1 : 0), -1]];
        } else if (this.y % 6 == 1) {
            // left triangle pointing up-right
            this.points = [[0, 0], [0.5, height / 3], [0.5, height], [0, 0]];
            this.neighborOffsets = [[0, -1], [-1, 3], [0, 1]];
        } else if (this.y % 6 == 2) {
            // right triangle pointing up-left
            this.left += 0.5;
            this.points = [[0.5, 0], [0, height / 3], [0, height], [0.5, 0]];
            this.neighborOffsets = [[0, -2], [0, -1], [0, 1]];
        } else if (this.y % 6 == 3) {
            // left triangle pointing bottom-right
            this.left += 0.5;
            this.points = [[0.5, 0], [0.5, 2 * height / 3], [0, height], [0.5, 0]];
            this.neighborOffsets = [[0, -1], [0, 1], [0, 2]];
        } else if (this.y % 6 == 4) {
            // right triangle pointing bottom-left
            this.left += 1;
            this.points = [[0, 0], [0.5, height], [0, 2 * height / 3], [0, 0]];
            this.neighborOffsets = [[0, -1], [0, 1], [1, -3]];
        } else if (this.y % 6 == 5) {
            // bottom triangle pointing up
            this.left += 0.5;
            this.top += 2 * height / 3;
            this.points = [[0, height / 3], [0.5, 0], [1, height / 3], [0, height / 3]];
            this.neighborOffsets = [[0, -2], [0, -1], [(odd ? 0 : 1), 1]];
        }
    }
}


class Connector {
    element : HTMLDivElement;
    svgGroup : SVGElement;

    constructor() {
        this.build();
    }

    build() {
        const div = document.createElement('div');
        this.element = div;

        div.style.position = 'absolute';
        div.style.left = `${OFFSET}px`;
        div.style.top = `${OFFSET}px`;

        const svg = this.generateSvg();
        this.element.appendChild(svg);
    }

    generateSvg() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', `${100 * SCALE}`);
        svg.setAttribute('height', `${100 * SCALE}`);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(group);
        this.svgGroup = group;

        return svg;
    }

    connect(grid : NewGrid, triangle : Triangle) {
        for (const neighbor of grid.getNeighbors(triangle)) {
            this.drawLine(triangle, neighbor);
        }
    }

    drawLine(a : Triangle, b : Triangle) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${(a.left + a.center[0]) * SCALE}`);
        line.setAttribute('y1', `${(a.top + a.center[1]) * SCALE}`);
        line.setAttribute('x2', `${(b.left + b.center[0]) * SCALE}`);
        line.setAttribute('y2', `${(b.top + b.center[1]) * SCALE}`);
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-width', '8');
        this.svgGroup.appendChild(line);
    }
}


export class NewGrid {
    triangleType = [HexGridTriangle, SquareGridTriangle, EquilateralGridTriangle][2];

    grid : Triangle[][];
    div : HTMLDivElement;

    constructor() {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.background = '#fff';
        div.style.zIndex = '10000';
        document.body.appendChild(div);
        this.div = div;

        this.drawTriangles();
    }

    drawTriangles() {
        const triangles : Triangle[] = [];
        const grid : Triangle[][] = [];
        this.grid = grid;

        let i = 0;
        for (let row=0; row<24; row++) {
            for (let col=0; col<12; col++) {
                const triangle = new this.triangleType(col, row, COLORS[i % COLORS.length]);
                this.div.appendChild(triangle.element);
                i++;

                if (!grid[col]) grid[col] = [];
                grid[col][row] = triangle;
                triangles.push(triangle);
            }
        }

        const conn = new Connector();
        this.div.appendChild(conn.element);

        for (const triangle of triangles) {
            conn.connect(this, triangle);
        }
    }

    get(x : number, y : number) : Triangle | null {
        if (x < 0 || !this.grid[x]) return null;
        if (y < 0 || !this.grid[x][y]) return null;
        return this.grid[x][y];
    }

    getNeighbors(triangle : Triangle) : Triangle[] {
        const neighbors : Triangle[] = [];
        for (const n of triangle.neighborOffsets) {
            const neighbor = this.get(triangle.x + n[0], triangle.y + n[1]);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }
}
