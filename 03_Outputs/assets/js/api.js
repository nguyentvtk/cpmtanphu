/**
 * CPM 5.0 — Shared API Helper
 * POST-only client vì GAS redirect xóa query string khỏi GET requests.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbzdxuW6aD150_1xwTFf1ZRZ5v9BvI0I1A3BvsFPMyAT17k9QjChGPD-tidg2LYgb1HU/exec";

async function apiPost(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    // GAS yêu cầu redirect: follow và không set Content-Type thành application/json
    redirect: 'follow',
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message);
  return json.data;
}

const API = {
  list:   (sheet)            => apiPost({ action: 'list',   sheet }),
  get:    (sheet, id)        => apiPost({ action: 'get',    sheet, id }),
  create: (sheet, data)      => apiPost({ action: 'create', sheet, data }),
  update: (sheet, id, data)  => apiPost({ action: 'update', sheet, id, data }),
  delete: (sheet, id)        => apiPost({ action: 'delete', sheet, id }),
  login:  (email, password)  => apiPost({ action: 'login',  email, password })
};
