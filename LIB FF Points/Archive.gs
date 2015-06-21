/** Delete old entries from the Log sheet and summarize them on the Archive sheet */
function archive() {
  var archiveAfter = getArchiveAfter();
  if ( archiveAfter < 10 )
    throw "Archiving age set to " + archiveAfter + ". This is too short.";
    
  var now = new Date();
  var nowMsec = now.getTime();
  var archiveAfterMsec = nowMsec-archiveAfter*24*60*60*1000;
  
  var logSheet = SheetProvider.getLog();
  var archiveSheet = SheetProvider.getArchive();
  
  var numLogEntries = logSheet.getDataRange().getNumRows();
  var logEntries = logSheet.getRange(1,1,numLogEntries,3).getValues();
  
  var firstRowToArchive = null;
  for ( var i in logEntries ) {
    var timestampMsec = Date.parse(logEntries[i][0]);
    if ( timestampMsec < archiveAfterMsec ) {
      firstRowToArchive = parseInt(i);
      break;
    }
  }
  
  if ( firstRowToArchive == null )
    return;
  
  var archiveRange = archiveSheet.getDataRange();
  var archiveEntries = archiveRange.getValues();
  var name2ArchiveRow = {};
  for ( var i in archiveEntries ) {
    var name = archiveEntries[i][0];
    name2ArchiveRow[name.toLowerCase()] = archiveEntries[i];
  }
  
  var addToArchive = [];
  for ( var i = firstRowToArchive ; i < logEntries.length ; ++i ) {
    var name = logEntries[i][1];
    var points = parseInt(logEntries[i][2]);
    var archiveRow = name2ArchiveRow[name.toLowerCase()];
    if ( archiveRow == null ) {
      archiveRow = [name, points];
      addToArchive.push(archiveRow);
    } else {
      archiveRow[1] += points;
    }
  }
  
  archiveRange.setValues(archiveEntries);

  if ( addToArchive.length > 0 ) {
    var archiveCount = archiveSheet.getDataRange().getNumRows();
    archiveSheet.insertRows(archiveCount+1, addToArchive.length);
    var insertRange = archiveSheet.getRange(archiveCount+1, 1, addToArchive.length, 2);
    insertRange.setValues(addToArchive);
    archiveSheet.getDataRange().sort(1);
  }
  
  logSheet.deleteRows(firstRowToArchive+1, logEntries.length-firstRowToArchive);
}
