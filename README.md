# FF-Points (Fish Flingers clan points)

## Overview
FF Points project consists of four components:

1. "FF Points" - A bit of JavaScript from the Spreadsheet itself.
2. "LIB FF Points" - Most of JavaScript.  It lives in a library and is separate from the spreadsheet.  Libraries provide a convinient way to test changes before deploying them.  Also integration with source control currently works only with libraries.
3. "FF Personal Points" - A tool to allow clanmates to see their current points without seeing other clannie's points.
4. "FF Personal Points Server" - Used by "FF Personal Points" in order to get rid of the "manage your spreadsheets" authorization.

## Source control integration
To create local development environment:

1. Request "edit" access to the project by emailing to cosk.rs@gmail.com or asking in game.  Alternatively edit this GIT repository and ask Cosk to publish it to Google Apps.
2. Install Eclipse for Java developers (or any other flavor of Eclipse).
3. Install Google Plugin for Eclipse.  Uncheck all "Android" stuff if possible.  Android dev environment is hundreds of megabytes and you don't need it for Google Apps projects.
4. You would need EGit plugin for Eclipse.  It is likely preinstalled with the Eclipse flavor you picked.
