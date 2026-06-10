/**
 * CPM 5.0 — Google Apps Script
 * Entry Point: doPost — xử lý toàn bộ HTTP POST request
 * Layer: 02_Process/api
 */

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action || '';
    const sheet  = body.sheet  || '';
    const id     = body.id     || null;
    const data   = body.data   || {};

    const result = Router.dispatch({ method: 'POST', action, sheet, id, data });
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost ERROR: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify(Response.error(err.message)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
