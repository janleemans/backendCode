var express = require('express');
var router = express.Router();
var db = require('../databaseHandler');
var squadsMicroservices = require('../squadsMicroservicesHandler');
var squads = require('../squadsHandler');

/* Retrieve all squads */
router.get('/', (req, res, next) => {
    let gameId = req.query.gameId || null;
    squads.getSquads(gameId)
        .then( squads => res.send( squads ), err => res.send(err) );
});

/* Retrieves all microservices for a squad identified by squad id */
router.get('/:squadId/microservices', (req, res, next) => {
    let squadId = req.param('squadId');
    squadsMicroservices.getMicroservicesForSquad(squadId)
        .then( data => res.send(data), err => res.send(err) );
});

module.exports = router;