function doGet(req) {
  var rsnLower = req.parameters.rsn.toString().toLowerCase();
  var p = {};
  var points = SheetProvider.getPoints().getDataRange().getValues();
  for ( var i = 1 ; i < points.length ; ++i ) {
    if ( points[i][0].toLowerCase() == rsnLower ) {
      p.totalPoints = points[i][3];
    }
  }

  var settings = SheetProvider.getSettings().getDataRange().getValues();
  var descriptions = {};
  for ( var i = 1 ; i < settings.length ; ++i ) {
    var key = settings[i][0];
    var value = settings[i][2];
    if ( key!=null && key.trim()!="" && value!=null && value.trim()!="" ) {
      descriptions[key.trim().toLowerCase()] = value.trim();
    }
  }
  
  var log = SheetProvider.getLog().getDataRange().getValues();
  var records = [];
  for ( var i in log ) {
    if ( log[i][1].toLowerCase() != rsnLower )
      continue;
    var record = {};
    record.timestamp = log[i][0];
    record.points = log[i][2];
    record.code = log[i][3];
    record.count = log[i][4];
    record.comment = log[i][5];
    record.description = descriptions[record.code.trim().toLowerCase()];
    records.push(record);
  }
  
  p.log = records;
  
  var rankPoints = SheetProvider.getSpreadsheet().getRangeByName("RankPoints").getValues();
  p.rankPoints = rankPoints;
  
  return ContentService.createTextOutput(JSON.stringify(p))
    .setMimeType(ContentService.MimeType.JSON);
}
