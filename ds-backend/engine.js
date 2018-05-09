var http = require('https');
var request = require('request');

var db = require('./databaseHandler');
var squads = require('./squadsHandler');
var microservices = require('./microserviceHandler');
var squadsMicroservicesHandler = require('./squadsMicroservicesHandler');
var missionHandler = require('./missionHandler');
var deathstar = require('./deathstarHandler');
var debugHandler = require('./debugHandler');

var fs = require('fs');
var myLogFileStream = fs.createWriteStream('engine-log.txt');

var myConsole = new console.Console(myLogFileStream, myLogFileStream);

module.exports = {
  // this will run every minute to update all microservices in the DB
  // and update the state of the game if needed
  update: function() {
    deathstar.getCurrentGame()
      .then(game => {
        if (game) {
          deathstar.getDeathstar(game.deathStarId)
            .then(deathstarObj => {
              if (!(deathstarObj.state == deathstarObj.state.INITIALIZING)) {
                pollDomains(game);
              }
            });
        }
      });
  }
};

/**
 * Queries all the domains that are belonging to the different squads.
 */
function pollDomains(game) {
  var JSONDomains = JSON.parse(game.gseDomains);

  JSONDomains.forEach(domain => {
		var options = {
			method: 'GET',
      url: 'https://' + domain.host + '/paas/service/apaas/api/v1.1/apps/' + domain.name + '?outputLevel=verbose',
      headers: {
        'Authorization': domain.auth,
        'X-ID-TENANT-NAME': domain.name
      }
    };

    callback = function(error, response, body) {

      if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);

        updateMicroservicesForDomain(info, game.id);
      }
    };

    request(options, callback);
  });

}

/**
 * Loops through all microservices found for a domain
 */
function updateMicroservicesForDomain(JSONObject, gameId) {
  JSONObject.applications.forEach(app => {
    microservices.getMicroservice(gameId, app.name, app.identityDomain, app.lastestDeployment.deploymentInfo.uploadedBy)
      .then(rows => updateMicroservice(rows, app, gameId));
  });
}

/**
 * Analyzes a particular microservice in the domain and compares it with
 * the respective microservice in the database.
 */
function updateMicroservice(rows, microservice, gameId) {
  var dbMicroservice = rows[0];
  if (dbMicroservice && dbMicroservice.name === microservice.name) {
    // microservice exists, let's see if it should be updated
    if (dbMicroservice.instances === microservice.lastestDeployment.processes[0].quantity) {

    } else if (microservice.lastestDeployment.processes[0].quantity === 2) {
      // user has scaled up to 2 instances, this mean the the user
      // completed the Scale Mission.
      microservices.updateMicroservice(microservice, dbMicroservice.id);
      squads.getSquadByUserName(gameId, dbMicroservice.userName, dbMicroservice.environment)
        .then(data => missionHandler.missionCompleted(missionHandler.MISSION.SCALE, dbMicroservice, data[0], gameId));
    } else {
      // scaling has changed but don't gives points, just update
      microservices.updateMicroservice(microservice, dbMicroservice.id);
    }
    // did it complete all the missions? If so we should add it to the Hall of getDeathstarForGame
    missionHandler.getCompletedMissionsCount(gameId, dbMicroservice.id)
      .then(data => {
        if (data === Object.keys(missionHandler.MISSION).length) {
          // we did it, add to hall of fame!
          var creationTime = new Date(microservice.creationTime);
          var lastModifiedTime = new Date(microservice.lastModifiedTime);
          var minuteDifference = Math.ceil((lastModifiedTime.getTime() - creationTime.getTime()) / 60000);
          console.log('YAAY! Finished in ' + minuteDifference + " minutes!");


          missionHandler.addToHallOfFame()
        }
      })
  } else {
    // microservice does not exist in DB, let's insert it
    microservices.insertMicroservice(microservice, gameId)
      // our microservice is inserted on then clause, but it
      // requires a mapping to it's associated squad.
      // first obtain the id of this microservice.
      .then(() => microservices.getMicroservice(
        gameId, microservice.name, microservice.identityDomain, microservice.lastestDeployment.deploymentInfo.uploadedBy))
      // response is the result of a promise holding the rows
      // object.
      .then(response => {
        debugHandler.insert('Engine', 'Received row from database: ' + JSON.stringify(response));
        let row = response[0];
        let microserviceId = row.id;
        let username = row.userName;
        let environment = row.environment;
        let squad;
        squads.getSquadByUserName(gameId, username, environment)
          .then(data => {
            squad = data[0];
            return squadsMicroservicesHandler.insertSquadMicroservice(squad.id, microserviceId);
          }, (err) => debugHandler.insert('Engine', "Couldn't find squad ID for: " + username))
          .then(() => missionHandler.missionCompleted(missionHandler.MISSION.DEPLOY, row, squad, gameId));
      });

  }
}