var express = require('express');
var router = express.Router();
const logsHandler = require('../logHandler');

router.get('', (req, res, next) => {
    let params = req.query;
    logsHandler.getLogs(params)
        .then(response => res.send(response));
    
});

// takes squadName, microserviceName, score, damage, type.
router.post('', (req, res, next) => {
    let squadName = req.body.squadName;
    let microserviceName = req.body.microserviceName;
    let score = req.body.score;
    let damage = req.body.damage;
    let type = req.body.type;
    
    logsHandler.insertLog(squadName, microserviceName, score, damage, type)
        .then( () => {
            res.writeHead(201);
            res.end('Created');
        }, () => {
            res.writeHead(500);
            res.end('Could not create');
    });
});

module.exports = router;