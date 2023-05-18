import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { Board, Colors, Coord, Directions, InitialTile, ScoreType, TileStack } from './game.js';

export { Grid as NewGrid } from './grid/Grid.js';


interface TileUIHTMLDivElement extends HTMLDivElement {
  tile? : TileUI;
}

class TileUI {
  gameManager : GameManager;
  svg : SVGSVGElement;
  div : TileUIHTMLDivElement;
  col : number;
  row : number;
  colors : Colors;
  beforeAutoRotate : { className : string, colors : Colors };
  dropzone : Interactable;

  constructor(gameManager : GameManager) {
    this.gameManager = gameManager;

    const svg = this.generateSvg();
    this.svg = svg;

    const div = document.createElement('div');
    div.className = 'tile';
    div.appendChild(this.svg);
    this.div = div;

    this.div.addEventListener('transitionend', function() {
      console.log('hello');
      svg.classList.remove('rot360');
    });

    this.div.tile = this;
  }

  setPosition(col : number, row : number) {
    this.col = col;
    this.row = row;
    this.div.style.top = `${100 * (row - 0.5)}px`;
    this.div.style.left = `${100 * (col - 0.5)}px`;
  }

  setColors(colors : Colors | null) {
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
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'tile-segments');
    svg.appendChild(group);

    for (const poly of [
      ['top',    '-2, -2  102, -2  102, 2  52, 50  48, 50  -2, 2'],
      ['right',  '102, -2  102, 102  98, 102  50, 52  50, 50'],
      ['bottom', '102, 102  -2, 102  -2, 98  48, 50  50, 50'],
      ['left',   '0, 0  50, 50  0, 100']
    ]) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      el.setAttribute('class', 'tile-segment ' + poly[0]);
      el.setAttribute('points', poly[1]);
      el.setAttribute('fill', 'transparent');
      group.append(el);
    }

    return svg;
  }

  rotateTile() {
    this.colors.unshift(this.colors.pop());
    const cls = this.svg.classList;
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

  autoRotate(targetTile : TileUI) {
    if (!this.gameManager.settings.autorotate) {
      return;
    }
    this.resetAutoRotate();
    // how many rotations?
    const rotations = this.gameManager.board.checkFitWithRotations(this.colors, targetTile.col, targetTile.row);
    if (rotations == null) {
      console.log('does not fit even with rotation');
      return;
    }
    console.log(`requires ${rotations} rotations to fit`);
    if (!this.beforeAutoRotate) {
      this.beforeAutoRotate = { className: this.svg.getAttribute('class'), colors: [...this.colors] };
    }
    for (let i=0; i<rotations; i++) {
      this.rotateTile();
    }
    console.log({ className: [...this.svg.classList], colors: this.colors });
  }

  resetAutoRotate() {
    if (this.beforeAutoRotate) {
      console.log('resetAutoRotate', this.beforeAutoRotate);
      this.svg.setAttribute('class', this.beforeAutoRotate.className);
      this.colors = this.beforeAutoRotate.colors;
      this.beforeAutoRotate = null;
    }
  }

  makeDraggable(onDragStart : (DragEvent) => void) {
    const position = { x: 0, y: 0 };
    const boardUI = this.gameManager.boardUI;
    interact(this.div).on('tap', () => {
      this.rotateTile();
    }).draggable({
      listeners: {
        start (evt : DragEvent) {
          console.log(evt.type, evt.target);
          evt.target.classList.add('dragging');
          onDragStart(evt);
        },
        move (evt : DragEvent) {
          position.x += evt.dx;
          position.y += evt.dy;
          evt.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${boardUI.scale})`;
        },
        end (evt : DragEvent) {
          evt.target.classList.remove('dragging');
          position.x = 0;
          position.y = 0;
          evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
        },
      }
    });
  }

  makeDropzone(ondrop : (DragEvent) => void) {
    this.dropzone = interact(this.div).dropzone({
      overlap: 'center',
      ondrop: ondrop
    }).on('dropactivate', (evt : DragEvent) => {
      evt.target.classList.add('drop-activated');
      if (this.gameManager.settings.hints) {
        console.log('dropactivate', (evt.relatedTarget as TileUIHTMLDivElement).tile.colors);
        if (this.gameManager.board.checkFitWithRotations((evt.relatedTarget as TileUIHTMLDivElement).tile.colors,
                                                         (evt.target as TileUIHTMLDivElement).tile.col,
                                                         (evt.target as TileUIHTMLDivElement).tile.row) == null) {
          evt.target.classList.add('drop-hint-would-not-fit');
        } else {
          evt.target.classList.add('drop-hint-would-fit');
        }
      }
    }).on('dropdeactivate', (evt : DragEvent) => {
      evt.target.classList.remove('drop-activated');
      evt.target.classList.remove('drop-hint-would-fit');
      evt.target.classList.remove('drop-hint-would-not-fit');
    }).on('dragenter', (evt : DragEvent) => {
      console.log('dragenter', (evt.target as TileUIHTMLDivElement));
      (evt.relatedTarget as TileUIHTMLDivElement).tile.autoRotate((evt.target as TileUIHTMLDivElement).tile);
    }).on('dragleave', (evt : DragEvent) => {
      console.log('dragleave', evt.target);
      (evt.relatedTarget as TileUIHTMLDivElement).tile.resetAutoRotate();
    });
  }

  removeDropzone() {
    if (this.dropzone) {
      this.dropzone.unset();
      this.dropzone = null;
    }
  }
}



type PlayerScoreType = {
  name: string;
  points: number;
  color: PlayerType['color'];
  turn: boolean;
};

class ScoreboardUI {
  element : HTMLDivElement;

  constructor() {
    const div = document.createElement('div');
    div.setAttribute('id', 'scoreboard');
    this.element = div;
  }

  update(scores : PlayerScoreType[]) {
    const fragment = document.createDocumentFragment();
    for (let i=0; i<scores.length; i++) {
      const div = document.createElement('div');
      div.style.backgroundColor = scores[i].color.main;
      fragment.appendChild(div);

      const name = document.createElement('span');
      name.className = 'name';
      name.appendChild(document.createTextNode(scores[i].name));
      div.appendChild(name);

      const points = document.createElement('span');
      points.className = 'points';
      points.appendChild(document.createTextNode(`${scores[i] ? scores[i].points : 0}`));
      div.appendChild(points);

      if (scores[i].turn) {
        div.className = 'turn';
      }
    }
    this.element.innerHTML = '';
    this.element.appendChild(fragment);
  }
}



class BoardPolyDrawing {
  boardUI : BoardUI;
  minX : number;
  maxX : number;
  minY : number;
  maxY : number;
  x : number;
  y : number;
  scoreData : ScoreType;
  currentDepth : number;
  maxDepth : number;
  color : PlayerType['color'];
  div : HTMLDivElement;
  svg : SVGSVGElement;
  timeout? : number;

  constructor(boardUI : BoardUI) {
    this.boardUI = boardUI;
  }

  start(x : number, y : number, scoreData : ScoreType, color : PlayerType['color']) {
    console.log('boardPolyDrawing', x, y, scoreData, color);

    this.minX = this.boardUI.minX;
    this.maxX = this.boardUI.maxX;
    this.minY = this.boardUI.minY;
    this.maxY = this.boardUI.maxY;

    this.x = x;
    this.y = y;
    this.scoreData = scoreData;
    this.currentDepth = 0;
    this.color = color;

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

    this.div.style.left = `${100 * (this.minX - 0.5)}px`;
    this.div.style.top = `${100 * (this.minY - 0.5)}px`;

    this.iterDraw();
  }

  initSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('className', 'score-graph');
    svg.setAttribute('width', `${100 * (this.maxX - this.minX + 1)}`);
    svg.setAttribute('height', `${100 * (this.maxY - this.minY + 1)}`);
    return svg;
  }

  iterDraw() {
    if (this.currentDepth >= this.maxDepth) {
      this.drawScoreTile();
    } else {
      this.drawPolyDepth(this.currentDepth);
      this.currentDepth++;
      this.timeout = window.setTimeout(() => { this.iterDraw(); }, 100);
    }
  }

  drawScoreTile() {
    const scores = this.scoreData.scores;
    const x = this.x - this.minX + 0.5;
    const y = this.y - this.minY + 0.5;

    for (let i=0; i<Directions.length; i++) {
      const dir = Directions[i];
      if (scores[i]) {
        const thisX = 100 * (x + 0.5 * dir.offset.x);
        const thisY = 100 * (y + 0.5 * dir.offset.y);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${thisX}`);
        circle.setAttribute('cy', `${thisY}`);
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', this.color.light);
        circle.setAttribute('stroke', this.color.dark);
        circle.setAttribute('stroke-width', '8');
        circle.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
        this.svg.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', `${thisX}`);
        text.setAttribute('y', `${thisY + 1}`);
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '21');
        text.appendChild(document.createTextNode(`${scores[i]}`));
        this.svg.appendChild(text);
      }
    }
  }

  drawPolyDepth(depth : number) {
    const d = depth;
    const allPolyEdges = this.scoreData.polyEdges;
    for (let i=0; i<allPolyEdges.length; i++) {
      const polyEdges = allPolyEdges[i];
      if (polyEdges.length > depth) {
        for (let j=0; j<polyEdges[d].length; j++) {
          const from = polyEdges[d][j][0],
                to = polyEdges[d][j][1];
          const X_OFFSET = [ 0.5, 1, 0.5, 0 ],
                Y_OFFSET = [ 0, 0.5, 1, 0.5 ];

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', `${100 * (X_OFFSET[from.t] + from.x - this.minX)}`);
          line.setAttribute('y1', `${100 * (Y_OFFSET[from.t] + from.y - this.minY)}`);
          line.setAttribute('x2', `${100 * (X_OFFSET[to.t] + to.x - this.minX)}`);
          line.setAttribute('y2', `${100 * (Y_OFFSET[to.t] + to.y - this.minY)}`);
          line.setAttribute('stroke', this.color.main);
          line.setAttribute('stroke-width', '8');
          this.svg.appendChild(line);

          const circleA = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circleA.setAttribute('cx', `${100 * (X_OFFSET[from.t] + from.x - this.minX)}`);
          circleA.setAttribute('cy', `${100 * (Y_OFFSET[from.t] + from.y - this.minY)}`);
          circleA.setAttribute('r', '11');
          circleA.setAttribute('fill', this.color.light);
          circleA.setAttribute('stroke', this.color.dark);
          circleA.setAttribute('stroke-width', '8');
          circleA.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
          this.svg.appendChild(circleA);

          const circleB = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circleB.setAttribute('cx', `${100 * (X_OFFSET[to.t] + to.x - this.minX)}`);
          circleB.setAttribute('cy', `${100 * (Y_OFFSET[to.t] + to.y - this.minY)}`);
          circleB.setAttribute('r', '11');
          circleB.setAttribute('fill', this.color.light);
          circleB.setAttribute('stroke', this.color.dark);
          circleB.setAttribute('stroke-width', '8');
          circleB.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
          this.svg.appendChild(circleB);
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


class TileStackUI {
  gameManager : GameManager;
  stack : TileUI[];
  element : HTMLDivElement;

  constructor(gameManager : GameManager) {
    this.gameManager = gameManager;
    this.stack = [];
    this.build();
  }

  build() {
    this.element = document.createElement('div');
    this.element.setAttribute('id', 'tile-stack');
  }

  addToStack(colors : Colors) {
    const tile = new TileUI(this.gameManager);
    tile.setColors(colors);
    this.element.appendChild(tile.div);
    let idx = 0;
    while (idx < this.stack.length && this.stack[idx]) {
      idx++;
    }
    tile.setPosition(0, idx);
    this.stack[idx] = tile;

    tile.makeDraggable(() => {
      this.gameManager.boardUI.clearScoresOnTile();
    });
  }

  isEmpty() {
    let tilesLeft = 0;
    for (let i=0; i<this.stack.length; i++) {
      if (this.stack[i]) tilesLeft++;
    }
    return tilesLeft == 0;
  }
}


class ControlsUI {
  gameManager : GameManager;
  element : HTMLDivElement;

  constructor(gameManager : GameManager) {
    this.gameManager = gameManager;
    this.build();
  }

  build() {
    this.element = document.createElement('div');

    const instructions = document.createElement('div');
    instructions.setAttribute('id', 'instructions');
    instructions.innerHTML = 'Drag tiles to form shapes.<br/><br/>Click tiles to rotate.';
    this.element.appendChild(instructions);

    const autorotate = document.createElement('input');
    autorotate.type = 'checkbox';
    let label = document.createElement('label');
    label.appendChild(autorotate);
    instructions.appendChild(document.createElement('br'));
    instructions.appendChild(document.createElement('br'));
    label.appendChild(document.createTextNode('Autorotate'));
    instructions.appendChild(label);
    label.addEventListener('change', () => {
      this.gameManager.settings.autorotate = autorotate.checked;
    });

    const hints = document.createElement('input');
    hints.type = 'checkbox';
    label = document.createElement('label');
    label.appendChild(hints);
    instructions.appendChild(document.createElement('br'));
    label.appendChild(document.createTextNode('Show hints'));
    instructions.appendChild(label);
    label.addEventListener('change', () => {
      this.gameManager.settings.hints = hints.checked;
    });

    const restart = document.createElement('input');
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
  gameManager : GameManager;
  grid : TileUI[][];
  tiles : TileUI[];
  scale : number;
  boardPolyDrawings : BoardPolyDrawing[];
  boardUI : BoardUI;
  tileStackUI : TileStackUI;
  scoreboard : ScoreboardUI;
  controls : ControlsUI;

  minX : number;
  maxX : number;
  minY : number;
  maxY : number;

  gameDiv : HTMLDivElement;
  tileBoardContainer : HTMLDivElement;
  tileBoard : HTMLDivElement;

  constructor(gameManager : GameManager) {
    this.gameManager = gameManager;

    this.grid = [];
    this.tiles = [];

    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;

    this.scale = 1.0;

    this.boardPolyDrawings = [];
  }

  construct() {
    this.gameDiv = document.createElement('div');

    const tileStackContainer = document.createElement('div');
    tileStackContainer.setAttribute('id', 'tile-stack-container');
    this.gameDiv.appendChild(tileStackContainer);

    this.tileStackUI = new TileStackUI(this.gameManager);
    tileStackContainer.appendChild(this.tileStackUI.element);

    const scoreboard = new ScoreboardUI();
    tileStackContainer.appendChild(scoreboard.element);
    this.scoreboard = scoreboard;

    const controls = new ControlsUI(this.gameManager);
    tileStackContainer.appendChild(controls.element);
    this.controls = controls;

    const tileBoardContainer = document.createElement('div');
    tileBoardContainer.setAttribute('id', 'tile-board-container');
    this.gameDiv.appendChild(tileBoardContainer);
    this.tileBoardContainer = tileBoardContainer;

    const tileBoard = document.createElement('div');
    tileBoard.setAttribute('id', 'tile-board');
    tileBoardContainer.appendChild(tileBoard);
    this.tileBoard = tileBoard;

    document.body.appendChild(this.gameDiv);
  }

  place(colors : Colors, x : number, y : number) {
    if (!this.grid[x]) {
      this.grid[x] = [];
    }

    let tile = this.grid[x][y];
    if (!tile) {
      tile = new TileUI(this.gameManager);
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
      tile.makeDropzone((evt : Interact.DropEvent) => {
        const dragged = (evt.relatedTarget as TileUIHTMLDivElement).tile;
        const target = (evt.target as TileUIHTMLDivElement).tile;
        console.log('dropped', dragged, target);

        if (this.tileStackUI.stack[dragged.row] != dragged) {
          console.log('duplicate drop');
          return;
        }

        // remove from stack
        this.tileStackUI.stack[dragged.row] = null;

        if (this.gameManager.placeFromStack(dragged, target)) {
          dragged.div.parentNode.removeChild(dragged.div);
          // TODO
        } else {
          // replace on stack
          dragged.resetAutoRotate();
          this.tileStackUI.stack[dragged.row] = dragged;
        }
        this.update();
      });
    }
  }

  drawFrontier(frontierTiles : Coord[]) {
    for (let i=0; i<frontierTiles.length; i++) {
      this.place(null, frontierTiles[i].x, frontierTiles[i].y);
    }
  }

  showScore(scores : PlayerScoreType[]) {
    this.scoreboard.update(scores);
  }

  update() {
    this.rescaleGrid();
  }

  rescaleGrid() {
    const margins = { top: 30, right: 150, bottom: 30, left: 30 };

    const availWidth = document.documentElement.clientWidth - margins.left - margins.right;
    const availHeight = document.documentElement.clientHeight - margins.top - margins.bottom;
    let totalWidth = 100 * (this.maxX - this.minX + 1);
    let totalHeight = 100 * (this.maxY - this.minY + 1);
    let skipPlaceholders = 0;
    if (this.isGameFinished()) {
      totalWidth -= 200;
      totalHeight -= 200;
      skipPlaceholders = 1;
    }

    const scale = Math.min(availWidth / totalWidth, availHeight / totalHeight);
    console.log(scale);
    totalWidth *= scale;
    totalHeight *= scale;

    this.tileBoard.style.transform = `scale(${scale}`;
    this.tileBoard.style.left = `${margins.left + (availWidth - totalWidth) / 2 +
                                   -(this.minX - 0.5 + skipPlaceholders) * scale * 100 }px`;
    this.tileBoard.style.top = `${margins.top + (availHeight - totalHeight) / 2 +
                                  -(this.minY - 0.5 + skipPlaceholders) * scale * 100 }px`;

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

  showScoresOnTile(x : number, y : number, scoreData : ScoreType, color : PlayerType['color']) {
    const bpd = new BoardPolyDrawing(this);
    this.boardPolyDrawings.push(bpd);
    bpd.start(x, y, scoreData, color);
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
      window.setTimeout(() => { this.clearScoresOnTile(); }, 2000);
    }
  }

  isGameFinished() {
    return (this.tileStackUI.isEmpty() &&
            this.gameManager.tileStack.isEmpty());
  }
}







type PlayerType = {
  name : string,
  color : {
    main : string,
    light : string,
    dark : string
  }
}



export class GameManager {
  tileStack : TileStack;
  board : Board;
  boardUI : BoardUI;
  totalScore : number;
  player : PlayerType;
  settings : {
    autorotate : boolean,
    hints : boolean,
  }

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

    this.board.place(InitialTile, 0, 0);
    this.boardUI.place(InitialTile, 0, 0);
    this.boardUI.drawFrontier(this.board.frontier());
    for (let i=0; i<3; i++) {
      const tile = this.tileStack.pop();
      if (tile) {
        this.boardUI.tileStackUI.addToStack(tile);
      }
    }
    this.boardUI.showScore([
      {name:this.player.name, points:0, color:this.player.color, turn:true}
    ]);
    this.boardUI.update();

    this.boardUI.startTurn();

    window.addEventListener('resize', () => {
      this.boardUI.rescaleGrid();
    });
  }

  placeFromStack(source : TileUI, target : TileUI) {
    if (this.board.place(source.colors, target.col, target.row)) {
      console.log(source.colors, target.col, target.row);
      this.boardUI.endTurn();

      this.boardUI.place(source.colors, target.col, target.row);
      this.boardUI.drawFrontier(this.board.frontier());

      const scoreData = this.board.calculateScore(target.col, target.row);
      console.log(scoreData);
      this.boardUI.showScoresOnTile(target.col, target.row, scoreData, this.player.color);
      for (let i=0; i<scoreData.scores.length; i++) {
        this.totalScore += scoreData.scores[i];
      }

      this.boardUI.showScore([{name:this.player.name, points:this.totalScore, color:this.player.color, turn:true}]);

      const tile = this.tileStack.pop();
      if (tile) {
        this.boardUI.tileStackUI.addToStack(tile);
      }

      this.boardUI.startTurn();

      return true;
    } else {
      return false;
    }
  }
}


