require 'net/http'
require 'date'

now = Date.today;
dateFormat = "%-m/%d/%Y"
fileDateFormat = "%Y%m%d"

baseUrl = 'http://www.crimemapping.com/GetIncidents.aspx?ccs=AR,AS,BU,DP,DR,DU,FR,HO,VT,RO,SX,TH,VA,VB,WE&xmin=-12947729.10131329&ymin=4311100.214514539&xmax=-12656809.771659799&ymax=4372096.963086132&'

def fetchData(url, filename) 
  uri = URI.parse(url)
  req = Net::HTTP::Get.new(uri.to_s)
  res = Net::HTTP.start(uri.host, uri.port) { |http|
    http.request(req)
  }
  File.open(filename, 'w') { |file| file.write(res.body) }
end

for i in 1 .. 20
#for i in 1 .. 3
  startDate = (now - i).strftime(dateFormat) + '+00:00:00'
  endDate = (now - i + 1).strftime(dateFormat) + '+23:59:00'
  dateUrl = "db=#{startDate}&de=#{endDate}"
  url = "#{baseUrl}#{dateUrl}"

  filename = "json/#{(now - i).strftime(fileDateFormat)}-#{(now - i + 1).strftime(fileDateFormat)}.json"
  if !File.exist?(filename) 
    fetchData(url, filename)
    system('node add-to-db.js '+filename);
  end

end


