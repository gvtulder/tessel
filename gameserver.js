
require('mootools');

var express = require('express')
  , cons = require('consolidate')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , game = require('./game.js')
  , gameDB = require('./gamedb.js');

gameDB.on('ready', function() {
  server.listen(9000);
});

app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded());
app.use(express.cookieParser());
app.use(express.cookieSession({
  cookie: { path: '/', httpOnly: true, maxAge: 30*24*3600},
  'secret': 'o7oVi46pyXZje4vWZcTa2n44yuM8DIxuKl18IAOh2upZjqXZWDeksONfidkz'
}));

app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');



app.get('/play-solo', function(req, res) {
  res.set('Cache-Control', 'no-cache');
  res.render('play', { solo: true });
});

app.get('/play-network/:id', function(req, res) {
  res.set('Cache-Control', 'no-cache');
  if (!checkUsername(req, res)) return;

  gameDB.loadGame(req.params.id, req.session.username, function(game) {
    if (game) {
      res.render('play', { network: true, game_id: req.params.id, player_id: req.session.username.toLowerCase() });
    } else {
 //     res.status(404).send('Sorry, game not found.');
      res.redirect('/');
    }
  });
});

app.get('/', function(req, res) {
  res.set('Cache-Control', 'no-cache');
  if (req.session.username) {
    gameDB.createUser(req.session.username, function() {
      gameDB.listGames(req.session.username, function(games) {
        res.render('index', {
          username: req.session.username,
          last_friend: req.session.last_friend,
          games: games,
          playerID: req.session.username.toLowerCase()
        });
      });
    });
  } else {
    res.render('index');
  }
});

app.get('/games-list', function(req, res) {
  res.set('Cache-Control', 'no-cache');
  if (req.session.username) {
    gameDB.listGames(req.session.username, function(games) {
      res.render('games-list', {
        username: req.session.username,
        last_friend: req.session.last_friend,
        games: games,
        playerID: req.session.username.toLowerCase()
      });
    });
  } else {
    res.status(404).send('not found');
  }
});

app.post('/new-game', function(req, res) {
  if (!checkUsername(req, res)) return;

  var cleanName = req.body['name'].replace(/[^a-zA-Z0-9 ]/g, '').trim();
  if (cleanName == '' || cleanName.toLowerCase()==req.session.username.toLowerCase()) {
    res.redirect('/?not_found=true');
  } else {
    req.session.last_friend = cleanName;
    gameDB.existingUser(cleanName, function(result) {
      if (result) {
        var sgm = new ServerGameManager();
        sgm.newPlayer(req.session.username.toLowerCase(), req.session.username);
        sgm.newPlayer(cleanName.toLowerCase(), cleanName);
        sgm.start();

        gameDB.createGame([ req.session.username, cleanName ], sgm.serialize(), sgm.finished(), sgm.playerIDs[sgm.playerTurn],
        function(game) {
          res.redirect('/play-network/' + game.id);

          notifyMonitoringUser(req.session.username.toLowerCase());
          notifyMonitoringUser(cleanName.toLowerCase());
        });
      } else {
        res.redirect('/?not_found=true');
      }
    });
  }
});

app.post('/remove-game', function(req, res) {
  if (!checkUsername(req, res)) return;

  gameDB.removeGame(req.body['id'], req.session.username, function(game) {
    res.redirect('/');
  });
});

app.post('/login', function(req, res) {
  var cleanName = req.body['name'].replace(/[^a-zA-Z0-9 ]/g, '').trim();
  if (cleanName != '') {
    req.session.username = cleanName;
  }
  res.redirect('/');
});

app.post('/logout', function(req, res) {
  req.session = null;
  res.redirect('/');
});


function checkUsername(req, res) {
  if (req.session && req.session.username) {
    return true;
  }

  res.redirect('/');
  return false;
}




var ServerGameManager = new Class({
  Implements: Events,

  PLAYER_COLORS: ['#9acd32', '#ed9d67', '#d58da2', '#73c5b7'],

  initialize: function() {
    this.tileStack = new game.TileStack();
    this.board = new game.Board();
    this.playerIDs = [];
    this.players = {};
    this.playerTurn = null;
    this.lastMoves = {}
    this.totalScores = {};
    this.playerTiles = {};
    this.gameStarted = false;
    this.connected = {};
    this.connectedCount = 0;
  },

  serialize: function(d) {
    return { tileStack: this.tileStack.serialize(), board: this.board.serialize(),
             playerIDs: this.playerIDs, players: this.players, playerTurn: this.playerTurn,
             lastMoves: this.lastMoves, totalScores: this.totalScores,
             playerTiles: this.playerTiles, gameStarted: this.gameStarted };
  },

  unserialize: function(d) {
    this.tileStack.unserialize(d.tileStack);
    this.board.unserialize(d.board);
    this.playerIDs = d.playerIDs;
    this.players = d.players;
    this.playerTurn = d.playerTurn;
    this.lastMoves = d.lastMoves;
    this.totalScores = d.totalScores;
    this.playerTiles = d.playerTiles;
    this.gameStarted = d.gameStarted;
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
      this.connectedCount++;
      return player;
    } else {
      return null;
    }
  },

  disconnectPlayer: function(playerID) {
    if (this.connected[playerID]) {
      this.connected[playerID] = false;
      this.connectedCount--;
    }
  },

  newPlayer: function(playerID, name) {
    var playerIdx = this.playerIDs.length;
    var player = { id: playerID, name: name, color: this.PLAYER_COLORS[playerIdx] };
    this.players[playerID] = player;
    this.playerIDs.push(playerID);
    this.totalScores[playerID] = 0;
    this.playerTiles[playerID] = [];
    this.fireEvent('updatePlayers');
    return player;
  },

  start: function() {
    this.gameStarted = true;

    this.board.place(game.INITIAL_TILE, 0, 0);
    this.fireEvent('place', {colors:game.INITIAL_TILE, x:0, y:0});

    for (var p=0; p<this.playerIDs.length; p++) {
      for (var i=0; i<3; i++) {
        var tile = this.tileStack.pop();
        if (tile) {
          this.playerTiles[this.playerIDs[p]].push(tile);
          this.fireEvent('addToStack', {colors:tile, playerID:this.playerIDs[p]});
        }
      }
    }

    this.playerTurn = 0;
    this.fireEvent('startTurn', {playerID:this.playerIDs[this.playerTurn]});
  },

  placeFromStack: function(playerID, colors, x, y) {
    var tileIdx = this.indexOfTile(this.playerTiles[playerID], colors);

    if (tileIdx!=-1 && playerID==this.playerIDs[this.playerTurn] && this.board.place(colors, x, y)) {
      this.playerTiles[playerID].splice(tileIdx, 1);

      this.fireEvent('place', {colors:colors, x:x, y:y, playerID:playerID});

      var scoreData = this.board.calculateScore(x, y);
      this.lastMoves[playerID] = {x:x, y:y, scoreData:scoreData, playerID:playerID};
      for (var i=0; i<scoreData.scores.length; i++) {
        this.totalScores[playerID] += scoreData.scores[i];
      }
      this.fireEvent('updateScores', this.totalScores);

      var tile = this.tileStack.pop();
      if (tile) {
        this.playerTiles[playerID].push(tile);
        this.fireEvent('addToStack', {colors:tile, playerID:playerID});
      }

      this.playerTurn = (this.playerTurn + 1) % this.playerIDs.length;
      this.fireEvent('startTurn', {playerID:this.playerIDs[this.playerTurn]});

      return true;
    } else {
      return false;
    }
  },

  finished: function() {
    if (this.playerTurn===null) return false;
    for (var p=0; p<this.playerIDs.length; p++) {
      var pt = this.playerTiles[this.playerIDs[p]];
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



var managerCache = {},
    managerCacheList = [];
function getServerGameManager(gameID, playerID, callback) {
  var mgr = managerCache[gameID];
  if (mgr) {
    callback(mgr);
  } else {
    gameDB.loadGame(gameID, playerID, function(game) {
      if (game) {
        var mgr = new ServerGameManager();
        mgr.unserialize(game.gameState);
        managerCache[gameID] = mgr;
        managerCacheList.push(gameID);

        mgr.addEvent('startTurn', function(data) {
          gameDB.saveGame(gameID, mgr.serialize(), mgr.finished(), mgr.playerIDs[mgr.playerTurn]);

          for (var i=0; i<game.users.length; i++) {
            notifyMonitoringUser(game.users[i].usernameLC);
          }
        });

        callback(mgr);
      } else {
        callback(null);
      }
    });
  }
}
function clearServerGameManagerCache() {
  for (var i=managerCacheList.length-1; i>=0; i--) {
    var gameID = managerCacheList[i],
        mgr = managerCache[gameID];
    if (mgr && mgr.connectedCount == 0) {
      console.log('clearing from cache:', gameID);
      gameDB.saveGame(gameID, mgr.serialize(), mgr.finished(), mgr.playerIDs[mgr.playerTurn]);
      managerCache[gameID] = null;
      managerCacheList.slice(i, 1);
    }
  }
}


// var mgr = new ServerGameManager();

var monitoringUsers = {};
function notifyMonitoringUser(userID) {
  if (monitoringUsers[userID]) {
    for (var i=0; i<monitoringUsers[userID].length; i++) {
      if (monitoringUsers[userID][i]) {
        monitoringUsers[userID][i].emit('index.update', []);
      }
    }
  }
}


io.sockets.on('connection', function(socket) {

  socket.on('index.monitor', function(data) {
    var userID = data;
    if (!monitoringUsers[userID]) {
      monitoringUsers[userID] = [];
    }

    monitoringUsers[userID].push(socket);

    socket.on('disconnect', function() {
      monitoringUsers[userID].slice(monitoringUsers[userID].indexOf(socket), 1);
    });
  });

  socket.on('game.resume', function(data) {
    getServerGameManager(data[0], data[1], function(mgr) {
      if (!mgr) {
        socket.emit('game.gone', ['Game not found.']);
        return null;
      }

      var thisPlayer, thisPlayerID = null;

      console.log(mgr);

      socket.on('disconnect', function() {
        if (thisPlayerID !== null) {
          mgr.disconnectPlayer(thisPlayerID);
        }
        clearServerGameManagerCache();
      });

      socket.on('game.input', function(data) {
        console.log(data);
        if (data[0]=='placeFromStack') {
          mgr.placeFromStack(thisPlayerID, data[1], data[2], data[3]);
        }
      });

      function sendUpdateScores() {
        socket.emit('game.event', ['updateScores', mgr.totalScores]);
      }

      function sendUpdatePlayers() {
        if (thisPlayerID === null) return;

        var ps = [];
        ps.push(mgr.players[thisPlayerID]);
        for (var i=0; i<mgr.playerIDs.length; i++) {
          if (mgr.playerIDs[i] != thisPlayerID) {
            ps.push(mgr.players[mgr.playerIDs[i]]);
          }
        }
        socket.emit('game.event', ['updatePlayers', ps]);
      }

      function sendUpdateTurn() {
        if (mgr.finished()) {
          socket.emit('game.event', ['finished', []]);
        } else {
          var d = {playerID:mgr.playerIDs[mgr.playerTurn], isThisPlayer:(mgr.playerIDs[mgr.playerTurn]==thisPlayerID)};
          socket.emit('game.event', ['startTurn', d]);
        }
      }

      mgr.addEvent('updatePlayers', function(data) {
        sendUpdatePlayers();
      });

      mgr.addEvent('updateScores', function(scores) {
        sendUpdateScores();
      });

      mgr.addEvent('startTurn', function(data) {
        sendUpdateTurn();
      });

      mgr.addEvent('place', function(data) {
        socket.emit('game.event', ['place', data]);
        console.log(JSON.stringify(mgr.serialize()));
      });

      mgr.addEvent('addToStack', function(data) {
        if (data.playerID==thisPlayerID) {
          socket.emit('game.event', ['addToStack', data]);
        }
      });


      thisPlayer = mgr.connectPlayer(data[1]);

      if (!thisPlayer) {
        return;
      }

      thisPlayerID = thisPlayer.id;

      socket.emit('game.player', thisPlayer);
      sendUpdatePlayers();
      sendUpdateScores();

      if (!mgr.gameStarted) return;

      socket.emit('game.resume', mgr.getPlayerState(thisPlayerID));

      sendUpdateTurn();
    });
  });
});

