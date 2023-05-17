
function shuffle<T>(myArray : T[]) {
  // Fisher-Yates shuffle
  let i = myArray.length;
  if (i == 0 ) return false;
  while (--i) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempi = myArray[i];
    const tempj = myArray[j];
    myArray[i] = tempj;
    myArray[j] = tempi;
  }
}

type DirectionKey = 'top' | 'right' | 'bottom' | 'left';

class Direction {
  readonly index : number;
  readonly key : DirectionKey;
  readonly offset : Coord;
  mirror : Direction;

  constructor(index : number, key : DirectionKey, offset : Coord) {
    this.index = index;
    this.key = key;
    this.offset = offset;
  }
}

const Top = new Direction(0, 'top', {x: 0, y: -1});
const Right = new Direction(1, 'right', {x: 1, y: 0});
const Bottom = new Direction(2, 'bottom', {x: 0, y: 1});
const Left = new Direction(3, 'left', {x: -1, y: 0});

Top.mirror = Bottom;
Right.mirror = Left;
Bottom.mirror = Top;
Left.mirror = Right;

export const Directions = [Top, Right, Bottom, Left];

type Color = 'r' | 'p' | 'b' | 'w';
export type Colors = [Color, Color, Color, Color];

type Tile = {
  colors : Colors,
  x : number,
  y : number,
}
type Coord = {
  x : number,
  y : number,
}

export const InitialTile : Colors = ['r','p','b','w'];
const Tiles : Colors[] = [['r','r','r','r'],['r','r','r','b'],
   ['r','r','r','p'],['r','r','r','w'],['r','r','b','b'],['r','r','b','p'],
   ['r','r','b','w'],['r','r','p','b'],['r','r','p','p'],['r','r','p','w'],
   ['r','r','w','b'],['r','r','w','p'],['r','r','w','w'],['r','b','r','b'],
   ['r','b','r','p'],['r','b','r','w'],['r','b','b','b'],['r','b','b','p'],
   ['r','b','b','w'],['r','b','p','b'],['r','b','p','p'],['r','b','p','w'],
   ['r','b','w','b'],['r','b','w','p'],['r','b','w','w'],['r','p','r','p'],
   ['r','p','r','w'],['r','p','b','b'],['r','p','b','p'],// ['r','p','b','w'],
   ['r','p','p','b'],['r','p','p','p'],['r','p','p','w'],['r','p','w','b'],
   ['r','p','w','p'],['r','p','w','w'],['r','w','r','w'],['r','w','b','b'],
   ['r','w','b','p'],['r','w','b','w'],['r','w','p','b'],['r','w','p','p'],
   ['r','w','p','w'],['r','w','w','b'],['r','w','w','p'],['r','w','w','w'],
   ['b','b','b','b'],['b','b','b','p'],['b','b','b','w'],['b','b','p','p'],
   ['b','b','p','w'],['b','b','w','p'],['b','b','w','w'],['b','p','b','p'],
   ['b','p','b','w'],['b','p','p','p'],['b','p','p','w'],['b','p','w','p'],
   ['b','p','w','w'],['b','w','b','w'],['b','w','p','p'],['b','w','p','w'],
   ['b','w','w','p'],['b','w','w','w'],['p','p','p','p'],['p','p','p','w'],
   ['p','p','w','w'],['p','w','p','w'],['p','w','w','w'],['w','w','w','w']];
// Game.TILES = [['r','r','r','r'],['r','r','r','b']];

export class TileStack {
  tiles : Colors[];

  constructor() {
    this.tiles = [...Tiles];
    shuffle(this.tiles);
  }
  peek(n : number) : Colors[] {
    return this.tiles.slice(0, n);
  }
  pop() : Colors | undefined {
    if (this.tiles.length == 0) {
      return undefined;
    }
    return this.tiles.shift();
  }
  remove(idx : number) : void {
    if (idx < this.tiles.length) {
      this.tiles.splice(idx, 1);
    }
  }
  serialize() {
    return { tiles: this.tiles };
  }
  unserialize(d) {
    this.tiles = d.tiles;
  }
  isEmpty() {
    return this.tiles.length == 0;
  }
}


type PolyEdgeType = [number[], number[]];
type PolyEdgesType = PolyEdgeType[][];
export type ScoreType = {
  scores : [number, number, number, number],
  polyEdges : [PolyEdgesType, PolyEdgesType, PolyEdgesType, PolyEdgesType]
};


export class Board {
  grid : Tile[][];
  tiles : Tile[];
  minX : number;
  minY : number;
  maxX : number;
  maxY : number;

  constructor() {
    this.grid = [];
    this.tiles = [];
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
  }

  serialize() {
    return { grid: this.grid, tiles: this.tiles,
             minX: this.minX, minY: this.minY,
             maxX: this.maxX, maxY: this.maxY };
  }
  unserialize(d) {
    this.grid = d.grid;
    this.tiles = d.tiles;
    this.minX = d.minX;
    this.minY = d.minY;
    this.maxX = d.maxX;
    this.maxY = d.maxY;
  }

  checkFit(colors : Colors, x : number, y : number) : boolean {
    if (this.get(x, y)) {
      return false;
    }
    for (const direction of Directions) {
      const otherTile = this.get(x + direction.offset.x, y + direction.offset.y);
      if (otherTile && otherTile.colors[direction.mirror.index] != colors[direction.index]) {
        return false;
      }
    }
    return true;
  }

  checkFitWithRotations(colors : Colors, x : number, y : number) : number | null {
    colors = [...colors];
    let rotations = 0;
    while (rotations < 4 && !this.checkFit(colors, x, y)) {
      colors.unshift(colors.pop());
      rotations++;
    }
    if (rotations == 4) {
      return null;
    } else {
      return rotations;
    }
  }

  place(colors : Colors, x : number, y : number) : boolean {
    if (!this.checkFit(colors, x, y)) {
      return false;
    }
    if (this.grid[x] === undefined) {
      this.grid[x] = [];
    }
    let tile = this.grid[x][y];
    if (!tile) {
      tile = {colors: colors, x: x, y: y};
      this.grid[x][y] = tile;
      this.tiles.push(tile);
      this.minX = Math.min(x, this.minX);
      this.minY = Math.min(y, this.minY);
      this.maxX = Math.max(x, this.maxX);
      this.maxY = Math.max(y, this.maxY);
    }
    tile.colors = colors;
    return true;
  }

  get(x : number, y : number) : Tile | null {
    if (this.grid[x] && this.grid[x][y]) {
      return this.grid[x][y];
    } else {
      return null;
    }
  }

  frontier() : Coord[] {
    const frontierTiles : {x : number, y: number}[] = [];
    for (let x=this.minX-1; x<=this.maxX+1; x++) {
      for (let y=this.minY-1; y<=this.maxY+1; y++) {
        if (!this.get(x, y) && (this.get(x-1,y) || this.get(x+1,y) || this.get(x,y-1) || this.get(x,y+1))) {
          frontierTiles.push({x: x, y: y});
        }
      }
    }
    return frontierTiles;
  }

  getTriangleColor(x : number, y : number, t : number) : Color | null {
    const tile = (this.grid[x] ? this.grid[x][y] : null);
    return tile ? tile.colors[t] : null;
  }

  calculateScore(srcX : number, srcY : number) : ScoreType {
    const scores : [number, number, number, number] = [0,0,0,0];
    const polyEdgesPerStart : [PolyEdgesType, PolyEdgesType, PolyEdgesType, PolyEdgesType] = [[],[],[],[]];
    const crumbs = [];
    const c = this.getTriangleColor.bind(this),
          m = function(x : number, y : number, t : number, set : number | null) {
            if (!crumbs[x]) crumbs[x] = [];
            if (!crumbs[x][y]) crumbs[x][y] = [];
            if (!set) return crumbs[x][y][t];
            crumbs[x][y][t] = set;
            return false;
          };

    for (let start=0; start<4; start++) {
       const polyIdx = start + 1,
             polyColor = c(srcX,srcY,start),
             polyTiles = [],
             polyEdges = [];
       let polyOpen = false,
           polyTileCount = 0;

      if (!m(srcX, srcY, start, null)) {
        m(srcX, srcY, start, polyIdx);

        const queue = [ [srcX, srcY, start, 0, null] ];
        while (queue.length > 0) {
          const cur = queue.shift();
          const x = cur[0],
                y = cur[1],
                t = cur[2],
                depth = cur[3];

          if (!polyTiles[x]) {
            polyTiles[x] = [];
          }
          if (!polyTiles[x][y]) {
            polyTiles[x][y] = true;
            polyTileCount++;
          }

          const nextTriangles = [];
          switch (t) {
            case 0: // TOP
              nextTriangles.push([x,y,1]); // RIGHT
              nextTriangles.push([x,y,3]); // LEFT
              nextTriangles.push([x,y-1,2]); // BOTTOM
              break;
            case 1: // RIGHT
              nextTriangles.push([x,y,0]); // TOP
              nextTriangles.push([x,y,2]); // BOTTOM
              nextTriangles.push([x+1,y,3]); // LEFT
              break;
            case 2: // BOTTOM
              nextTriangles.push([x,y,1]); // RIGHT
              nextTriangles.push([x,y,3]); // LEFT
              nextTriangles.push([x,y+1,0]); // TOP
              break;
            case 3: // LEFT
              nextTriangles.push([x,y,0]); // TOP
              nextTriangles.push([x,y,2]); // BOTTOM
              nextTriangles.push([x-1,y,1]); // RIGHT
              break;
          }
          for (let i=0; i<nextTriangles.length; i++) {
            const tri = nextTriangles[i],
                  triColor = c(tri[0], tri[1], tri[2]);

            if (!triColor) {
              polyOpen = true;
            } else if (!m(tri[0], tri[1], tri[2], null) && triColor==polyColor) {
              m(tri[0], tri[1], tri[2], polyIdx);

              if (tri[0]==x && tri[1]==y) {
                // same tile, draw line
                tri.push(depth+1);
                if (!polyEdges[Math.floor(depth)]) {
                  polyEdges[Math.floor(depth)] = [];
                }
                polyEdges[Math.floor(depth)].push([ cur, tri ]);
              } else {
                // two tiles, no line
                tri.push(depth);
              }
              tri.push(cur);

              queue.push(tri);
            }
          }
        }

        console.log('starting '+start+' color '+polyColor+' '+(polyOpen?'open':'closed')+' tileCount '+polyTileCount);

        if (!polyOpen) {
          if (polyTileCount >= 4) {
            polyTileCount *= 2;
          }
          scores[start] = polyTileCount;
          polyEdgesPerStart[start] = polyEdges;
        }
      }
    }

    return { scores: scores, polyEdges: polyEdgesPerStart };
  }
}

