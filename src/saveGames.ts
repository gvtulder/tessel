import { GameSettings } from "./game/Game.js";
import { TileGenerators } from "./game/TileGenerator.js";
import { EquilateralGridTriangle } from "./grid/EquilateralGridTriangle.js";
import { HalfHexGridTriangle } from "./grid/HalfHexGridTriangle.js";
import { HexGridTriangle } from "./grid/HexGridTriangle.js";
import { PentagonGridTriangle } from "./grid/PentagonGridTriangle.js";
import { SnubSquareGridTriangle } from "./grid/SnubSquareGridTriangle.js";
import { SquareGridTriangle } from "./grid/SquareGridTriangle.js";


const COLORS = ['red', 'green', 'blue', 'black', 'orange', 'purple', 'grey', 'orange', 'green'];


export const lookup = new Map<string, GameSettings>();


// squares
lookup.set('square', {
    triangleType : SquareGridTriangle,
    pattern : {
        shapes : [
            [ [[0, 0]], [[0, 1]], [[0, 3]], [[0, 2]] ],
        //  [ [[1, 0]], [[1, 1]], [[1, 2]], [[1, 3]] ],
        ]
    },
    initialTile: ['red','black','blue','white'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
    ]
});

// triangles
lookup.set('triangle', {
    triangleType : EquilateralGridTriangle,
    pattern : {
        shapes : [
            [ [[0, 0]], [[0, 1]], [[0, 2]] ],
            [ [[0, 3]], [[0, 4]], [[0, 5]] ],
        ]
    },
    initialTile: ['red','black','blue','white'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
        TileGenerators.repeat(3),
    ]
});

// hexagons
lookup.set('hex', {
    triangleType : HexGridTriangle,
    pattern : {
        shapes : [
            [ [[0, 0]], [[1, 0]], [[1, 1]], [[0, 1]], [[-1, 1]], [[-1, 0]] ],
        //  [ [[3, 1]], [[4, 1]], [[4, 2]], [[3, 2]], [[2, 2]], [[2, 1]] ],
        ]
    },
    initialTile: ['red','black','blue','white','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
        TileGenerators.randomSubset(100),
    ]
});

// cube on hex grid
lookup.set('cube', {
    triangleType : HexGridTriangle,
    pattern : {
        shapes : [
            [ [[-1, 0], [0, 0]], [[1, 0], [1, 1]], [[0, 1], [-1, 1]] ],
        ]
    },
    initialTile: ['red','black','blue','white','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
    ]
});

// single-directional
lookup.set('rhombus', {
    triangleType : HexGridTriangle,
    pattern : {
        shapes : [
            [ [[0, 0]], [[1, 0]] ],
        ]
    },
    initialTile: ['red','black'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
    ]
});

// two-directional
lookup.set('rhombus2', {
    triangleType : HexGridTriangle,
    pattern : {
        shapes : [
            [ [[0, 0]], [[1, 0]] ],
            [ [[1, 1]], [[0, 1]] ],
        ]
    },
    initialTile: ['red','black'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
    ]
});

// two-directional
lookup.set('rhombus3', {
    triangleType : HexGridTriangle,
    pattern : {
        shapes : [
            [ [[0, 0]], [[1, 0]] ],
            [ [[1, 1]], [[0, 1]] ],
            [ [[-1, 1]], [[-1, 0]] ],
        ]
    },
    initialTile: ['red','black'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
        TileGenerators.repeat(10),
    ]
});


lookup.set('snubsquare', {
    triangleType : SnubSquareGridTriangle,
    pattern : {
        shapes : [
            [ [[7,0], [8,0]], [[9,0],[10,0]], [[11,0]], [[5,0]] ],
            [ [[1,0], [4,0]], [[2,0], [3,0]], [[18,0]], [[0, 0]] ],
        ]
    },
    initialTile: ['red','black','blue','white'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
        TileGenerators.repeat(10),
    ]
});

lookup.set('snubsquare3', {
    triangleType : SnubSquareGridTriangle,
    pattern : {
        shapes : [
            [ [[7,0], [8,0]], [[9,0],[10,0], [11,0]], [[5,0]] ],
            [ [[1,0], [4,0]], [[2,0], [3,0], [18,0]], [[0, 0]] ],
        ]
    },
    initialTile: ['red','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
        TileGenerators.repeat(10),
    ]
});

lookup.set('snubsquaredebug', {
    triangleType : SnubSquareGridTriangle,
    pattern : {
        shapes : [
//          [ [[1, 0]], [[2, 0]], [[3, 0]], [[4, 0]] ],
//          [[ [0, 0], [1, 0], [2, 0], [3, 0],
//             [4, 0], [5, 0], [6, 0], [7, 0],
//             [8, 0], [9, 0], [10, 0], [11, 0] ]],
            [ [[0, 0], [1, 0], [2, 0], [3, 0]],
              [[4, 0], [5, 0], [6, 0], [7, 0]],
              [[8, 0], [9, 0], [10, 0], [11, 0]] ],
        ]
    },
    initialTile: ['black','black','black','black'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['black', 'black']),
        TileGenerators.repeat(100),
    ]
});

lookup.set('trianglearrows', {
    triangleType : EquilateralGridTriangle,
    pattern : {
        shapes : [
            [[[0,0],[0,1]],[[0,2]],[[0,-3],[0,-2]],[[0,-1]]],
            [[[1,-4],[1,-6]],[[1,-5]],[[1,-3]],[[1,-2],[1,-1]]],
            [[[1,1],[1,2]],[[1,0]],[[0,4]],[[0,5],[0,3]]]
        ]
    },
    initialTile: ['red','black','blue','white'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
        TileGenerators.repeat(10),
    ]
});

// hexagons split in 12 triangles
lookup.set('halfhex', {
    triangleType : HalfHexGridTriangle,
    pattern : {
        shapes : [
            [ [[3, 0]], [[2, 0]], [[9, 1]], [[8, 1]] ],
            [ [[19, 0]], [[18, 0]], [[1, 0]], [[0, 0]] ],
            [ [[17, 0]], [[16, 0]], [[11, 1]], [[10, 1]] ],
        ]
    },
    initialTile: ['red','black','blue','white','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
    ]
});

// hexagons split in 12 triangles
lookup.set('halfhexbig', {
    triangleType : HalfHexGridTriangle,
    pattern : {
        shapes : [
            [[[11,0],[16,-1],[15,-1]],[[0,0],[19,0],[20,0]],[[14,-1],[13,-1],[30,-1]],[[21,0],[22,0],[29,-1]]],[[[1,-1],[18,-1],[17,-1]],[[2,-1],[9,0],[10,0]],[[16,-1],[15,-1],[20,0]],[[11,0],[0,0],[19,0]]],[[[15,-1],[20,0],[19,0]],[[16,-1],[11,0],[0,0]],[[18,0],[17,0],[10,1]],[[1,0],[2,0],[9,1]]],[[[29,-1],[22,0],[21,0]],[[30,-1],[13,-1],[14,-1]],[[20,0],[19,0],[0,0]],[[15,-1],[16,-1],[11,0]]],[[[19,0],[0,0],[11,0]],[[20,0],[15,-1],[16,-1]],[[10,0],[9,0],[2,-1]],[[17,-1],[18,-1],[1,-1]]],[[[9,1],[2,0],[1,0]],[[10,1],[17,0],[18,0]],[[0,0],[11,0],[16,-1]],[[19,0],[20,0],[15,-1]]]
        ]
    },
    initialTile: ['red','black','blue','white','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
    ]
});

// snub square
lookup.set('snubsquare4', {
    triangleType : SnubSquareGridTriangle,
    pattern : {
        shapes : [
            [[[10,0],[9,0]],[[7,0],[8,0]],[[5,0]],[[11,0]]],
            [[[2,0],[1,0]],[[3,0],[4,0]],[[11,-1]],[[18,0]]],
            [[[19,0],[22,0]],[[20,0],[21,0]],[[0,0]],[[17,0]]],
            [[[3,0],[2,0]],[[4,0],[1,0]],[[5,0]],[[11,-1]]],
            [[[20,0],[19,0]],[[21,0],[22,0]],[[18,1]],[[0,0]]],
            [[[4,0],[3,0]],[[1,0],[2,0]],[[0,0]],[[5,0]]],
            [[[9,-1],[8,-1]],[[10,-1],[7,-1]],[[11,-1]],[[6,0]]],
            [[[1,0],[4,0]],[[2,0],[3,0]],[[18,0]],[[0,0]]]
        ]
    },
    initialTile: ['red','black','blue','white'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','black','blue','white']),
    ]
});

// pentagons
lookup.set('pentagon', {
    triangleType : PentagonGridTriangle,
    pattern : {
        shapes: [
            [[[0,0]],[[1,0]],[[2,0]],[[3,0]],[[4,0]]],
            [[[5,0]],[[6,0]],[[7,0]],[[8,0]],[[9,0]]],
            [[[10,0]],[[11,0]],[[12,0]],[[13,0]],[[14,0]]],
            [[[15,0]],[[16,0]],[[17,0]],[[18,0]],[[19,0]]],
        ]
    },
    initialTile: ['red','blue','white','red','blue'],
    tilesShownOnStack: 3,
    tileGenerator : [
        TileGenerators.permutations(['red','blue','white']),
    ]
});



/*

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

export const TriangleDefault: GameSettings = {
    gridType : GridTypes['triangle'],
    initialTile: ['red','black','blue'],
    tilesShownOnStack: 3,
    tileGenerator : TileGenerators.permutations(['red','black','blue','white'], 3),
}
lookup.set('TriangleDefault', TriangleDefault);


*/
