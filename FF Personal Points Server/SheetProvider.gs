var SheetProvider = {
  fcRankSheetIds: [1025920167/*Live*/, 100122507/*Sandbox*/, 1602679235/*Dev*/],
  
  getSummary: function() { return this.getSheetById(0); },
  getPoints: function() { return this.getSheetById(3612003); },
  getLog: function() { return this.getSheetById(150247565); },
  getReconcileClan: function() { return this.getSheetById(1390751735); },
  getRanks: function() { return this.getSheetById(1607822050); },
  getArchive: function() { return this.getSheetById(1014502689); },
  getSettings: function() { return this.getSheetById(1268716369); },
  getSpreadsheet: function() { return SpreadsheetApp.openById("1h63WWTylD8gjSzJRwwD4t9dl5Rw2epaA_hszd2u_s_U"); },
  
  getSheetById: function(id) {
    var sheet = this.tryGetSheetById(id);
    if ( sheet == null )
      throw "Sheet with ID="+id+" not found";
    return sheet;
  },
  
  tryGetSheetById: function(id) {
    var sheets = this.getSpreadsheet().getSheets();
    for ( var i in sheets ) {
      var sheet = sheets[i];
      if ( sheet.getSheetId() == id )
        return sheet;
    }
    return null;
  }
}
