import { GameSettings } from "./game/Game.js";
import { GridTypes } from "./grid/GridType.js";
import { TileGenerators } from "./game/TileGenerator.js";


export const lookup = new Map<string, GameSettings>();


// a few dummy hex tiles
export const HexDebug : GameSettings = {
    gridType : GridTypes['hex'],
    initialTile: ['red', 'green', 'blue', 'orange', 'white', 'purple'],
    tilesShownOnStack: 3,
    tileGenerator : TileGenerators.fromList([
        ['red', 'blue', 'green', 'purple', 'orange', 'black'],
        ['red', 'red', 'green', 'white', 'blue', 'black'],
        ['blue', 'blue', 'green', 'red', 'black', 'black'],
        ['blue', 'red', 'blue', 'blue', 'red', 'blue'],
        ['white', 'orange', 'green', 'red', 'black', 'black'],
        ['black', 'black', 'black', 'black', 'black', 'black'],
        ['red', 'red', 'red', 'red', 'black', 'black'],
    ]),
}
lookup.set('HexDebug', HexDebug);

// almost finished black circle
export const HexDebug_BlackRed : GameSettings = {
    gridType : GridTypes['hex'],
    tilesShownOnStack: 3,
    tileGenerator : TileGenerators.fromList([
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
lookup.set('HexDebug_BlackRed', HexDebug_BlackRed);

export const SquareDefault : GameSettings = {
    gridType : GridTypes['square'],
    initialTile: ['red','black','blue','white'],
    tilesShownOnStack: 3,
    tileGenerator : TileGenerators.permutations(['red','black','blue','white'], 4),
}
lookup.set('SquareDefault', SquareDefault);

export const HexDefault : GameSettings = {
    gridType : GridTypes['hex'],
    // initialTile: ['red','black','blue','white','orange','purple'],
    initialTile: ['red','black','black','orange','white','white'],
    tilesShownOnStack: 3,
    // tileGenerator : TileGenerators.permutations(['red','black','blue','white','orange','purple'], 6),
    tileGenerator : TileGenerators.permutations(['red','black','orange','white'], 6),
}
lookup.set('HexDefault', HexDefault);

export const CubeDefault : GameSettings = {
    gridType : GridTypes['cube'],
    initialTile: ['red','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : TileGenerators.permutations(['red','black','blue','white'], 3),
}
lookup.set('CubeDefault', CubeDefault);

export const CubeHexDefault : GameSettings = {
    gridType : GridTypes['hex'],
    initialTile: ['red','red','black','black','blue','blue'],
    tilesShownOnStack: 3,
    tileGenerator : TileGenerators.repeatColors(2, TileGenerators.permutations(['red','black','blue','white'], 3)),
}
lookup.set('CubeHexDefault', CubeHexDefault);

export const CubeDebug: GameSettings = {
    gridType : GridTypes['cube'],
    initialTile: ['red','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : TileGenerators.randomSubset(5, TileGenerators.permutations(['red','black','blue','white'], 3)),
}
lookup.set('CubeDebug', CubeDebug);

