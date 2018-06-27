var deathstar = require('./deathstarHandler');
var microservices = require('./microserviceHandler');
var request = require('request');
var fs = require('fs');
var AdmZip = require('adm-zip');
var http = require('https');
var url = require('url');

function getLogs(options) {
  let appName = options.name;
  let index = options.index;
  let myPromise = new Promise((resolve, reject) => {
      microservices.getMicroserviceByName(appName)
        .then(rows => {
            deathstar.getCurrentGame()
              .then(game => {
                  if (game) {
                    var JSONDomains = JSON.parse(game.gseDomains);
                    JSONDomains.forEach(domain => {
                        if (domain.name === rows[0].environment) {
                          let credentials = Buffer.from(domain.auth.substring(5), 'base64').toString('ascii').split(':');
                          var username = credentials[0];
                          var password = credentials[1];
                          console.info(password);

                          var options = {
                            method: 'GET',
                            url: 'https://uscom-east-1.storage.oraclecloud.com/auth/v1.0',
                            headers: {
                              'X-Storage-User': 'Storage-' + domain.gseDomain + ':' + username,
                              'X-Storage-Pass': password
                            }
                          };

                          callback = function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                              var token = response.headers['x-auth-token'];
                              console.info(token);
                              var options = {
                                method: 'GET',
                                url: 'https://uscom-east-1.storage.oraclecloud.com/v1/Storage-' + domain.gseDomain +
                                  '/_apaas?prefix=' + appName + '&limit=' + (parseInt(index) + 1) + '&format=json',
                                headers: {
                                  'X-Auth-Token': token
                                }
                              };
                              console.info('URL is ' + options.url);
                              var callback = function(error, response, body) {

                                if (!error && response.statusCode == 200) {
                                  var body = JSON.parse(body);
                                  console.info('Take number ' + (body.length - 1));
                                  var log = body[body.length - 1]
                                  var urlString = 'https://uscom-east-1.storage.oraclecloud.com/v1/Storage-' + domain.gseDomain +
                                    '/_apaas/' + log.name;
                                  var options = {
                                    method: 'GET',
                                    port: "443",
                                    host: url.parse(urlString).host,
                                    path: url.parse(urlString).path,
                                    headers: {
                                      'X-Auth-Token': token
                                    }
                                  };
                                  console.info(options.host);

                                  http.get(options, function(res) {
                                    console.info('Got response');

                                    var data = [],
                                      dataLen = 0;

                                    res.on('data', function(chunk) {
                                      data.push(chunk);
                                      dataLen += chunk.length;
                                    }).on('end', function() {
                                      var buf = new Buffer(dataLen);

                                      for (var i = 0, len = data.length, pos = 0; i < len; i++) {
                                        data[i].copy(buf, pos);
                                        pos += data[i].length;
                                      }

                                      var zip = new AdmZip(buf);
                                      var zipEntries = zip.getEntries();
                                      var jsonObject = {
                                        date: log['last_modified'],
                                        logContent: zip.readAsText(zipEntries[0])
                                      }
                                      resolve(jsonObject);

                                    });
                                  });
                                }
                              }
                            request(options, callback);
                          }
                        };

                        request(options, callback);
                      }

                    });
                }
              });
        });
  });
return myPromise;
}


module.exports = {
  getLogs: getLogs
};
