

const OFFSET = 0;
const SCALE = 100;
const DEBUG_OVERLAP = false;
const O = (DEBUG_OVERLAP ? 0.1 : 0.1);
const COLORS = ['black', 'red', 'blue', 'grey', 'green', 'brown', 'orange', 'purple', 'pink'];

const SELECT_GRID = 0;


type TriangleColor = string;
type TileColors = TriangleColor[];


type Coord = [x : number, y : number];


function wrapModulo(n : number, d : number) : number {
    // support for negative numbers
    if (n < 0) {
        n = n + Math.ceil(Math.abs(n) / d) * d;
    }
    return n % d;
}


abstract class Triangle extends EventTarget {
    x : number;
    y : number;
    private _color : TriangleColor;

    points : [Coord, Coord, Coord];
    polyPoints : Coord[];
    left : number;
    top : number;

    neighborOffsets : Coord[];

    private _changecolor : Event = new Event('changecolor');

    constructor(x : number, y : number) {
        super();

        this.x = x;
        this.y = y;
        this.color = null;

        this.calc();
    }

    abstract calc();

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

    set color(color : TriangleColor) {
        const changed = this._color != color;
        this._color = color;
        if (changed) {
            this.dispatchEvent(this._changecolor);
        }
    }

    get color() : TriangleColor {
        return this._color;
    }
}


class HexGridTriangle extends Triangle {
    calc() {
        const height = Math.sqrt(3) / 2;
        // equilateral triangle in a hexagonal grid
        if (wrapModulo(this.x, 2) == wrapModulo(this.y, 2)) {
            // triangle pointing down
            this.points = [[0, 0], [1, 0], [0.5, height]];
            this.polyPoints = [[0, 0], [1 + O, 0], [0.5, height + O], [0.5, height], [0, 0]];
            this.neighborOffsets = [[0, -1], [1, 0], [-1, 0]];
        } else {
            // triangle pointing up
            this.points = [[0.5, 0], [1, height], [0, height]];
            this.polyPoints = [[0.5, 0], [0.5 + O, 0], [1 + O, height + O], [0, height], [0.5, 0]];
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
        switch (wrapModulo(this.y, 4)) {
            case 0:
                // top triangle pointing down
                this.points = [[0, 0], [1, 0], [0.5, 0.5]];
                this.polyPoints = [[0, 0], [1 + O, 0], [0.5 + O, 0.5 + O], [0.5 - O, 0.5 + O], [0, O], [0, 0]];
                this.neighborOffsets = [[0, -1], [0, 1], [0, 2]];
                break;
            case 1:
                // left triangle pointing right
                this.points = [[0, 0], [0.5, 0.5], [0, 1]];
                this.polyPoints = [[0, 0], [0.5 + O, 0.5 + O], [0, 1 + O], [0, 0]];
                this.neighborOffsets = [[-1, 1], [0, -1], [0, 2]];
                break;
            case 2:
                // right triangle pointing left
                this.left += 0.5;
                this.points = [[0, 0.5], [0.5, 0], [0.5, 1]];
                this.polyPoints = [[0, 0.5], [0.5, 0], [0.5 + O, 0], [0.5 + O, 1 + O], [0.5, 1 + O], [0, 0.5 + O], [0, 0.5]];
                this.neighborOffsets = [[1, -1], [0, -2], [0, 1]];
                break;
            case 3:
                // bottom triangle pointing up
                this.top += 0.5;
                this.points = [[0, 0.5], [0.5, 0], [1, 0.5]];
                this.polyPoints = [[0, 0.5], [0.5, 0], [1, 0.5], [1 + O, 0.5 + O], [0, 0.5 + O], [0, 0.5]];
                this.neighborOffsets = [[0, 1], [0, -1], [0, -2]];
                break;
            default:
                console.log('invalid side!');
        }
    }
}

class EquilateralGridTriangle extends Triangle {
    calc() {
        // triangle in a grid of equilateral triangles
        const height = Math.sqrt(3) / 2;
        const h = height / 3;
        const odd = wrapModulo(this.y, 12) < 6;
        this.left = this.x + (odd ? 0 : 0.5);
        this.top = height * Math.floor(this.y / 6);
        switch (wrapModulo(this.y, 6)) {
            case 0:
                // top triangle pointing down
                this.points = [[0, 0], [1, 0], [0.5, h]];
                this.polyPoints = [[0, 0], [1 + O, 0], [0.5 + O, h + O], [0.5 - O, h + O], [0, 0]];
                this.neighborOffsets = [[0, 1], [0, 2], [(odd ? -1 : 0), -1]];
                break;
            case 1:
                // left triangle pointing up-right
                this.points = [[0, 0], [0.5, h], [0.5, height]];
                this.polyPoints = [[0, 0], [0.5, h], [0.5 + O, h], [0.5 + O, height + O], [0.5, height], [0, 0]];
                this.neighborOffsets = [[0, -1], [-1, 3], [0, 1]];
                break;
            case 2:
                // right triangle pointing up-left
                this.left += 0.5;
                this.points = [[0, h], [0.5, 0], [0, height]];
                this.polyPoints = [[0, h], [0.5, 0], [0.5 + O, 0], [0, height], [0, h]];
                this.neighborOffsets = [[0, -2], [0, -1], [0, 1]];
                break;
            case 3:
                // left triangle pointing bottom-right
                this.left += 0.5;
                this.points = [[0, height], [0.5, 0], [0.5, 2 * h]];
                this.polyPoints = [[0, height], [0.5, 0], [0.5 + O, 0], [0.5 + O, 2 * h + O], [0, height], [0, height]];
                this.neighborOffsets = [[0, -1], [0, 1], [0, 2]];
                break;
            case 4:
                // right triangle pointing bottom-left
                this.left += 1;
                this.points = [[0, 0], [0.5, height], [0, 2 * h]];
                this.polyPoints = [[0, 0], [O, 0], [0.5 + O, height + O], [0, 2 * h + O], [0, 0]];
                this.neighborOffsets = [[0, -1], [0, 1], [1, -3]];
                break;
            case 5:
                // bottom triangle pointing up
                this.left += 0.5;
                this.top += 2 * h;
                this.points = [[0, h], [0.5, 0], [1, h]];
                this.polyPoints = [[0, h], [0.5, 0], [1, h], [1 + O, h + O], [O, h + O], [0, h]];
                this.neighborOffsets = [[0, -2], [0, -1], [(odd ? 0 : 1), 1]];
                break;
            default:
                console.log('invalid side!');
        }
    }
}


abstract class Tile<TriangleType extends Triangle> {
    grid : NewGrid;
    x : number;
    y : number;
    triangles : TriangleType[];

    constructor(grid : NewGrid, x : number, y : number) {
        this.grid = grid;
        this.x = x;
        this.y = y;

        this.triangles = this.findTriangles();
    }

    abstract findTriangles() : TriangleType[];

    get colors() : TileColors {
        return this.triangles.map((t) => t.color);
    }

    set colors(colors : TileColors) {
        for (let i=0; i<this.triangles.length; i++) {
            this.triangles[i].color = colors[i];
        }
    }
}


class SquareTile extends Tile<SquareGridTriangle> {
    findTriangles() : SquareGridTriangle[] {
        const triangles : SquareGridTriangle[] = [];

        // top
        triangles.push(this.grid.getOrAdd(this.x, this.y * 4));
        // left
        triangles.push(this.grid.getOrAdd(this.x, this.y * 4 + 1));
        // right
        triangles.push(this.grid.getOrAdd(this.x, this.y * 4 + 2));
        // bottom
        triangles.push(this.grid.getOrAdd(this.x, this.y * 4 + 3));

        return triangles;
    }
}


class HexTile extends Tile<HexGridTriangle> {
    findTriangles() : HexGridTriangle[] {
        const triangles : HexGridTriangle[] = [];

        const x = this.x * 6 + (wrapModulo(this.y, 2) == 0 ? 0 : 3);
        const y = this.y;

        // top
        triangles.push(this.grid.getOrAdd(x, y));
        // clockwise
        triangles.push(this.grid.getOrAdd(x + 1, y));
        triangles.push(this.grid.getOrAdd(x + 1, y + 1));
        triangles.push(this.grid.getOrAdd(x, y + 1));
        triangles.push(this.grid.getOrAdd(x - 1, y + 1));
        triangles.push(this.grid.getOrAdd(x - 1, y));

        return triangles;
    }
}


class TriangleTile extends Tile<EquilateralGridTriangle> {
    findTriangles() : EquilateralGridTriangle[] {
        const triangles : EquilateralGridTriangle[] = [];

        const x = this.x;
        const y = this.y * 3;

        // top
        triangles.push(this.grid.getOrAdd(x, y));
        // counter-clockwise
        triangles.push(this.grid.getOrAdd(x, y + 1));
        triangles.push(this.grid.getOrAdd(x, y + 2));

        return triangles;
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

    connect(triangle : Triangle, neighbors : Triangle[]) {
        for (const neighbor of neighbors) {
            this.drawLine(triangle, neighbor);
        }
    }

    drawLine(a : Triangle, b : Triangle) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${(a.left + a.center[0]) * SCALE}`);
        line.setAttribute('y1', `${(a.top + a.center[1]) * SCALE}`);
        line.setAttribute('x2', `${(b.left + b.center[0]) * SCALE}`);
        line.setAttribute('y2', `${(b.top + b.center[1]) * SCALE}`);
        line.setAttribute('opacity', '0.5');
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-width', '2');
        this.svgGroup.appendChild(line);
    }
}


class TriangleDisplay {
    gridDisplay : GridDisplay;
    grid : NewGrid;
    triangle : Triangle;

    element : HTMLDivElement;
    triangleElement : SVGElement;

    constructor(gridDisplay : GridDisplay, grid : NewGrid, triangle : Triangle) {
        this.gridDisplay = gridDisplay;
        this.grid = grid;
        this.triangle = triangle;

        this.build();

        this.triangle.addEventListener('changecolor', () => { this.updateColor(); });
    }

    build() {
        const div = document.createElement('div');
        div.title = `(${this.triangle.x},${this.triangle.y})`;
        this.element = div;

        div.style.position = 'absolute';
        div.style.left = `${this.triangle.left * SCALE + OFFSET}px`;
        div.style.top = `${this.triangle.top * SCALE + OFFSET}px`;
        div.style.zIndex = `${this.triangle.x * 1000 + this.triangle.y}`;
        console.log(div.style.zIndex);

        const svg = this.generateSvg();
        div.appendChild(svg);
    }

    generateSvg() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', `${SCALE + 10}`);
        svg.setAttribute('height', `${SCALE + 10}`);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(group);

        const pointsString = [...this.triangle.points, this.triangle.points[0]].map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);
        const polyString = this.triangle.polyPoints.map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        el.setAttribute('points', polyString.join(' '));
        if (DEBUG_OVERLAP) {
            el.setAttribute('opacity', '0.6');
        }
        // el.setAttribute('fill', 'transparent');
        // el.setAttribute('stroke', 'white');
        // el.setAttribute('stroke-width', '2px');
        group.append(el);
        this.triangleElement = el;
        this.updateColor();

        if (DEBUG_OVERLAP) {
            const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            outline.setAttribute('points', pointsString.join(' '));
            outline.setAttribute('fill', 'transparent');
            outline.setAttribute('stroke', 'yellow');
            outline.setAttribute('stroke-width', '1px');
            group.append(outline);
        }

        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', `${this.triangle.center[0] * SCALE}`);
        center.setAttribute('cy', `${this.triangle.center[1] * SCALE}`);
        center.setAttribute('r', `${0.02 * SCALE}`);
        center.setAttribute('opacity', '0.5');
        center.setAttribute('fill', 'black');
        group.append(center);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', `${this.triangle.center[0] * SCALE}`);
        text.setAttribute('y', `${this.triangle.center[1] * SCALE}`);
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', 'white');
        text.appendChild(document.createTextNode(`(${this.triangle.x},${this.triangle.y})`));
        group.append(text);

        return svg;
    }

    updateColor() {
        const color = this.triangle.color || 'transparent';
        this.triangleElement.setAttribute('fill', color);
    }
}


export class GridDisplay {
    grid : NewGrid;
    element : HTMLDivElement;
    gridElement : HTMLDivElement;
    triangleDisplays : TriangleDisplay[][];

    minX : number;
    minY : number;

    constructor(grid : NewGrid) {
        this.grid = grid;
        this.minX = Math.min(...grid.triangles.map((t) => t.x));
        this.minY = Math.min(...grid.triangles.map((t) => t.y));

        this.build();

        this.grid.addEventListener('addtriangle', (evt : GridEvent) => {
            this.addTriangle(evt.triangle);
        });
    }

    build() {
        this.triangleDisplays = [];

        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.background = '#fff';
        div.style.zIndex = '1000';
        this.element = div;

        const gridElement = document.createElement('div');
        gridElement.style.position = 'absolute';
        gridElement.style.top = '10px';
        gridElement.style.left = '10px';
        gridElement.style.zIndex = '100';
        this.gridElement = gridElement;
        this.element.appendChild(gridElement);
    }

    drawTriangles() {
        for (const triangle of this.grid.triangles) {
            this.addTriangle(triangle);
        }

        const conn = new Connector();
        this.element.appendChild(conn.element);
        conn.element.style.position = 'absolute';
        conn.element.style.top = '10px';
        conn.element.style.left = '10px';
        conn.element.style.zIndex = '200';

        for (const triangle of this.grid.triangles) {
            conn.connect(triangle, this.grid.getNeighbors(triangle));
        }
    }

    addTriangle(triangle : Triangle) {
        if (!this.triangleDisplays[triangle.x]) {
            this.triangleDisplays[triangle.x] = [];
        }
        if (!this.triangleDisplays[triangle.x][triangle.y]) {
            const triangleDisplay = new TriangleDisplay(this, this.grid, triangle);
            this.triangleDisplays[triangle.x][triangle.y] = triangleDisplay;
            this.gridElement.appendChild(triangleDisplay.element);
        }
    }
}


class GridEvent extends Event {
    grid : NewGrid;
    triangle : Triangle;

    constructor(type : string, grid : NewGrid, triangle : Triangle) {
        super(type);
        this.grid = grid;
        this.triangle = triangle;
    }
}


export class NewGrid extends EventTarget {
    triangleType = [HexGridTriangle, SquareGridTriangle, EquilateralGridTriangle][SELECT_GRID];

    grid : Triangle[][];
    triangles : Triangle[];
    div : HTMLDivElement;

    constructor() {
        super();

        this.grid = [];
        this.triangles = [];

        this.createTriangles();

        const display = new GridDisplay(this);
        display.drawTriangles();
        document.body.appendChild(display.element);

        let i = 0;
        for (const triangle of this.triangles) {
            triangle.color = ['#aaa','#888','#ccc'][i % 3];
            triangle.color = 'white';
            i++;
        }

        if (this.triangleType === SquareGridTriangle) {
            let i = 0;
            for (let x=0; x<5; x++) {
                for (let y=0; y<5; y++) {
                    const tile = new SquareTile(this, x, y);
                    const color = COLORS[i % COLORS.length];
                    tile.colors = [color, color, color, color];
                    i++;
                }
            }
        }

        if (this.triangleType === HexGridTriangle) {
            let i = 0;
            for (let x=0; x<2; x++) {
                for (let y=0; y<4; y++) {
                    const tile = new HexTile(this, x, y);
                    const color = COLORS[i % COLORS.length];
                    tile.colors = [color, color, color, color, color, color];
                    i++;
                }
            }
        }

        if (this.triangleType === EquilateralGridTriangle) {
            let i = 0;
            for (let x=0; x<5; x++) {
                for (let y=0; y<5; y++) {
                    const tile = new TriangleTile(this, x, y);
                    const color = COLORS[i % COLORS.length];
                    tile.colors = [color, color, color];
                    i++;
                }
            }
        }
    }

    createTriangles() {
        return;
        let i = 0;
        for (let row=0; row<24; row++) {
            for (let col=0; col<12; col++) {
                const triangle = this.getOrAdd(col, row);
                triangle.color = COLORS[i % COLORS.length];
                i++;
            }
        }
    }

    get(x : number, y : number) : Triangle | null {
        if (!this.grid[x]) return null;
        if (!this.grid[x][y]) return null;
        return this.grid[x][y];
    }

    getOrAdd(x : number, y : number) : Triangle {
        if (!this.grid[x]) this.grid[x] = [];
        if (!this.grid[x][y]) {
            const triangle = new this.triangleType(x, y);
            this.grid[x][y] = triangle;
            this.triangles.push(triangle);
            this.dispatchEvent(new GridEvent('addtriangle', this, triangle));
        }
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
