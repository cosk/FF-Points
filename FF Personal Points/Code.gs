function doGet(req) {
  if ( req.parameters.page == "points" ) {
    var points = new Points(rsn);
    var template = HtmlService.createTemplateFromFile("PointsUI");
    template.rsn = rsn;
    template.totalPoints = points.totalPoints;
    return template.evaluate()
    .setTitle('Fish Flingers Points for ' + rsn)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  }
//  var resetCode = "75362";
//  if ( req.parameters.reset == resetCode ) {
//    RSN.reset();
//  }
  var rsn = RSN.get();
  if ( rsn == null || rsn=="" ) {
    return enterRSNTemplate();
  }
  
  return getPointsTemplate(rsn);
}

function enterRSNTemplate(msg) {
  var template = HtmlService.createTemplateFromFile('EnterRSN');
  template.message = msg;
  return template.evaluate()
  .setTitle('Fish Flingers Personal Points')
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function processRSN(f) {
  var rsn = f.RSN.trim();
  if ( rsn=="" )
    return;
  
  var points = getPoints(RSN.get());
  if ( points.totalPoints!=null && rsn.toLowerCase() != RSN.get().toLowerCase() ) {
    throw "RuneScape name is already set to " + RSN.get();
  }
  
  RSN.set(rsn);
  
  return getPointsTemplate(rsn).getContent();
}

function getPointsTemplate(rsn) {
  var points = getPoints(rsn);
  if ( points.totalPoints == null ) {
    RSN.reset();
    return enterRSNTemplate(rsn + " was not found in the clan list");
  }
  
  var numbersRe = /^\d+$/;
  for ( var i in points.log ) {
    if ( points.log[i].code.substr(0,2).toLowerCase() == "xp" ) {
      var xpGain = points.log[i].comment;
      if ( xpGain!=null && numbersRe.test(xpGain) ) {
        points.log[i].comment = "Gained " + numberWithCommas(xpGain) + " XP";
      }
    }
  }
  
  var totalPoints = parseInt(points.totalPoints);
  var nextRank;
  var pointsToNextRank;
  for ( var i in points.rankPoints ) {
    var rankPoints = parseInt(points.rankPoints[i][1]);
    var diff = rankPoints - totalPoints;
    if ( diff > 0 ) {
      if ( pointsToNextRank==null || pointsToNextRank>diff ) {
        pointsToNextRank = diff;
        nextRank = points.rankPoints[i][0];
      }
    }
  }
  
  var template = HtmlService.createTemplateFromFile("PointsUI");
  template.rsn = rsn;
  template.totalPoints = points.totalPoints;
  template.log = points.log;
  template.nextRank = nextRank;
  if ( nextRank != null ) {
    template.pointsToNextRank = numberWithCommas(pointsToNextRank);
  }
  
  return template.evaluate()
  .setTitle('Fish Flingers Points for ' + rsn)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function getPoints(rsn) {
  var uuu = "https://script.google.com/macros/s/AKfycbw7O23jOYxPVDmlG_44PhTeGauPfSiI9dK5ZK1NHa5NYUDlNuU/exec";
  var response = UrlFetchApp.fetch(uuu + "?rsn=" + rsn);
  var responseCode = response.getResponseCode();
  if ( responseCode != 200  )
    throw "Error fetching points for " + rsn + ".  Response code = " + responseCode;

  return JSON.parse(response.getContentText());
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
