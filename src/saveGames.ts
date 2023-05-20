import { TileStack } from "./game/TileStack.js";
import { GameSettings } from "./game/Game.js";
import { GridTypes } from "./grid/GridType.js";


// a few dummy hex tiles
export const HexDebug : GameSettings = {
    gridType : GridTypes['hex'],
    initialTile: ['red', 'green', 'blue', 'orange', 'white', 'purple'],
    tilesShownOnStack: 3,
    newTileStack : TileStack.factoryFromArray([
        ['red', 'blue', 'green', 'purple', 'orange', 'black'],
        ['red', 'red', 'green', 'white', 'blue', 'black'],
        ['blue', 'blue', 'green', 'red', 'black', 'black'],
        ['blue', 'red', 'blue', 'blue', 'red', 'blue'],
        ['white', 'orange', 'green', 'red', 'black', 'black'],
        ['black', 'black', 'black', 'black', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
    ]),
}

// almost finished black circle
export const HexDebug_BlackRed : GameSettings = {
    gridType : GridTypes['hex'],
    tilesShownOnStack: 3,
    newTileStack : TileStack.factoryFromArray([
        ['black', 'black', 'black', 'black', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
    ]),
    initialTiles: [
        {x: 0, y:  0, colors: ["red","green","blue","orange","white","purple"]},
        {x: 0, y: -2, colors: ["black","red","red","red","red","black"]},
        {x: 0, y: -3, colors: ["red","black","black","red","red","red"]},
        {x: 1, y: -4, colors: ["black","black","black","black","black","black"]},
        {x: 0, y: -5, colors: ["red","black","black","red","red","red"]},
        {x: 1, y: -2, colors: ["black","red","red","red","red","black"]},
        {x: 1, y: -3, colors: ["black","red","red","red","red","black"]},
        {x: 1, y: -6, colors: ["red","red","red","black","black","red"]},
    ],
}

export const SquareDefault : GameSettings = {
    gridType : GridTypes['square'],
    initialTile: ['red','black','blue','white'],
    tilesShownOnStack: 3,
    newTileStack : TileStack.factoryPermute(['red','black','blue','white'], 4),
}
