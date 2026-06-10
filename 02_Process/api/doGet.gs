/**
 * CPM 5.0 — Google Apps Script
 * Entry Point: doGet — xử lý toàn bộ HTTP GET request
 * Layer: 02_Process/api
 */

function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action || 'list';
    const sheet  = params.sheet  || '';
    const id     = params.id     || null;

    // Phân quyền — kiểm tra session
    // const user = AuthService.verifySession(params.token);
    // if (!user) return Response.error('Unauthorized', 401);

    const result = Router.dispatch({ method: 'GET', action, sheet, id, params });
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doGet ERROR: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify(Response.error(err.message)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
