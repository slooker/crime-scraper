var request = require('request')
var moment = require('moment');
var fs = require('fs');
var mongoose = require('mongoose');
var proj4 = require('proj4');

var baseUrl = 'http://www.crimemapping.com/GetIncidents.aspx?ccs=AR,AS,BU,DP,DR,DU,FR,HO,VT,RO,SX,TH,VA,VB,WE&xmin=-12947729.10131329&ymin=4311100.214514539&xmax=-12656809.771659799&ymax=4372096.963086132&'
var daysToRun = 3;

//mongoose.connect('mongodb://localhost/crime-data-test');
mongoose.connect('mongodb://localhost:27017/crime-data');

var incidentSchema = mongoose.Schema({
  agency: String,
  lat: String,
  lng: String,
  dateReported: Date,
  description: String,
  caseNumber: String,
  code: String,
  area: String,
  loc: {
    type: { type: String },
    coordinates: [Number]
  }
});
var Incident = mongoose.model('Incident', incidentSchema);

Incident.find({ caseNumber: 'LLV140915001930'}, function(err, found) {
  console.log(err);
  console.log(found);
  
  
});


//EPSG 3857, Web Mercator
var projection1 = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
//EPSG 4326, WGS84
var projection2 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

var STUPID_LAT_OFFSET =  0.183167581534754;

for (var i = 0; i < daysToRun; i++) {
  var momentStart = moment().subtract(i+1, 'day');
  var startDate = momentStart.format('MM/DD/YYYY+00:00:00');
  var startFileDate = momentStart.format('YYYYMMDD');
  var momentEnd = moment().subtract(i, 'day');
  var endDate = momentEnd.format('MM/DD/YYYY+23:59:00');
  var endFileDate = momentEnd.format('YYYYMMDD');
  var dateUrl = "db="+startDate+"&de="+endDate;
  var filename = "json/"+startFileDate+"-"+endFileDate+".json";
  var url = baseUrl + dateUrl;

  fetchData(url, filename);
}

function fetchData(url, filename, i, callback) {
  request({
    url: url,
    json: true,
  }, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      fs.exists(filename, function(exists) {
        if (!exists) {
          fs.writeFile(filename, JSON.stringify(body), { flags: 'wx' }, function(error) {
            if (error) {
              console.log("Error writing file: "+filename);
            } else {
              console.log("Wrote file: "+filename);
            }
          });
        } else {
          console.log("Skipping existing file: "+filename);
        }
      });
      var incidents = body.incidents;
      for (var i in incidents) {
        processIncident(incidents[i]);
      }
      console.log("Processed "+incidents.length);
    }
  });
}

function processIncident(incident) {
  var coord = [
    incident["Y"],
    incident["X"]
      ];
  var newCoord = proj4(projection1, projection2, coord);
  // Check if it's already added.
  Incident.find({ caseNumber: incident.CaseNumber }, function(err, found) {
    // If not, add it.
    if (err) {
      console.log("Error finding incident: "+err);
    } else if (found && found.length == 0) {
      // Create the incident
      var lat = newCoord[1] - STUPID_LAT_OFFSET;
      var lng = newCoord[0];

      var object = {
        'agency': incident['AgencyName'],
        'dateReported': incident['DateReported'],
        'description': incident['Description'],
        'caseNumber': incident['CaseNumber'],
        'code': incident['CrimeCode'],
        'area': incident["Location"],
        'loc': {
          'type': 'Point',
          'coordinates': [ lng, lat ],
        }
      };
      
      var iModel = new Incident({
        'agency': incident['AgencyName'],
        'dateReported': incident['DateReported'],
        'description': incident['Description'],
        'caseNumber': incident['CaseNumber'],
        'code': incident['CrimeCode'],
        'area': incident["Location"],
        'loc': {
          'type': 'Point',
          'coordinates': [ lng, lat ],
        }
      });
      // Save the model
      iModel.save(function(err, iModel) {
        if (err) { 
          console.log("Error saving model: "+err);
        }
        console.log('Saved case ' + iModel.code);
      });
    }
  });
}

