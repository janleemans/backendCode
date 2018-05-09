const pool = require('./databaseHandler');
const fs = require('fs');
const myLogFileStream = fs.createWriteStream('squads-microservices-log.txt');
const myConsole = new console.Console(myLogFileStream, myLogFileStream);
const debugHandler = require('./debugHandler');

module.exports = {
    
    insertSquadMicroservice : (squadId, microserviceId) => {
        let insertSquadMicroservicePromise = new Promise( (resolve, reject) => {
            let sqlString = `INSERT INTO SquadsMicroservices (squadId, microserviceId) 
                VALUES(${squadId}, ${microserviceId})`;
            
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
        return insertSquadMicroservicePromise;
    },
    
    getMicroservicesForSquad : squadId => {
        let myPromise = new Promise( (resolve, reject) => {
            
            let sqlString = `SELECT SquadsMicroservices.*, ms.*, SUM(mm.score) AS score 
                FROM SquadsMicroservices 
                INNER JOIN Microservices ms ON microserviceId = id 
                INNER JOIN MissionsMicroservices mm ON mm.microserviceId = id 
                WHERE squadId = ${squadId} GROUP BY id`;
            
            pool.getConnection( (err, connection) => {
                if(err) {
                    console.log(`Error!`);
                    reject(`Error connecting to database: ${JSON.stringify(err)}`);
                } else {
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
    },
    
    getMicroservicesForAllSquads : gameId => {
        let myPromise = new Promise ( (resolve, reject) => {
           
            let sqlString = `SELECT *, ms.name AS microserviceName 
                FROM SquadsMicroservices 
                INNER JOIN Microservices ms ON microserviceId = ms.id 
                INNER JOIN Squads sq on squadId = sq.id`;
            
            if(gameId)
                sqlString = sqlString.concat(` WHERE sq.gameId = ${gameId}`);
            
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
        return myPromise;
    }
    
};