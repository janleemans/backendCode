const pool = require('./databaseHandler');
const fs = require('fs');
const myLogFileStream = fs.createWriteStream('myLog.txt');
const debugHandler = require('./debugHandler');

module.exports = {
    //Retrieve a microservice from the DB
    getMicroservice: (gameId, name, environment, userName) => {
        let myPromise = new Promise(function (resolve, reject) {
            let sqlString = `SELECT * FROM Microservices WHERE name = '${name}'
                 AND gameId = ${gameId} AND environment = '${environment}'
                 AND userName = '${userName}'`;

            console.log(`SQL String: ${sqlString}`);
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
    },

    getMicroservices : gameId => {
        let myPromise = new Promise( (resolve, reject) => {
            let sqlString = `SELECT * FROM Microservices`;
            if(gameId)
                sqlString = sqlString.concat(` WHERE gameId = ${gameId}`);

            pool.getConnection((err, connection) => {
                if (err) {
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

    getMicroserviceByGameAndName : (gameId, microserviceName, squadName) => {
        let myPromise = new Promise( (resolve, reject) => {
            let sqlString = `SELECT m.* FROM Microservices as m
                INNER JOIN SquadsMicroservices sm on microserviceId = id
                INNER JOIN Squads sq on sm.squadId = sq.id
                WHERE m.name = '${microserviceName}' AND m.gameId = ${gameId} AND sq.name = '${squadName}'`;
                console.log(`getMicroserviceByGameAndName: ` + sqlString);
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
    },

    updateMicroservice: function (microservice, microserviceId) {
        let myPromise = new Promise((resolve, reject) => {
            let sqlString = `UPDATE Microservices SET
            modified = '${microservice.lastModifiedTime}',
            instances = ${microservice.lastestDeployment.processes[0].quantity},
            memory = '${microservice.lastestDeployment.processes[0].memory}',
            version = '${microservice.lastestDeployment.deploymentInfo.deploymentNumber}',
            status = '${microservice.status}' WHERE id = ${microserviceId}`;
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
    },

    insertMicroservice: (microservice, gameId) => {
        let myPromise = new Promise(function (resolve, reject) {
            let sqlString = `INSERT INTO Microservices (name, gameId, environment, created, modified, platform, instances, memory, status, userName, version)
                VALUES('${microservice.name}', ${gameId}, '${microservice.identityDomain}',
                '${microservice.creationTime}', '${microservice.lastModifiedTime}',
                '${microservice.lastestDeployment.environment}',
                ${microservice.lastestDeployment.processes[0].quantity},
                '${microservice.lastestDeployment.processes[0].memory}',
                '${microservice.status}',
                '${microservice.lastestDeployment.deploymentInfo.uploadedBy}',
                '${microservice.lastestDeployment.deploymentInfo.deploymentNumber}')`;
            debugHandler.insert('microserviceHandler', sqlString);
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
};
