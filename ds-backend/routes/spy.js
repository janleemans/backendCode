const express = require('express');
const spyHandler = require('../spyHandler');
const router = express.Router();

router.get('/', (req, res, send) => {
    let params = req.query;
    console.log(params);
    spyHandler.get(params)
        .then( response => res.send(response), err => res.send(err) );
});

router.post('/', (req, res, send) => {
    let params = req.body;
    let message = req.body.message;
    let active = req.body.active;
    
    spyHandler.insert(message, active)
        .then( response => res.send(response), err => res.send(err) );
});

router.put('/:messageId', (req, res, send) => {
    let messageId = req.params.messageId;
    
    spyHandler.update(messageId, req.body)
        .then(response => res.send(response), err => res.send(err) );
});

module.exports = router;