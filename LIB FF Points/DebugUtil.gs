function logSheetIds() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for ( var sheetIndex in sheets ) {
    var sheet = sheets[sheetIndex];
    var id = sheet.getSheetId();
    var name = sheet.getSheetName();
    Logger.log(id + ": " + name);
  }
}

function initDatesOnXp() {
  var sheet = SheetProvider.getPoints();
  var numRows = sheet.getDataRange().getNumRows();
  var headerRange = sheet.getRange(1,5,1,1);
  var xpRange = sheet.getRange(2,5,numRows-1,1);
  var dates = createArray(["2015/4/6"], numRows-1);
  xpRange.setNotes(dates);
  headerRange.clearNote();
}

function copyDataFromLive() {
  var liveSs = getLiveSpreadsheet();
  if ( liveSs.getId() == SpreadsheetApp.getActive().getId() )
    throw "Cannot copy data to live spreadsheet";
  for ( var i in liveSs.getSheets() ) {
    var liveSheet = liveSs.getSheets()[i];
    var mySheet = getSheetById(liveSheet.getSheetId());
    if ( liveSheet == mySheet )
      throw "Cannot copy data to live spreadsheet";
    if ( SheetProvider.isReconcileClan(mySheet) || SheetProvider.isRanks(mySheet) ) {
//      mySheet.getDataRange().clearDataValidations();
      continue;
    }
    var liveData = liveSheet.getDataRange();
    var myData = mySheet.getRange(1,1,liveData.getNumRows(),liveData.getNumColumns());
    mySheet.getDataRange().clearContent();
    myData.setValues(liveData.getValues());
  }
  initReconciliation();
}
/*
function initializeSpreadsheet() {
  assertNotLive();
  initArchiveSheet();
  initPointsSheet();
  updatePoints();
}

function initArchiveSheet() {
  assertNotLive();
  var clanList = fetchClan().asList();
  var archiveSheet = SheetProvider.getArchive();
  var rankPoints = getRankPoints();
  var archive = [];
  for ( var i in clanList ) {
    var clanmate = clanList[i];
    var points = rankPoints[clanmate.rank.toLowerCase()];
    archive.push([clanmate.name, points]);
  }
  archiveSheet.clear();
  var archiveRange = archiveSheet.getRange(1,1,archive.length,2);
  archiveRange.setValues(archive);
}

function initPointsSheet() {
  assertNotLive();
  var now = new Date();
  
  var clanList = fetchClan().asList();
  var pointsSheet = SheetProvider.getPoints();
  var clanRanks = [];
  var baseXp = [];
  for ( var i in clanList ) {
    var clanmate = clanList[i];
    clanRanks.push([clanmate.name, clanmate.rank]);
    baseXp.push([clanmate.xp]);
  }
  
  var headerRange = pointsSheet.getRange(1,1,1,5);
  var header = headerRange.getValues();
  pointsSheet.clearContents();
  headerRange.setValues(header);
  var rangeNameRank = pointsSheet.getRange(2,1,clanList.length,2);
  var rangeXp = pointsSheet.getRange(2,5,clanList.length,1);
  rangeNameRank.setValues(clanRanks);
  rangeXp.setValues(baseXp);
  
  var dateNote = "Retrieved " + now.getDate() + "/" + (now.getMonth()+1) + "/" + now.getFullYear();
  var xpHeaderCell = pointsSheet.getRange(1,5,1,1);
  xpHeaderCell.setNote(dateNote);
  
  initFcRanks();
}

function initFcRanks() {
  assertNotLive();
  var ss = SpreadsheetApp.openById("1URlww--VFOBhk4oNOEPWcjlo0VwtQZ3k9725PDIi22U");
  var ranksSheet = ss.getSheets()[0];
  var ranksRange = ranksSheet.getRange(1, 2, ranksSheet.getDataRange().getNumRows(), 2);
  var clanmate2Rank = getMapFromRange(ranksRange);
  var pointsSheet = SheetProvider.getPoints();
  var range = pointsSheet.getRange(2,1,pointsSheet.getDataRange().getNumRows(),3);
  var values = range.getValues();
  for ( var i in values ) {
    var rank = clanmate2Rank[values[i][0].toLowerCase()];
    if ( rank == null )
      continue;
    var rankCased = rank.substr(0,1).toUpperCase() + rank.substr(1).toLowerCase();
    values[i][2] = rankCased;
  }
  range.setValues(values);
}
*/
var LIVE_SHEET_ID = "1h63WWTylD8gjSzJRwwD4t9dl5Rw2epaA_hszd2u_s_U";  // LIVE
//var LIVE_SHEET_ID = "1wOAdDXlf4QEujJlcW3hk_3Zac5ATB4blVSMqABJlHn4";  // SANDBOX

function getLiveSpreadsheet() {
  assertNotLive();
  return SpreadsheetApp.openById(LIVE_SHEET_ID);
}

function assertNotLive() {
  if ( isLive() )
    throw "Please run debug utilities on a staging spreadsheet";
}

function isLive() {
  return SpreadsheetApp.getActive().getId() == LIVE_SHEET_ID;
}
