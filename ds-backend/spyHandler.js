const db = require('./databaseHandler');
const has = Object.prototype.hasOwnProperty;

const insert = function(message, active) {
    return new Promise( (resolve, reject) => {
        let sqlString = `
            INSERT INTO SpyMessages (date, message, active)
             VALUES (NOW(), '${message}', '${active}')`;
        console.log(sqlString);
        db.query(sqlString, (err, rows, fields) => {
            if(!err)
                resolve(rows);
            else
                reject(err);
        });
    });
};

const get = function(options) {
    let opts = options;
    return new Promise( (resolve, reject) => {
        let options = opts || {};
        let amount = has.call(options, 'amount') ? options.amount : 1;
        let onlyActive = has.call(options, 'onlyActive') ? options.onlyActive : true;
        let whereClause = onlyActive !== "false" ? `WHERE active = 1` : '';
        let sqlString = `
            SELECT * FROM SpyMessages 
            ${whereClause} 
            ORDER BY id DESC LIMIT ${amount}`;
        db.query(sqlString, (err, rows, fields) => {
            if(!err)
                resolve(rows);
            else
                reject(err);
        });
    });
};

const update = function(id, options) {
    let opts = options;
    return new Promise( (resolve, reject) => {
        let options = opts || {};
        let hasActive = has.call(options, 'active');
        let hasMessage = has.call(options, 'message');
        
        let setActive = hasActive ? ` set active = ${options.active}` : '';
        let setMessage = hasMessage ? `, message = '${options.message}'` : '';
        let sqlString = `UPDATE SpyMessages ${setActive} ${setMessage} WHERE id = ${id}`;
        
        db.query(sqlString, (err, rows, fields) => {
            if(!err)
                resolve(rows);
            else
                reject(err);
        });
    });
};

module.exports = {
    insert: insert,
    get : get,
    update : update
};