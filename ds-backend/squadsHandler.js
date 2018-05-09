const pool = require('./databaseHandler');

const fs = require('fs');
const debugHandler = require('./debugHandler');

module.exports = {
        getSquadByUserName : (gameId, username, environment) => {
            let squadByUserNamePromise = new Promise( (resolve, reject) => {
                let sqlString = `SELECT * FROM Squads WHERE gameId = ${gameId} 
                    AND username = '${username}' AND environment = '${environment}'`;
                debugHandler.insert('squadsHandler', 'Performing SQL query: ' + sqlString);
                pool.getConnection( (err, connection) => {
                    if(err) {
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
            return squadByUserNamePromise;
        },
        getSquads : function(gameId) {
            let squadsPromise = new Promise( (resolve, reject) => {
                let sqlString = `SELECT Squads.*, SUM(mm.score) AS score FROM Squads 
                    LEFT JOIN SquadsMicroservices sm ON sm.squadId = id 
                    LEFT JOIN MissionsMicroservices mm ON mm.microserviceId = sm.microserviceId`;
                if(gameId)
                    sqlString = sqlString.concat(` WHERE gameId = ${gameId}`);
                sqlString = sqlString.concat(` GROUP BY id`);
                pool.getConnection( (err, connection) => {
                    if(err) {
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
            return squadsPromise;
        }
        
    
};
