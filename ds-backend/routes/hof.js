var express = require('express');
var router = express.Router();
var missionHandler = require('../missionHandler');

/* Retrieve all squads */
router.get('/', (req, res, next) => {
    let gameId = req.query.gameId;
    if (gameId) {
      missionHandler.getHallOfFame(gameId)
          .then( microservices => res.send( microservices ), err => res.send(err) );
    } else {
      res.send('Please provide gameId');
    }

});

module.exports = router;
