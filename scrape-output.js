var request = require("request")

function getDate(date, dateType) {
  if (dateType == 'file') {
  return date.getFullYear() + '' +
         ('0' + (date.getMonth()+1)).slice(-2) + '' + 
         ('0' + date.getDate()).slice(-2);
  } 
  return ('0' + (date.getMonth()+1)).slice(-2) + '/' +
         ('0' + date.getDate()).slice(-2) + '/' +
         date.getFullYear();



}
var baseUrl = 'http://www.crimemapping.com/GetIncidents.aspx?ccs=AR,AS,BU,DP,DR,DU,FR,HO,VT,RO,SX,TH,VA,VB,WE&xmin=-12947729.10131329&ymin=4311100.214514539&xmax=-12656809.771659799&ymax=4372096.963086132&'

  var now = new Date();
for (var i = 1; i < 3; i++) {
  var date = now;
  console.log("I is "+i);
  var days = now.getDate() - i - 1;
  console.log("days : "+days);
  date.setDate(days);
  console.log(date);

  var startDate = getDate(date)+'+00:00:00';
  var startFileDate = getDate(date, 'file');
  console.log("Startdate: "+startDate);

  date.setDate(days + 1);
  console.log(now.getDate() - i + 1);
  var endDate = getDate(date)+'+23:59:00';
  var endFileDate = getDate(date, 'file');
  console.log("Enddate: "+endDate);

//  var dateUrl = "db="+startDate+"&de="+endDate;
//  console.log("dateUrl: "+dateUrl);
//  var url = baseUrl + dateUrl;
//  console.log("Url: "+url);
//
//  var filename = "json/"+startFileDate+"-"+endFileDate+".json";
//  console.log("Filename: "+filename);

  //fetchData(url, filename);
  




}

function fetchData(url, filename) {
  request({
    url: url,
    json: true,
  }, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body);
    }
  });

}
//  filename = "json/#{(now - i).strftime(fileDateFormat)}-#{(now - i + 1).strftime(fileDateFormat)}.json"
//  puts "Filename: #{filename}"
//  if !File.exist?(filename) 
//    #fetchData(url, filename)
//    #system('node add-to-db.js '+filename);
//  end
//
//end
//
//def fetchData(url, filename) 
//  uri = URI.parse(url)
//  req = Net::HTTP::Get.new(uri.to_s)
//  res = Net::HTTP.start(uri.host, uri.port) { |http|
//    http.request(req)
//  }
//  File.open(filename, 'w') { |file| file.write(res.body) }
//end
