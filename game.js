(function(exports) {
  // shuffle
  function fisherYates(myArray) {
    var i = myArray.length;
    if ( i == 0 ) return false;
    while ( --i ) {
      var j = Math.floor( Math.random() * ( i + 1 ) );
      var tempi = myArray[i];
      var tempj = myArray[j];
      myArray[i] = tempj;
      myArray[j] = tempi;
    }
  }

  exports.DIRECTION_NAMES = [ 'top', 'right', 'bottom', 'left' ];
  exports.DIRECTION_OFFSETS = {
    top: [0,-1], right: [1,0], bottom: [0,1], left: [-1,0]
  };
  exports.DIRECTION_MIRROR = [ 2, 3, 0, 1 ];

  exports.INITIAL_TILE = ['r','p','b','w'];
  exports.TILES = [['r','r','r','r'],['r','r','r','b'],
//   ['r','r','r','p'],['r','r','r','w'],['r','r','b','b'],['r','r','b','p'],
//   ['r','r','b','w'],['r','r','p','b'],['r','r','p','p'],['r','r','p','w'],
//   ['r','r','w','b'],['r','r','w','p'],['r','r','w','w'],['r','b','r','b'],
//   ['r','b','r','p'],['r','b','r','w'],['r','b','b','b'],['r','b','b','p'],
//   ['r','b','b','w'],['r','b','p','b'],['r','b','p','p'],['r','b','p','w'],
//   ['r','b','w','b'],['r','b','w','p'],['r','b','w','w'],['r','p','r','p'],
//   ['r','p','r','w'],['r','p','b','b'],['r','p','b','p'],// ['r','p','b','w'],
//   ['r','p','p','b'],['r','p','p','p'],['r','p','p','w'],['r','p','w','b'],
//   ['r','p','w','p'],['r','p','w','w'],['r','w','r','w'],['r','w','b','b'],
//   ['r','w','b','p'],['r','w','b','w'],['r','w','p','b'],['r','w','p','p'],
//   ['r','w','p','w'],['r','w','w','b'],['r','w','w','p'],['r','w','w','w'],
//   ['b','b','b','b'],['b','b','b','p'],['b','b','b','w'],['b','b','p','p'],
//   ['b','b','p','w'],['b','b','w','p'],['b','b','w','w'],['b','p','b','p'],
//   ['b','p','b','w'],['b','p','p','p'],['b','p','p','w'],['b','p','w','p'],
//   ['b','p','w','w'],['b','w','b','w'],['b','w','p','p'],['b','w','p','w'],
//   ['b','w','w','p'],['b','w','w','w'],['p','p','p','p'],['p','p','p','w'],
     ['p','p','w','w'],['p','w','p','w'],['p','w','w','w'],['w','w','w','w']];

  exports.TileStack = new Class({
    initialize: function() {
      this.tiles = [];
      for (var i=0; i<exports.TILES.length; i++) {
        this.tiles.push(exports.TILES[i]);
      }
      fisherYates(this.tiles);
    },
    pop: function() {
      if (this.tiles.length == 0) {
        return null;
      }
      return this.tiles.shift();
    },
    serialize: function() {
      return { tiles: this.tiles };
    },
    unserialize: function(d) {
      this.tiles = d.tiles;
    }
  });

  exports.Board = new Class({
    initialize: function() {
      this.grid = [];
      this.tiles = [];
      this.minX = 0;
      this.minY = 0;
      this.maxX = 0;
      this.maxY = 0;
    },

    serialize: function() {
      return { grid: this.grid, tiles: this.tiles,
               minX: this.minX, minY: this.minY,
               maxX: this.maxX, maxY: this.maxY };
    },
    unserialize: function(d) {
      this.grid = d.grid;
      this.tiles = d.tiles;
      this.minX = d.minX;
      this.minY = d.minY;
      this.maxX = d.maxX;
      this.maxY = d.maxY;
    },

    checkFit: function(colors, x, y) {
      if (this.get(x, y)) {
        return false;
      }
      for (var i=0; i<4; i++) {
        var direction = exports.DIRECTION_NAMES[i],
            offset = exports.DIRECTION_OFFSETS[direction],
            otherColors = this.get(x + offset[0], y + offset[1]);
        if (otherColors && otherColors[exports.DIRECTION_MIRROR[i]] != colors[i]) {
          return false;
        }
      }
      return true;
    },

    place: function(colors, x, y) {
      if (!this.checkFit(colors, x, y)) {
        return false;
      }
      if (!this.grid[x]) {
        this.grid[x] = [];
      }
      var tile = this.grid[x][y];
      if (!tile) {
        tile = [x,y, colors];
        this.grid[x][y] = tile;
        this.tiles.push(tile);
        this.minX = Math.min(x, this.minX);
        this.minY = Math.min(y, this.minY);
        this.maxX = Math.max(x, this.maxX);
        this.maxY = Math.max(y, this.maxY);
      }
      tile[2] = colors;
      return true;
    },

    get: function(x, y) {
      if (this.grid[x] && this.grid[x][y]) {
        return this.grid[x][y][2];
      } else {
        return null;
      }
    },

    frontier: function() {
      var frontierTiles = [];
      for (var x=this.minX-1; x<=this.maxX+1; x++) {
        for (var y=this.minY-1; y<=this.maxY+1; y++) {
          if (!this.get(x, y) && (this.get(x-1,y) || this.get(x+1,y) || this.get(x,y-1) || this.get(x,y+1))) {
            frontierTiles.push([ x, y ]);
          }
        }
      }
      return frontierTiles;
    },

    getTriangleColor: function(x, y, t) {
      var tile = (this.grid[x] ? this.grid[x][y] : null);
      return tile ? tile[2][t] : null;
    },

    calculateScore: function(srcX, srcY) {
      var scores = [0,0,0,0],
          polyEdgesPerStart = [[],[],[],[]];
      var crumbs = [];
      var c = this.getTriangleColor.bind(this),
          m = function(x,y,t,set) {
            if (!crumbs[x]) crumbs[x] = [];
            if (!crumbs[x][y]) crumbs[x][y] = [];
            if (!set) return crumbs[x][y][t];
            crumbs[x][y][t] = set;
            return false;
          };

      for (var start=0; start<4; start++) {
        var polyIdx = start + 1,
            polyColor = c(srcX,srcY,start),
            polyOpen = false,
            polyTiles = [],
            polyTileCount = 0,
            polyEdges = [];

        if (!m(srcX,srcY,start)) {
          m(srcX,srcY,start,polyIdx);

          var queue = [ [srcX,srcY,start,0,null] ];
          while (queue.length > 0) {
            var cur = queue.shift();
            var x = cur[0],
                y = cur[1],
                t = cur[2],
                depth = cur[3],
                previous = cur[4];

            if (!polyTiles[x]) {
              polyTiles[x] = [];
            }
            if (!polyTiles[x][y]) {
              polyTiles[x][y] = true;
              polyTileCount++;
            }

            var nextTriangles = [];
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
            for (var i=0; i<nextTriangles.length; i++) {
              var tri = nextTriangles[i],
                  triColor = c(tri[0], tri[1], tri[2]);

              if (!triColor) {
                polyOpen = true;
              } else if (!m(tri[0], tri[1], tri[2]) && triColor==polyColor) {
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
  });
})(exports);

