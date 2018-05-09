var express = require('express');
var router = express.Router();
var db = require('../databaseHandler');
var deathstar = require('../deathstarHandler');

//retrieve latest games
router.get('/latest', function(req, res, next) {
    deathstar.getCurrentGame()
        .then( row => res.send(row), err => res.send(err) );
});

//retrieve all games
router.get('/', function(req, res, next) {
	db.query('SELECT * FROM games', function(err, rows, fields) {
		if (!err) {
			res.send(rows);
		} else {
			console.log('Database error: ' + err.stack);
			res.send('No rows');
		}
	});
});


module.exports = router;