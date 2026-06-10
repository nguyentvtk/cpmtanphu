/**
 * CPM 5.0 — Google Apps Script
 * Response Helper: chuẩn hóa toàn bộ JSON response
 * Layer: 02_Process/api
 */

const Response = (() => {
  function _build(status, data, message) {
    return {
      status,
      data: data || null,
      message: message || '',
      timestamp: new Date().toISOString()
    };
  }

  function success(data, message = 'Thành công') {
    return _build('success', data, message);
  }

  function error(message = 'Đã xảy ra lỗi', code = 500) {
    return _build('error', null, message);
  }

  function created(data, message = 'Tạo mới thành công') {
    return _build('success', data, message);
  }

  function updated(data, message = 'Cập nhật thành công') {
    return _build('success', data, message);
  }

  function deleted(message = 'Xóa thành công') {
    return _build('success', null, message);
  }

  return { success, error, created, updated, deleted };
})();
