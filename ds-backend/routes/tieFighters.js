var express = require('express');
var router = express.Router();
var incomingHandler = require('../incomingHandler');
var missionHandler = require('../missionHandler');

const xCoordinate = 45;

/**
 * Endpoint to hit one of theMinifighters.
 */
router.get('/' + xCoordinate + '/:y/:squadName/:microserviceName', function(req, res, next) {
  console.log('Incoming TIE fire to shield, squadName: ' + req.params.squadName + ", ms name: " + req.params.microserviceName);

	if (req.params.squadName == 'test') {
		// this is used to test out the endpoint from Postman
		req.params.squadName = 'blue';
		incomingHandler.incomingMinigun(req.params);
		res.send('Something got hit!');
	} else {
    if (req.headers['user-agent'] && !req.headers['user-agent'].includes('Apache')) {
      // is coming from a non-server client
      res.send('Caller is not a fighter!');
    } else {
      incomingHandler.incomingMinigun(req.params);
      res.send('Something got hit!');
    }
	}
});

module.exports = router;
