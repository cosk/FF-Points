// Clan reconciliation

function showClanReconciliation() {
  initClanReconciliation();
  SheetProvider.getReconcileClan().activate();
  reconcileClanUi();
}

///////////////////////////////////////////////////////////////////////
/** Initialize clan reconciliation sheet unless it has been initialized recently */
function refreshClanReconciliation() {
  if ( getReconcileClanCacheExpiration().expired() )
    initClanReconciliation();
}

/** Initialize clan reconciliation sheet */
function initClanReconciliation() {
  var clanFromRs = fetchClan();
  var clanFromSs = getClanFromSpreadsheet();
  
  var oldClannies = getUniqueNames(clanFromSs, clanFromRs);
  var newClannies = getUniqueNames(clanFromRs, clanFromSs);
  
  var summarySheet = SheetProvider.getSummary();
  setReconciliationCell(summarySheet.getRange(4,3), oldClannies.length);
  setReconciliationCell(summarySheet.getRange(5,3), newClannies.length);
  
  var recSheet = SheetProvider.getReconcileClan();
  recSheet.getDataRange().clearDataValidations();
  clearSheet(recSheet, CRSFormat.headerRows);

  var hiddenNewNamesRange = recSheet.getRange(1,CRSFormat.newNameHiddenCol, newClannies.length+2, 1);
  var newNameValues = getClannieNames(newClannies);
  if ( newClannies.length > 0 ) {
    var newNamesRange = recSheet.getRange(CRSFormat.headerRows+1, CRSFormat.newNameCol, newClannies.length, 1);
    newNamesRange.setValues(newNameValues);
    newNamesRange.setNotes(getClannieRanksAndXp(newClannies));
    var newNamesActionRange = recSheet.getRange(CRSFormat.headerRows+1, CRSFormat.newNameActionCol, newClannies.length, 1);
    createDropdownsFromList(newNamesActionRange, [CRSFormat.add, CRSFormat.dontAdd], false);
  }
  newNameValues.push([CRSFormat.leftClan]);
  newNameValues.push([CRSFormat.notNow]);
  hiddenNewNamesRange.setValues(newNameValues);
    
  if ( oldClannies.length > 0 ) {
    var oldNames = getClannieNames(oldClannies);
    var oldNameRange = recSheet.getRange(CRSFormat.headerRows+1, CRSFormat.oldNameCol, oldClannies.length, 1);
    oldNameRange.setValues(oldNames);
    oldNameRange.setNotes(getClannieRanksAndXp(oldClannies));
    var oldNameActionRange = recSheet.getRange(CRSFormat.headerRows+1, CRSFormat.oldNameActionCol, oldClannies.length, 1);
    createDropdownsFromRange(oldNameActionRange, hiddenNewNamesRange, false);
  }
  
  getReconcileClanCacheExpiration().set();
}

function getUniqueNames(clanToFilter, filterBy) {
  var filtered = [];
  var filter = filterBy.asMap();
  var list = clanToFilter.asList();
  for ( var i in list ) {
    if ( filter[list[i].name.toLowerCase()] == null )
      filtered.push(list[i]);
  }
  return filtered;
}

function getClannieNames(arrayOfClanmates) {
  var names = [];
  for ( var i in arrayOfClanmates ) {
    names.push([arrayOfClanmates[i].name]);
  }
  return names;
}

function getClannieRanksAndXp(arrayOfClanmates) {
  var ranks = [];
  for ( var i in arrayOfClanmates ) {
    ranks.push([arrayOfClanmates[i].rank + "\n" + arrayOfClanmates[i].xp + " xp"]);
  }
  return ranks;
}

///////////////////////////////////////////////////////////////////////
// Show clan reconciliation sidebar

function reconcileClanUi() {
  try {
//    initClanReconciliation();
    var recSheet = SheetProvider.getReconcileClan();
    var numRows = recSheet.getDataRange().getNumRows() - CRSFormat.headerRows;
    if ( numRows == 0 )
      return;
    var renameRange = recSheet.getRange(CRSFormat.headerRows+1, CRSFormat.oldNameCol, numRows, 2);
    var renameValues= renameRange.getValues();
    var renameFrom = [];
    var renameTo = [];
    var del = [];
    for ( var i in renameValues ) {
      var fromName = renameValues[i][0];
      if ( fromName == "" )
        continue;
      var toName = renameValues[i][1];
      if ( toName == CRSFormat.leftClan ) {
        del.push(fromName);
      } else if ( toName==CRSFormat.notNow || toName=="" ) {
        // Do nothing
      } else {
        renameFrom.push(fromName);
        renameTo.push(toName);
      }
    }
    renameFrom = validateNames(renameFrom);
    del = validateNames(del);
    var rename = [];
    for ( var i in renameFrom ) {
      rename.push([renameFrom[i],renameTo[i]]);
    }
    
    var add = [];
    var addRanks = [];
    var addXp = [];
    var addRange = recSheet.getRange(CRSFormat.headerRows+1, CRSFormat.newNameCol, numRows, 2);
    var addValues = addRange.getValues();
    var rankXpValues = addRange.getNotes();
    for ( var i in addValues ) {
      var name = addValues[i][0];
      if ( name == "" )
        continue;
      var action = addValues[i][1];
      if ( action == CRSFormat.add ) {
        add.push(name);
        var match = rankXpValues[i][0].match(/^(.+)(?:[\r\n]+)([0-9,]+) xp$/im);
        if ( match==null || match.length != 3 )
          throw "\nUnexpected rank/xp note " + rankXpValues[i][0];
        addRanks.push(match[1]);
        addXp.push(match[2]);
      }
    }
    
    validateNamesAreUnique([renameTo, add]);
    showHtmlTemplate("ReconcileClanUi",
                     {
                       rename: rename,
                       del: del,
                       add: add,
                       addRanks: addRanks,
                       addXp: addXp,
                     }
                    );
  } catch (err) {
    showHtmlTemplate("ErrorMessage",
                     {errorMessage: err}
                    );
  }
}

function validateNamesAreUnique(arrayOfNameArrays) {
  var uniqueSet = {};
  var notUniqueSet = {};
  var notUnique = [];
  for ( var i in arrayOfNameArrays ) {
    for ( var j in arrayOfNameArrays[i] ) {
      var name = arrayOfNameArrays[i][j];
      var key = name.toLowerCase();
      var nameInSet = uniqueSet[key];
      if ( nameInSet == null ) {
        uniqueSet[key] = name;
      } else if ( notUniqueSet[key] == null ) {
        notUniqueSet[key] = name;
        notUnique.push(name);
      }
    }
  }
  
  if ( notUnique.length > 0 ) {
    throw "New " + plural("name", notUnique.length) + " " +
      formatNames(notUnique) + " are not unique";
  }
}

///////////////////////////////////////////////////////////////////////
// Reconcile clan (callback from the sidebar)

function doReconcileClan(formObject) {
  var renameRaw = parseArrayFromString(formObject.rename);
  var rename = [];
  for ( var i = 0 ; i < renameRaw.length ; i+=2 ) {
    rename.push([renameRaw[i], renameRaw[i+1]]);
  }
  
  var del = parseNames(formObject.del);
  var add = parseArrayFromString(formObject.add);
  var addRanks = parseArrayFromString(formObject.addRanks);
  var addXp = parseArrayFromString(formObject.addXp);
  
  var renameCount = doRename(rename);
  var delCount = doDelete(del);
  var addCount = doAdd(add, addRanks, addXp);
  
  initClanReconciliation();
  
  return "Renamed " + renameCount + ", deleted " + delCount + ", added " + addCount;
}

function doRename(rename) {
  if ( rename.length == 0 )
    return 0;
  var renameMap = {};
  for ( var i in rename ) {
    renameMap[rename[i][0].toLowerCase()] = rename[i][1];
  }
  var pointsSheet = SheetProvider.getPoints();
  var renameCount = renameInColumn(pointsSheet, 2, 1, renameMap);
  
  sortPointsSheet();
  
  var logSheet = SheetProvider.getLog();
  renameInColumn(logSheet, 1, 2, renameMap);
  
  var archiveSheet = SheetProvider.getArchive();
  renameInColumn(archiveSheet, 1, 1, renameMap);
  archiveSheet.getDataRange().sort(1);

  updatePoints();
  
  var fcConflicts = filterFcRenamingConflicts(renameMap);
  var deconflicted = fcConflicts[0];
  var conflicts = fcConflicts[1];
  renameInColumn(SheetProvider.getFc(), FCSFormat.headerRows+1, 1, deconflicted);
  
  return renameCount;
}

/**
Admin who works on clan reconciliation typically does not maintain
FC ranks, so we silently ignore conflicts instead of failing reconciliation.
*/
function filterFcRenamingConflicts(renameMap) {
  var fcSheet = SheetProvider.getFc();
  var fcCount = fcSheet.getDataRange().getNumRows()-FCSFormat.headerRows;
  var fcNames = fcSheet.getRange(FCSFormat.headerRows+1,1,fcCount,1).getValues();
  var fcNameSet = {};
  for ( var i in fcNames ) {
    fcNameSet[fcNames[i][0].toLowerCase()] = true;
  }
  var deconflicted = {};
  var conflicts = [];
  for ( var oldName in renameMap ) {
    var newName = renameMap[oldName];
    if ( fcNameSet[newName.toLowerCase()] == null )
      deconflicted[oldName] = newName;
    else
      conflicts.push(newName);
  }
  return [deconflicted, conflicts];
}

function renameInColumn(sheet, firstRow, nameColumn, renameMap) {
  var numRows = sheet.getDataRange().getNumRows();
  var nameRange = sheet.getRange(firstRow,nameColumn,numRows-firstRow+1,1);
  var nameValues = nameRange.getValues();
  var renameCount = 0;
  for ( var i in nameValues ) {
    var newName = renameMap[nameValues[i][0].toLowerCase()];
    if ( newName != null ) {
      nameValues[i] = [newName];
      renameCount++;
    }
  }
  nameRange.setValues(nameValues);
  return renameCount;
}

function doDelete(del) {
  var delMap = {};
  for ( var i in del ) {
    delMap[del[i].toLowerCase()] = del[i];
  }
  var pointsSheet = SheetProvider.getPoints();
  var delCount = deleteByName(pointsSheet, 2, 1, delMap);
  var logSheet = SheetProvider.getLog();
  deleteByName(logSheet, 1, 2, delMap);
  var archiveSheet = SheetProvider.getArchive();
  deleteByName(archiveSheet, 1, 1, delMap);
  
  return delCount;
}

function deleteByName(sheet, firstRow, nameColumn, delMap) {
  var rowsToDelete = [];
  var numRows = sheet.getDataRange().getNumRows();
  var nameRange = sheet.getRange(firstRow,nameColumn,numRows-firstRow+1,1);
  var nameValues = nameRange.getValues();
  for ( var i in nameValues ) {
    if ( delMap[nameValues[i][0].toLowerCase()] != null )
      rowsToDelete.push(firstRow+parseInt(i));
  }
  for ( var i=rowsToDelete.length-1 ; i>=0 ; --i ) {
    sheet.deleteRow(rowsToDelete[i]);
  }
  return rowsToDelete.length;
}

function doAdd(add, addRanks, addXp) {
  if ( add.length == 0 )
    return 0;
  var addValues = [];
  for ( var i in add ) {
    addValues.push([add[i], addRanks[i], "", 0, addXp[i]]);
  }

  var pointsSheet = SheetProvider.getPoints();
  var numRows = pointsSheet.getDataRange().getNumRows();
  var numColumns = pointsSheet.getDataRange().getNumColumns();
  var addRange = pointsSheet.getRange(numRows+1,1,addValues.length, 5);
  var addXpRange = pointsSheet.getRange(numRows+1,5,addValues.length,1);
  var sNow = makeXpTimestamp();
  var dateNotes = createArray([sNow], addValues.length);
  addRange.setValues(addValues);
  addXpRange.setNotes(dateNotes);
  sortPointsSheet();
    
  return addValues.length;
}
