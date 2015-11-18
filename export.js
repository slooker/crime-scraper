var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;


var Incident = function(json) {
  return {
    agency: json.agency,
    dateReported: json.dateReported,
    description: json.description,
    caseNumber: json.caseNumber,
    code: json.code,
    area: json.area,
    lat: json.loc.coordinates[1],
    lng: json.loc.coordinates[0]
  };
}


function generateList(callback) {
  MongoClient.connect("mongodb://localhost/crime-data", function(err, db) {
    database = db;
    if(err) throw err;

    var collection = db.collection('incidents');
    var returnList = [];

    collection.find({}).toArray(function(err, results) {
      results.forEach(function(row) {
        returnList.push(Incident(row));
        if (results.length === returnList.length) {
          callback(returnList);
          db.close();
        }
      });
    });
  });
}

function toCSV(results) {
  var csvIncidents;

  results.forEach(function(row) {
    var values = [];
    for (var key in row) {
      values.push(row[key]);
    }
    csvIncidents += values.join(',')  + "\n";
  });
  return csvIncidents;

}

generateList(function(results) {
  console.log(toCSV(results));
});
