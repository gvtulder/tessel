import { Triangle } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class SquareGridTriangle extends Triangle {
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
