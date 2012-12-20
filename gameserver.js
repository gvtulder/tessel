
require('mootools');

var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , game = require('./game.js');

server.listen(9000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

var ServerGameManager = new Class({
  Implements: Events,

  PLAYER_COLORS: ['#9acd32', '#ed9d67', '#d58da2', '#73c5b7'],

  initialize: function() {
    this.tileStack = new game.TileStack();
    this.board = new game.Board();
    this.players = [];
    this.playerTurn = null;
    this.lastMoves = {}
    this.totalScores = {};
    this.playerTiles = [];
    this.gameStarted = false;
    this.connected = {};
  },

  serialize: function(d) {
    return { tileStack: this.tileStack.serialize(), board: this.board.serialize(),
             players: this.players, playerTurn: this.playerTurn,
             lastMoves: this.lastMoves, totalScores: this.totalScores, playerTiles: this.playerTiles };
  },

  getPlayerState: function(playerID) {
    return {
      boardTiles: this.board.tiles,
      lastMoves: this.lastMoves,
      playerTiles: this.playerTiles[playerID]
    };
  },

  connectPlayer: function(playerID) {
    var player = this.players[playerID];
    if (player && !this.connected[playerID]) {
      this.connected[playerID] = true;
      return player;
    } else {
      return null;
    }
  },

  disconnectPlayer: function(playerID) {
    this.connected[playerID] = false;
  },

  newPlayer: function() {
    var playerID = this.players.length;
    var player = { id: playerID, name: 'Player '+playerID, color: this.PLAYER_COLORS[playerID] };
    this.players.push(player);
    this.totalScores[playerID] = 0;
    this.playerTiles[playerID] = [];
    this.fireEvent('updatePlayers');
    this.connected[playerID] = true;
    return player;
  },

  setPlayerName: function(playerID, name) {
    this.players[playerID].name = name;
    this.fireEvent('updatePlayers');
  },

  start: function() {
    this.gameStarted = true;

    this.board.place(game.INITIAL_TILE, 0, 0);
    this.fireEvent('place', {colors:game.INITIAL_TILE, x:0, y:0});

    for (var p=0; p<this.players.length; p++) {
      for (var i=0; i<3; i++) {
        var tile = this.tileStack.pop();
        if (tile) {
          this.playerTiles[this.players[p].id].push(tile);
          this.fireEvent('addToStack', {colors:tile, playerID:this.players[p].id});
        }
      }
    }

    this.playerTurn = 0;
    this.fireEvent('startTurn', {playerID:this.players[this.playerTurn].id});
  },

  placeFromStack: function(playerID, colors, x, y) {
    var tileIdx = this.indexOfTile(this.playerTiles[playerID], colors);

    if (tileIdx!=-1 && playerID==this.playerTurn && this.board.place(colors, x, y)) {
      this.playerTiles[playerID].splice(tileIdx, 1);

      this.fireEvent('place', {colors:colors, x:x, y:y, playerID:playerID});

      var scoreData = this.board.calculateScore(x, y);
      this.lastMoves[playerID] = {x:x, y:y, scoreData:scoreData, playerID:playerID};
      console.log(scoreData);
      for (var i=0; i<scoreData.scores.length; i++) {
        this.totalScores[playerID] += scoreData.scores[i];
      }
      this.fireEvent('updateScores', this.totalScores);

      var tile = this.tileStack.pop();
      if (tile) {
        this.playerTiles[playerID].push(tile);
        this.fireEvent('addToStack', {colors:tile, playerID:playerID});
      }

      this.playerTurn = (this.playerTurn + 1) % this.players.length;
      this.fireEvent('startTurn', {playerID:this.players[this.playerTurn].id});

      return true;
    } else {
      return false;
    }
  },

  finished: function() {
    if (this.playerTurn===null) return false;
    for (var p=0; p<this.players.length; p++) {
      var pt = this.playerTiles[this.players[p].id];
      if (pt && pt.length > 0) return false;
    }
    return true;
  },

  indexOfTile: function(tiles, tile) {
    for (var i=0; i<tiles.length; i++) {
      if (this.compareTiles(tiles[i], tile)) {
        return i;
      }
    }
    return -1;
  },

  compareTiles: function(tileA, tileB) {
    for (var o=0; o<4; o++) {
      var same = true;
      for (var i=0; i<4; i++) {
        if (tileA[(i+o)%4]!=tileB[i]) {
          same = false;
        }
      }
      if (same) return true;
    }
    return false;
  }
});

var mgr = new ServerGameManager();

io.sockets.on('connection', function(socket) {

  var thisPlayer, thisPlayerID = null;

  socket.on('disconnect', function() {
    if (thisPlayerID !== null) {
      mgr.disconnectPlayer(thisPlayerID);
    }
  });

  socket.on('game.resume', function(data) {
    thisPlayer = mgr.connectPlayer(data[0]);

    if (!thisPlayer) {
      return joinGame();
    }

    thisPlayerID = thisPlayer.id;

    socket.emit('game.player', thisPlayer);
    sendUpdatePlayers();
    sendUpdateScores();

    if (!mgr.gameStarted) return;

    socket.emit('game.resume', mgr.getPlayerState(thisPlayerID));

    sendUpdateTurn();
  });

  socket.on('game.join', function(data) {
    joinGame();
  });

  function joinGame() {
    if (mgr.gameStarted) return;

    thisPlayer = mgr.newPlayer();
    thisPlayerID = thisPlayer.id;
    socket.emit('game.new', true);
    socket.emit('game.player', thisPlayer);

    if (mgr.players.length == 2) {
      setTimeout(function() { mgr.start(); }, 1000);
    }
  }

  socket.on('game.player', function(data) {
    console.log(data);
    mgr.setPlayerName(thisPlayerID, data.name);
  });

  socket.on('game.input', function(data) {
    console.log(data);
    if (data[0]=='placeFromStack') {
      mgr.placeFromStack(thisPlayerID, data[1], data[2], data[3]);
    }
  });

  mgr.addEvent('updateScores', function(scores) {
    sendUpdateScores();
  });

  mgr.addEvent('updatePlayers', function(data) {
    sendUpdatePlayers();
  });

  function sendUpdateScores() {
    socket.emit('game.event', ['updateScores', mgr.totalScores]);
  }

  function sendUpdatePlayers() {
    if (thisPlayerID === null) return;

    var ps = [];
    ps.push(mgr.players[thisPlayerID]);
    for (var i=0; i<mgr.players.length; i++) {
      if (mgr.players[i].id != thisPlayerID) {
        ps.push(mgr.players[i]);
      }
    }
    socket.emit('game.event', ['updatePlayers', ps]);
  }

  function sendUpdateTurn() {
    if (mgr.finished()) {
      socket.emit('game.event', ['finished', []]);
    } else {
      var d = {playerID:mgr.playerTurn, isThisPlayer:(mgr.playerTurn==thisPlayerID)};
      socket.emit('game.event', ['startTurn', d]);
    }
  }

  mgr.addEvent('place', function(data) {
    socket.emit('game.event', ['place', data]);
    console.log(JSON.stringify(mgr.serialize()));
  });

  mgr.addEvent('addToStack', function(data) {
    if (data.playerID==thisPlayerID) {
      socket.emit('game.event', ['addToStack', data]);
    }
  });

  mgr.addEvent('startTurn', function(data) {
    console.log(JSON.stringify(mgr.serialize()));
    sendUpdateTurn();
  });
});

