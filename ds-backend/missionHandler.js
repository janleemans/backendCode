const pool = require('./databaseHandler');
const deathstar = require('./deathstarHandler');
const logHandler = require('./logHandler');
const spy = require('./spyHandler');
const debugHandler = require('./debugHandler');

const
  MISSION = {
    DEPLOY: {
      name: "DEPLOY",
      maxScore: 100
    },
    SCALE: {
      name: "SCALE",
      maxScore: 100
    },
    SHIELD: {
      name: "SHIELD",
      maxScore: 300
    },
    DATABASE: {
      name: "DATABASE",
      maxScore: 500
    },
    ITERATE: {
      name: "ITERATE",
      maxScore: 500
    }
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

    let scoreToGive = mission.maxScore;
    console.log(`Yes. Inserting mission complete: ${missionId} ${microservice.id} ${gameId} ${scoreToGive}`)
    insertMissionCompleted(missionId, microservice.id, gameId, scoreToGive);
    deathstar.updateHealth(gameId, scoreToGive); // LINUSTODO: What to do?
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
      default:
    }
  } catch (err) {
    console.log(err);
  }
};

const getCompletedMissionsCount = (microserviceId, gameId) => {
  var getMissionsCountPromise = new Promise(function(resolve, reject) {
    var sqlstring = "SELECT COUNT(*) as count FROM MissionsMicroservices INNER JOIN Missions ON missionId=id where microserviceId = " +
      microserviceId + " AND gameId = '" + gameId + "'";

    pool.getConnection((err, connection) => {
      if (err) {
        console.log(`Error!`);
        reject(`Error connecting to database: ${JSON.stringify(err)}`);
      } else {
        connection.query(sqlstring, (err, result, fields) => {
          connection.release();
          if (!err) {
            resolve(result[0].count);
          } else {
            console.log('Database error: ' + err.stack);
            reject(err);
          }
        });
      }
    });
  });
  return getMissionsCountPromise;
};

const getMissionId = (missionName, gameId) => {
  var getMissionIdPromise = new Promise(function(resolve, reject) {
    var sqlstring = "SELECT id from Missions WHERE gameId = " + gameId + " " +
      "AND name = '" + missionName + "'";

    pool.getConnection((err, connection) => {
      if (err) {
        console.log(`Error!`);
        reject(`Error connecting to database: ${JSON.stringify(err)}`);
      } else {
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
  let myPromise = new Promise(function(resolve, reject) {
    let sqlString = `SELECT * FROM MissionsMicroservices
            WHERE microserviceId = ${microserviceId} AND missionId = ${missionId}`;
    pool.getConnection((err, connection) => {
      if (err) {
        console.log(`Error!`);
        reject(`Error connecting to database: ${JSON.stringify(err)}`);
      } else {
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

const insertIntoHallOfFame = (microserviceId, gameId, microserviceName, minutesCompleted) => {
  let myPromise = new Promise((resolve, reject) => {
    let sqlString = `INSERT IGNORE INTO HallOfFame
                (microserviceId, gameId, name, minutesCompleted)
                VALUES (${microserviceId}, ${gameId}, "${microserviceName}", ${minutesCompleted})`;
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

};

const insertMissionCompleted = (missionId, microserviceId, gameId, score) => {
  let myPromise = new Promise((resolve, reject) => {
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

const getHallOfFame = (gameId) => {
    let myPromise = new Promise((resolve, reject) => {
      let sqlString = `SELECT * FROM HallOfFame WHERE gameId = ${gameId}`;
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

};

module.exports = {
  missionCompleted: missionCompleted,
  getMissionId: getMissionId,
  getCompletedMissionsCount: getCompletedMissionsCount,
	insertIntoHallOfFame : insertIntoHallOfFame,
	getHallOfFame: getHallOfFame,
  MISSION
};
