const pool = require('./databaseHandler');

const
LOG_TYPE = {
	START : "START",
	DEPLOY : "DEPLOY",
	SCALE : "SCALE",
	SHIELD : "SHIELD",
	ITERATE : "ITERATE",
	DATABASE : "DATABASE",
	FALCON : "FALCON",
	HARD : "HARD",
	FINISHED : "FINISHED"
};

const has = Object.prototype.hasOwnProperty;

function formatDate(dateString) {
    let date = new Date(dateString).toLocaleString('en-US',{hour12:false}).split(" ");

    let time = date[1];
    let mdy = date[0];

    mdy = mdy.split('/');
    let month = parseInt(mdy[0]);
    let day = parseInt(mdy[1]);
    let year = parseInt(mdy[2]);

    let formattedDate = year + '-' + month + '-' + day + ' ' + time;
    return formattedDate;
};

// Takes an options object with rows requested, ordering and gameId..
function getLogs(options) {
    options = options || {};

    let amount = has.call(options, 'amount') ? options.amount : 5;
    let ordering = has.call(options, 'ordering') ? options.ordering : 'DESC';
    let gameId = has.call(options, 'gameId') ? options.gameId : false;

    let myPromise = new Promise( (resolve, reject) => {
        let sqlString = `SELECT * FROM Logs `;
        let whereClause = `WHERE gamesId =`;
        if(gameId)
            whereClause = whereClause.concat(gameId);
        else
            whereClause = whereClause.concat(`(SELECT MAX(id) FROM Games)`);

        let orderClause = ` ORDER BY id ${ordering}`;
        //let limitClause = ` LIMIT ${amount}`;

        sqlString = sqlString.concat(whereClause, orderClause);

        pool.getConnection((err, connection) => {
            if (err) {
                console.log(`Error!`);
                reject(`Error connecting to database: ${JSON.stringify(err)}`);
            } else {
                //console.log(`Connection object: ${JSON.stringify(connection)}`);
                connection.query(sqlString, (err, result, fields) => {
                    connection.release();
                    if (!err) {
                        resolve(result);
                    } else {
                        console.log('Database error: ' + err.stack);
                        reject(err);
                    }
                });
            }
        });
    });
    return myPromise;
}

function insertLog(squadName, microserviceName, score, damage, type) {
    let myPromise = new Promise( (resolve, reject) => {

        let sqlString = `INSERT INTO Logs(time, gamesId, squadName,
            microserviceName, score, damage, type) VALUES (
            '${formatDate(new Date().toString())}',
            (SELECT MAX(id) FROM Games), '${squadName}',
            '${microserviceName}', ${score}, ${damage}, '${type}')`;
        pool.getConnection((err, connection) => {
            if (err) {
                console.log(`Error!`);
                reject(`Error connecting to database: ${JSON.stringify(err)}`);
            } else {
                //console.log(`Connection object: ${JSON.stringify(connection)}`);
                connection.query(sqlString, (err, result, fields) => {
                    connection.release();
                    if (!err) {
                        resolve(result);
                    } else {
                        console.log('Database error: ' + err.stack);
                        reject(err);
                    }
                });
            }
        });
    });
    return myPromise;
};

module.exports = {
    getLogs : getLogs,
    insertLog : insertLog,
    LOG_TYPE : LOG_TYPE
};
