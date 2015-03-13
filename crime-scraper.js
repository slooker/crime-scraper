var fs = require('fs');
var request = require('request');
var nano = require('nano')('http://localhost:5984');
var proj4 = require("proj4");


var crimes = nano.db.use('crimes');

//EPSG 3857, Web Mercator
var projection1 =
    "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
//EPSG 4326, WGS84
var projection2 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";




var url = "http://www.crimemapping.com/GetIncidents.aspx?ccs=AR,AS,BU,DP,DR,DU,FR,HO,VT,RO,SX,TH,VA,VB,WE&xmin=-12829318.088623248&ymin=4311636.276208027&xmax=-12792628.315046415&ymax=4323827.982219496";

url += "&db=3/02/2015+00:00:00&de=3/08/2015+23:59:00";


request(url, function(error, response, data) {
  var json = JSON.parse(data);
  if (!error) {
    for (var i = 0; i < json["incidents"].length; i++) {
      var incident = json["incidents"][i];
      var coord = [
        incident["X"],
        incident["Y"]
      ];
      var newCoord = proj4(projection1, projection2, coord);
      console.log("Converted " + coord + " to " + newCoord);
    }

    /* X: 4325070.69838978
     * Y: -12817179.37470610
     * 36.177490, -115.138909
     */

    /*
       X: 4323802.55813974,
       Y: -12817139.5219945 
       36.177756, -115.140068
     */



  } else {
    console.log("Error: "+error);
  }
})

