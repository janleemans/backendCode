var express = require('express');
var router = express.Router();
var logsHandler = require('../appLogsHandler')
router.get('', (req, res, next) => {
    let params = req.query;
    logsHandler.getLogs(params)
        .then(response => res.send(response));

});

module.exports = router;
