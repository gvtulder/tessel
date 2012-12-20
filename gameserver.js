
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
    this.totalScores = {};
  },

  newPlayer: function() {
    var playerID = this.players.length;
    var player = { id: playerID, name: 'Player '+playerID, color: this.PLAYER_COLORS[playerID] };
    this.players.push(player);
    this.totalScores[playerID] = 0;
    this.fireEvent('updatePlayers');
    return player;
  },

  setPlayerName: function(playerID, name) {
    this.players[playerID].name = name;
    this.fireEvent('updatePlayers');
  },

  start: function() {
    this.board.place(game.INITIAL_TILE, 0, 0);
    this.fireEvent('place', {colors:game.INITIAL_TILE, x:0, y:0});

    for (var p=0; p<this.players.length; p++) {
      for (var i=0; i<3; i++) {
        var tile = this.tileStack.pop();
        if (tile) {
          this.fireEvent('addToStack', {colors:tile, playerID:this.players[p].id});
        }
      }
    }

    this.playerTurn = 0;
    this.fireEvent('startTurn', {playerID:this.players[this.playerTurn].id});
  },

  placeFromStack: function(playerID, colors, x, y) {
    if (playerID==this.playerTurn && this.board.place(colors, x, y)) {
      this.fireEvent('place', {colors:colors, x:x, y:y, playerID:playerID});

      var scoreData = this.board.calculateScore(x, y);
      console.log(scoreData);
      for (var i=0; i<scoreData.scores.length; i++) {
        this.totalScores[playerID] += scoreData.scores[i];
      }
      this.fireEvent('updateScores', this.totalScores);

      var tile = this.tileStack.pop();
      if (tile) {
        this.fireEvent('addToStack', {colors:tile, playerID:playerID});
      }

      this.playerTurn = (this.playerTurn + 1) % this.players.length;
      this.fireEvent('startTurn', {playerID:this.players[this.playerTurn].id});

      return true;
    } else {
      return false;
    }
  }
});

var mgr = new ServerGameManager();

io.sockets.on('connection', function(socket) {

  if (mgr.players.length >= 2) return;

  var thisPlayer = mgr.newPlayer();
  var thisPlayerID = thisPlayer.id;

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
    socket.emit('game.event', ['updateScores', scores]);
  });

  mgr.addEvent('updatePlayers', function(data) {
    var ps = [];
    ps.push(mgr.players[thisPlayerID]);
    for (var i=0; i<mgr.players.length; i++) {
      if (mgr.players[i].id != thisPlayerID) {
        ps.push(mgr.players[i]);
      }
    }
    socket.emit('game.event', ['updatePlayers', ps]);
  });

  mgr.addEvent('place', function(data) {
    socket.emit('game.event', ['place', data]);
  });

  mgr.addEvent('addToStack', function(data) {
    if (data.playerID==thisPlayerID) {
      socket.emit('game.event', ['addToStack', data]);
    }
  });

  mgr.addEvent('startTurn', function(data) {
    var d = {playerID:data.playerID, isThisPlayer:(data.playerID==thisPlayerID)};
    socket.emit('game.event', ['startTurn', d]);
  });

  socket.emit('game.player', thisPlayer);

  if (mgr.players.length == 2) {
    setTimeout(function() { mgr.start(); }, 1000);
  }
});

