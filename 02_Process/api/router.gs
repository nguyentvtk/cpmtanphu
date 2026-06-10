/**
 * CPM 5.0 — Google Apps Script
 * Router: điều hướng request đến đúng Logic module
 * Layer: 02_Process/api
 */

const Router = (() => {
  // Map sheet name → logic handler
  const HANDLERS = {
    'projects':  ProjectsService,
    'tasks':     TasksService,
    'users':     UsersService,
    'contracts': ContractsService,
    'reports':   ReportsService
  };

  function dispatch({ method, action, sheet, id, data, params }) {
    const handler = HANDLERS[sheet];
    if (!handler) return Response.error(`Sheet không hợp lệ: "${sheet}"`);

    switch (action) {
      case 'list':   return handler.list(params);
      case 'get':    return handler.getById(id);
      case 'create': return handler.create(data);
      case 'update': return handler.update(id, data);
      case 'delete': return handler.remove(id);
      default:       return Response.error(`Action không hợp lệ: "${action}"`);
    }
  }

  return { dispatch };
})();
