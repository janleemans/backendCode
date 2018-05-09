var express = require('express');
var router = express.Router();
var incomingHandler = require('../incomingHandler');
var missionHandler = require('../missionHandler');

const xCoordinate = 320;
const yCoordinate = 650;

/**
 * Endpoint to hit the Reactor Core.
 */
router.get('/' + xCoordinate + '/' + yCoordinate + '/:squadName/:microserviceName', function(req, res, next) {
			if (req.params.squadName == 'test') {
				// this is used to test out the endpoint from Postman
				req.params.squadName = 'blue';
				incomingHandler.incomingFire(req.params.squadName, req.params.microserviceName, missionHandler.MISSION.DATABASE);
				res.send('Reactor core hit!');
			} else {
				if (req.headers['user-agent'] && !req.headers['user-agent'].includes('Apache')) {
					// is coming from a non-server client
					res.send('Caller is not a fighter!');
				} else {
					incomingHandler.incomingFire(req.params.squadName, req.params.microserviceName, missionHandler.MISSION.DATABASE);
					res.send('Reactor core hit!');
				}
			}
});

module.exports = router;
