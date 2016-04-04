var mongoose = require('mongoose');
var Hapi = require('hapi');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;




// Setup our hapi server
var server = new Hapi.Server();
server.connection({ port: 9000 });

server.route({ 
  method: 'GET',
  path: '/getAll',
  handler: function(request, reply) {
    MongoClient.connect("mongodb://localhost/crime-data", function(err, db) {
      database = db;
      if(err) throw err;
      var collection = db.collection('incidents');
      collection.find({ }).toArray(function(err, results) {
        var incidents = [];
        for (var i = 0; i < results.length; i++) {
          var result = results[i];
          var loc = result.loc.coordinates;
          var lat = loc[1];
          var lng = loc[0];
          result.lat = lat;
          result.lng = lng;
          incidents.push(result);
        }
        reply(incidents);
      });
    });
  }
});

server.route({ 
  method: 'GET',
  path: '/getAll/startDate/{startDate}/endDate/{endDate}',
  handler: function(request, reply) {
    MongoClient.connect("mongodb://localhost/crime-data", function(err, db) {
      database = db;
      var startDate = new Date(request.params.startDate);
      var endDate = new Date(request.params.endDate);
      if(err) throw err;
      var collection = db.collection('incidents');
      collection.find({
        dateReported: {
          $gte: startDate,
          $lte: endDate 
        }
      }).toArray(function(err, results) {
        reply(results);
      });
    });
  }
});

server.route({
  method: 'GET',
  path: '/lat/{lat}/lng/{lng}/distance/{distance}',
  handler: function(request, reply) {
    console.log("doing a geo query");
    MongoClient.connect("mongodb://localhost/crime-data", function(err, db) {
      database = db;
      if(err) throw err;

      var collection = db.collection('incidents');
      var lat = parseFloat(request.params.lat);
      var lng = parseFloat(request.params.lng);
      // Limit to 5k
      var distance = parseInt(request.params.distance) <= 5000 ? parseInt(request.params.distance) : 5000;
      
      collection.find({ loc : { $near : { $geometry: { type: 'Point', coordinates: [ lng, lat ]}, $maxDistance: distance }}}).toArray(function(err, results) {
        reply(results);
      });
    });
  }
});


server.route({
  method: 'GET',
  path: '/lat/{lat}/lng/{lng}/distance/{distance}/startDate/{startDate}/endDate/{endDate}',
  handler: function(request, reply) {
    console.log("doing a geo query");
    MongoClient.connect("mongodb://localhost/crime-data", function(err, db) {
      database = db;
      if(err) throw err;

      var collection = db.collection('incidents');
      var lat = parseFloat(request.params.lat);
      var lng = parseFloat(request.params.lng);
      // Limit to 5k
      var distance = parseInt(request.params.distance) <= 5000 ? parseInt(request.params.distance) : 5000;
      var startDate = new Date(request.params.startDate);
      var endDate = new Date(request.params.endDate);
      console.log("Start date: "+startDate+", end date: "+endDate);
/* This works just fine in the mongodb console:
db.incidents.find({ 
  loc : { 
  '$near' : { 
    '$geometry': { 
      type: 'Point', 
      coordinates: [ -115.02346661800036, 36.079411233095  ]
    },
    $maxDistance: 50 }    
  }, 
  dateReported: { 
    $gte: ISODate("2014-12-16T12:52:00Z"), 
    $lte: ISODate("2014-12-17T00:00:00Z") 
  }
}) ;
*/
// This works if I remove the dateCreated section with no other modifications
      collection.find({ 
        loc : { 
          $near : { 
            $geometry: { 
              type: 'Point', 
              coordinates: [ lng, lat ]
            },
            $maxDistance: distance 
          }
        },
        dateReported: {
          $gte: startDate,
          $lte: endDate 
        }
      }).toArray(function(err, results) {
        reply(results);
      });
    });
  }
});



server.start(function() {
  // Run the fetch on startup, so I can restart and get the videos immediately if need be.
  console.log('Server running at ', server.info.uri);
});
