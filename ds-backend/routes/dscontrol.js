var express = require('express');
var router = express.Router();
var db = require('../databaseHandler');
var deathstarHandler = require('../deathstarHandler');
var logHandler = require('../logHandler');

router.post('/start', function(req, res, next) {
	var bd = req.body;
	var deathstarId;
	var gameId;
	var startHealth = calcStartHealth(bd.enableDatabaseMission, bd.squads.length);

	deathstarHandler.insertDeathStar(startHealth)
	.then( id => {
		deathstarId = id
		return deathstarHandler.insertGame(deathstarId, bd.timeLimit, bd.domains, bd.squads);
	})
	.then( id => {
		gameId = id;
		return deathstarHandler.insertMissions(gameId, bd.timeLimit);
	})
	.then( () => deathstarHandler.insertSquads(gameId, bd.squads))
	.then( () => deathstarHandler.updateState(bd.enableDatabaseMission ? deathstarHandler.STATE.STARTED_DATABASE : deathstarHandler.STATE.STARTED, deathstarId))
	.then( () => {
		logHandler.insertLog("", "", 0, 0, logHandler.LOG_TYPE.START);
		res.send('Game started with id ' + gameId);
	});
});

router.get('/initFalcon', function(req, res, next) {
	deathstarHandler.getCurrentGame()
    .then( row => {
    	var id = row[0].deathStarId;
    	db.query("UPDATE DeathStars SET state = 'FALCON' WHERE id = " + id, function(err, rows, fields) {
    		if (!err) {
    			res.send(rows);
    		} else {
    			console.log('Database error: ' + err.stack);
    		}
    	});
    });
});

// reset all microservices
router.delete('/tables/delete', function(req, res, next) {
	db.query('DELETE FROM microservices', function(err, rows, fields) {
		if (!err) {
			res.send(rows);
		} else {
			console.log('Database error: ' + err.stack);
		}
	});
});

//reset all games
router.delete('/games/delete', function(req, res, next) {
	db.query('DELETE FROM games', function(err, rows, fields) {
		if (!err) {
			res.send(rows);
		} else {
			console.log('Database error: ' + err.stack);
		}
	});
});

function calcStartHealth(dbMission, squads) {
  var basePoints = 100 + 100 + 300 + 500 + (dbMission ? 500 : 0);
	var lowest = basePoints / squads;
	var avg = (lowest + basePoints)/2;
	var total = avg * squads;
	return total;
};
module.exports = router;
