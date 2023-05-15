
class Tile {
  constructor(gameManager) {
    this.gameManager = gameManager;

    let svg = this.generateSvg();
    this.svg = svg;

    let div = document.createElement('div');
    div.className = 'tile';
    div.appendChild(this.svg);
    this.div = div;

    this.div.addEventListener('transitionend', function() {
      console.log('hello');
      svg.classList.remove('rot360');
    });

    this.div.tile = this;
  }

  setPosition(col, row) {
    this.col = col;
    this.row = row;
    this.div.style.top = 100 * (row - 0.5) + 'px';
    this.div.style.left = 100 * (col - 0.5) + 'px';
  }

  setColors(colors) {
    if (colors === null) {
      this.div.className = 'tile placeholder';
    } else {
      this.div.className = 'tile' +
                           ' top-' + colors[0] +
                           ' right-' + colors[1] +
                           ' bottom-' + colors[2] +
                           ' left-' + colors[3];
    }
    this.colors = colors;
  }

  generateSvg() {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', 100);
    svg.setAttribute('height', 100);

    let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'tile-segments');
    svg.appendChild(group);

    for (let poly of [
      ['top',    '-2, -2  102, -2  102, 2  52, 50  48, 50  -2, 2'],
      ['right',  '102, -2  102, 102  98, 102  50, 52  50, 50'],
      ['bottom', '102, 102  -2, 102  -2, 98  48, 50  50, 50'],
      ['left',   '0, 0  50, 50  0, 100']
    ]) {
      let el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      el.setAttribute('class', 'tile-segment ' + poly[0]);
      el.setAttribute('points', poly[1]);
      el.setAttribute('fill', 'transparent');
      group.append(el);
    }

    return svg;
  }

  rotateTile() {
    this.colors.unshift(this.colors.pop());
    let cls = this.svg.classList;
    if (cls.contains('rot90')) {
      cls.replace('rot90', 'rot180');
    } else if (cls.contains('rot180')) {
      cls.replace('rot180', 'rot270');
    } else if (cls.contains('rot270')) {
      cls.replace('rot270', 'rot360');
    } else {
      cls.remove('rot360');
      cls.add('rot90');
    }
  }

  autoRotate(targetTile) {
    if (!this.gameManager.settings.autorotate) {
      return;
    }
    this.resetAutoRotate();
    // how many rotations?
    let rotations = this.gameManager.board.checkFitWithRotations(this.colors, targetTile.col, targetTile.row);
    if (rotations == null) {
      console.log('does not fit even with rotation');
      return;
    }
    console.log(`requires ${rotations} rotations to fit`);
    if (!this.beforeAutoRotate) {
      this.beforeAutoRotate = { className: [...this.svg.classList], colors: [...this.colors] };
    }
    for (let i=0; i<rotations; i++) {
      this.rotateTile();
    }
    console.log({ className: [...this.svg.classList], colors: this.colors });
  }

  resetAutoRotate() {
    if (this.beforeAutoRotate) {
      console.log('resetAutoRotate', this.beforeAutoRotate);
      this.svg.classList = this.beforeAutoRotate.className;
      this.colors = this.beforeAutoRotate.colors;
      this.beforeAutoRotate = null;
    }
  }

  makeDraggable(onDragStart) {
    const position = { x: 0, y: 0 };
    const boardUI = this.gameManager.boardUI;
    interact(this.div).on('tap', function(evt) {
      this.rotateTile();
    }.bind(this)).draggable({
      listeners: {
        start (evt) {
          console.log(evt.type, evt.target);
          evt.target.classList.add('dragging');
          onDragStart(evt);
        },
        move (evt) {
          position.x += evt.dx;
          position.y += evt.dy;
          evt.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${boardUI.scale})`;
        },
        end (evt) {
          evt.target.classList.remove('dragging');
          position.x = 0;
          position.y = 0;
          evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
        },
      }
    });
  }

  makeDropzone(ondrop) {
    this.dropzone = interact(this.div).dropzone({
      ondrop: ondrop
    }).on('dropactivate', function (evt) {
      evt.target.classList.add('drop-activated');
      if (this.gameManager.settings.hints) {
        console.log('dropactivate', evt.relatedTarget.tile.colors);
        if (this.gameManager.board.checkFitWithRotations(evt.relatedTarget.tile.colors,
                                                         evt.target.tile.col, evt.target.tile.row) == null) {
          evt.target.classList.add('drop-hint-would-not-fit');
        } else {
          evt.target.classList.add('drop-hint-would-fit');
        }
      }
    }.bind(this)).on('dropdeactivate', function (evt) {
      evt.target.classList.remove('drop-activated');
      evt.target.classList.remove('drop-hint-would-fit');
      evt.target.classList.remove('drop-hint-would-not-fit');
    }).on('dragenter', function (evt) {
      console.log('dragenter', evt.target);
      evt.relatedTarget.tile.autoRotate(evt.target.tile);
    }.bind(this)).on('dragleave', function (evt) {
      console.log('dragleave', evt.target);
      evt.relatedTarget.tile.resetAutoRotate();
    });
  }

  removeDropzone() {
    if (this.dropzone) {
      this.dropzone.unset();
      this.dropzone = null;
    }
  }
}



class ScoreboardUI {
  constructor(gamemanager) {
    let div = document.createElement('div');
    div.setAttribute('id', 'scoreboard');
    this.element = div;
  }

  update(scores) {
    let fragment = document.createDocumentFragment(),
        div, span;
    for (let i=0; i<scores.length; i++) {
      div = document.createElement('div');
      div.style.backgroundColor = scores[i].color.main;
      span = document.createElement('span');
      span.className = 'name';
      span.appendChild(document.createTextNode(scores[i].name));
      div.appendChild(span);
      span = document.createElement('span');
      span.className = 'points';
      span.appendChild(document.createTextNode(scores[i] ? scores[i].points : 0));
      div.appendChild(span);
      fragment.appendChild(div);

      if (scores[i].turn) {
        div.className = 'turn';
      }
    }
    this.element.innerHTML = '';
    this.element.appendChild(fragment);
  }
}



class BoardPolyDrawing {
  constructor(boardUI) {
    this.boardUI = boardUI;
  }

  start(x, y, scoreData, color, drawNil) {
    console.log('boardPolyDrawing', x, y, scoreData, color, drawNil);

    this.minX = this.boardUI.minX;
    this.maxX = this.boardUI.maxX;
    this.minY = this.boardUI.minY;
    this.maxY = this.boardUI.maxY;

    this.x = x;
    this.y = y;
    this.scoreData = scoreData;
    this.currentDepth = 0;
    this.color = color;
    this.drawNil = drawNil;

    let maxDepth = 0;
    for (let i=0; i<scoreData.polyEdges.length; i++) {
      maxDepth = Math.max(maxDepth, scoreData.polyEdges[i].length);
    }
    this.maxDepth = maxDepth;

    this.div = document.createElement('div');
    this.div.className = 'score-graph-overlay';
    this.svg = this.initSvg();
    this.div.appendChild(this.svg);
    this.boardUI.tileBoard.appendChild(this.div);

    this.div.style.left = 100 * (this.minX - 0.5) + 'px';
    this.div.style.top = 100 * (this.minY - 0.5) + 'px';

    this.iterDraw();
  }

  initSvg() {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('className', 'score-graph');
    svg.setAttribute('width', 100 * (this.maxX - this.minX + 1));
    svg.setAttribute('height', 100 * (this.maxY - this.minY + 1));
    return svg;
  }

  iterDraw() {
    if (this.currentDepth >= this.maxDepth) {
      this.drawScoreTile();
    } else {
      this.drawPolyDepth(this.currentDepth);
      this.currentDepth++;
      this.timeout = window.setTimeout(this.iterDraw.bind(this), 100);
    }
  }

  drawScoreTile() {
    let scores = this.scoreData.scores,
        x = this.x, y = this.y;

    console.log('drawScoreTile', this.scoreData);
    console.log('drawScoreTile', x, y, scores);
    x = x - this.minX + 0.5;
    y = y - this.minY + 0.5;

    for (let i=0; i<Game.DIRECTION_NAMES.length; i++) {
      if (scores[i]) {
        let thisX = 100 * (x + 0.5 * Game.DIRECTION_OFFSETS[Game.DIRECTION_NAMES[i]][0]);
        let thisY = 100 * (y + 0.5 * Game.DIRECTION_OFFSETS[Game.DIRECTION_NAMES[i]][1]);

        let el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('cx', thisX);
        el.setAttribute('cy', thisY);
        el.setAttribute('r', 20);
        el.setAttribute('fill', this.color.light);
        el.setAttribute('stroke', this.color.dark);
        el.setAttribute('stroke-width', 8);
        el.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
        this.svg.appendChild(el);

        el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('x', thisX);
        el.setAttribute('y', thisY + 1);
        el.setAttribute('alignment-baseline', 'middle');
        el.setAttribute('dominant-baseline', 'middle');
        el.setAttribute('text-anchor', 'middle');
        el.setAttribute('font-size', 21);
        el.setAttribute('color', 'white');
        el.appendChild(document.createTextNode(scores[i]));
        this.svg.appendChild(el);
      }
    }
  }

  drawPolyDepth(depth) {
    let d = depth, c = this.ctx;
    let allPolyEdges = this.scoreData.polyEdges;
    for (let i=0; i<allPolyEdges.length; i++) {
      let polyEdges = allPolyEdges[i];
      if (polyEdges.length > depth) {
        for (let j=0; j<polyEdges[d].length; j++) {
          let from = polyEdges[d][j][0],
              to = polyEdges[d][j][1];
          let X_OFFSET = [ 0.5, 1, 0.5, 0 ],
              Y_OFFSET = [ 0, 0.5, 1, 0.5 ];

          let el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          el.setAttribute('x1', 100 * (X_OFFSET[from[2]] + from[0] - this.minX));
          el.setAttribute('y1', 100 * (Y_OFFSET[from[2]] + from[1] - this.minY));
          el.setAttribute('x2', 100 * (X_OFFSET[to[2]] + to[0] - this.minX));
          el.setAttribute('y2', 100 * (Y_OFFSET[to[2]] + to[1] - this.minY));
          el.setAttribute('stroke', this.color.main);
          el.setAttribute('stroke-width', 8);
          this.svg.appendChild(el);

          el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          el.setAttribute('cx', 100 * (X_OFFSET[from[2]] + from[0] - this.minX));
          el.setAttribute('cy', 100 * (Y_OFFSET[from[2]] + from[1] - this.minY));
          el.setAttribute('r', 11);
          el.setAttribute('fill', this.color.light);
          el.setAttribute('stroke', this.color.dark);
          el.setAttribute('stroke-width', 8);
          el.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
          this.svg.appendChild(el);

          el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          el.setAttribute('cx', 100 * (X_OFFSET[to[2]] + to[0] - this.minX));
          el.setAttribute('cy', 100 * (Y_OFFSET[to[2]] + to[1] - this.minY));
          el.setAttribute('r', 11);
          el.setAttribute('fill', this.color.light);
          el.setAttribute('stroke', this.color.dark);
          el.setAttribute('stroke-width', 8);
          el.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
          this.svg.appendChild(el);
        }
      }
    }
  }

  destroy() {
    if (this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  }
}



class ControlsUI {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.build();
  }

  build() {
    this.element = document.createElement('div');

    let instructions = document.createElement('div');
    instructions.setAttribute('id', 'instructions');
    instructions.innerHTML = 'Drag tiles to form shapes.<br/><br/>Click tiles to rotate.';
    this.element.appendChild(instructions);

    let autorotate = document.createElement('input');
    autorotate.type = 'checkbox';
    let label = document.createElement('label');
    label.appendChild(autorotate);
    instructions.appendChild(document.createElement('br'));
    instructions.appendChild(document.createElement('br'));
    label.appendChild(document.createTextNode('Autorotate'));
    instructions.appendChild(label);
    label.addEventListener('change', function() {
      this.gameManager.settings.autorotate = autorotate.checked;
    }.bind(this));

    let hints = document.createElement('input');
    hints.type = 'checkbox';
    label = document.createElement('label');
    label.appendChild(hints);
    instructions.appendChild(document.createElement('br'));
    label.appendChild(document.createTextNode('Show hints'));
    instructions.appendChild(label);
    label.addEventListener('change', function() {
      this.gameManager.settings.hints = hints.checked;
    }.bind(this));

    let restart = document.createElement('input');
    restart.type = 'button';
    restart.value = 'Restart';
    instructions.appendChild(document.createElement('br'));
    instructions.appendChild(restart);
    restart.addEventListener('click', function() {
      window.location.reload();
    });
  }
}



class BoardUI {
  constructor(gameManager) {
    this.gameManager = gameManager;

    this.grid = [];
    this.tiles = [];
    this.stack = [];

    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;

    this.scale = 1.0;

    this.boardPolyDrawings = [];
  }

  construct() {
    this.gameDiv = document.createElement('div');

    let tileStackContainer = document.createElement('div');
    tileStackContainer.setAttribute('id', 'tile-stack-container');
    this.gameDiv.appendChild(tileStackContainer);

    let tileStack = document.createElement('div');
    tileStack.setAttribute('id', 'tile-stack');
    tileStackContainer.appendChild(tileStack);
    this.tileStack = tileStack;

    let scoreboard = new ScoreboardUI();
    tileStackContainer.appendChild(scoreboard.element);
    this.scoreboard = scoreboard;

    let controls = new ControlsUI(this);
    tileStackContainer.appendChild(controls.element);
    this.controls = controls;

    let tileBoardContainer = document.createElement('div');
    tileBoardContainer.setAttribute('id', 'tile-board-container');
    this.gameDiv.appendChild(tileBoardContainer);
    this.tileBoardContainer = tileBoardContainer;

    let tileBoard = document.createElement('div');
    tileBoard.setAttribute('id', 'tile-board');
    tileBoardContainer.appendChild(tileBoard);
    this.tileBoard = tileBoard;

    document.body.appendChild(this.gameDiv);
  }

  place(colors, x, y) {
    if (!this.grid[x]) {
      this.grid[x] = [];
    }

    let tile = this.grid[x][y];
    if (!tile) {
      tile = new Tile(this.gameManager);
      this.tileBoard.appendChild(tile.div);
      tile.setPosition(x, y);
      this.tiles.push(tile);
      this.grid[x][y] = tile;

      this.minX = Math.min(x, this.minX);
      this.minY = Math.min(y, this.minY);
      this.maxX = Math.max(x, this.maxX);
      this.maxY = Math.max(y, this.maxY);
    }

    tile.setColors(colors);
    if (colors) {
      tile.removeDropzone();
    } else {
      tile.makeDropzone(function (evt) {
        let dragged = evt.relatedTarget.tile;
        let target = evt.target.tile;
        console.log('dropped', dragged, target);

        if (this.stack[dragged.row] != dragged) {
          console.log('duplicate drop');
          return;
        }

        // remove from stack
        this.stack[dragged.row] = null;

        if (this.gameManager.placeFromStack(dragged, target)) {
          dragged.div.parentNode.removeChild(dragged.div);
          // TODO
        } else {
          // replace on stack
          dragged.resetAutoRotate();
          this.stack[dragged.row] = dragged;
        }
        this.update();
      }.bind(this));
    }
  }

  drawFrontier(frontierTiles) {
    for (let i=0; i<frontierTiles.length; i++) {
      this.place(null, frontierTiles[i][0], frontierTiles[i][1]);
    }
  }

  addToStack(colors) {
    let tile = new Tile(this.gameManager);
    tile.setColors(colors);
    this.tileStack.appendChild(tile.div);
    let idx = 0;
    while (idx < this.stack.length && this.stack[idx]) {
      idx++;
    }
    tile.setPosition(0, idx);
    this.stack[idx] = tile;

    tile.makeDraggable(function() {
      this.clearScoresOnTile();
    }.bind(this));
  }

  showScore(scores) {
    this.scoreboard.update(scores);
  }

  update() {
    this.rescaleGrid();
  }

  rescaleGrid() {
    let margins = { top: 30, right: 150, bottom: 30, left: 30 };

    let availWidth = document.documentElement.clientWidth - margins.left - margins.right;
    let availHeight = document.documentElement.clientHeight - margins.top - margins.bottom;
    let totalWidth = 100 * (this.maxX - this.minX + 1);
    let totalHeight = 100 * (this.maxY - this.minY + 1);
    let skipPlaceholders = 0;
    if (this.isGameFinished()) {
      totalWidth -= 200;
      totalHeight -= 200;
      skipPlaceholders = 1;
    }

    let scale = Math.min(availWidth / totalWidth, availHeight / totalHeight);
    console.log(scale);
    totalWidth *= scale;
    totalHeight *= scale;

    this.tileBoard.style.transform = `scale(${scale}`;
    this.tileBoard.style.left = margins.left + (availWidth - totalWidth) / 2 +
                                -(this.minX - 0.5 + skipPlaceholders) * scale * 100 + 'px';
    this.tileBoard.style.top = margins.top + (availHeight - totalHeight) / 2 +
                                -(this.minY - 0.5 + skipPlaceholders) * scale * 100 + 'px';

//  this.tileBoard.style.top = -100 * ((this.maxY - this.minY + 1) / 2 + this.minY - 0.5) + 'px';
//  this.tileBoard.style.left = -100 * ((this.maxX - this.minX + 1) / 2 + this.minX - 0.5) + 'px';
    console.log(
                document.documentElement.clientWidth,
                document.documentElement.clientHeight);

//  for (let i=0; i<this.boardPolyDrawings.length; i++) {
//    this.boardPolyDrawings[i].updateOffset();
//  }

    this.scale = scale;
    this.tileBoard.classList.add('animated');
  }

  showScoresOnTile(x, y, scoreData, color, drawNil) {
    let bpd = new BoardPolyDrawing(this);
    this.boardPolyDrawings.push(bpd);
    bpd.start(x, y, scoreData, color, drawNil);
  }

  clearScoresOnTile() {
    for (let i=0; i<this.boardPolyDrawings.length; i++) {
      this.boardPolyDrawings[i].destroy();
    }
  }

  startTurn() {
    this.update();
  }

  endTurn() {
    if (this.isGameFinished()) {
      this.gameDiv.classList.add('game-finished');
      this.rescaleGrid();
      window.setTimeout(this.clearScoresOnTile.bind(this), 2000);
    }
  }

  isGameFinished() {
    let tilesLeft = 0;
    for (let i=0; i<this.stack.length; i++) {
      if (this.stack[i]) tilesLeft++;
    }
    return (tilesLeft == 0 && this.gameManager.tileStack.isEmpty());
  }
}









class GameManager {
  constructor() {
    this.tileStack = new TileStack();
    this.board = new Board();
    this.boardUI = new BoardUI(this);
    this.totalScore = 0;
    this.player = {
      name: 'Points',
      color: {
        main: '#9acd32',
        light: '#e1f0c1',
        dark: '#63851d'
      }
    };

    this.settings = {autorotate: false, hints: false};
  }

  start() {
    this.boardUI.construct();

    this.board.place(Game.INITIAL_TILE, 0, 0);
    this.boardUI.place(Game.INITIAL_TILE, 0, 0);
    this.boardUI.drawFrontier(this.board.frontier());
    for (let i=0; i<3; i++) {
      let tile = this.tileStack.pop();
      if (tile) {
        this.boardUI.addToStack(tile);
      }
    }
    this.boardUI.showScore([
      {name:this.player.name, points:0, color:this.player.color, turn:true}
    ]);
    this.boardUI.update();

    this.boardUI.startTurn();

    window.addEventListener('resize', function() {
      this.boardUI.rescaleGrid();
    }.bind(this));
  }

  placeFromStack(source, target) {
    if (this.board.place(source.colors, target.col, target.row)) {
      console.log(source.colors, target.col, target.row);
      this.boardUI.endTurn();

      this.boardUI.place(source.colors, target.col, target.row);
      this.boardUI.drawFrontier(this.board.frontier());

      let scoreData = this.board.calculateScore(target.col, target.row);
      console.log(scoreData);
      this.boardUI.showScoresOnTile(target.col, target.row, scoreData, this.player.color);
      for (let i=0; i<scoreData.scores.length; i++) {
        this.totalScore += scoreData.scores[i];
      }

      this.boardUI.showScore([{name:this.player.name, points:this.totalScore, color:this.player.color, turn:true}]);

      let tile = this.tileStack.pop();
      if (tile) {
        this.boardUI.addToStack(tile);
      }

      this.boardUI.startTurn();

      return true;
    } else {
      return false;
    }
  }
}


