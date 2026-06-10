/**
 * CPM 5.0 — Frontend API Client
 * Wrapper gọi GAS Web App API
 * Layer: 03_Outputs/assets/js
 */

const ApiClient = (() => {
  // 🔧 Thay bằng GAS Deployment URL sau khi deploy
  const BASE_URL = window.CPM_CONFIG?.apiUrl || 'https://script.google.com/macros/s/AKfycbzdxuW6aD150_1xwTFf1ZRZ5v9BvI0I1A3BvsFPMyAT17k9QjChGPD-tidg2LYgb1HU/exec';

  async function _request(method, params = {}, body = null) {
    let url = BASE_URL;

    if (method === 'GET' && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString();
      url += '?' + qs;
    }

    const options = { method, redirect: 'follow' };
    if (body) {
      options.headers = { 'Content-Type': 'text/plain' };
      options.body    = JSON.stringify(body);
    }

    const res  = await fetch(url, options);
    const json = await res.json();

    if (json.status === 'error') throw new Error(json.message);
    return json.data;
  }

  // ─── Public Methods ───────────────────────────────────────────────────
  const list   = (sheet, filters = {}) => _request('GET', { action: 'list', sheet, ...filters });
  const getById = (sheet, id)          => _request('GET', { action: 'get', sheet, id });
  const create  = (sheet, data)        => _request('POST', {}, { action: 'create', sheet, data });
  const update  = (sheet, id, data)    => _request('POST', {}, { action: 'update', sheet, id, data });
  const remove  = (sheet, id)          => _request('POST', {}, { action: 'delete', sheet, id });

  return { list, getById, create, update, remove };
})();
