// Rank reconciliation

function showRankReconciliation() {
  initRankReconciliation();
  SheetProvider.getRanks().activate();
  reconcileRanksUi();
}

///////////////////////////////////////////////////////////////////////
/** Initialize rank reconciliation sheet unless it has been initialized recently */
function refreshRankReconciliation() {
  if ( getReconcileRanksCacheExpiration().expired() )
    initRankReconciliation();
}

/** Initialize rank reconciliation sheet */
function initRankReconciliation() {
  var ranksSheet = SheetProvider.getRanks();
  var clanMapFromRs = fetchClan().asMap();
  var clanListFromSs = getClanFromSpreadsheet().asList();
  var rankPointProvider = new RankPointProvider();
  
  clearSheet(ranksSheet, RRSFormat.headerRows);
  
  var uprankCount = 0;
  var diffRankCount = 0;
  var rankValues = [];
  var actionRules = [];
  for ( var i in clanListFromSs ) {
    var clanmate = clanListFromSs[i];
    var rank = rankPointProvider.getRank(clanmate.points, clanmate.rank);
    var clanmateFromRs = clanMapFromRs[clanmate.name.toLowerCase()];
    if ( rank==clanmate.rank && (clanmateFromRs==null||clanmateFromRs.rank==clanmate.rank) )
      continue;
    var action;
    var actionRule;
    if ( clanmateFromRs == null ) {
      action = formatName(clanmate.name) + " is not in the runescape.com clan list, please reconcile clan first";
      actionRule = null;
    } else if ( clanmateFromRs.rank == clanmate.rank ) {
      action = "Please uprank " + formatName(clanmate.name) + " in game and then use 'Reconcile' menu to refresh clan list";
      actionRule = null;
      ++uprankCount;
    } else {
      action = "";
      var options = [RRSFormat.changeRank + clanmateFromRs.rank, "Don't change rank"];
      actionRule = SpreadsheetApp.newDataValidation().requireValueInList(options).setAllowInvalid(false).build();
      ++diffRankCount;
    }
    var row = [clanmate.name, clanmate.rank, clanmate.points+"/"+rank, clanmateFromRs==null ? "N/A" : clanmateFromRs.rank, action];
    rankValues.push(row);
    actionRules.push([actionRule]);
  }
  if ( rankValues.length == 0 ) {
    ranksSheet.getRange(RRSFormat.headerRows+1,1).setValue("All ranks are up to date");
  } else {
    ranksSheet.getRange(RRSFormat.headerRows+1, 1, rankValues.length, 5).setValues(rankValues);
    var actionRange = ranksSheet.getRange(RRSFormat.headerRows+1, RRSFormat.actionCol, rankValues.length, 1);
    actionRange.setDataValidations(actionRules);
  }
  
  var summarySheet = SheetProvider.getSummary();
  setReconciliationCell(summarySheet.getRange(8,3), uprankCount);
  setReconciliationCell(summarySheet.getRange(9,3), diffRankCount);
  
  getReconcileRanksCacheExpiration().set();
}

function RankPointProvider() {
  this.pointsAndRanks = getRanksAndPoints();
  
  this.getRank = function(points, currentRank) {
    var bestRank = null;
    var bestRankPoints = -1;
    for ( var i in this.pointsAndRanks ) {
      var pointsAndRank = this.pointsAndRanks[i];
      var rankPoints = pointsAndRank[1];
      if ( points < rankPoints )
        continue;  // Not enough points for this rank
      var rankFromPoints = pointsAndRank[0];
      if ( rankPoints>bestRankPoints || rankPoints==bestRankPoints&&rankFromPoints==currentRank ) {
        bestRank = rankFromPoints;
        bestRankPoints = rankPoints;
      }
    }
    return bestRank;
  }
}

///////////////////////////////////////////////////////////////////////
// Show rank reconciliation sidebar

function reconcileRanksUi() {
  var ranksSheet = SheetProvider.getRanks();
  var numRows = ranksSheet.getDataRange().getNumRows() - RRSFormat.headerRows;
  if ( numRows == 0 )
    return;
  var rankValues = ranksSheet.getRange(RRSFormat.headerRows+1, 1, numRows, ranksSheet.getDataRange().getNumColumns()).getValues();
  
  var names = [];
  var oldRanks = [];
  var newRanks = [];
  for ( var i in rankValues ) {
    var row = rankValues[i];
    var rsRank = row[RRSFormat.rsRankCol-1];
    var changeAction = RRSFormat.changeRank + rsRank;
    if ( row[RRSFormat.actionCol-1] != changeAction )
      continue;
    names.push(row[RRSFormat.nameCol-1]);
    oldRanks.push(row[RRSFormat.rankCol-1]);
    newRanks.push(rsRank);
  }

  showHtmlTemplate("ReconcileRanksUi",
                   {
                     names: names,
                     oldRanks: oldRanks,
                     newRanks: newRanks,
                   }
                  );
}

///////////////////////////////////////////////////////////////////////
// Reconcile ranks (callback from the sidebar)

function doReconcileRanks(formObject) {
  var names = parseNames(formObject.names);
  var newRanks = parseArrayFromString(formObject.newRanks);
  
  var newRankMap = {};
  for ( var i in names ) {
    newRankMap[names[i].toLowerCase()] = newRanks[i];
  }
  
  var uprankCount = 0;
  var pointsSheet = SheetProvider.getPoints();
  var numRows = pointsSheet.getDataRange().getNumRows();
  var nameRankRange = pointsSheet.getRange(2, 1, numRows-1, 2);
  var nameRankValues = nameRankRange.getValues();
  for ( var i in nameRankValues ) {
    var row = nameRankValues[i];
    var newRank = newRankMap[row[0].toLowerCase()];
    if ( newRank != null ) {
      row[1] = newRank;
      ++uprankCount;
    }
  }
  nameRankRange.setValues(nameRankValues);

  initRankReconciliation();
  return "Changed rank for " + uprankCount + " " + plural("clanmate",uprankCount);
}
