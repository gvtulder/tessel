
var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    EventEmitter = require('events').EventEmitter,
    assert = require('assert');

module.exports = new EventEmitter();
exports = module.exports;

// Connect to the db
MongoClient.connect('mongodb://tiles-game:Tiles@ds045757.mongolab.com:45757/tiles', function(err, db) {
  if(err) {
    console.log(err);
  } else {
    console.log('We are connected to MongoDB');

    var usersCollection = db.collection('tiles.users'),
        gamesCollection = db.collection('tiles.games');

    exports.existingUser = function(username, callback) {
      var usernameLC = username.toLowerCase();
      return usersCollection.findOne({ usernameLC: usernameLC }, function(err, result) {
        assert.equal(null, err);
        callback(result);
      });
    };

    exports.createUser = function(username, callback) {
      var usernameLC = username.toLowerCase();
      usersCollection.update({ usernameLC: usernameLC },
        { usernameLC: usernameLC,
          username: username
        }, { upsert: true },
        function(err, result) {
          assert.equal(null, err);
          if (callback) callback();
        });
    };

    exports.listGames = function(username, callback) {
      var usernameLC = username.toLowerCase();
      gamesCollection.find({ 'users.usernameLC': usernameLC },
        function(err, result) {
          assert.equal(null, err);
          if (callback) result.toArray(function(err, res) {
            var games = [];
            for (var i=0; i<res.length; i++) {
              var opponents = [];
              for (var j=0; j<res[i].users.length; j++) {
                if (res[i].users[j].usernameLC != usernameLC) {
                  opponents.push(res[i].users[j]);
                }
              }
              games.push({
                id: res[i]._id,
                opponents: opponents,
                finished: res[i].finished,
                your_turn: (res[i].playerTurn == usernameLC)
              });
            }
            callback(games);
          });
        });
    };

    exports.createGame = function(players, gameState, finished, playerTurn, callback) {
      var users = [];
      for (var i=0; i<players.length; i++) {
        users.push({ username: players[i], usernameLC: players[i].toLowerCase() });
      }
      gamesCollection.insert({
        users: users,
        gameState: gameState,
        finished: finished,
        playerTurn: playerTurn,
        created: new Date(),
        updated: new Date()
      }, function(err, result) {
        assert.equal(null, err);
        if (callback) callback({ id: result[0]._id });
      });
    };

    exports.removeGame = function(id, username, callback) {
      var usernameLC = username.toLowerCase();
      gamesCollection.remove({
        _id: ObjectID.createFromHexString(id),
        'users.usernameLC': usernameLC
      }, function(err, result) {
        assert.equal(null, err);
        if (callback) {
          callback();
        }
      });
    };

    exports.loadGame = function(id, username, callback) {
      var usernameLC = username.toLowerCase();
      gamesCollection.findOne({
        _id: ObjectID.createFromHexString(id),
        'users.usernameLC': usernameLC
      }, function(err, result) {
        assert.equal(null, err);
        if (result) {
          callback(result);
        } else {
          callback(null);
        }
      });
    };

    exports.saveGame = function(id, gameState, finished, playerTurn) {
      gamesCollection.update({
        _id: ObjectID.createFromHexString(id)
      }, { '$set': {
        gameState: gameState,
        finished: finished,
        playerTurn: playerTurn,
        updated: new Date() } },
      function(err, result) {
        assert.equal(null, err);
      });
    };

    exports.emit('ready');
  }
});

