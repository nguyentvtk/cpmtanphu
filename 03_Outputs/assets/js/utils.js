/**
 * CPM 5.0 — Utility Functions
 * Các hàm tiện ích dùng chung toàn ứng dụng
 */
const Utils = (() => {

  function toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const id      = 'toast_' + Date.now();
    const icons   = { success: 'check-circle-fill', danger: 'x-circle-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' };
    const icon    = icons[type] || 'info-circle-fill';

    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <i class="bi bi-${icon}"></i> ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `);

    setTimeout(() => document.getElementById(id)?.remove(), 4000);
  }

  function formatCurrency(val) {
    if (!val) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch { return dateStr; }
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  return { toast, formatCurrency, formatDate, isOverdue };
})();
