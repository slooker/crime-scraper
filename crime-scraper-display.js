var fs = require('fs');
var request = require('request');
var proj4 = require('proj4');
var hogan = require('hogan');
var Hapi = require('hapi');

// Setup our hapi server
var server = new Hapi.Server();
server.connection({ port: 8090 });

//EPSG 3857, Web Mercator
var projection1 = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
//EPSG 4326, WGS84
var projection2 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

var url = "http://www.crimemapping.com/GetIncidents.aspx?ccs=AR,AS,BU,DP,DR,DU,FR,HO,VT,RO,SX,TH,VA,VB,WE&xmin=-12829318.088623248&ymin=4311636.276208027&xmax=-12792628.315046415&ymax=4323827.982219496";

url += "&db=3/02/2015+00:00:00&de=3/08/2015+23:59:00";

//url = 'http://www.crimemapping.com/GetIncidents.aspx?db=3/07/2015+00:00:00&de=3/13/2015+23:59:00&ccs=AR,AS,BU,DP,DR,DU,FR,HO,VT,RO,SX,TH,VA,VB,WE&xmin=-12807442.169426344&ymin=4314356.456342557&xmax=-12806295.614001911&ymax=4314684.896698516'
url = 'http://www.crimemapping.com/GetIncidents.aspx?db=3/07/2015+00:00:00&de=3/13/2015+23:59:00&ccs=AR,AS,BU,DP,DR,DU,FR,HO,VT,RO,SX,TH,VA,VB,WE&xmin=-12826208.05703488&ymin=4322096.205797401&xmax=-12807863.170246463&ymax=4327351.251492';

var locations = [];
var STUPID_LAT_OFFSET =  0.183167581534754;


function populateLocations() {
  request(url, function(error, response, data) {
    var json = JSON.parse(data);
    if (!error) {
      for (var i = 0; i < json["incidents"].length; i++) {
      //for (var i = 0; i < 3; i++) {
        var incident = json["incidents"][i];
        var coord = [
          incident["Y"],
          incident["X"]
        ];
        var newCoord = proj4(projection1, projection2, coord);
        var prettyIncident = {
          'lat':  newCoord[1] - STUPID_LAT_OFFSET,
          'lng': newCoord[0],
          'date': incident['DateReported'],
          'description': incident['Description'],
          'caseNumber': incident['CaseNumber'],
          'code': incident['CrimeCode'],
          'location': incident["Location"]
        };

        locations.push(prettyIncident);
      }
    } else {
      console.log("Error: "+error);
    }
  });
}

server.route({ 
  method: 'GET',
  path: '/crimeLocations.json',
  handler: function(request, reply) {
    reply(locations);
  }
});
  

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    var testFile = fs.readFileSync('template.hbs').toString();
    var testTemplate = hogan.compile(testFile); 
    var html = testTemplate.render({locations: JSON.stringify(locations)});
    reply(html)
  }
});

server.start(function() {
  // Run the fetch on startup, so I can restart and get the videos immediately if need be.
  console.log('Server running at ', server.info.uri);
  populateLocations();
});
