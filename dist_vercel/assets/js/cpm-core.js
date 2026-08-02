/**
 * CPM Dashboard — Core Data Layer (dùng chung cho dashboard.html & bao-cao-nhanh.html)
 * ---------------------------------------------------------------------------
 * KHÔNG sửa đổi bất kỳ file nào của repo cpmtanphu / qlcl-tqt.
 * Chỉ GỌI LẠI đúng API Apps Script mà webapp hiện hành đang dùng:
 *   POST { action:'list'|'batch_list'|'create', sheet:'duan'|'nhansu'|'baocao'|'gantt', ... }
 * ---------------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CẤU HÌNH
  // ─────────────────────────────────────────────────────────────────────────
  var DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzdxuW6aD150_1xwTFf1ZRZ5v9BvI0I1A3BvsFPMyAT17k9QjChGPD-tidg2LYgb1HU/exec';
  var SHEET_ID        = '1LsaccoqTu3sRaElEWVdCZjXlzRL_2N2DPPP3UiInDEk';

  var CFG = {
    apiUrl: (function () {
      try { return localStorage.getItem('cpm_api_url') || DEFAULT_API_URL; }
      catch (e) { return DEFAULT_API_URL; }
    })(),
    sheetId: SHEET_ID,
    cacheMs: 60000,
    reportDeadlineDays: 7   // quá 7 ngày kể từ báo cáo gần nhất => cảnh báo
  };

  function setApiUrl(url) {
    CFG.apiUrl = url;
    try { localStorage.setItem('cpm_api_url', url); } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. TIỆN ÍCH CHUNG
  // ─────────────────────────────────────────────────────────────────────────

  /** Bỏ dấu tiếng Việt + lowercase + bỏ ký tự không phải chữ/số */
  function norm(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /** So khớp tên người (bỏ dấu, bỏ khoảng trắng thừa) */
  function sameName(a, b) {
    var na = norm(a), nb = norm(b);
    return !!na && !!nb && (na === nb || na.indexOf(nb) >= 0 || nb.indexOf(na) >= 0);
  }

  /**
   * Lấy giá trị 1 trường theo danh sách "từ khoá chuẩn hoá".
   * Hoạt động với cả key camelCase (maDA, tongMucDauTu) lẫn key tiếng Việt
   * ("Tổng mức đầu tư (đ)") do API có thể trả về khác nhau giữa các sheet.
   */
  function pick(obj, candidates, opts) {
    if (!obj) return '';
    opts = opts || {};
    var keys = Object.keys(obj);
    var i, j, c, k;
    // Vòng 1: khớp chính xác sau chuẩn hoá
    for (i = 0; i < candidates.length; i++) {
      c = norm(candidates[i]);
      for (j = 0; j < keys.length; j++) {
        if (norm(keys[j]) === c) {
          if (obj[keys[j]] !== '' && obj[keys[j]] != null) return obj[keys[j]];
        }
      }
    }
    // Vòng 2: khớp "chứa" (trừ khi bị cấm bởi opts.exclude)
    for (i = 0; i < candidates.length; i++) {
      c = norm(candidates[i]);
      for (j = 0; j < keys.length; j++) {
        k = norm(keys[j]);
        if (k.indexOf(c) >= 0) {
          if (opts.exclude && opts.exclude.some(function (x) { return k.indexOf(norm(x)) >= 0; })) continue;
          if (obj[keys[j]] !== '' && obj[keys[j]] != null) return obj[keys[j]];
        }
      }
    }
    return '';
  }

  /** Chuỗi tiền tệ VN ("2.812.044.000", "1,5", 1500) → Number */
  function toNum(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = String(v).trim().replace(/[^\d.,-]/g, '');
    if (!s) return 0;
    var lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
    if (lastDot >= 0 && lastComma >= 0) {
      // Dấu xuất hiện sau cùng là dấu thập phân
      if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (lastComma >= 0) {
      // Chỉ có dấu phẩy: nếu nhóm 3 chữ số đều đặn → phân cách nghìn
      s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if (lastDot >= 0) {
      s = /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s;
    }
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  /** Parse ngày: "12/06/2026", "2026-06-12", Date, ISO string → Date | null */
  function toDate(v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    var s = String(v).trim();
    var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);      // dd/mm/yyyy
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);                       // yyyy-mm-dd
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function fmtDate(d) {
    d = toDate(d);
    if (!d) return '—';
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function toISO(d) {
    d = toDate(d) || new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function daysBetween(a, b) {
    a = toDate(a); b = toDate(b);
    if (!a || !b) return null;
    return Math.floor((b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0)) / 86400000);
  }

  /** 920000000 → "920.000.000" */
  function fmtVND(n) {
    n = toNum(n);
    return Math.round(n).toLocaleString('vi-VN');
  }

  /** 920000000 → "920,0 tr" | "9,65 tỷ" — gọn cho thẻ KPI */
  function fmtShort(n) {
    n = toNum(n);
    var abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ';
    if (abs >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr';
    return fmtVND(n);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. API CLIENT (giống hệt cpmtanphu — POST, không set Content-Type)
  // ─────────────────────────────────────────────────────────────────────────
  function apiPost(body, timeoutMs) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 45000) : null;

    return fetch(CFG.apiUrl, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json && json.status === 'error') throw new Error(json.message || 'Lỗi API');
        return json ? json.data : null;
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function cacheGet(key) {
    try {
      var raw = sessionStorage.getItem('cpmdash_' + key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t < CFG.cacheMs) return o.d;
    } catch (e) {}
    return null;
  }
  function cacheSet(key, data) {
    try { sessionStorage.setItem('cpmdash_' + key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
  }
  function cacheClear(key) {
    try {
      if (key) sessionStorage.removeItem('cpmdash_' + key);
      else Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf('cpmdash_') === 0) sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  function list(sheet, useCache) {
    if (useCache !== false) {
      var c = cacheGet(sheet);
      if (c) return Promise.resolve(c);
    }
    return apiPost({ action: 'list', sheet: sheet }).then(function (d) {
      d = d || [];
      cacheSet(sheet, d);
      return d;
    });
  }

  function batchList(sheets, useCache) {
    var result = {}, missing = [];
    sheets.forEach(function (s) {
      var c = (useCache !== false) ? cacheGet(s) : null;
      if (c) result[s] = c; else missing.push(s);
    });
    if (!missing.length) return Promise.resolve(result);

    return apiPost({ action: 'batch_list', sheets: missing })
      .then(function (batch) {
        Object.keys(batch || {}).forEach(function (s) {
          result[s] = batch[s] || [];
          cacheSet(s, result[s]);
        });
        // Sheet nào batch không trả về → gọi lẻ
        var still = missing.filter(function (s) { return !result[s]; });
        if (!still.length) return result;
        return Promise.all(still.map(function (s) {
          return list(s, false).then(function (d) { result[s] = d; }).catch(function () { result[s] = []; });
        })).then(function () { return result; });
      })
      .catch(function () {
        // batch_list không hỗ trợ → fallback gọi tuần tự
        return Promise.all(missing.map(function (s) {
          return list(s, useCache).then(function (d) { result[s] = d; }).catch(function () { result[s] = []; });
        })).then(function () { return result; });
      });
  }

  function create(sheet, data) {
    return apiPost({ action: 'create', sheet: sheet, data: data })
      .then(function (r) { cacheClear(sheet); return r; });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CHUẨN HOÁ BẢN GHI
  // ─────────────────────────────────────────────────────────────────────────

  /** Sheet "Dự án" (A→V) */
  function mapProject(p) {
    var tongMuc = toNum(pick(p, ['tongMucDauTu', 'Tổng mức đầu tư']));
    var soGiaiNgan = toNum(pick(p, ['soGiaiNgan', 'Số giải ngân', 'giaiNgan', 'disbursed'], { exclude: ['tyle', 'ratio'] }));
    var tyLeRaw = pick(p, ['tyLeGiaiNgan', 'Tỷ lệ giải ngân', 'tyLe']);
    var tyLe = toNum(tyLeRaw);
    if (tyLe > 1.5) tyLe = tyLe / 100;                                  // sheet ghi 38 thay vì 0,38
    if (!tyLe && tongMuc > 0) tyLe = soGiaiNgan / tongMuc;              // tự tính nếu trống
    if (!soGiaiNgan && tyLe && tongMuc) soGiaiNgan = tyLe * tongMuc;

    var sources = {
      'Chuẩn bị đầu tư':        toNum(pick(p, ['nguonCBDT', 'Nguồn Chuẩn bị đầu tư'])),
      'NS tập trung':           toNum(pick(p, ['nguonNSTT', 'Nguồn NS tập trung'])),
      'Thu tiền SDĐ':           toNum(pick(p, ['nguonThuSDD', 'Nguồn thu tiền SDĐ'], { exclude: ['tangthu'] })),
      'Tăng thu SDĐ tỉnh bổ sung': toNum(pick(p, ['nguonTangThuSDD', 'Nguồn tăng thu tiền SDĐ tỉnh bổ sung'])),
      'Vốn tỉnh (XSKT)':        toNum(pick(p, ['vonTinhXSKT', 'Vốn tỉnh (XSKT)', 'Vốn tỉnh']))
    };

    return {
      raw: p,
      maDA:            String(pick(p, ['maDA', 'Mã DA', 'Mã dự án']) || '').trim(),
      tenDA:           String(pick(p, ['tenDA', 'Tên dự án']) || '').trim(),
      moTa:            String(pick(p, ['moTa', 'Mô tả dự án']) || '').trim(),
      namThucHien:     String(pick(p, ['namThucHien', 'Năm thực hiện']) || '').trim(),
      phuTrachKT:      String(pick(p, ['phuTrachKT', 'Phụ trách kỹ thuật']) || '').trim(),
      phuTrachKeToan:  String(pick(p, ['phuTrachKeToan', 'Phụ trách kế toán']) || '').trim(),
      ngayBatDau:      toDate(pick(p, ['ngayBatDau', 'Ngày bắt đầu'])),
      ngayKetThuc:     toDate(pick(p, ['ngayKetThuc', 'Ngày kết thúc'])),
      trangThai:       String(pick(p, ['trangThai', 'Trạng thái dự án', 'Trạng thái']) || 'Chưa triển khai').trim(),
      tongMucDauTu:    tongMuc,
      tongGTQuyetToan: toNum(pick(p, ['tongGTQuyetToan', 'Tổng GT Quyết toán'])),
      nguonVon:        sources,
      loaiDA:          String(pick(p, ['loaiDA', 'Loại Dự án', 'Loại dự án']) || 'Khác').trim() || 'Khác',
      ghiChu:          String(pick(p, ['ghiChu', 'Ghi chú']) || '').trim(),
      soGiaiNgan:      soGiaiNgan,
      tyLeGiaiNgan:    tyLe,
      giaiDoan:        String(pick(p, ['giaiDoanHienTai', 'Giai đoạn hiện tại', 'giaiDoan']) || '').trim()
    };
  }

  /** Sheet "Báo cáo" */
  function mapReport(r) {
    return {
      raw: r,
      id:        String(pick(r, ['id', 'maBC', 'Mã Báo Cáo']) || '').trim(),
      ngay:      toDate(pick(r, ['date', 'ngayBaoCao', 'Ngày Báo Cáo'])),
      maDA:      String(pick(r, ['maDA', 'Mã Dự Án']) || '').trim(),
      tenDA:     String(pick(r, ['tenDA', 'Tên Dự Án']) || '').trim(),
      maNV:      String(pick(r, ['maNV', 'Mã Nhân Viên']) || '').trim(),
      maCT:      String(pick(r, ['maCT', 'Mã công tác']) || '').trim(),
      hangMuc:   String(pick(r, ['workItem', 'Hạng Mục Thi Công']) || '').trim(),
      tienDo:    toNum(pick(r, ['progressPercent', 'Tiến độ'])),
      giaiNganTr: toNum(pick(r, ['disbursementAmount', 'Giải Ngân'])),
      vuongMac:  String(pick(r, ['issues', 'Khó Khăn Vướng Mắc']) || '').trim(),
      hinhAnh:   String(pick(r, ['imageUri', 'Hình Ảnh Hiện Trường']) || '').trim(),
      thoiTiet:  String(pick(r, ['weather', 'Thời Tiết']) || '').trim(),
      congNhan:  toNum(pick(r, ['laborCount', 'Số Lượng Công Nhân'])),
      chatLuong: String(pick(r, ['qualityInspection', 'Kiển Định Chất Lượng', 'Kiểm Định Chất Lượng']) || '').trim(),
      ghiChu:    String(pick(r, ['notes', 'Ghi Chú']) || '').trim()
    };
  }

  /** Sheet "Nhân sự" */
  function mapStaff(s) {
    return {
      raw: s,
      maNV:     String(pick(s, ['maNV', 'Mã NV']) || '').trim(),
      hoTen:    String(pick(s, ['hoTen', 'Họ tên']) || '').trim(),
      email:    String(pick(s, ['email', 'Email']) || '').trim(),
      phone:    String(pick(s, ['phone', 'sdt', 'Số điện thoại']) || '').trim(),
      chucVu:   String(pick(s, ['chucVu', 'Chức vụ']) || '').trim(),
      phongBan: String(pick(s, ['phongBan', 'Phòng ban']) || '').trim(),
      role:     String(pick(s, ['role', 'phanQuyen', 'Phân quyền']) || '').trim()
    };
  }

  /** Sheet "Gantt" */
  function mapGantt(g) {
    return {
      raw: g,
      maDA:       String(pick(g, ['maDA', 'Mã dự án']) || '').trim(),
      maCT:       String(pick(g, ['maCT', 'Mã công tác']) || '').trim(),
      tenCT:      String(pick(g, ['tenCT', 'Tên công tác']) || '').trim(),
      ngayBatDau: toDate(pick(g, ['ngayBatDau', 'Ngày bắt đầu'])),
      ngayKetThuc: toDate(pick(g, ['ngayKetThuc', 'Ngày kết thúc'])),
      giaTri:     toNum(pick(g, ['giaTriCT', 'Giá trị công tác'])),
      trangThai:  String(pick(g, ['trangThai', 'Trạng thái']) || '').trim()
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. NGHIỆP VỤ: PHÁT HIỆN TRỄ BÁO CÁO (mốc 7 ngày)
  // ─────────────────────────────────────────────────────────────────────────

  /** Trạng thái dự án BẮT BUỘC phải báo cáo định kỳ */
  function requiresReport(project) {
    var t = norm(project.trangThai);
    return t.indexOf('dangthuchien') >= 0 || t.indexOf('chamtiendo') >= 0 || t.indexOf('tamngung') >= 0;
  }

  /**
   * Tính tình trạng cập nhật báo cáo cho từng dự án.
   * @returns [{ project, lastReport, lastDate, daysLate, overdue, owners:[{hoTen,email,vaiTro}] }]
   */
  function computeReportStatus(projects, reports, staff, today, deadlineDays) {
    today = toDate(today) || new Date();
    deadlineDays = deadlineDays || CFG.reportDeadlineDays;

    var byProject = {};
    reports.forEach(function (r) {
      if (!r.maDA) return;
      var k = String(r.maDA).trim();
      if (!byProject[k]) byProject[k] = [];
      byProject[k].push(r);
    });
    Object.keys(byProject).forEach(function (k) {
      byProject[k].sort(function (a, b) { return (b.ngay ? b.ngay.getTime() : 0) - (a.ngay ? a.ngay.getTime() : 0); });
    });

    function findStaff(name) {
      for (var i = 0; i < staff.length; i++) if (sameName(staff[i].hoTen, name)) return staff[i];
      return null;
    }

    return projects.map(function (p) {
      var rs   = byProject[p.maDA] || [];
      var last = rs.length ? rs[0] : null;
      var lastDate = last ? last.ngay : null;
      // Chưa có báo cáo nào → tính mốc từ ngày bắt đầu dự án
      var anchor = lastDate || p.ngayBatDau;
      var days = anchor ? daysBetween(anchor, new Date(today.getTime())) : null;

      var owners = [];
      [[p.phuTrachKT, 'Phụ trách kỹ thuật'], [p.phuTrachKeToan, 'Phụ trách kế toán']].forEach(function (pair) {
        if (!pair[0]) return;
        var s = findStaff(pair[0]);
        owners.push({ hoTen: pair[0], vaiTro: pair[1], email: s ? s.email : '', maNV: s ? s.maNV : '' });
      });

      var mustReport = requiresReport(p);
      return {
        project:    p,
        lastReport: last,
        lastDate:   lastDate,
        reportCount: rs.length,
        daysLate:   days,
        mustReport: mustReport,
        overdue:    mustReport && days != null && days > deadlineDays,
        owners:     owners
      };
    });
  }

  /** Gom cảnh báo theo từng nhân sự để soạn email */
  function groupOverdueByStaff(statuses) {
    var map = {};
    statuses.filter(function (s) { return s.overdue; }).forEach(function (s) {
      s.owners.forEach(function (o) {
        var key = norm(o.hoTen) || o.email;
        if (!key) return;
        if (!map[key]) map[key] = { hoTen: o.hoTen, email: o.email, maNV: o.maNV, items: [] };
        if (!map[key].email && o.email) map[key].email = o.email;
        map[key].items.push({
          maDA: s.project.maDA,
          tenDA: s.project.tenDA,
          vaiTro: o.vaiTro,
          lastDate: s.lastDate,
          daysLate: s.daysLate,
          reportCount: s.reportCount,
          tienDo: s.lastReport ? s.lastReport.tienDo : 0
        });
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.items.length - a.items.length; });
  }

  /** Dự án mà 1 nhân sự phụ trách (theo cột E hoặc F sheet Dự án) */
  function projectsOf(projects, hoTen) {
    return projects.filter(function (p) {
      return sameName(p.phuTrachKT, hoTen) || sameName(p.phuTrachKeToan, hoTen);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. TẢI TOÀN BỘ DỮ LIỆU
  // ─────────────────────────────────────────────────────────────────────────
  function loadAll(useCache) {
    return batchList(['duan', 'nhansu', 'baocao', 'gantt'], useCache).then(function (d) {
      return {
        projects: (d.duan   || []).map(mapProject).filter(function (p) { return p.maDA || p.tenDA; }),
        staff:    (d.nhansu || []).map(mapStaff).filter(function (s) { return s.maNV || s.hoTen; }),
        reports:  (d.baocao || []).map(mapReport).filter(function (r) { return r.maDA || r.id; }),
        gantt:    (d.gantt  || []).map(mapGantt).filter(function (g) { return g.maDA; })
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  global.CPM = {
    CFG: CFG, setApiUrl: setApiUrl,
    norm: norm, sameName: sameName, pick: pick,
    toNum: toNum, toDate: toDate, fmtDate: fmtDate, toISO: toISO, daysBetween: daysBetween,
    fmtVND: fmtVND, fmtShort: fmtShort, esc: esc,
    apiPost: apiPost, list: list, batchList: batchList, create: create, cacheClear: cacheClear,
    mapProject: mapProject, mapReport: mapReport, mapStaff: mapStaff, mapGantt: mapGantt,
    requiresReport: requiresReport, computeReportStatus: computeReportStatus,
    groupOverdueByStaff: groupOverdueByStaff, projectsOf: projectsOf,
    loadAll: loadAll
  };
})(typeof window !== 'undefined' ? window : globalThis);
