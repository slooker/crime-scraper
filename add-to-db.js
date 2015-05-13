var fs = require('fs');
var request = require('request');
var proj4 = require('proj4');
var mongoose = require('mongoose');
var throng = require('throng');

var fileArg = process.argv[2];
if (fileArg && !fs.existsSync(fileArg)) {
  console.log("File does not exist: "+fileArg);
  process.exit(code=0);
}


mongoose.connect('mongodb://localhost/crime-data');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  //processFile(fileArg);
  if (fileArg) {
    processFile(fileArg);
  } else {
    processJsonFiles();
  }
  // yay!
});

//EPSG 3857, Web Mercator
var projection1 = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
//EPSG 4326, WGS84
var projection2 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

var STUPID_LAT_OFFSET =  0.183167581534754;

/*
{ lat: 36.30995420864732,
  lng: -115.60716270899995,
  date: '2014-09-15T18:41:00',
  description: 'OTHER DISTURBANCE',
  caseNumber: 'LLV140915003099',
  code: 'Disturbing the Peace',
  location: '0 BLOCK HILLTOP CAMPGROUND RD' }
*/ 

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

function processIncident(incident, last) {
  
  var coord = [
    incident["Y"],
    incident["X"]
      ];
  var newCoord = proj4(projection1, projection2, coord);
  // Check if it's already added.
  Incident.find({ caseNumber: incident['CaseNumber'] }, function(err, found) {
    // If not, add it.
    if (err) {
      console.log("Error: "+err);
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
        if (err) return console.error(err);
        console.log('Saved case ' + iModel.code);
      checkLast(last);
      });

    } else {
      //console.log('Already have case '+incident['CaseNumber']);
      checkLast(last);
    }
  });
}

function checkLast(last) {
  if (last) {
    setTimeout(function() {
      mongoose.disconnect();
    }, 2000);
  }
}

function getIncidentsFromFile(fileName) {
  var data = fs.readFileSync(fileName);
  var json = JSON.parse(""+data);
  var incidents = json.incidents;
  return incidents;
}

//var testFile = './json/20140914-20140915.json';
//var incidents = getIncidentsFromFile(testFile);

function processFile(file) {
  var incidents = getIncidentsFromFile(file);
  console.log("Got incidents for "+file);
  for (var i = 0; i < incidents.length; i++) {
    processIncident(incidents[i], i == incidents.length-1);
  }
}

/*
function processJsonFiles() {
  //var files =fs.readdirSync('./json/20140914-20140915.json');
  files = ['./json/20140914-20140915.json'];
  console.log(files);
  for (i in files) {
    var file = files[i];
    processFile(file)
  }
}

*/
