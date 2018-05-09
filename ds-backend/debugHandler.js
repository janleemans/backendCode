const pool = require('./databaseHandler');
const has = Object.prototype.hasOwnProperty;
const os = require('os');
const hostname = os.hostname();

const get = options => {
    let amount = has.call(options, 'amount') ? options.amount : 10;
    let service = has.call(options, 'service') ? options.service : null;
    
    return new Promise( (resolve, reject) => {
        let sqlString;
        if(service) {
            sqlString = `SELECT * FROM Debug WHERE service = "${service}" ORDER BY id DESC LIMIT ${amount}`;
        } else {
            sqlString = `SELECT * FROM Debug ORDER BY id DESC LIMIT ${amount}`;
        }
        
        db.query(sqlString ,(err, rows, fields) => {
            if(!err)
                resolve(rows);
            else
                reject(err);
        });
    });
};

const insert = (service, message) => {
	//console.log(message);
    //let sqlString = `INSERT INTO Debug (service, message, hostname) 
    //    VALUES("${service}" , "${message}", "${hostname}")`;
    let myPromise = new Promise((resolve, reject) => {
        resolve();
//        pool.getConnection((err, connection) => {
//            if (err) {
//                console.log(`Error!`);
//                reject(`Error connecting to database: ${JSON.stringify(err)}`);
//            } else {
//                //console.log(`Connection object: ${JSON.stringify(connection)}`);
//                connection.query(sqlString, (err, result, fields) => {
//                    connection.release();
//                    if (!err) {
//                        resolve(result);
//                    } else {
//                        console.log('Database error: ' + err.stack);
//                        reject(err);
//                    }
//                });
//            }
//        });
    });
    return myPromise;
};

module.exports = {
    get : get,
    insert: insert
};