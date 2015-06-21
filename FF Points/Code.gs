function myOnOpen() {
  try {
    LibFFPoints.enterCriticalSection();
    LibFFPoints.libOnOpen();
  } catch ( e ) {
    Logger.log(e);
    SpreadsheetApp.getActive().toast(e);
  }
}

function onEdit(e) {
  try {
    LibFFPoints.enterCriticalSection();
    LibFFPoints.onEdit(e);
  } catch ( ex ) {
    Logger.log(ex);
    SpreadsheetApp.getActive().toast(ex);
  }
}

/** Run by trigger */
function recordXp() {
  LibFFPoints.enterCriticalSection();
  LibFFPoints.recordXp();
}

/** Run by trigger */
function archive() {
  LibFFPoints.enterCriticalSection();
  LibFFPoints.archive();
}

function runFormCallback(formObject) {
  var funcName = formObject.funcName;
  LibFFPoints.enterCriticalSection();
  return LibFFPoints[funcName].apply(this, arguments);
}
