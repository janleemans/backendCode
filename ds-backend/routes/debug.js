const express = require('express');
const router = express.Router();
const debugHandler = require('../debugHandler');

router.get('', (req, res, next) => {
    let params = req.query;
    debugHandler.get(params)
        .then(response => res.send(response));
});

router.post('', (req, res, next) => {
    let service = req.body.service;
    let message = req.body.message;
    debugHandler.insert(service, message)
        .then(response => res.send(response));
});

module.exports = router;