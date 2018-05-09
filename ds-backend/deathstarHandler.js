const pool = require('./databaseHandler');
const log = require('./logHandler');

const
        STATE = {
            STARTED: "STARTED",
            STARTED_DATABASE: "STARTED_DATABASE",
            INITIALIZING: "INITIALIZING",
            SHIELD: "SHIELD",
            FINAL: "FINAL",
            HARD: "HARD",
            FALCON: "FALCON",
            FALCONCALLED: "FALCONCALLED"
        };

var MISSION = {
    // TODO: Update below with better names to reflect the actual missions
    DEPLOY: {
        name: "DEPLOY"
    },
    SCALE: {
        name: "SCALE"
    },
    SHIELD: {
        name: "SHIELD"
    },
    DATABASE: {
        name: "DATABASE"
    },
    ITERATE: {
        name: "ITERATE"
    },
    FALCON: {
        name: "FALCON"
    },
    HARD: {
        name: "HARD"
    }
};

const insertDeathStar = function (startHealth) {
    let myPromise = new Promise((resolve, reject) => {
        let sqlString = `INSERT INTO DeathStars (startHealth, currentHealth, state)
            VALUES(${startHealth}, ${startHealth}, '${STATE.INITIALIZING}')`;

        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (error, result, fields) => {
                connection.release();
                if(!error)
                    resolve(result.insertId);
                else
                    reject(err);
            });
        });
    });
    return myPromise;
};

const updateState = (state, id) => {
    let myPromise = new Promise( (resolve, reject) => {
        //var sqlstring = "UPDATE DeathStars SET " +
        //        "state = '" + state + "' WHERE id = " + id;
        let sqlString = `UPDATE DeathStars SET state = '${state}' WHERE id = ${id}`;

        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (error, result, fields) => {
                connection.release();
                if(!error)
                    resolve(state);
                else
                    reject(err);
            });
        });

    });
    return myPromise;
};

const updateHealth = (gameId, damageToGive) => {
    let myPromise = new Promise((resolve, reject) => {

        let sqlString = `UPDATE DeathStars AS D
            INNER JOIN Games as g on g.deathStarId = D.id
            SET D.currentHealth = D.currentHealth - ${damageToGive}
            WHERE g.id = ${gameId}`;
        /*var sqlstring = "UPDATE DeathStars as D " +
                "INNER JOIN Games as g on g.deathStarId = D.id " +
                "SET D.currentHealth = D.currentHealth - " + damageToGive +
                " WHERE g.id = " + gameId;*/
        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (err, result, fields) => {
                connection.release();
                if (!err) {
                    resolve();
                } else {
                    console.log('Database error: ' + err.stack);
                    reject(err);
                }
            });
        });

    });
    return myPromise;
};

const insertGame = (deathStarId, timeLimit, domains, squads) => {
    let myPromise = new Promise((resolve, reject) => {
        /*var sqlstring = "INSERT INTO Games (endTime, timeLimit, deathStarId, gseDomains)"
                + " VALUES("
                + "NOW() + INTERVAL "
                + timeLimit
                + " MINUTE"
                + ","
                + timeLimit
                + ","
                + deathStarId
                + ",'"
                + JSON.stringify(domains)
                + "')";*/
        let sqlString = `INSERT INTO Games (endTime, timeLimit, deathStarId, gseDomains)
            VALUES(NOW() + INTERVAL + ${timeLimit} MINUTE, ${timeLimit}, ${deathStarId}, '${JSON.stringify(domains)}')`;

        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (err, result, fields) => {
                connection.release();
                if (!err) {
                    resolve(result.insertId);
                } else {
                    console.log('Database error: ' + err.stack);
                    reject(err);
                }
            });
        });
    });
    return myPromise;
};

var insertMissions = function (gameId, timeLimit) {
    let promises = [];
    for (var index in MISSION) {
        var mission = MISSION[index];
        if (timeLimit < 30) {
            // don't abort missions for now
            mission.state = MISSION_STATE.CANCELLED;
        }
        promises.push(insertMission(gameId, mission));
    }
    return Promise.all(promises);
}

const insertMission = (gameId, mission) => {
    let myPromise = new Promise((resolve, reject) => {
        /*var sqlstring = "INSERT INTO Missions (name, gameId)"
                + " VALUES('" + mission.name + "',"
                + gameId + ")";*/
        let sqlString = `INSERT INTO Missions (name, gameId)
            VALUES('${mission.name}', ${gameId})`;

        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (err, result, fields) => {
                connection.release();
                if (!err) {
                    resolve(result.insertId);
                } else {
                    console.log('Database error: ' + err.stack);
                    reject(err);
                }
            });
        });
    });
    return myPromise;
};

var insertSquads = function (gameId, squads) {
    let promises = [];
    for (var index in squads) {
        promises.push(insertSquad(gameId, squads[index]));
    }
    return Promise.all(promises);
};

const insertSquad = (gameId, squad) => {
    let myPromise = new Promise((resolve, reject) => {
        /*var sqlstring = "INSERT INTO Squads (name, gameId, environment, username)"
                + " VALUES('" + squad.name + "'," + gameId + ",'"
                + squad.domain + "','" + squad.username + "')";*/

        let sqlString = `INSERT INTO Squads (name, gameId, environment, username)
            VALUES('${squad.name}', ${gameId}, '${squad.domain}', '${squad.username}')`;

        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (err, result, fields) => {
                connection.release();
                if (!err) {
                    resolve(result.insertId);
                } else {
                    console.log('Database error: ' + err.stack);
                    reject(err);
                }
            });
        });
    });
    return myPromise;
};

const getCurrentGame = function () {
    return new Promise((resolve, reject) => {
        let sqlString = `
            SELECT *,
            games.id AS gameId,
            deathstars.id AS deathstarId
            FROM DeathStars deathstars
            INNER JOIN Games games
            ON deathstars.id = games.deathStarId
            ORDER BY games.id DESC LIMIT 1;`;
        pool.getConnection( (err, connection) => {
            if(err) {
                console.log(`Error!`);
                reject(`Error connecting to database: ${JSON.stringify(err)}`);
            } else {
                //console.log(`Connection object: ${JSON.stringify(connection)}`);
                connection.query(sqlString, (err, result, fields) => {
                    connection.release();
                    if (!err) {

                        resolve(result[0]);
                    } else {
                        console.log('Database error: ' + err.stack);
                        reject(err);
                    }
                });
            }
        });
    });
};

const getDeathstarForGame = function (gameId) {
    return new Promise((resolve, reject) => {
        let sqlString = `
            SELECT *,
            games.id AS gameId,
            deathstars.id AS deathstarId
            FROM DeathStars deathstars
            INNER JOIN Games games
            ON deathstars.id = games.deathStarId
            WHERE games.id = ` + gameId;
        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (err, result, fields) => {
                connection.release();
                if (!err) {
                    resolve(result);
                } else {
                    console.log('Database error: ' + err.stack);
                    reject(err);
                }
            });
        });
    });
};

var getDeathstar = function (id) {
    let myPromise = new Promise((resolve, reject) => {
        let sqlString = `SELECT * from DeathStars WHERE id = ${id}`;
        pool.getConnection( (err, connection) => {
            if(err)
                reject(`Error connecting to database: ${JSON.stringify(err)}`);

            connection.query(sqlString, (err, result, fields) => {
                connection.release();
                if (!err) {
                    resolve(result[0]);
                } else {
                    console.log('Database error: ' + err.stack);
                    reject(err);
                }
            });
        });
    });
    return myPromise;
};

module.exports = {
    insertDeathStar: insertDeathStar,
    insertGame: insertGame,
    updateState: updateState,
    updateHealth: updateHealth,
    insertMissions: insertMissions,
    insertSquads: insertSquads,
    getDeathstarForGame: getDeathstarForGame,
    getCurrentGame: getCurrentGame,
    getDeathstar: getDeathstar,
    STATE: STATE
};
