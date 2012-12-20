
window.addEvent('domready', function() {
  var BoardPolyDrawing = new Class({
    initialize: function(boardUI) {
      this.boardUI = boardUI;
    },

    start: function(x, y, scoreData, color, drawNil) {
      this.scoreOffsetLayer = document.createElement('div');
      this.scoreOffsetLayer.className = 'offset-layer';
      $('scores-layer').appendChild(this.scoreOffsetLayer);

      this.baseX = this.boardUI.minX;
      this.baseY = this.boardUI.minY;

      this.x = x;
      this.y = y;
      this.scoreData = scoreData;
      this.currentDepth = 0;
      this.color = color;
      this.drawNil = drawNil;

      var maxDepth = 0;
      for (var i=0; i<scoreData.polyEdges.length; i++) {
        maxDepth = Math.max(maxDepth, scoreData.polyEdges[i].length);
      }
      this.maxDepth = maxDepth;

      var cv = document.createElement('canvas');
      cv.width = (this.boardUI.maxX - this.boardUI.minX) * this.boardUI.WIDTH + 50;
      cv.height = (this.boardUI.maxY - this.boardUI.minY) * this.boardUI.HEIGHT + 50;
      this.scoreOffsetLayer.appendChild(cv);

      var c = cv.getContext('2d');
      c.lineWidth = 4;
      c.strokeStyle = color;
      c.fillStyle = color;
      this.ctx = c;

      this.iterDraw();
    },

    iterDraw: function() {
      if (this.currentDepth >= this.maxDepth) {
        this.drawScoreTile();
      } else {
        this.drawPolyDepth(this.currentDepth);
        this.currentDepth++;
        this.timeout = window.setTimeout(this.iterDraw.bind(this), 100);
      }
    },

    drawScoreTile: function() {
      var scores = this.scoreData.scores,
          x = this.x, y = this.y;
      var div = document.createElement('div'),
          span;
      var anyScore = false;
      div.className = 'tile-with-scores';
      for (var i=0; i<exports.DIRECTION_NAMES.length; i++) {
        if (scores[i]) {
          span = document.createElement('span');
          span.innerHTML = scores[i];
          span.className = 'score-' + exports.DIRECTION_NAMES[i];
          span.style.backgroundColor = this.color;
          div.appendChild(span);
          anyScore = true;
        }
      }
      if (!anyScore && this.drawNil) {
        span = document.createElement('span');
        span.innerHTML = ' ';
        span.className = 'score-center';
        span.style.backgroundColor = this.color;
        div.appendChild(span);
      }
      div.style.top  = ((y - this.boardUI.minY) * this.boardUI.HEIGHT) + 'px';
      div.style.left = ((x - this.boardUI.minX) * this.boardUI.WIDTH) + 'px';
      this.scoreOffsetLayer.appendChild(div);
    },

    drawPolyDepth: function(depth) {
      var d = depth, c = this.ctx;
      var allPolyEdges = this.scoreData.polyEdges;
      for (var i=0; i<allPolyEdges.length; i++) {
        var polyEdges = allPolyEdges[i];
        if (polyEdges.length > depth) {
          for (var j=0; j<polyEdges[d].length; j++) {
            var from = polyEdges[d][j][0],
                to = polyEdges[d][j][1];
            var X_OFFSET = [ 0.5, 1, 0.5, 0 ],
                Y_OFFSET = [ 0, 0.5, 1, 0.5 ];

            c.beginPath();
            c.moveTo((X_OFFSET[from[2]] + from[0] - this.boardUI.minX) * this.boardUI.WIDTH,
                     (Y_OFFSET[from[2]] + from[1] - this.boardUI.minY) * this.boardUI.HEIGHT);
            c.lineTo((X_OFFSET[to[2]] + to[0] - this.boardUI.minX) * this.boardUI.WIDTH,
                     (Y_OFFSET[to[2]] + to[1] - this.boardUI.minY) * this.boardUI.HEIGHT);
            c.stroke();

            c.beginPath();
            c.arc((X_OFFSET[from[2]] + from[0] - this.boardUI.minX) * this.boardUI.WIDTH,
                  (Y_OFFSET[from[2]] + from[1] - this.boardUI.minY) * this.boardUI.HEIGHT,
                  6,0,Math.PI*2);
            c.fill();

            c.beginPath();
            c.arc((X_OFFSET[to[2]] + to[0] - this.boardUI.minX) * this.boardUI.WIDTH,
                  (Y_OFFSET[to[2]] + to[1] - this.boardUI.minY) * this.boardUI.HEIGHT,
                  6,0,Math.PI*2);
            c.fill();
          }
        }
      }
    },

    updateOffset: function() {
      this.scoreOffsetLayer.style.left = ((this.baseX - this.boardUI.minX) * this.boardUI.WIDTH) + 'px';
      this.scoreOffsetLayer.style.top = ((this.baseY - this.boardUI.minY) * this.boardUI.HEIGHT) + 'px';
    },

    destroy: function() {
      if (this.timeout) {
        window.clearTimeout(this.timeout);
      }
      this.scoreOffsetLayer.destroy();
      this.scoreOffsetLayer = null;
    }
  });

  var BoardUI = new Class({
    TILE_DRAG_OPTIONS: {
      droppables: '.frontier',
      onBeforeStart: function(el) {
        el.setStyle('z-index', 1000);
      },
      onComplete: function(el, evt) {
        el.setStyle('z-index', null);
      },
      onEnter: function(el, droppable) {
      },
      onLeave: function(el, droppable) {
      }
    },

    onTileDragStart: function(el) {
      for (var i=0; i<this.boardPolyDrawings.length; i++) {
        this.boardPolyDrawings[i].destroy();
      }
      this.boardPolyDrawings = [];
//      $('scores-layer').empty();
    },

    onTileDragCancel: function(el) {
      this.rotateTile(this.stack[el.getProperty('data-idx') * 1]);

      el.setStyle('z-index', null);
    },

    onTileDrop: function(el, droppable, evt) {
      if (droppable) {
        var coords = droppable.getParent().getProperties('data-x', 'data-y');
        var tile = this.stack[el.getProperty('data-idx') * 1];

        this.stack[el.getProperty('data-idx') * 1] = null;

        if (this.gameManager.placeFromStack(tile[0], coords['data-x']*1, coords['data-y']*1)) {
          el.destroy();
        } else {
          this.stack[el.getProperty('data-idx') * 1] = tile;
        }
      }
      this.update();
    },

    initialize: function(gameManager) {
      this.gameManager = gameManager;

      this.grid = [];
      this.tiles = [];
      this.stack = [];

      this.WIDTH = 53;
      this.HEIGHT = 53;
      this.minX = 0;
      this.minY = 0;
      this.maxX = 0;
      this.maxY = 0;

      this.boardPolyDrawings = [];
    },

    construct: function() {
      this.gameDiv = new Element('div');
      this.gameDiv
            .grab(new Element('div', { id: 'tile-stack-container' })
                         .grab(new Element('div', { id: 'tile-stack' }))
                         .grab(new Element('div', { id: 'scoreboard' }))
                              )
            .grab(new Element('div', { id: 'tile-board-container' })
                         .grab(new Element('div', { id: 'tile-board' })
                                      .grab(new Element('div', { id: 'scores-layer' }))
                              ))
            .grab(new Element('div', { id: 'game-state-message', style: 'display: none' }));
      document.body.appendChild(this.gameDiv);
    },

    destroy: function() {
      for (var i=0; i<this.boardPolyDrawings.length; i++) {
        this.boardPolyDrawings[i].destroy();
      }
      this.boardPolyDrawings = null;
      this.gameDiv.destroy();
      this.gameDiv = null;
    },

    drawFrontier: function(frontierTiles) {
      for (var i=0; i<frontierTiles.length; i++) {
        this.place(null, frontierTiles[i][0], frontierTiles[i][1]);
      }
    },

    addToStack: function(colors) {
      var div = this.createTile();
      div.firstChild.className = this.colorClasses(colors);
      $('tile-stack').appendChild(div);

      div.addEventListener('transitionend', this.onTileTransitionEnd, false);
      div.addEventListener('webkitTransitionEnd', this.onTileTransitionEnd, false);
      div.addEventListener('otransitionend', this.onTileTransitionEnd, false);
      div.addEventListener('oTransitionEnd', this.onTileTransitionEnd, false);

      var drag = new Drag.Move(div, this.TILE_DRAG_OPTIONS);
      drag.addEvent('start', this.onTileDragStart.bind(this));
      drag.addEvent('drop', this.onTileDrop.bind(this));
      drag.addEvent('cancel', this.onTileDragCancel.bind(this));
      drag.detach();

      var tile = [ colors, div, drag ];
      var idx = 0;
      while (idx < this.stack.length && this.stack[idx]) {
        idx++;
      }
      div.setProperty('data-idx', idx);
      this.stack[idx] = tile;
    },

    place: function(colors, x, y) {
      if (!this.grid[x]) {
        this.grid[x] = [];
      }

      var tile = this.grid[x][y];
      if (!tile) {
        var div = this.createTile(x, y);
        $('tile-board').appendChild(div);
        tile = [ x, y, colors, div ];
        this.tiles.push(tile);
        this.grid[x][y] = tile;

        this.minX = Math.min(x, this.minX);
        this.minY = Math.min(y, this.minY);
        this.maxX = Math.max(x, this.maxX);
        this.maxY = Math.max(y, this.maxY);
      }

      tile[2] = colors;
      tile[3].firstChild.className = this.colorClasses(colors);
    },

    update: function() {
      this.updatePositionsOnGrid();
      this.updateTilesOnStack();
    },

    updatePositionsOnGrid: function() {
      for (var i=0; i<this.tiles.length; i++) {
        var tile = this.tiles[i];
        tile[3].style.top  = ((tile[1] - this.minY) * this.HEIGHT) + 'px';
        tile[3].style.left = ((tile[0] - this.minX) * this.WIDTH) + 'px';
      }
      for (var i=0; i<this.boardPolyDrawings.length; i++) {
        this.boardPolyDrawings[i].updateOffset();
      }
    },

    updateTilesOnStack: function() {
      var frontierTiles = $$('.frontier');
      for (var i=0; i<this.stack.length; i++) {
        if (this.stack[i]) {
          this.stack[i][2].droppables = frontierTiles;
          this.stack[i][1].setPosition({ x: 0, y: i * this.HEIGHT });
        }
      }
    },

    showScore: function(scores) {
      var fragment = document.createDocumentFragment(),
          div, span;
      for (var i=0; i<scores.length; i++) {
        div = document.createElement('div');
        div.style.backgroundColor = scores[i].color;
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
      var scoreboard = $('scoreboard');
      scoreboard.empty();
      scoreboard.appendChild(fragment);
    },

    showScoresOnTile: function(x, y, scoreData, color, drawNil) {
      var bpd = new BoardPolyDrawing(this);
      this.boardPolyDrawings.push(bpd);
      bpd.start(x, y, scoreData, color, drawNil);
    },

    startTurn: function() {
      this.update();
      for (var i=0; i<this.stack.length; i++) {
        if (this.stack[i]) {
          this.stack[i][2].attach();
        }
      }
    },

    endTurn: function() {
      for (var i=0; i<this.stack.length; i++) {
        if (this.stack[i]) {
          this.stack[i][2].detach();
        }
      }
    },

    createTile: function(x, y) {
      var div = document.createElement('div'),
          span = document.createElement('span');
      div.appendChild(span);
      div.className = 'tile';
      $(div).setProperties({'data-x': x, 'data-y': y});
      $('tile-board').appendChild(div);
      return div;
    },

    colorClasses: function(colors) {
      if (colors) {
        var colorClasses = '';
        for (var i=0; i<exports.DIRECTION_NAMES.length; i++) {
          colorClasses += exports.DIRECTION_NAMES[i]+'-'+colors[i]+' ';
        }
        return colorClasses;
      } else {
        return 'frontier';
      }
    },

    onTileTransitionEnd: function(evt) {
      var div = evt.target;
      if (div.hasClass('rot360')) {
        div.removeClass('rot360');
      }
    },

    rotateTile: function(tileOnStack) {
      tileOnStack[0].unshift(tileOnStack[0].pop());
      if (tileOnStack[1].hasClass('rot90')) {
        tileOnStack[1].removeClass('rot90');
        tileOnStack[1].addClass('rot180');
      } else if (tileOnStack[1].hasClass('rot180')) {
        tileOnStack[1].removeClass('rot180');
        tileOnStack[1].addClass('rot270');
      } else if (tileOnStack[1].hasClass('rot270')) {
        tileOnStack[1].removeClass('rot270');
        tileOnStack[1].addClass('rot360');
      } else {
        tileOnStack[1].removeClass('rot360');
        tileOnStack[1].addClass('rot90');
      }
    },

    showState: function(msg) {
      var gsm = $('game-state-message');
      gsm.empty();
      if (msg) {
        gsm.appendChild(document.createTextNode(msg));
        gsm.style.display = 'block';
      }
    }
  });

  var GameManager = new Class({
    initialize: function() {
      this.tileStack = new exports.TileStack();
      this.board = new exports.Board();
      this.boardUI = new BoardUI(this);
      this.totalScore = 0;
//    this.player = {name:'You', color:'#73c5b7'};
//    this.player = {name:'You', color:'#ed9d67'};
//    this.player = {name:'You', color:'#d58da2'};
      this.player = {name:'Points', color:'#9acd32'};
    },

    start: function() {
      this.boardUI.construct();

      this.board.place(exports.INITIAL_TILE, 0, 0);
      this.boardUI.place(exports.INITIAL_TILE, 0, 0);
      this.boardUI.drawFrontier(this.board.frontier());
      for (var i=0; i<3; i++) {
        var tile = this.tileStack.pop();
        if (tile) {
          this.boardUI.addToStack(tile);
        }
      }
      this.boardUI.showScore([
        {name:this.player.name, points:0, color:this.player.color, turn:true}
      ]);
      this.boardUI.update();

      this.boardUI.startTurn();
    },

    placeFromStack: function(colors, x, y) {
      if (this.board.place(colors, x, y)) {
        this.boardUI.endTurn();

        this.boardUI.place(colors, x, y);
        this.boardUI.drawFrontier(this.board.frontier());

        var scoreData = this.board.calculateScore(x, y);
        console.log(scoreData);
        this.boardUI.showScoresOnTile(x, y, scoreData, this.player.color);
        for (var i=0; i<scoreData.scores.length; i++) {
          this.totalScore += scoreData.scores[i];
        }

        this.boardUI.showScore([{name:this.player.name, points:this.totalScore, color:this.player.color, turn:true}]);

        var tile = this.tileStack.pop();
        if (tile) {
          this.boardUI.addToStack(tile);
        }

        this.boardUI.startTurn();

        return true;
      } else {
        return false;
      }
    }
  });

  var NetworkGameManager = new Class({
    initialize: function() {
      var socket = io.connect();
      socket.on('connect', this.onConnect.bind(this));
      socket.on('game.new', this.onGameNew.bind(this));
      socket.on('game.player', this.onGamePlayer.bind(this));
      socket.on('game.resume', this.onGameResume.bind(this));
      socket.on('game.event', this.onGameEvent.bind(this));
      socket.on('disconnect', this.onDisconnect.bind(this));
      this.socket = socket;

      this.reset();
    },

    reset: function() {
      if (this.boardUI) {
        this.boardUI.destroy();
      }

      this.board = new exports.Board();
      this.boardUI = new BoardUI(this);
      this.boardUI.construct();

      this.playerID = null;
      this.scores = [];
      this.players = [];
      this.playersByID = {};
      this.turn = null;

      this.boardUI.showState('Preparing...');
    },

    onConnect: function() {
      console.log('connected!');
      if (document.location.hash.replace(/^#/,"") != "") {
        this.socket.emit('game.resume', [document.location.hash.replace(/^#/,"")]);
      } else {
        this.socket.emit('game.join', []);
      }
    },

    onDisconnect: function() {
      console.log('disconnected!');
    },

    onGameNew: function() {
      this.reset();
    },

    onGamePlayer: function(data) {
      console.log('received player:', data);
      this.playerID = data.id;
      document.location.hash = '#'+this.playerID;
      this.socket.emit('game.player', {name:'Player '+data.id});
    },

    onGameResume: function(data) {
      console.log('resume data:', data);
      for (var i=0; i<data.boardTiles.length; i++) {
        var tile = data.boardTiles[i];
        this.board.place(tile[2], tile[0], tile[1]);
        this.boardUI.place(tile[2], tile[0], tile[1]);
      }
      this.boardUI.drawFrontier(this.board.frontier());
      for (var i=0; i<data.playerTiles.length; i++) {
        var tile = data.playerTiles[i];
        this.boardUI.addToStack(tile);
      }
      for (var i=0; i<this.players.length; i++) {
        var lastMove = data.lastMoves[this.players[i].id];
        if (lastMove) {
          this.boardUI.showScoresOnTile(lastMove.x, lastMove.y, lastMove.scoreData,
                                        this.playersByID[lastMove.playerID].color,
                                        (lastMove.playerID != this.playerID));
        }
      }
      this.boardUI.update();
    },

    onGameEvent: function(data) {
      console.log('received game.event:', data);
      if (data[0] == 'updatePlayers') {
        this.players = data[1];
        this.playersByID = {};
        for (var i=0; i<this.players.length; i++) {
          this.playersByID[this.players[i].id] = this.players[i];
        }
        this.showScores();
      } else if (data[0] == 'updateScores') {
        this.scores = data[1];
        this.showScores();
      } else if (data[0] == 'startTurn') {
        this.turn = data[1].playerID;
        if (this.turn == this.playerID) {
          this.boardUI.showState('Your turn...');
          this.boardUI.startTurn();
        } else {
          this.boardUI.showState('Waiting for '+this.playersByID[data[1].playerID].name+'...');
        }
        this.showScores();
      } else if (data[0] == 'addToStack') {
        this.boardUI.addToStack(data[1].colors);
      } else if (data[0] == 'place') {
        this.board.place(data[1].colors, data[1].x, data[1].y);
        this.boardUI.place(data[1].colors, data[1].x, data[1].y);
        this.boardUI.drawFrontier(this.board.frontier());
        if (data[1].playerID !== undefined) {
          var scoreData = this.board.calculateScore(data[1].x, data[1].y);
          console.log(scoreData);
          this.boardUI.showScoresOnTile(data[1].x, data[1].y, scoreData,
                                        this.playersByID[data[1].playerID].color,
                                        (data[1].playerID != this.playerID));
        }
      } else if (data[0] == 'finished') {
        this.boardUI.showState('Finished. '+this.winnerMessage());
      }
      this.boardUI.update();
    },

    placeFromStack: function(colors, x, y) {
      if (this.board.checkFit(colors, x, y)) {
        this.boardUI.endTurn();
        this.boardUI.showState('Processing...');

        this.board.place(colors, x, y);
        this.boardUI.place(colors, x, y);
        this.boardUI.drawFrontier(this.board.frontier());
        this.boardUI.update();

        this.socket.emit('game.input', ['placeFromStack', colors, x, y]);

        return true;
      } else {
        return false;
      }
    },

    showScores: function() {
      var scoreData = [];
      for (var i=0; i<this.players.length; i++) {
        scoreData.push({name:this.players[i].name, color:this.players[i].color,
                        points:(this.scores[this.players[i].id] ? this.scores[this.players[i].id] : 0),
                        turn:(this.players[i].id == this.turn)});
      }
      this.boardUI.showScore(scoreData);
    },

    winnerMessage: function() {
      var maxScore = -1, maxScoreWinner = [];
      for (var i=0; i<this.players.length; i++) {
        var score = this.scores[this.players[i].id],
            name = this.players[i].name;
        if (this.players[i].id == this.playerID) {
          name = 'You';
        }
        if (score) {
          if (score == maxScore) {
            maxScoreWinner.push(name);
          } else if (score > maxScore) {
            maxScoreWinner = [ name ];
            maxScore = score;
          }
        }
      }
      return maxScoreWinner.join(' and ')+' won!';
    }
  });

  if (window.socketIO) {
    new NetworkGameManager();
  } else {
    new GameManager().start();
  }

});

