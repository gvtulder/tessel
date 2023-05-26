import { TriangleType } from "./Triangle.js";
import { TileType } from "./Tile.js";
import { HexGridTriangle } from "./HexGridTriangle.js";
import { HexTile } from "./old.HexTile.js";
import { EquilateralGridTriangle } from "./EquilateralGridTriangle.js";
import { SquareGridTriangle } from "./SquareGridTriangle.js";
import { SquareTile } from "./old.SquareTile.js";
import { TriangleTile } from "./old.TriangleTile.js";
import { CubeTile } from "./old.CubeTile.js";

export abstract class GridType {
    abstract createTile : TileType;
    abstract createTriangle : TriangleType;
    abstract rotationAngles : number[];
}

export class HexGrid extends GridType {
    createTile = HexTile;
    createTriangle = HexGridTriangle;
    rotationAngles = [0, 60, 120, 180, 240, 300];
}

export class CubeGrid extends GridType {
    createTile = CubeTile;
    createTriangle = HexGridTriangle;
    rotationAngles = [0, 60, 120, 180, 240, 300];
}

export class SquareGrid extends GridType {
    createTile = SquareTile;
    createTriangle = SquareGridTriangle;
    rotationAngles = [0, 90, 180, 270];
}

export class TriangleGrid extends GridType {
    createTile = TriangleTile;
    createTriangle = EquilateralGridTriangle;
    rotationAngles = [0, 60, 120, 180, 240, 300];
}

export const GridTypes = {
    'hex': new HexGrid(),
    'cube': new CubeGrid(),
    'square': new SquareGrid(),
    'triangle': new TriangleGrid(),
};
