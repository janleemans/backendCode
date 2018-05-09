var missionHandler = require('./missionHandler');
var deathstar = require('./deathstarHandler');
var microservices = require('./microserviceHandler');
var squads = require('./squadsHandler');
const debugHandler = require('./debugHandler');

var array = [];

const incomingFire = async (squadName, microserviceName, type) => {
	console.log('Incoming fire from ' + squadName + ', ' + microserviceName);
        debugHandler.insert('incomingHandler', 'Incomingfire' );
    try {
        let gameId = (await deathstar.getCurrentGame()).id;
        let ms = (await microservices.getMicroserviceByGameAndName(gameId, microserviceName, squadName))[0];
				let sq = (await squads.getSquadByUserName(gameId, ms.userName, ms.environment))[0];
				console.log(`Incoming fire from squad: ${JSON.stringify(sq)} and microservice is: ${JSON.stringify(ms)}`);

        let result = missionHandler.missionCompleted(type, ms, sq, gameId);
        return result;
    } catch(e) {
        console.log(e);
    }
};

const incomingMinigun = async(params) => {
	//debugHandler.insert('incomingHandler', 'Incoming minigun' );
	var insert = {
			'microservice' :  params.microserviceName,
			'squad' : params.squadName,
			'y' : params.y.replace('y','')
	};
	var count = 0;

	for (var i in array) {
		if (JSON.stringify(array[i]) === JSON.stringify(insert)) {
			console.log('Already hit!');
			return;
		}
		if (array[i].microservice === insert.microservice
				&& array[i].squad === insert.squad
				&& insert.y >= 0 && insert.y < 10) {
			count++;
		}
	}
	console.log('Count is: ' + count);
	array.push(insert);

	if (count == 9) {
		debugHandler.insert('incomingHandler', 'Mission completed');

        try {
            let gameId = (await deathstar.getCurrentGame()).id;
            let microservice = (await microservices.getMicroserviceByGameAndName(gameId, params.microserviceName, params.squadName))[0];
            let squad = (await squads.getSquadByUserName(gameId, microservice.userName, microservice.environment))[0];

            return missionHandler.missionCompleted(missionHandler.MISSION.ITERATE, microservice, squad, gameId);
        } catch(e) {
            console.log(e);
        }
    }
}


module.exports = {
    incomingFire : incomingFire,
    incomingMinigun : incomingMinigun
};
