/**
Fetch clan from runescape.com ignoring cache.<br>
Fetching clan list from runescape.com can take awhile, so DocumentLock is released
while talking to runescape.com and then relocked.  This means that another user
or script CAN CHANGE THE SPREADSHEET while this function is running.
*/
function forceFetchClan() {
  CacheService.getDocumentCache().remove("clan");
  return fetchClan();
}

/**
Fetch clan from runescape.com or cache.<br>
Fetching clan list from runescape.com can take awhile, so DocumentLock is released
while talking to runescape.com and then relocked.  This means that another user
or script CAN CHANGE THE SPREADSHEET while this function is running.
*/
function fetchClan() {
  return new Clan(fetchClanList());
}

function getClanFromSpreadsheet() {
  var pointsSheet = SheetProvider.getPoints();
  var clanCount = pointsSheet.getDataRange().getNumRows()-1;
  var dataRange = pointsSheet.getRange(2,1,clanCount, 5);
  var data = dataRange.getValues();
  var clanArray = [];
  for ( var i in data ) {
    var clanmate = new Clanmate(data[i][0], data[i][1], data[i][4], data[i][3], data[i][2]);
    clanArray.push(clanmate);
  }
  return new Clan(clanArray);
}

function Clan(clanArray) {
  this.clanArray = clanArray;
  this.clanMap = {};
  
  clanArray.sort(function(a,b){return a.name.toLowerCase().localeCompare(b.name.toLowerCase());})
  
  for ( var i in clanArray ) {
    var clanmate = clanArray[i];
    this.clanMap[clanmate.name.toLowerCase()] = clanmate;
  }
  this.asList = function() { return this.clanArray; }
  this.asMap = function() { return this.clanMap; }
}

function Clanmate(name, rank, xp, points, fcRank) {
  this.name = name;
  this.rank = rank;
  this.xp = xp;
  this.points = points;
  this.fcRank = fcRank;
}

Clanmate.prototype.toString = function() {
  return "[" + this.name + "(" + this.rank + ")]";
}

/**
Returns array of Clanmate objects, sorted by name.<br>
Fetching clan list from runescape.com can take awhile, so DocumentLock is released
while talking to runescape.com and then relocked.  This means that another user
or script CAN CHANGE THE SPREADSHEET while this function is running.
*/
function fetchClanList() {
  var cache = CacheService.getDocumentCache();
  var cachedResponse = cache.get("clan");
  var csv;
  if ( cachedResponse != null ) {
    csv = cachedResponse;
  } else {
    var isInCritSection = isInCriticalSection();
    if ( isInCritSection )
      exitCriticalSection();
    try {
      var response = UrlFetchApp.fetch("http://services.runescape.com/m=clan-hiscores/members_lite.ws?clanName=Fish+Flingers");
    } finally {
      if ( isInCritSection )
        enterCriticalSection();
    }
    var responseCode = response.getResponseCode();
    if ( responseCode != 200  )
      throw "Error fetching clan list from runescape.com.  Response code = " + responseCode;
    csv = response.getContentText();
  }
  var lines = csv.split(/[\r\n]+/);
  var clanArray = [];
  for ( var i in lines ) {
    var line = lines[i].split(/\s*,\s*/);
    if ( i == 0 ) {
      var sLine = line.join(",");
      if ( sLine == "Clanmate,Clan Rank,Total XP,Kills" )
        continue;
      throw "Unexpected clan list header: " + lines[i];
    }
    if ( line.length==1 && line[0]=="" )
      continue;  // Last line is empty
    if ( line.length!=4 )
      throw "Unexpected clanmate format: " + lines[i] +'/';
    var name = line[0].replace(/�/g,' ');
    var clanmate = new Clanmate(name, line[1], line[2]);
    clanArray.push(clanmate);
    
    if ( cachedResponse == null ) {
      cache.put("clan", csv, 10*60);
    }
  }
  
  return clanArray;
}
