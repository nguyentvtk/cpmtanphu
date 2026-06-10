/**
 * CPM 5.0 — Google Apps Script
 * Business Logic: Quản lý Dự án (Projects)
 * Layer: 02_Process/logic
 */

const CONFIG   = JSON.parse(DriveApp.getFilesByName('spreadsheet_config.json').next().getBlob().getDataAsString());
const SS       = SpreadsheetApp.openById(CONFIG.spreadsheet.id);

// ─── Helper ──────────────────────────────────────────────────────────────────
function _getSheet(name) {
  const sh = SS.getSheetByName(name);
  if (!sh) throw new Error(`Sheet "${name}" không tồn tại`);
  return sh;
}

function _sheetToObjects(sh) {
  const [headers, ...rows] = sh.getDataRange().getValues();
  return rows
    .filter(r => r[0] !== '')
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

function _generateId(prefix, sh) {
  const rows = sh.getLastRow();
  const num  = String(rows).padStart(3, '0');
  return `${prefix}-${num}`;
}

// ─── ProjectsService ─────────────────────────────────────────────────────────
const ProjectsService = (() => {
  const SHEET_NAME = 'projects';

  function list(params = {}) {
    try {
      const sh   = _getSheet(SHEET_NAME);
      const data = _sheetToObjects(sh);
      // Filter theo trangThai nếu có
      const filtered = params.trangThai
        ? data.filter(r => r.trangThai === params.trangThai)
        : data;
      return Response.success(filtered, `Tìm thấy ${filtered.length} dự án`);
    } catch (err) {
      return Response.error(err.message);
    }
  }

  function getById(id) {
    try {
      const sh   = _getSheet(SHEET_NAME);
      const data = _sheetToObjects(sh);
      const item = data.find(r => r.maDA === id);
      if (!item) return Response.error(`Không tìm thấy dự án: ${id}`);
      return Response.success(item);
    } catch (err) {
      return Response.error(err.message);
    }
  }

  function create(data) {
    try {
      const sh      = _getSheet(SHEET_NAME);
      const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      const newId   = _generateId('PRJ', sh);
      const now     = new Date().toISOString();

      const newRow  = headers.map(h => {
        if (h === 'maDA')    return newId;
        if (h === 'ngayTao') return now;
        if (h === 'nguoiTao') return Session.getActiveUser().getEmail();
        return data[h] !== undefined ? data[h] : '';
      });

      sh.appendRow(newRow);
      return Response.created({ maDA: newId, ...data });
    } catch (err) {
      return Response.error(err.message);
    }
  }

  function update(id, data) {
    try {
      const sh      = _getSheet(SHEET_NAME);
      const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      const allData = sh.getDataRange().getValues();
      const rowIdx  = allData.findIndex(r => r[0] === id);

      if (rowIdx < 1) return Response.error(`Không tìm thấy dự án: ${id}`);

      headers.forEach((h, i) => {
        if (data[h] !== undefined) sh.getRange(rowIdx + 1, i + 1).setValue(data[h]);
      });

      return Response.updated({ maDA: id, ...data });
    } catch (err) {
      return Response.error(err.message);
    }
  }

  function remove(id) {
    try {
      const sh      = _getSheet(SHEET_NAME);
      const allData = sh.getDataRange().getValues();
      const rowIdx  = allData.findIndex(r => r[0] === id);

      if (rowIdx < 1) return Response.error(`Không tìm thấy dự án: ${id}`);
      sh.deleteRow(rowIdx + 1);
      return Response.deleted(`Đã xóa dự án ${id}`);
    } catch (err) {
      return Response.error(err.message);
    }
  }

  return { list, getById, create, update, remove };
})();
