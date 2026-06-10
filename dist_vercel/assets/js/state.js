/**
 * CPM 5.0 — State Management
 * Lưu trữ trạng thái runtime của ứng dụng
 */
const State = (() => {
  const _store = {};
  const set    = (key, val) => { _store[key] = val; };
  const get    = (key)      => _store[key];
  const clear  = (key)      => { delete _store[key]; };
  const getAll = ()         => ({ ..._store });
  return { set, get, clear, getAll };
})();
