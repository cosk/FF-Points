
/**
 * Create custom menu and initialize "Renamings" and "Ranks" sheets
 */
function libOnOpen() {
  try {
    createMenus();
    refreshClanReconciliation();
    refreshRankReconciliation();
  } catch (e) {
    showModalError(e);
  }
};

function createMenus() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Record")
  .addItem("Thread bump", "LibFFPoints.logThreadBumpUi")
  .addItem("Event", "LibFFPoints.logEventUi")
  .addItem("Meeting", "LibFFPoints.logMeetingUi")
  .addItem("FC upranks", "LibFFPoints.logFcUprankUi")
  .addItem("Manual points award", "LibFFPoints.logManualUi")
  .addItem("Refresh points", "LibFFPoints.updatePoints")
  .addToUi();
  ui.createMenu("Update")
  .addItem("Clan", "LibFFPoints.showClanReconciliation")
  .addItem("Clan - Update side bar", "LibFFPoints.refreshClanSidebar")
  .addItem("Ranks", "LibFFPoints.showRankReconciliation")
  .addItem("Ranks - Update side bar", "LibFFPoints.refreshRankSidebar")
  .addItem("Refresh from runescape.com", "LibFFPoints.initReconciliation")
  .addToUi();
}

function onEdit(e) {
  try {
    if ( isActiveCellClanReconciliation() )
      reconcileClanUi(e);
    else if ( isActiveCellRankReconciliation() )
      reconcileRanksUi(e);
  } catch (e) {
    showModalError(e);
  }
}

function isActiveCellClanReconciliation() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getActiveSheet();
  return SheetProvider.isReconcileClan(sheet);
  var firstCol = range.getColumn();
  if ( firstCol>3 || firstCol+range.getNumColumns()<=3 )
    return false;
}

function isActiveCellRankReconciliation() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getActiveSheet();
  if ( !SheetProvider.isRanks(sheet) )
    return false;
  var range = sheet.getActiveRange();
  var firstCol = range.getColumn();
  if ( firstCol>RRSFormat.actionCol || firstCol+range.getNumColumns()<=RRSFormat.actionCol )
    return false;
  if ( range.getRow()==RRSFormat.headerRows && range.getNumRows()==RRSFormat.headerRows )
    return false;  // Header
  return true;
}

function initReconciliation() {
  forceFetchClan();
  initClanReconciliation();
  initRankReconciliation();
}

function updatePoints() {
  var archiveSheet = SheetProvider.getArchive();
  var pointsSheet = SheetProvider.getPoints();
  var archive = getMapFromRange(archiveSheet.getDataRange());
  var log = collateLog();
  var clanCount = pointsSheet.getLastRow()-1;  // -1 for the header row
  var nameRange = pointsSheet.getRange(2, 1, clanCount, 1);
  var pointsRange = pointsSheet.getRange(2,4, clanCount, 1);
  var names = nameRange.getValues();
  var pointValues = [];
  for ( var i in names ) {
    var name = names[i][0].toLowerCase();
    var points = 0;
    var archivePoints = archive[name];
    if ( archivePoints != null )
      points += archivePoints;
    var logPoints = log[name];
    if ( logPoints != null )
      points += logPoints;
    pointValues.push([points]);
  }
  pointsRange.setValues(pointValues);
}

function collateLog() {
  var collated = {};
  var logSheet = SheetProvider.getLog();
  var logCount = logSheet.getLastRow();
  if ( logCount == 0 )
    return collated;
  var logRange = logSheet.getRange(1,2,logCount,2);
  var logValues = logRange.getValues();
  for ( var i in logValues ) {
    var name = logValues[i][0].toLowerCase();
    var points = logValues[i][1];
    var oldPoints = collated[name];
    if ( oldPoints != null )
      points += oldPoints;
    collated[name] = points;
  }
  return collated;
}

function showModalError(msg) {
  try {
    var template = HtmlService.createTemplateFromFile("ErrorMessage");
    template.errorMessage = msg;
    var html = template.evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    SpreadsheetApp.getUi().showModalDialog(html, "Error");
  } catch ( e ) {
    SpreadsheetApp.getActive().toast(msg);
  }
}
