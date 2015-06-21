/////////////////////////////////////////////////////////
// Thread bumps

function logThreadBumpUi() {
  showSidebar('logThreadBump');
}

function doLogThreadBump(formObject) {
  var name = formObject.name.trim();
  name = validateName(name);
  var sCount = formObject.bumpCount;
  var count = parseInt(sCount);
  if ( isNaN(count) || count<=0 )
    throw "Number of bumps should be a whole number";
  var comment = formObject.comment;
  var pointProvider = getActionPoints();
  doRecord(name, "BUMP", count, pointProvider, comment);
  updatePoints();
  return "Recorded " + count + " " + plural("bump", count) + " for " + formatName(name);
}

/////////////////////////////////////////////////////////
// Events

function logEventUi() {
  showSidebar('logEvent');
}

function doLogEvent(formObject) {
  var hosts = parseNames(formObject.hosts);
  var helpers = parseNames(formObject.helpers);
  var participants = parseNames(formObject.participants);
  var comment = formObject.comment;
  /*  Don't check that fields are filled out in case we want to add a participant that was missed in the original report
  if ( hosts.length == 0 )
    throw "At least one host is required";
  if ( helpers.length + participants.length == 0 )
    throw "At least one helper or other participant is required";
  */
  checkDuplicates([hosts, helpers, participants]);
  
  var pointProvider = getActionPoints();
  for  ( var i in hosts ) {
    doRecord(hosts[i], "EH", 1, pointProvider, comment);
  }
  for  ( var i in helpers ) {
    doRecord(helpers[i], "EC", 1, pointProvider, comment);
  }
  for  ( var i in participants ) {
    doRecord(participants[i], "EP", 1, pointProvider, comment);
  }
  updatePoints();
  return "Event \"" + comment + "\" logged: " +
    hosts.length + " " + plural("host", hosts.length) + ", " +
    helpers.length + " " + plural("helper", helpers.length) + ", " +
    participants.length + " other " + plural("participant", participants.length);
}

/////////////////////////////////////////////////////////
// Meetings

function logMeetingUi() {
  showSidebar('logMeeting');
}

function doLogMeeting(formObject) {
  var participants = parseNames(formObject.participants);
  var comment = formObject.comment;
  if ( participants.length == 0 )
    throw "At least one participant is required";
  checkDuplicates([participants]);
  
  var pointProvider = getActionPoints();
  for  ( var i in participants ) {
    doRecord(participants[i], "MEET", 1, pointProvider, comment);
  }
  updatePoints();
  return "Meeting \"" + comment + "\" logged: " +
    participants.length + " " + plural("participant", participants.length);
}

function checkDuplicates(arrayOfArrays) {
  var counts = {};
  var duplicates = [];
  for ( var i in arrayOfArrays ) {
    var ar = arrayOfArrays[i];
    for ( var j in ar ) {
      var item = ar[j];
      var count = counts[item];
      if ( count == null )
        count = 0;
      else if ( count == 1 )
        duplicates.push(item);
      counts[item] = count+1;
    }
  }
  if ( duplicates.length != 0 ) {
    throw plural("Clannie", duplicates.length) + " " + formatNames(duplicates) + " " +
      pluralVerb("appear", duplicates.length) + " more than once";
  }
}

/////////////////////////////////////////////////////////
// FC Upranks

function logFcUprankUi() {
  var pointsSheet = SheetProvider.getPoints();
  var fcSheet = SheetProvider.getFc();
  var fcCount = fcSheet.getDataRange().getNumRows()-FCSFormat.headerRows;
  var fcMap = getMapFromRange(fcSheet.getRange(FCSFormat.headerRows+1,1,fcCount,2));
  var clan = getClanFromSpreadsheet();
  var fcRankPoints = getFcRankPoints();
  
  var names = [];
  var points = [];
  var newRanks = [];
  var oldRanks = [];
  for ( var i in clan.asList() ) {
    var clanmate = clan.asList()[i];
    var newFcRank = fcMap[clanmate.name.toLowerCase()];
    var oldFcRank = clanmate.fcRank;
    if ( newFcRank==null )
      continue;
    newFcRank = newFcRank.trim().toLowerCase();
    oldFcRank = oldFcRank==null? "" : oldFcRank.trim().toLowerCase();
    if ( newFcRank=="" || oldFcRank==newFcRank )
      continue;
    
    var xpPoints = fcRankPoints[newFcRank];
    if ( xpPoints == null )
      continue;
    names.push(clanmate.name);
    newRanks.push(newFcRank);
    oldRanks.push(oldFcRank);
    points.push(xpPoints);
  }
  showHtmlTemplate("logFcUprank",
                   {
                     names: names,
                     newRanks: newRanks,
                     oldRanks: oldRanks,
                     points: points,
                   }
                  );
}

function doLogFcUprank(formObject) {
  var names = parseNames(formObject.names);
  var newRanks = parseArrayFromString(formObject.newRanks);
  var points = parseArrayFromString(formObject.points);
  var comment = formObject.comment;
  
  Logger.log(names);
  var codes = [];
  for ( var i in newRanks ) {
    codes.push("FC:"+newRanks[i].toLowerCase());
  }
  var comments = createArray(comment, names.length);
  
  var pointsSheet = SheetProvider.getPoints();
  var clanCount = pointsSheet.getDataRange().getNumRows()-1;
  var pointsRange = pointsSheet.getRange(2,1,clanCount,3);
  var pointValues = pointsRange.getValues();
  var name2Row = {};
  for ( var i in pointValues ) {
    name2Row[pointValues[i][0].toLowerCase()] = i;
  }
  for ( var i in names ) {
    var row = name2Row[names[i].toLowerCase()];
    if ( row == null )
      throw "Clanmate " + formatName(names[i]) + " not found on the " + pointsSheet.getName() + " sheet";
    pointValues[row][2] = sentenceCase(newRanks[i]);
  }
  doMultiRecordPoints(names, codes, points, comments);
  pointsRange.setValues(pointValues);

  updatePoints();
  return "Recorded points for " + names.length + " " + plural("name", names.length);
}

/////////////////////////////////////////////////////////
// XP

function recordXp() {
  if ( !isXpDueForUpdate() )
    return;
  
  var clan = forceFetchClan();
  var sheet = SheetProvider.getPoints();
  var numRows = sheet.getDataRange().getNumRows();
  var range = sheet.getRange(2,1,numRows-1,5);
  var values = range.getValues();
  var notes = range.getNotes();
  var rowsToUpdate = getRowsDueForXpUpdate(notes,4);
  var pointProvider = getActionPoints();
  var sNow = makeXpTimestamp();
  var xpPointsProvider = new XpPointsProvider();
  
  var recordNames = [];
  var recordCodes = [];
  var recordComments = [];
  
  for ( var i in rowsToUpdate ) {
    var row = rowsToUpdate[i];
    var clanmate = clan.asMap()[values[row][0].toLowerCase()];
    if ( clanmate == null ) {
      continue;  // Left clan or changed name
    }
    
    notes[row][4] = sNow;
    var xpGain = clanmate.xp-values[row][4];
    values[row][4] = clanmate.xp;
    var code = xpPointsProvider.getCode(xpGain);
    if ( code == null )
      continue;
    recordNames.push(clanmate.name);
    recordCodes.push(code);
    recordComments.push(numberWithCommas(xpGain));
  }
  
  doMultiRecord(recordNames, recordCodes, pointProvider, recordComments);
  range.setValues(values);
  range.setNotes(notes);
  updatePoints();
}

function isXpDueForUpdate() {
  var sheet = SheetProvider.getPoints();
  var numRows = sheet.getDataRange().getNumRows();
  var xpRange = sheet.getRange(2,5,numRows-1,1);
  var dateNotes = xpRange.getNotes();
  var rowsToUpdate = getRowsDueForXpUpdate(dateNotes,0);
  return rowsToUpdate.length>0;
}

function getRowsDueForXpUpdate(notes, column) {
  var now = new Date();
  var currentMonth = now.getMonth()+1;
  var rows = [];
  for ( var i in notes ) {
    var note = notes[i][column];
    var matches = note.match(/^(\d+)\/(\d+)\/(\d+)$/);
    if ( matches==null || matches.length != 4 ) {
      Logger.log("Note '" + note + "' in row " + (i+1) + " does not contain a date");
      continue;
    }
    if ( matches[2] != currentMonth )
      rows.push(i);
  }

  return rows;
}

/////////////////////////////////////////////////////////
// Utilities

function doRecord(name, code, count, pointProvider, comment) {
  var points = count * pointProvider[code.toLowerCase()];
  doRecordPoints(name, code, count, points, comment);
}

function doRecordPoints(name, code, count, points, comment) {
  var timestamp = new Date().toUTCString();
  if ( comment == null )
    comment = "";
  var record = [[timestamp, name, points, code, count, comment]];
  var logSheet = SheetProvider.getLog();
  logSheet.insertRows(1);
  var range = logSheet.getRange(1,1,1,6);
  range.setValues(record);
}

function doMultiRecord(names, codes, pointProvider, comments) {
  var points = [];
  for ( var i in codes ) {
    points.push(pointProvider[codes[i].toLowerCase()]);
  }
  doMultiRecordPoints(names, codes, points, comments);
}

function doMultiRecordPoints(names, codes, points, comments) {
  if ( names.length == 0 )
    return;
  var timestamp = new Date().toUTCString();
  var records = [];
  for ( var i in names ) {
    var comment = comments==null||comments[i]==null ? "" : comments[i];
    var record = [timestamp, names[i], points[i], codes[i], 1, comment];
    records.push(record);
  }
  var logSheet = SheetProvider.getLog();
  logSheet.insertRows(1, names.length);
  var range = logSheet.getRange(1,1,names.length,6);
  range.setValues(records);
}
