const express = require('express');
const router = express.Router();
const incomingHandler = require('../incomingHandler');
const missionHandler = require('../missionHandler');

const password = 'darthvader';
// decrypting the password below will result in the above password.
// Don't change the password without changing the encrypted string
const encryptedString = '14 78 SPACE 14 70 cd SPACE 65 c9 08 65 dc 12 SPACE d6 02 77 da 05 72 c9 0f 6d dc 19 77 dc SPACE 78 d6 0c 77 d1 SPACE 7b d0 09 SPACE d3 SPACE SPACE cb 14 73 de 0d 6a SPACE 10 65 c9 08 76 c9 10 79 cb 01 79 dc 05 68 cc 0f 69 d7 0e 78 cd SPACE SPACE cd 12 70 d6 05 6c cc 10 68 da';

/**
 * Endpoint to hack into the Fuel Tank.
 */
router.get('/:squadName/:microserviceName', (req, res, next) => {
    let authHeader = req.header('Authorization');
    console.log(authHeader);

    if (authHeader !== password)
        res.send('Wrong authorization header!');
    else {
        if (req.params.squadName === 'test') {
        	// this is used to test out the endpoint from Postman
            req.params.squadName = 'blue';
            incomingHandler.incomingFire(req.params.squadName, req.params.microserviceName, missionHandler.MISSION.HARD);
            res.send('Fuel tank hit!');
        } else {
          if (req.headers['user-agent']) {
            // is coming from a non-server client
            res.send('Caller is not a fighter!');
          } else {
            incomingHandler.incomingFire(req.params.squadName, req.params.microserviceName, missionHandler.MISSION.HARD);
            res.send('Fuel tank hit!');
          }
        }
    }
});

module.exports = router;
