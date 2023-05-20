import { TriangleType } from "./Triangle.js";
import { TileType } from "./Tile.js";
import { HexGridTriangle } from "./HexGridTriangle.js";
import { HexTile } from "./HexTile.js";
import { EquilateralGridTriangle } from "./EquilateralGridTriangle.js";
import { SquareGridTriangle } from "./SquareGridTriangle.js";
import { SquareTile } from "./SquareTile.js";
import { TriangleTile } from "./TriangleTile.js";
import { CubeTile } from "./CubeTile.js";

export abstract class GridType {
    abstract createTile : TileType;
    abstract createTriangle : TriangleType;
}

export class HexGrid extends GridType {
    createTile = HexTile;
    createTriangle = HexGridTriangle;
}

export class CubeGrid extends GridType {
    createTile = CubeTile;
    createTriangle = HexGridTriangle;
}

export class SquareGrid extends GridType {
    createTile = SquareTile;
    createTriangle = SquareGridTriangle;
}

export class TriangleGrid extends GridType {
    createTile = TriangleTile;
    createTriangle = EquilateralGridTriangle;
}

export const GridTypes = {
    'hex': new HexGrid(),
    'cube': new CubeGrid(),
    'square': new SquareGrid(),
    'triangle': new TriangleGrid(),
};
