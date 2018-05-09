const pool = require('./databaseHandler');
const deathstar = require('./deathstarHandler');
const logHandler = require('./logHandler');
const spy = require('./spyHandler');
const debugHandler = require('./debugHandler');

const
MISSION = {
	DEPLOY : { name: "DEPLOY", maxScore: 100 },
	SCALE : { name: "SCALE", maxScore: 100 },
	SHIELD : { name: "SHIELD", maxScore: 300},
	DATABASE : { name: "DATABASE", maxScore: 500 },
	ITERATE : { name: "ITERATE", maxScore: 500 },
	FALCON : { name: "FALCON", maxScore: 0 },
	HARD : { name: "HARD", maxScore: 1000 }
};

const missionCompleted = async (mission, microservice, squad, gameId) => {
	if (!microservice) {
		return;
	}
    try {
        console.log('See if mission completed for ' + squad.name + ", " + microservice.name + " for mission " + mission.name);
        let missionId = await getMissionId(mission.name, gameId);
        let isCompletedByMicroservice = await isMissionCompletedByMicroservice(missionId, microservice.id);
        if (isCompletedByMicroservice)
            return;

        let isCompletedBySquad = await isMissionCompletedBySquad(missionId, squad.id);
        let fractionOfSquadsCompleted = await getFractionCompleted(missionId, gameId);
        let scoreToGive = isCompletedBySquad ? 0 : (mission.maxScore * (1 - fractionOfSquadsCompleted));
        console.log(`Yes. Inserting mission complete: ${missionId} ${microservice.id} ${gameId} ${scoreToGive}`)
        insertMissionCompleted(missionId, microservice.id, gameId, scoreToGive);
        deathstar.updateHealth(gameId, scoreToGive);
        switch (mission.name) {
            case MISSION.DEPLOY.name:
                logHandler.insertLog(squad.name, microservice.name, scoreToGive, scoreToGive, logHandler.LOG_TYPE.DEPLOY);
                break;
            case MISSION.SCALE.name:
                logHandler.insertLog(squad.name, microservice.name, scoreToGive, scoreToGive, logHandler.LOG_TYPE.SCALE);
                break;
            case MISSION.SHIELD.name:
                logHandler.insertLog(squad.name, microservice.name, scoreToGive, scoreToGive, logHandler.LOG_TYPE.SHIELD);
                break;
            case MISSION.ITERATE.name:
                logHandler.insertLog(squad.name, microservice.name, scoreToGive, scoreToGive, logHandler.LOG_TYPE.ITERATE);
                break;
            case MISSION.DATABASE.name:
                logHandler.insertLog(squad.name, microservice.name, scoreToGive, scoreToGive, logHandler.LOG_TYPE.DATABASE);
                break;
            case MISSION.FALCON.name:
                logHandler.insertLog(squad.name, microservice.name, scoreToGive, scoreToGive, logHandler.LOG_TYPE.FALCON);
                break;
            case MISSION.HARD.name:
                logHandler.insertLog(squad.name, microservice.name, scoreToGive, scoreToGive, logHandler.LOG_TYPE.HARD);
                break;
            default:
        }
    } catch (err) {
        console.log(err);
    }
};

const updateMissionState = (missionId, missionName, newState) => {
    let myPromise = new Promise(function (resolve, reject) {
        let sqlString = `UPDATE Missions SET state = '${newState}'
            WHERE gameId = ${missionId} AND name = '${missionName}'`;
        debugHandler.insert('missionHandler', sqlString);
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

const getMissionId = (missionName, gameId) => {
    var getMissionIdPromise = new Promise(function (resolve, reject) {
        var sqlstring = "SELECT id from Missions WHERE gameId = " + gameId + " " +
        		"AND name = '" + missionName + "'";

        //let sqlString = `SELECT id from Missions WHERE gameId = ${gameId}
        //    AND name = '${missionName}'`;
        pool.getConnection((err, connection) => {
            if (err) {
                console.log(`Error!`);
                reject(`Error connecting to database: ${JSON.stringify(err)}`);
            } else {
                //console.log(`Connection object: ${JSON.stringify(connection)}`);
                connection.query(sqlstring, (err, result, fields) => {
                    connection.release();
                    if (!err) {
                        resolve(result[0].id);
                    } else {
                        console.log('Database error: ' + err.stack);
                        reject(err);
                    }
                });
            }
        });
    });
    return getMissionIdPromise;
};

const isMissionCompletedByMicroservice = (missionId, microserviceId) => {
    let myPromise = new Promise(function (resolve, reject) {
        let sqlString = `SELECT * FROM MissionsMicroservices
            WHERE microserviceId = ${microserviceId} AND missionId = ${missionId}`;
        pool.getConnection((err, connection) => {
            if (err) {
                console.log(`Error!`);
                reject(`Error connecting to database: ${JSON.stringify(err)}`);
            } else {
                //console.log(`Connection object: ${JSON.stringify(connection)}`);
                connection.query(sqlString, (err, result, fields) => {
                    connection.release();
                    if (!err) {
                        resolve(result.length > 0);
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

const isMissionCompletedBySquad = (missionId, squadId) => {
    let myPromise = new Promise(function (resolve, reject) {
        let sqlString = `SELECT * FROM MissionsMicroservices mm
            INNER JOIN SquadsMicroservices sm ON mm.microserviceId = sm.microserviceId
            INNER JOIN Squads sq on sq.id = sm.squadId
            WHERE squadId = ${squadId} AND missionId = ${missionId}`;
        pool.getConnection((err, connection) => {
            if (err) {
                console.log(`Error!`);
                reject(`Error connecting to database: ${JSON.stringify(err)}`);
            } else {
                //console.log(`Connection object: ${JSON.stringify(connection)}`);
                connection.query(sqlString, (err, result, fields) => {
                    connection.release();
                    if (!err) {
                        resolve(result.length > 0);
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

const getFractionCompleted = (missionId, gameId) => {
    let myPromise = new Promise(function (resolve, reject) {
        let sqlString = `SELECT (SELECT COUNT(DISTINCT squadId) FROM Squads sq
            RIGHT JOIN SquadsMicroservices sm ON sq.id = sm.squadId
            RIGHT JOIN MissionsMicroservices mm ON sm.microserviceId = mm.microserviceId
            WHERE missionId = ${missionId} ) /
            (SELECT COUNT(*) FROM Squads
            WHERE gameId = ${gameId} ) as divisionResult`;
        //debugHandler.insert('missionHandler', sqlString);
        pool.getConnection((err, connection) => {
            if (err) {
                console.log(`Error!`);
                reject(`Error connecting to database: ${JSON.stringify(err)}`);
            } else {
                //console.log(`Connection object: ${JSON.stringify(connection)}`);
                connection.query(sqlString, (err, result, fields) => {
                    connection.release();
                    if (!err) {
                        resolve(result[0].divisionResult);
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

const insertMissionCompleted = (missionId, microserviceId, gameId, score) => {
    let myPromise = new Promise( (resolve, reject) => {
        if (missionId) {
            let sqlstring = "INSERT IGNORE INTO MissionsMicroservices " +
            "(microserviceId, missionId, score) VALUES(" + microserviceId +
            ", " + missionId + ", " + score + ")";
            let sqlString = `INSERT IGNORE INTO MissionsMicroservices
                (microserviceId, missionId, score)
                VALUES (${microserviceId}, ${missionId}, ${score})`;
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
        } else {
            reject(`No mission id`);
        }
    });
    return myPromise;

};
module.exports = {
	missionCompleted : missionCompleted,
	getMissionId : getMissionId,
	updateMissionState : updateMissionState,
	getFractionCompleted : getFractionCompleted,
	MISSION
};
