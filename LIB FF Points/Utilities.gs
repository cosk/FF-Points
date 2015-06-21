//////////////////////////////////////////////////////////////
// Locking

var DocumentLock;

/** Return true if lock was acquired, false if not */
function enterCriticalSection() {
  var docLock = DocumentLock;
  if ( docLock == null )
    docLock = LockService.getDocumentLock();
  if ( docLock == null )
    return false;
  DocumentLock = docLock;
  var gotLock = docLock.tryLock(20000);
  return gotLock;
}

function exitCriticalSection() {
  var docLock = DocumentLock;
  if ( docLock == null )
    return;
  docLock.releaseLock();
}

function isInCriticalSection() {
  var docLock = DocumentLock;
  if ( docLock == null )
    return false;
  return docLock.hasLock();
}

//////////////////////////////////////////////////////////////
// UI components (sidebars, dropdowns)

function showSidebar(htmlFile) {
  var html = HtmlService.createHtmlOutputFromFile(htmlFile)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showHtmlTemplate(htmlFile, values) {
  var template = HtmlService.createTemplateFromFile(htmlFile);
  for ( var key in values ) {
    template[key] = values[key];
  }
  var html;
  try {
    html = template.evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  } catch ( e ) {
    throw "Error in " + htmlFile + ".html: " + e;
  }
  SpreadsheetApp.getUi().showSidebar(html);
}

function createDropdownsFromList(range, list, allowInvalidData) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(list).setAllowInvalid(allowInvalidData).build();
  createDropdowns(range, rule);
}

function createDropdownsFromRange(range, valueRange, allowInvalidData) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInRange(valueRange).setAllowInvalid(allowInvalidData).build();
  createDropdowns(range, rule);
}

function createDropdowns(range, rule) {
  var rules = createArray([rule], range.getNumRows());
  range.setDataValidations(rules);
}

function setReconciliationCell(cell, discrepancyCount) {
  if ( cell.getValue() == discrepancyCount )
    return;
  cell.setValue(discrepancyCount);
  cell.setBackground(discrepancyCount==0 ? "white" : "red");
}

//////////////////////////////////////////////////////////////
//Sheet data manipulation

function sortPointsSheet() {
  var pointsSheet = SheetProvider.getPoints();
  var numRows = pointsSheet.getDataRange().getNumRows();
  var numColumns = pointsSheet.getDataRange().getNumColumns();
  var rangeToSort = pointsSheet.getRange(2,1,numRows-1,numColumns);
  rangeToSort.sort(1);
}

function clearSheet(sheet, headerRows) {
  var dataRange = sheet.getDataRange();
  var dataRows = dataRange.getNumRows()-headerRows;
  if ( dataRows == 0 )
    return;  // Nothing to clear
  var clearRange = sheet.getRange(headerRows+1, 1, dataRows, dataRange.getNumColumns());
  clearRange.clearContent();
  clearRange.clearNote();
  clearRange.clearDataValidations();
}


/**
 * Build a JavaScript "map" from a 2-column range.
 * First column is lowercased and becomes key, second column becomes value.
 */
function getMapFromRange(range) {
  var rangeValues = range.getValues();
  var map = {};
  for ( var i in rangeValues ) {
    var key = rangeValues[i][0];
    var value = rangeValues[i][1];
    map[key.toLowerCase()] = value;
  }
  return map;
}


//////////////////////////////////////////////////////////////
// Dealing with arrays in callbacks from sidebars

function parseNames(sNames) {
  var names = parseArrayFromString(sNames);
  return validateNames(names);
}

function parseArrayFromString(sNames) {
  var names = sNames.trim().split(/(?:\s*,\s*)+/);
  if ( names.length==1 && names[0]=="" )
    return [];
  return names;
}

//////////////////////////////////////////////////////////////
// Checking names against the Points sheet

function validateName(name) {
  var properCaseNames = validateNames([name]);
  return properCaseNames[0];
}

function validateNames(names) {
  if ( names.length == 0 )
    return [];
  var clanSheet = SheetProvider.getPoints();
  var clanCount = clanSheet.getLastRow()-1;  // Subtract 1 for header row
  var range = clanSheet.getRange(2, 1, clanCount, 1);
  var clanmateRangeValues = range.getValues();
  var clanmates = {};
  for ( var i in clanmateRangeValues ) {
    var clanmate = clanmateRangeValues[i][0];
    clanmates[clanmate.toLowerCase()] = clanmate;
  }
  var missingNames = [];
  var properCaseNames = [];
  for ( var i in names ) {
    var clanmate = clanmates[names[i].toLowerCase()];
    if ( clanmate == null )
      missingNames.push(names[i]);
    else
      properCaseNames.push(clanmate);
  }
  if ( missingNames.length > 0 ) {
    var sMissingNames = formatNames(missingNames);
    throw plural("Clanmate", missingNames.length) + " " + sMissingNames + " not found on the " + clanSheet.getName() + " sheet";
  }
  
  return properCaseNames;
}

//////////////////////////////////////////////////////////////
// Miscellaneous utilities

function formatName(name) {
  return formatNames([name]);
}

function formatNames(names) {
  return "[" + names.join("],[") + "]";
}

function makeXpTimestamp() {
  var now = new Date();
  return now.getUTCFullYear() + "/" + (now.getUTCMonth()+1) + "/" + now.getUTCDate()
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function plural(singular, count) {
  return count==1 ? singular : singular+"s";
}

function pluralVerb(singular, count) {
  return count!=1 ? singular : singular+"s";
}

function createArray(value, size) {
  var a = [];
  for ( var i = 0 ; i < size ; ++i ) {
    a.push(value);
  }
  return a;
}

function sentenceCase(s) {
  if ( s==null || s=="" )
    return "";
  return s.slice(0,1).toUpperCase() + s.slice(1).toLowerCase();
}
