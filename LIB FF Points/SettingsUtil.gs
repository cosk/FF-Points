function getRankPoints() {
  return getPointMap("RankPoints");
}

function getFcRankPoints() {
  return getPointMap("FcRankPoints");
}

function getActionPoints() {
  return getPointMap("ActionPoints");
}

function getRanksAndPoints() {
  return SpreadsheetApp.getActiveSpreadsheet().getRangeByName("RankPoints").getValues();
}

function getPointMap(rangeName) {
  var range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(rangeName);
  return getMapFromRange(range);
}

function getArchiveAfter() {
  var sArchiveAfter = SpreadsheetApp.getActiveSpreadsheet().getRangeByName("ArchiveAfter").getValue();
  return parseInt(sArchiveAfter);
}

function XpPointsProvider() {
  this.xpCode = [];
  var actionPoints = getActionPoints();
  for ( var code in actionPoints ) {
    var match = code.match(/^XP(\d+)m$/i);
    if ( match == null )
      continue;
    this.xpCode.push([parseInt(match[1])*1000000, code]);
  }

  this.getCode = function(xp) {
    var bestCode = null;
    var bestXp = 0;
    for ( var i in this.xpCode ) {
      var xpi = this.xpCode[i][0];
      if ( xp >= xpi && xpi > bestXp ) {
        bestXp = xpi;
        bestCode = this.xpCode[i][1];
      }
    }
    return bestCode;
  }
}
