import { Triangle } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class HexGridTriangle extends Triangle {
    calc() {
        const height = Math.sqrt(3) / 2;
        // equilateral triangle in a hexagonal grid
        if (wrapModulo(this.x, 2) == wrapModulo(this.y, 2)) {
            // triangle pointing down
            this.points = [[0, 0], [1, 0], [0.5, height]];
            this.polyPoints = [[0, 0], [1 + O, 0], [0.5, height + O], [0.5, height], [0, 0]];
            this.neighborOffsets = [[0, -1], [1, 0], [-1, 0]];
            this.shape = 0;
        } else {
            // triangle pointing up
            this.points = [[0.5, 0], [1, height], [0, height]];
            this.polyPoints = [[0.5, 0], [0.5 + O, 0], [1 + O, height], [1 + O, height + O], [0, height + O], [0, height], [0.5, 0]];
            this.neighborOffsets = [[-1, 0], [1, 0], [0, 1]];
            this.shape = 1;
        }

        this.left = this.x * 0.5 * this.width;
        this.top = this.y * this.height;
    }
}
