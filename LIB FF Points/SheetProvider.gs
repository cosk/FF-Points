// Reference sheets by their unique ID rather than their name or index
// to allow us to rename and reorder sheets without changing code.
var SheetProvider = {
  fcRankSheetIds: [1025920167/*Live*/, 100122507/*Sandbox*/, 1602679235/*Dev*/],
  
  getSummary: function() { return getSheetById(0); },
  getPoints: function() { return getSheetById(3612003); },
  getLog: function() { return getSheetById(150247565); },
  getReconcileClan: function() { return getSheetById(1390751735); },
  getRanks: function() { return getSheetById(1607822050); },
  getArchive: function() { return getSheetById(1014502689); },
  getSettings: function() { return getSheetById(1268716369); },
  getFc: function() { return getSheetByIds(this.fcRankSheetIds); },
  
  isPoints: function(sheet) { return sheet.getSheetId()==3612003; },
  isReconcileClan: function(sheet) { return sheet.getSheetId()==1390751735; },
  isRanks: function(sheet) { return sheet.getSheetId()==1607822050; },
}

function getSheetByIds(ids) {
  for ( var i in ids ) {
    var sheet = tryGetSheetById(ids[i]);
    if ( sheet != null )
      return sheet;
  }
  throw "Sheet with ID in "+ids+" not found";
}

function getSheetById(id) {
  var sheet = tryGetSheetById(id);
  if ( sheet == null )
    throw "Sheet with ID="+id+" not found";
  return sheet;
}

function tryGetSheetById(id) {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for ( var i in sheets ) {
    var sheet = sheets[i];
    if ( sheet.getSheetId() == id )
      return sheet;
  }
  return null;
}

/** Clan reconciliation sheet */
var CRSFormat = {
  headerRows: 1,
  oldNameCol: 1,
  oldNameActionCol: 2,  // Must be oldNameCol+1
  newNameCol: 4,
  newNameActionCol: 5,  // Must be newNameCol+1
  newNameHiddenCol: 6,
  
  leftClan: "*Left clan",
  notNow: "*Don't reconcile for now",
  
  add: "Add",
  dontAdd: "Don't add",
}

/** Rank reconciliation sheet */
var RRSFormat = {
  headerRows: 2,
  nameCol: 1,
  rankCol: 2,
  newRankCol: 3,
  rsRankCol: 4,
  actionCol: 5,
  
  changeRank: "Change rank to ",
}

/** FC Ranks sheet */
var FCSFormat = {
  headerRows: 2,
}
