/**
 * CPM 5.0 — Main Backend Entry Point (Code.gs)
 * System Pilot | Framework: IPO | Layer: 02_Process
 * 
 * FIX: GAS redirect mất tham số Unicode.
 * Giải pháp: Frontend gửi alias ASCII → Backend mapping sang tên sheet tiếng Việt.
 */

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const SS = SpreadsheetApp.getActiveSpreadsheet();

/**
 * SHEET_ALIAS: Mapping alias ASCII (dùng trên URL) → Tên sheet thực tế (tiếng Việt)
 * Frontend chỉ cần gửi ?sheet=duan thay vì ?sheet=Dự án
 */
const SHEET_ALIAS = {
  "duan":       "Dự án",
  "goithau":    "Gói thầu",
  "hopdong":    "Hợp đồng",
  "phuluc":     "Phụ lục HĐ",
  "nghiemthu":  "Nghiệm thu",
  "nhiemvu":    "Nhiệm vụ",
  "nhansu":     "Nhân sự",
  "nhathau":    "Nhà thầu",
  "gantt":      "Gantt",
  "holidays":   "Holidays",
  "thongbao":   "Thông báo",
  "phanhoi":    "Phản hồi người dùng",
  "nhatky":     "Nhật ký hoạt động",
  "baocao":     "Báo cáo",
  "tvgs":       "Nhà thầu TVGS",
  "baocaotvgs": "Báo cáo TVGS",
  "quyettoan":  "Quyết toán DAHT",
  "qtnguonvon": "QT Nguồn vốn",
  "qtchiphi":   "QT Chi phí",
  "qtvanban":   "QT Văn bản",
  "qttaisan":   "QT Tài sản",
  "qtcongno":   "QT Công nợ",
  // ── Module Site360 ──
  "pano360":    "360",
  "360stats":   "360",
  "360map":     "360"
};

/**
 * Các sheet tự sinh mã dòng theo prefix (PREFIX-00001)
 */
const AUTO_ID_PREFIX = {
  "Quyết toán DAHT": "QT",
  "QT Nguồn vốn":    "QTNV",
  "QT Chi phí":      "QTCP",
  "QT Văn bản":      "QTVB",
  "QT Tài sản":      "QTTS",
  "QT Công nợ":      "QTCN"
};

/**
 * Mapping header tiếng Việt sang Key JSON chuẩn (Normalize)
 * Dựa trên tài liệu db_schema.md
 */
const SCHEMA_MAP = {
  "Báo cáo": {
    // Header thực tế trên Google Sheet (ưu tiên)
    "Mã Báo Cáo": "id",
    "Ngày Báo Cáo": "date",
    "Mã Dự Án": "maDA",
    "Tên Dự Án": "tenDA",
    "Mã Nhân Viên": "maNV",
    "Hạng Mục Thi Công": "workItem",
    "Tiến Độ (%)": "progressPercent",
    "Giải Ngân (tr.đ)": "disbursementAmount",
    "Khó Khăn Vướng Mắc": "issues",
    "Hình Ảnh Hiện Trường": "imageUri",
    "Thời Tiết": "weather",
    "Số Lượng Công Nhân": "laborCount",
    "Kiển Định Chất Lượng": "qualityInspection",
    "Ghi Chú": "notes",
    // Liên kết công tác Gantt (phục vụ phân tích tiến độ thực tế theo công tác)
    "Mã Công Tác (Gantt)": "maCT",
    // Biến thể header cũ (tương thích ngược)
    "Mã công tác": "maCT",
    "Mã BC": "id",
    "Ngày": "date",
    "Mã DA": "maDA",
    "Mã NV": "maNV",
    "Hạng mục": "workItem",
    "Tiến độ (%)": "progressPercent",
    "Giải ngân (tr.đ)": "disbursementAmount",
    "Vướng mắc": "issues",
    "Hình ảnh": "imageUri",
    "Ghi chú": "notes",
    "Kiểm tra chất lượng": "qualityInspection",
    "Số nhân công": "laborCount",
    "Thời tiết": "weather"
  },
  "Dự án": {
    "Mã DA": "maDA", "Tên dự án": "tenDA", "Mô tả dự án": "moTa", "Năm thực hiện": "namThucHien",
    "Phụ trách kỹ thuật": "phuTrachKT", "Phụ trách kế toán": "phuTrachKeToan", "Ngày bắt đầu": "ngayBatDau",
    "Ngày kết thúc": "ngayKetThuc", "Trạng thái dự án": "trangThai", "Tổng mức đầu tư (đ)": "tongMucDauTu",
    "Tổng GT Quyết toán (đ)": "tongGTQuyetToan", "Nguồn Chuẩn bị đầu tư (đ)": "nguonCBDT",
    "Nguồn NS tập trung (đ)": "nguonNSTT", "Nguồn thu tiền SDĐ (đ)": "nguonThuSDD",
    "Nguồn tăng thu tiền SDĐ tỉnh bổ sung (đ)": "nguonTangThuSDD", "Vốn tỉnh (XSKT) (đ)": "vonTinhXSKT",
    "Loại Dự án": "loaiDA", "File đính kèm": "file", "Ghi chú": "ghiChu"
  },
  "Gói thầu": {
    "Mã GT": "maGT", "Mã DA": "maDA", "Tên gói thầu": "tenGT", "Loại GT": "loaiGT",
    "Hình thức LCNT": "hinhThucLCNT", "Giá gói thầu": "giaGT", "Trạng thái GT": "trangThai",
    "File GT": "file", "Ghi chú GT": "ghiChu"
  },
  "Hợp đồng": {
    "Mã HĐ": "maHD", "Mã GT": "maGT", "Mã DA": "maDA", "Tên HĐ": "tenHD", "Loại HĐ": "loaiHD",
    "Nhà thầu": "nhaThau", "Ngày ký": "ngayKy", "Giá HĐ/Trúng thầu": "giaHD", "Giá quyết toán": "giaQuyetToan",
    "Lũy kế thanh toán": "luyKeThanhToan", "% LK Thanh toán": "lkPercent",
    "Ngày hiệu lực": "ngayHieuLuc", "Ngày hết hạn": "ngayHetHan",
    "Thời gian HĐ (ngày)": "thoiGian", "File HĐ": "file",
    "Trạng thái HĐ": "trangThai", "Ghi chú HĐ": "ghiChu"
  },
  "Phụ lục HĐ": {
    "Mã PLHĐ": "maPLHD", "Mã HĐ": "maHD", "Mã DA": "maDA", "Nội dung PLHĐ": "noiDung",
    "Ngày ký PLHĐ": "ngayKy", "Giá trị PLHĐ (nếu có)": "giaTriPL", "Gia hạn thời gian HĐ (nếu có)": "giaHan",
    "File PLHĐ": "file", "Ghi chú": "ghiChu", "Nhà thầu": "nhaThau"
  },
  "Nhiệm vụ": {
    "Mã nhiệm vụ": "maNV", "Mã dự án": "maDA", "Tên DA": "tenDA", "Nhóm nhiệm vụ": "nhomNV", "Mô tả nhiệm vụ": "moTa",
    "Người thực hiện": "nguoiThucHien", "Trạng thái": "trangThai", "Ưu tiên": "uuTien",
    "Ngày bắt đầu": "ngayBatDau", "Hạn chót": "hanChot", "Tiến độ (%)": "tiDo", "Ngày xong": "ngayXong",
    "File": "file", "Ghi chú": "ghiChu",
    "Gửi mail": "guiMail", "Gửi đồng bộ lịch": "guiLich"
  },
  "Nhân sự": {
    "Mã NV": "maNV", "Họ tên": "hoTen", "Email": "email", "Số điện thoại": "phone",
    "Chức vụ": "chucVu", "Phòng ban": "phongBan", "Phân quyền": "role", "Mật khẩu": "password",
    "Hình đại diện": "avatar"
  },
  "Nghiệm thu": {
    "Mã HSNT": "maHSNT", "Mã HĐ": "maHD", "Mã DA": "maDA", "Lần NT": "lanNT", "Ngày NT": "ngayNT",
    "Giá trị NT": "giaTriNT", "Trạng thái HSNT": "trangThai", "Trạng thái": "trangThai", "File": "file", "File NT": "file", "Ghi chú NT": "ghiChu", "Ghi chú": "ghiChu", "Nhà thầu": "nhaThau"
  },
  "Gantt": {
    "Mã dự án": "maDA", "Mã công tác": "maCT", "Tên công tác": "tenCT",
    "Ngày bắt đầu": "ngayBatDau", "Ngày kết thúc": "ngayKetThuc",
    "Giá trị công tác": "giaTriCT", "Người phụ trách kỹ thuật": "phuTrachKT",
    "Ghi chú": "ghiChu", "Trạng thái": "trangThai"
  },
  "Nhà thầu": {
    "Mã số Nhà thầu": "maSoNhaThau",
    "Tên Nhà thầu": "tenNhaThau",
    "Địa chỉ": "diaChi",
    "Đại diện": "daiDien"
  },
  "Nhà thầu TVGS": {
    "Mã số doanh nghiệp": "maSoDN",
    "Tên doanh nghiệp": "tenDN",
    "Email": "email",
    "Mật khẩu": "password",
    "Chu kỳ báo cáo": "chuKy",
    "Hạn nộp": "hanNop",
    "Số lần vi phạm": "soViPham",
    "Trạng thái": "trangThai",
    "Báo cáo gần nhất": "baoCaoGanNhat",
    "Cảnh báo gần nhất": "canhBaoGanNhat",
    "Ghi chú": "ghiChu"
  },
  "Báo cáo TVGS": {
    "Mã BC TVGS": "maBC",
    "Ngày": "ngay",
    "Mã số doanh nghiệp": "maSoDN",
    "Tên doanh nghiệp": "tenDN",
    "Mã HĐ": "maHD",
    "Mã DA": "maDA",
    "Hạng mục kiểm tra": "hangMuc",
    "Đánh giá chất lượng": "danhGia",
    "Vi phạm phát hiện": "viPham",
    "Kiến nghị": "kienNghi",
    "Hình ảnh": "hinhAnh",
    "Ghi chú": "ghiChu"
  },
  "Quyết toán DAHT": {
    "Mã QT": "maQT",
    "Mã DA": "maDA",
    "Tên công trình": "tenCongTrinh",
    "Năm quyết toán": "namQT",
    "Cơ quan chủ quản": "coQuanChuQuan",
    "Chủ đầu tư": "chuDauTu",
    "Cơ quan thẩm tra (Kính gửi)": "coQuanThamTra",
    "Số tờ trình": "soToTrinh",
    "Địa danh": "diaDanh",
    "Ngày lập": "ngayLap",
    "Địa điểm xây dựng": "diaDiem",
    "Thời gian KC-HT": "thoiGianKCHT",
    "Ngày nghiệm thu hoàn thành": "ngayNghiemThu",
    "Ngày đưa vào sử dụng": "ngayDuaVaoSD",
    "Đơn vị tiếp nhận": "donViTiepNhan",
    "Mã dự án (KBNN)": "maDuAnKBNN",
    "Cơ quan thanh toán": "coQuanThanhToan",
    "Loại vốn hình thành TS": "loaiVon",
    "Tổng mức đầu tư": "tongMucDauTu",
    "Tổng dự toán": "tongDuToan",
    "Giá trị đề nghị quyết toán": "giaTriQT",
    "CP thiệt hại bất khả kháng": "cpThietHai",
    "CP không tạo nên tài sản": "cpKhongTaoTS",
    "Căn cứ pháp lý bổ sung": "canCuPhapLy",
    "Người lập biểu": "nguoiLapBieu",
    "Giám đốc CĐT": "giamDoc",
    "Trạng thái": "trangThai",
    "Ghi chú": "ghiChu"
  },
  "QT Nguồn vốn": {
    "Mã dòng": "id",
    "Mã QT": "maQT",
    "Nguồn vốn": "nguonVon",
    "Năm": "nam",
    "Vốn kế hoạch": "vonKeHoach",
    "Thanh toán KLHT": "thanhToanKLHT",
    "Tạm ứng": "tamUng",
    "Vốn KH (KBNN)": "vonKeHoachKB",
    "Thanh toán KLHT (KBNN)": "thanhToanKLHTKB",
    "Tạm ứng (KBNN)": "tamUngKB",
    "Ghi chú": "ghiChu"
  },
  "QT Chi phí": {
    "Mã dòng": "id",
    "Mã QT": "maQT",
    "Nhóm": "nhom",
    "Khoản mục": "khoanMuc",
    "TMĐT duyệt": "tmdtDuyet",
    "Dự toán duyệt": "duToanDuyet",
    "Giá trị đề nghị QT": "giaTriQT",
    "Nguyên nhân tăng giảm": "nguyenNhan",
    "Ghi chú": "ghiChu"
  },
  "QT Văn bản": {
    "Mã dòng": "id",
    "Mã QT": "maQT",
    "Loại": "loai",
    "Nội dung": "noiDung",
    "Số văn bản": "soVanBan",
    "Ngày ban hành": "ngayBanHanh",
    "Cơ quan ban hành / Nhà thầu": "coQuan",
    "Ghi chú": "ghiChu"
  },
  "QT Tài sản": {
    "Mã dòng": "id",
    "Mã QT": "maQT",
    "Loại": "loai",
    "Tên tài sản": "tenTaiSan",
    "Đơn vị tính": "donViTinh",
    "Số lượng": "soLuong",
    "Giá đơn vị": "giaDonVi",
    "Tổng nguyên giá": "nguyenGia",
    "Giá trị còn lại": "giaTriConLai",
    "Ngày đưa vào sử dụng": "ngayDuaVaoSD",
    "Loại vốn": "loaiVon",
    "Đơn vị tiếp nhận": "donViTiepNhan",
    "Ghi chú": "ghiChu"
  },
  "QT Công nợ": {
    "Mã dòng": "id",
    "Mã QT": "maQT",
    "Tên đơn vị": "tenDonVi",
    "Nội dung công việc": "noiDung",
    "Giá trị đề nghị QT": "giaTriQT",
    "Vốn đã giải ngân": "daGiaiNgan",
    "Phải thu": "phaiThu",
    "Phải trả": "phaiTra",
    "Ghi chú": "ghiChu"
  },
  "Thông báo": {
    "Mã thông báo": "maTB",
    "Tiêu đề": "tieuDe",
    "Nội dung": "noiDung",
    "Thời gian": "thoiGian",
    "Đã đọc": "daDoc",
    "Loại": "loai",
    "Người nhận": "nguoiNhan"
  }
};


/**
 * Chuyển đổi alias/tên sheet thành tên sheet thật trong Spreadsheet.
 * Hỗ trợ cả alias ASCII lẫn tên tiếng Việt gốc (fallback).
 */
function resolveSheetName(input) {
  if (!input) return null;
  // 1. Thử alias trước
  if (SHEET_ALIAS[input]) return SHEET_ALIAS[input];
  // 2. Thử tên tiếng Việt gốc (fallback nếu có ai gọi trực tiếp)
  if (SS.getSheetByName(input)) return input;
  return null;
}

// ─── API ENTRY POINTS ────────────────────────────────────────────────────────

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'login';
  var token = (e && e.parameter && e.parameter.token) || '';
  var embed = (e && e.parameter && e.parameter.embed) || '0';
  if (page === 'dashboard') page = 'index';
  
  try {
    var template = HtmlService.createTemplateFromFile(page);
    template.authToken = token;
    template.isEmbedded = embed;
    try {
      template.userEmail = Session.getActiveUser().getEmail();
    } catch(err) {
      template.userEmail = '';
    }
    return template.evaluate()
      .setTitle("CPM 5.0 — Hệ thống Quản lý Dự án")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // Nếu không tìm thấy trang hoặc lỗi, mặc định về login
    try {
      var template = HtmlService.createTemplateFromFile('login');
      template.authToken = '';
      template.isEmbedded = embed;
      try { template.userEmail = Session.getActiveUser().getEmail(); } catch(err) { template.userEmail = ''; }
      return template.evaluate()
        .setTitle("Đăng nhập — CPM 5.0")
        .addMetaTag("viewport", "width=device-width, initial-scale=1")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (e2) {
      return HtmlService.createHtmlOutput("<h1>Lỗi tải giao diện</h1><p>" + err.message + "</p>");
    }
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // ─── TELEGRAM WEBHOOK: update từ Telegram Bot (nút xác nhận, lệnh /tiendo) ───
    if (body && body.update_id !== undefined) {
      try { handleTelegramUpdate_(body); } catch (tgErr) { Logger.log('Telegram update error: ' + tgErr.message); }
      return responseSuccess({ ok: true });
    }

    // ─── BRIDGE: Tương thích App Báo cáo (BQLDA Tân Phú) ───
    // App gửi payload phẳng KHÔNG có action/sheet: {maBaoCao, ngayBaoCao, maDuAn, ...}
    // => Tự động chuyển đổi key và ghi vào sheet "Báo cáo"
    if (!body.action && !body.sheet && (body.maBaoCao !== undefined || body.hangMucThiCong !== undefined)) {
      var crudBC = new CRUDService("Báo cáo");
      var mappedBC = {
        id: body.maBaoCao || '',
        date: body.ngayBaoCao || '',
        maDA: body.maDuAn || '',
        tenDA: body.tenDuAn || '',
        maNV: body.maNhanVien || '',
        workItem: body.hangMucThiCong || '',
        progressPercent: body.tienDo !== undefined ? body.tienDo : '',
        disbursementAmount: body.giaiNgan !== undefined ? body.giaiNgan : '',
        issues: body.khoKhanVuongMac || '',
        imageUri: body.hinhAnhHienTruong || '',
        weather: body.thoiTiet || '',
        laborCount: body.soLuongCongNhan !== undefined ? body.soLuongCongNhan : '',
        qualityInspection: body.kienDinhChatLuong || '',
        notes: body.ghiChu || ''
      };
      var createdBC = crudBC.create(mappedBC);
      tgNotifyCrud_('create', "Báo cáo", createdBC, { hoTen: 'App BQLDA (mã NV ' + (mappedBC.maNV || '?') + ')' });
      return responseSuccess(createdBC, "Đã ghi báo cáo vào sheet Báo cáo");
    }

    var action = (body.action || 'list').toLowerCase();
    var rawSheet = body.sheet || '';
    var id = body.id || '';
    var data = body.data || {};

    if (action === 'login') {
      return responseSuccess(AuthService.login(body.email, body.password));
    }

    if (action === 'login_tvgs') {
      return responseSuccess(AuthService.loginTVGS(body.identifier, body.password));
    }

    if (action === 'login_360') {
      return responseSuccess(AuthService.login360(body.email, body.password));
    }

    if (action === 'logout_360') {
      var propKey = 'sess360_' + (body.token || '');
      PropertiesService.getScriptProperties().deleteProperty(propKey);
      return responseSuccess(null, 'Đăng xuất thành công');
    }

    if (action === 'gantt_repair') {
      return responseSuccess(repairGanttMaCT(), "Đã sửa chữa Mã công tác Gantt");
    }

    if (action === 'tvgs_sync') {
      return responseSuccess(syncTVGSAccounts(), "Đồng bộ tài khoản TVGS thành công");
    }

    if (action === 'tvgs_check_now') {
      return responseSuccess(checkTVGSReports(), "Đã kiểm tra báo cáo TVGS");
    }

    if (action === 'tvgs_change_password') {
      return responseSuccess(changeTVGSPassword(body.maSoDN, body.oldPassword, body.newPassword), "Đổi mật khẩu thành công");
    }

    if (action === 'qt_init') {
      return responseSuccess(createQuyetToanFromProject(body.maDA), "Đã khởi tạo hồ sơ quyết toán");
    }

    if (action === 'qt_load') {
      return responseSuccess(loadQuyetToanFull(body.maQT));
    }

    if (action === 'qt_delete') {
      return responseSuccess(deleteQuyetToanFull(body.maQT), "Đã xóa hồ sơ quyết toán");
    }

    if (action === 'upload_project_file') {
      return responseSuccess(uploadProjectFile(body.maDA, body.namThucHien, body.tenDA, body.fileName, body.base64Data), "Tải file lên thành công");
    }

    if (action === 'batch_list') {
      var sheets = body.sheets || [];
      var result = {};
      for (var i = 0; i < sheets.length; i++) {
        var rawSheetName = sheets[i];
        var resolved = resolveSheetName(rawSheetName);
        if (resolved) {
          try {
            var cachedBatch = cacheGet_(resolved);
            if (cachedBatch) {
              result[rawSheetName] = stripSensitive_(resolved, cachedBatch);
            } else {
              var batchData = new CRUDService(resolved, true).list();
              cachePut_(resolved, batchData);
              result[rawSheetName] = stripSensitive_(resolved, batchData);
            }
          } catch (eSheet) {
            Logger.log("Lỗi tải sheet " + rawSheetName + ": " + eSheet.message);
            result[rawSheetName] = [];
          }
        } else {
          result[rawSheetName] = [];
        }
      }
      return responseSuccess(result);
    }

    if (action === 'send_task_email') {
      return responseSuccess(sendTaskEmail(id), "Đã gửi email");
    }

    if (action === 'sync_task_calendar') {
      return responseSuccess(syncTaskCalendar(id), "Đã đồng bộ lịch");
    }

    var sheetName = resolveSheetName(rawSheet);
    if (!sheetName) {
      return responseError("sheet='" + rawSheet + "' không hợp lệ. Alias: " + Object.keys(SHEET_ALIAS).join(', '));
    }

    // Đường đọc nhanh: dùng cache server + CRUDService chế độ chỉ đọc
    if (action === 'list') {
      var cachedList = cacheGet_(sheetName);
      if (cachedList) return responseSuccess(stripSensitive_(sheetName, cachedList));
      var listData = new CRUDService(sheetName, true).list();
      cachePut_(sheetName, listData);
      return responseSuccess(stripSensitive_(sheetName, listData));
    }
    if (action === 'get') {
      return responseSuccess(stripSensitive_(sheetName, new CRUDService(sheetName, true).get(id)));
    }

    var crud = new CRUDService(sheetName);

    switch(action) {
      case 'create': {
        var createdRec = crud.create(data);
        tgNotifyCrud_('create', sheetName, createdRec, body._actor);
        return responseSuccess(createdRec, "Tạo mới thành công");
      }
      case 'update': {
        var updatedRes = crud.update(id, data);
        tgNotifyCrud_('update', sheetName, Object.assign({}, data, { __id: id }), body._actor);
        return responseSuccess(updatedRes, "Cập nhật thành công");
      }
      case 'delete': {
        var delRes = crud.delete(id);
        tgNotifyCrud_('delete', sheetName, { __id: id }, body._actor);
        return responseSuccess(delRes, "Xóa thành công");
      }
      case 'import': return responseSuccess(crud.importData(body.dataList), "Nhập dữ liệu thành công");
      case 'getNotifications': return responseSuccess(getNotificationsForUser(params.nguoiDung || '', params.choChuaDoc === 'true'));
      case 'countUnread': return responseSuccess({count: countUnreadNotifications(params.nguoiDung || '')});
      case 'markRead': return responseSuccess(markNotificationRead(params.refId || '', params.nguoiDung || '', params.refSheet || ''));
      default:       return responseError("Action không hợp lệ: " + action);
    }
  } catch (err) {
    return responseError(err.message);
  }
}

// ─── CRUD SERVICE CLASS ──────────────────────────────────────────────────────

class CRUDService {
  constructor(sheetName, readOnly) {
    this.sheet = SS.getSheetByName(sheetName);
    if (!this.sheet) {
      try {
        this.sheet = SS.insertSheet(sheetName);
        var headers = Object.keys(SCHEMA_MAP[sheetName] || {});
        if (headers.length > 0) {
          this.sheet.appendRow(headers);
        }
        SpreadsheetApp.flush();
      } catch (err) {
        throw new Error("Không tìm thấy và không thể tạo sheet: " + sheetName + ". Chi tiết: " + err.message);
      }
    }
    this.sheetName = sheetName;
    this.map = SCHEMA_MAP[sheetName] || {};
    this.reverseMap = {};
    for (var k in this.map) {
      this.reverseMap[this.map[k]] = k;
    }
    // Chế độ chỉ đọc (list/get): bỏ qua kiểm tra & đồng bộ cột => giảm 2-4 lần
    // gọi Sheets API mỗi request, tăng tốc độ load dữ liệu rõ rệt
    if (readOnly) return;

    if (this.sheetName === "Gantt") {
      try {
        var lastCol = this.sheet.getLastColumn();
        if (lastCol < 9) {
          this.sheet.getRange(1, 9).setValue("Trạng thái");
          SpreadsheetApp.flush();
        } else {
          var val = this.sheet.getRange(1, 9).getValue();
          if (String(val).trim() === "") {
            this.sheet.getRange(1, 9).setValue("Trạng thái");
            SpreadsheetApp.flush();
          }
        }
      } catch (e) {
        Logger.log("Error in Gantt check: " + e.message);
      }
    }

    // Tự động đồng bộ các cột thiếu từ SCHEMA_MAP vào sheet thực tế
    // Lưu ý: không thêm cột nếu đã có cột khác cùng key JSON (header biến thể tương đương)
    try {
      var lastCol = this.sheet.getLastColumn();
      if (lastCol > 0) {
        var existingHeaders = this.sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
        var schemaHeaders = Object.keys(this.map);
        var sheetObj = this.sheet;
        var mapRef = this.map;
        var existingKeys = {};
        existingHeaders.forEach(function(h) {
          var k = mapRef[h];
          if (k) existingKeys[k] = true;
        });
        schemaHeaders.forEach(function(sh) {
          if (existingHeaders.indexOf(sh) === -1) {
            var key = mapRef[sh];
            if (key && existingKeys[key]) return; // đã có cột tương đương cùng key
            lastCol++;
            sheetObj.getRange(1, lastCol).setValue(sh);
            existingHeaders.push(sh);
            if (key) existingKeys[key] = true;
          }
        });
        SpreadsheetApp.flush();
      }
    } catch (e) {
      Logger.log("Error syncing columns for " + this.sheetName + ": " + e.message);
    }
  }

  cleanArrayFormulaConflicts() {
    if (this.sheetName !== "Nhiệm vụ") return;
    try {
      var lastRow = this.sheet.getLastRow();
      if (lastRow < 1) return;
      
      // Ghi đè tiêu đề cột A là giá trị tĩnh "Mã nhiệm vụ" để xóa bỏ công thức ArrayFormula cũ bị lỗi
      var titleCell = this.sheet.getRange(1, 1);
      var currentFormula = titleCell.getFormula();
      var currentValue = titleCell.getValue();
      if (currentFormula !== "" || currentValue !== "Mã nhiệm vụ") {
        titleCell.clear();
        titleCell.setValue("Mã nhiệm vụ");
        SpreadsheetApp.flush();
      }

      if (lastRow < 2) return;

      // Duyệt qua tất cả các dòng hiện tại để tự động điền ID tĩnh cho các nhiệm vụ cũ bị trống ID hoặc lỗi
      var lastCol = Math.max(1, this.sheet.getLastColumn());
      var range = this.sheet.getRange(2, 1, lastRow - 1, lastCol);
      var values = range.getValues();
      var changed = false;
      
      for (var i = 0; i < values.length; i++) {
        var rowVal = values[i];
        var idVal = String(rowVal[0]).trim();
        
        // Một dòng được coi là có dữ liệu thực sự nếu Mã dự án, Mô tả nhiệm vụ hoặc Người thực hiện có giá trị thực tế
        var maDAVal = String(rowVal[1]).trim();
        var moTaVal = String(rowVal[4]).trim();
        var nguoiNhanVal = String(rowVal[5]).trim();
        
        var hasData = (maDAVal !== "" && maDAVal.indexOf("#") !== 0) || 
                      (moTaVal !== "" && moTaVal.indexOf("#") !== 0) || 
                      (nguoiNhanVal !== "" && nguoiNhanVal.indexOf("#") !== 0);
        
        if (hasData) {
          // Nếu có dữ liệu thực sự nhưng cột ID bị trống, bị lỗi (#REF!, #ERROR!) hoặc bị gán nhầm tiêu đề
          if (idVal === "" || idVal.indexOf("#") === 0 || idVal === "Mã nhiệm vụ") {
            var num = i + 1;
            var staticId = "NV-" + String(num).padStart(5, '0');
            this.sheet.getRange(2 + i, 1).setValue(staticId);
            changed = true;
          }
        } else {
          // Nếu KHÔNG có dữ liệu thực sự nhưng cột ID lại có giá trị
          if (idVal !== "") {
            this.sheet.getRange(2 + i, 1).setValue(""); // Xóa ID trống thừa
            changed = true;
          }
        }
      }
      if (changed) {
        SpreadsheetApp.flush();
      }
    } catch (e) {
      Logger.log("Error in cleanArrayFormulaConflicts: " + e.message);
    }
  }

  list() {
    this.cleanArrayFormulaConflicts();
    var data = this.sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    var headers = data[0];
    var rows = data.slice(1);
    var map = this.map;
    var sheetName = this.sheetName;
    
    return rows
      .filter(function(row) { 
        var hasId = String(row[0]).trim() !== "" && String(row[0]).trim().indexOf("#") !== 0;
        if (!hasId) return false;
        
        if (sheetName === "Nhiệm vụ") {
          var maDAVal = String(row[1]).trim();
          var moTaVal = String(row[4]).trim();
          var nguoiNhanVal = String(row[5]).trim();
          return (maDAVal !== "" && maDAVal.indexOf("#") !== 0) || 
                 (moTaVal !== "" && moTaVal.indexOf("#") !== 0) || 
                 (nguoiNhanVal !== "" && nguoiNhanVal.indexOf("#") !== 0);
        }
        return true;
      })
      .map(function(row) {
        var obj = {};
        headers.forEach(function(h, i) {
          var cleanH = String(h).trim();
          var key = map[cleanH] || cleanH;
          var val = row[i];
          if (val instanceof Date) {
            val = Utilities.formatDate(val, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd");
          }
          if (sheetName === "Nhiệm vụ" && key === "tiDo") {
            var numericVal = parseFloat(val);
            if (!isNaN(numericVal)) {
              val = numericVal <= 1 ? Math.round(numericVal * 100) : numericVal;
            } else {
              val = 0;
            }
          }
          obj[key] = val;
        });
        return obj;
      });
  }

  get(id) {
    var data = this.list();
    var pk = this.sheetName === "Gantt" ? "maCT" : Object.values(this.map)[0];
    for (var i = 0; i < data.length; i++) {
      if (data[i][pk] == id) return data[i];
    }
    return null;
  }

  create(data) {
    cacheClear_(this.sheetName);
    this.cleanArrayFormulaConflicts();

    if (this.sheetName === "Dự án") {
      getOrCreateProjectFolder(data.maDA, data.namThucHien, data.tenDA);
    }
    
    if (this.sheetName === "Nhiệm vụ") {
      if (data.maDA && !data.tenDA) {
        data.tenDA = getTenDAByMaDA(data.maDA);
      } else if (data.tenDA && !data.maDA) {
        data.maDA = getMaDAByTenDA(data.tenDA);
      }
      if (data.tiDo !== undefined) {
        var numericVal = parseFloat(data.tiDo);
        if (!isNaN(numericVal)) {
          data.tiDo = numericVal / 100;
        }
      }
    }

    var headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
    var map = this.map;
    var sheetName = this.sheetName;
    var keyCol = Object.values(map)[0];

    var hasFormulaInKeyCol = false;
    try {
      var f1 = this.sheet.getRange(1, 1).getFormula();
      var f2 = this.sheet.getRange(2, 1).getFormula();
      if ((f1 && f1.toUpperCase().indexOf("ARRAYFORMULA") >= 0) || (f2 && f2.toUpperCase().indexOf("ARRAYFORMULA") >= 0)) {
        hasFormulaInKeyCol = true;
      }
    } catch(e) {}

    var nextId = "";
    if (sheetName === "Nhiệm vụ") {
      var maxNum = 0;
      var lastRow = this.sheet.getLastRow();
      if (lastRow >= 2) {
        var values = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < values.length; i++) {
          var val = String(values[i][0]).trim();
          var match = val.match(/^NV-(\d+)$/);
          if (match) {
            var num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        }
      }
      nextId = "NV-" + String(maxNum + 1).padStart(5, '0');
      data[keyCol] = nextId;
    } else if (sheetName === "Báo cáo") {
      // Giữ nguyên mã báo cáo nếu app đã sinh sẵn (vd: BC-20260610-1234)
      var providedId = String(data[keyCol] || '').trim();
      if (providedId !== '') {
        nextId = providedId;
      } else {
        var maxNum = 0;
        var lastRow = this.sheet.getLastRow();
        if (lastRow >= 2) {
          var values = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (var i = 0; i < values.length; i++) {
            var val = String(values[i][0]).trim();
            var match = val.match(/^BC-(\d+)$/);
            if (match) {
              var num = parseInt(match[1]);
              if (num > maxNum) maxNum = num;
            }
          }
        }
        nextId = "BC-" + String(maxNum + 1).padStart(5, '0');
      }
      data[keyCol] = nextId;
    } else if (sheetName === "Báo cáo TVGS") {
      var maxNum = 0;
      var lastRow = this.sheet.getLastRow();
      if (lastRow >= 2) {
        var values = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < values.length; i++) {
          var val = String(values[i][0]).trim();
          var match = val.match(/^TVGS-(\d+)$/);
          if (match) {
            var num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        }
      }
      nextId = "TVGS-" + String(maxNum + 1).padStart(5, '0');
      data[keyCol] = nextId;
      if (!data.ngay) {
        data.ngay = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm');
      }
    } else if (AUTO_ID_PREFIX[sheetName]) {
      var providedQTId = String(data[keyCol] || '').trim();
      if (providedQTId !== '') {
        nextId = providedQTId;
      } else {
        var prefix = AUTO_ID_PREFIX[sheetName];
        var maxNum = 0;
        var lastRow = this.sheet.getLastRow();
        if (lastRow >= 2) {
          var values = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          var re = new RegExp('^' + prefix + '-(\\d+)$');
          for (var i = 0; i < values.length; i++) {
            var m = String(values[i][0]).trim().match(re);
            if (m) {
              var num = parseInt(m[1]);
              if (num > maxNum) maxNum = num;
            }
          }
        }
        nextId = prefix + "-" + String(maxNum + 1).padStart(5, '0');
      }
      data[keyCol] = nextId;
    }

    var newRow = headers.map(function(h, idx) {
      var cleanH = String(h).trim();
      var key = map[cleanH] || cleanH;
      if (idx === 0) {
        if (sheetName === "Nhiệm vụ") {
          return nextId;
        }
        if (sheetName === "Báo cáo") {
          return nextId;
        }
        if (sheetName === "Báo cáo TVGS") {
          return nextId;
        }
        if (AUTO_ID_PREFIX[sheetName]) {
          return nextId;
        }
        if (hasFormulaInKeyCol) {
          return "";
        }
      }
      return data[key] !== undefined ? data[key] : "";
    });

    var realLastRow = getRealLastRow(this.sheet);
    this.sheet.getRange(realLastRow + 1, 1, 1, newRow.length).setValues([newRow]);

    if (sheetName === "Nhiệm vụ") {
      var tiDoColIdx = headers.indexOf("Tiến độ (%)") + 1;
      if (tiDoColIdx > 0) {
        this.sheet.getRange(realLastRow + 1, tiDoColIdx).setNumberFormat('0%');
      }
    }

    if (sheetName !== "Nhiệm vụ" && hasFormulaInKeyCol) {
      SpreadsheetApp.flush();
      var actualId = this.sheet.getRange(realLastRow + 1, 1).getValue();
      data[keyCol] = actualId;
    }

    // Hook TVGS: cập nhật "Báo cáo gần nhất" cho tài khoản nhà thầu TVGS
    if (sheetName === "Báo cáo TVGS" && data.maSoDN) {
      try { updateTVGSLastReport_(data.maSoDN); } catch (e) { Logger.log("TVGS hook error: " + e.message); }
    }

    return data;
  }

  update(id, data) {
    cacheClear_(this.sheetName);
    if (!id || String(id).trim() === "") {
      throw new Error("Không thể cập nhật bản ghi với ID rỗng!");
    }
    
    this.cleanArrayFormulaConflicts();
    
    if (this.sheetName === "Dự án") {
      var currentProj = this.get(id);
      var maDA = data.maDA || (currentProj && currentProj.maDA) || id;
      var namThucHien = data.namThucHien || (currentProj && currentProj.namThucHien);
      var tenDA = data.tenDA || (currentProj && currentProj.tenDA);
      if (maDA && tenDA) {
        getOrCreateProjectFolder(maDA, namThucHien, tenDA);
      }
    }

    if (this.sheetName === "Nhiệm vụ") {
      if (data.maDA && !data.tenDA) {
        data.tenDA = getTenDAByMaDA(data.maDA);
      } else if (data.tenDA && !data.maDA) {
        data.maDA = getMaDAByTenDA(data.tenDA);
      }
      if (data.tiDo !== undefined) {
        var numericVal = parseFloat(data.tiDo);
        if (!isNaN(numericVal)) {
          data.tiDo = numericVal / 100;
        }
      }
    }

    var headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
    var allData = this.sheet.getDataRange().getValues();
    var map = this.map;
    var sheet = this.sheet;
    
    var targetIdStr = String(id).trim();
    var sheetName = this.sheetName;
    // Sheet Gantt: khóa duy nhất là "Mã công tác" (maCT), KHÔNG phải cột A
    // (cột A là Mã dự án, trùng nhau giữa nhiều công tác cùng dự án)
    var keyColIdx = this.getKeyColIndex_(headers);
    for (var i = 1; i < allData.length; i++) {
      if (String(allData[i][keyColIdx]).trim() === targetIdStr) {
        headers.forEach(function(h, j) {
          var cleanH = String(h).trim();
          var key = map[cleanH] || cleanH;
          // KHÔNG ghi đè cột khóa: giá trị không đổi (chính là id dùng để tìm dòng),
          // và nếu cột khóa sinh bằng ARRAYFORMULA thì setValue sẽ phá công thức,
          // làm mất mã của toàn bộ các dòng khác (sự cố cột Mã công tác Gantt).
          if (j === keyColIdx) return;
          // Bảo mật: với sheet chứa mật khẩu, nếu client gửi password rỗng
          // (do API không còn trả mật khẩu cũ) thì GIỮ NGUYÊN mật khẩu hiện có,
          // không ghi đè thành chuỗi rỗng.
          if (key === "password" && SENSITIVE_SHEETS[sheetName] &&
              (data[key] === undefined || String(data[key]).trim() === "")) {
            return;
          }
          if (data[key] !== undefined) {
            var cell = sheet.getRange(i + 1, j + 1);
            cell.setValue(data[key]);
            if (key === "tiDo") {
              cell.setNumberFormat('0%');
            }
          }
        });
        return { id: id, updated: data };
      }
    }
    throw new Error("Không tìm thấy bản ghi với ID: " + id);
  }

  // Xác định cột khóa để tìm bản ghi theo ID.
  // Mặc định cột A; riêng sheet Gantt dùng cột "Mã công tác" (maCT) vì cột A
  // (Mã dự án) lặp lại giữa các công tác cùng dự án.
  getKeyColIndex_(headers) {
    if (this.sheetName !== "Gantt") return 0;
    var map = this.map;
    for (var h = 0; h < headers.length; h++) {
      if ((map[String(headers[h]).trim()] || '') === 'maCT') return h;
    }
    return 0;
  }

  delete(id) {
    cacheClear_(this.sheetName);
    if (!id || String(id).trim() === "") {
      throw new Error("Không thể xóa bản ghi với ID rỗng!");
    }

    this.cleanArrayFormulaConflicts();
    var allData = this.sheet.getDataRange().getValues();
    var targetIdStr = String(id).trim();
    var keyColIdx = this.getKeyColIndex_(allData[0] || []);
    for (var i = 1; i < allData.length; i++) {
      if (String(allData[i][keyColIdx]).trim() === targetIdStr) {
        this.sheet.deleteRow(i + 1);
        return true;
      }
    }
    throw new Error("Không tìm thấy bản ghi với ID: " + id);
  }

  importData(dataList) {
    cacheClear_(this.sheetName);
    if (!Array.isArray(dataList) || dataList.length === 0) return 0;
    
    this.cleanArrayFormulaConflicts();
    
    var headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
    var map = this.map;
    var sheet = this.sheet;
    var sheetName = this.sheetName;
    
    var hasFormulaInKeyCol = false;
    try {
      var f1 = this.sheet.getRange(1, 1).getFormula();
      var f2 = this.sheet.getRange(2, 1).getFormula();
      if ((f1 && f1.toUpperCase().indexOf("ARRAYFORMULA") >= 0) || (f2 && f2.toUpperCase().indexOf("ARRAYFORMULA") >= 0)) {
        hasFormulaInKeyCol = true;
      }
    } catch(e) {}

    // Tìm maxNum cho sheet Nhiệm vụ trước để tự sinh ID nếu bị trống
    var maxNum = 0;
    if (sheetName === "Nhiệm vụ") {
      var lastRow = this.sheet.getLastRow();
      if (lastRow >= 2) {
        var values = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < values.length; i++) {
          var val = String(values[i][0]).trim();
          var match = val.match(/^NV-(\d+)$/);
          if (match) {
            var num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        }
      }
    }

    var rowsToAdd = dataList.map(function(data) {
      if (sheetName === "Nhiệm vụ") {
        if (data.maDA && !data.tenDA) {
          data.tenDA = getTenDAByMaDA(data.maDA);
        } else if (data.tenDA && !data.maDA) {
          data.maDA = getMaDAByTenDA(data.tenDA);
        }
        var currentId = String(data.maNV || "").trim();
        if (currentId === "" || currentId.indexOf("#") === 0) {
          maxNum++;
          data.maNV = "NV-" + String(maxNum).padStart(5, '0');
        }
        if (data.tiDo !== undefined) {
          var numericVal = parseFloat(data.tiDo);
          if (!isNaN(numericVal)) {
            data.tiDo = numericVal > 1 ? numericVal / 100 : numericVal;
          }
        }
      }
      return headers.map(function(h, idx) {
        var cleanH = String(h).trim();
        var key = map[cleanH] || cleanH;
        if (idx === 0) {
          if (sheetName === "Nhiệm vụ") {
            return data.maNV;
          }
          if (hasFormulaInKeyCol) {
            return "";
          }
        }
        return data[key] !== undefined ? data[key] : "";
      });
    });
    
    var realLastRow = getRealLastRow(sheet);
    sheet.getRange(realLastRow + 1, 1, rowsToAdd.length, headers.length).setValues(rowsToAdd);
    
    if (sheetName === "Nhiệm vụ") {
      var tiDoColIdx = headers.indexOf("Tiến độ (%)") + 1;
      if (tiDoColIdx > 0) {
        sheet.getRange(realLastRow + 1, tiDoColIdx, rowsToAdd.length, 1).setNumberFormat('0%');
      }
    }
    
    return rowsToAdd.length;
  }
}

// ─── AUTH SERVICE ────────────────────────────────────────────────────────────

var AuthService = (function() {
  function login(email, password) {
    if (!email || !password) throw new Error("Vui lòng nhập Email và Mật khẩu");

    var crud = new CRUDService("Nhân sự");
    var users = crud.list();
    
    var user = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email && users[i].password == password) {
        user = users[i];
        break;
      }
    }
    
    if (!user) throw new Error("Email hoặc Mật khẩu không chính xác");
    
    // Xóa mật khẩu trước khi trả về profile
    var profile = {};
    for (var k in user) {
      if (k !== 'password') profile[k] = user[k];
    }
    
    return profile;
  }

  return { login: login };
})();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// ─── BẢO MẬT: ẩn cột mật khẩu khỏi mọi phản hồi đọc (list/get/batch_list) ──────
// Các sheet chứa mật khẩu (Nhân sự, Nhà thầu TVGS) map cột "Mật khẩu" -> key "password".
// Đăng nhập (login/loginTVGS) đọc sheet trực tiếp nên KHÔNG bị ảnh hưởng bởi hàm này.
var SENSITIVE_SHEETS = { "Nhân sự": true, "Nhà thầu TVGS": true };

function stripSensitive_(sheetName, data) {
  if (!SENSITIVE_SHEETS[sheetName] || !data) return data;
  if (Array.isArray(data)) {
    return data.map(function(row) {
      if (row && typeof row === 'object' && 'password' in row) {
        var copy = {};
        for (var k in row) { if (k !== 'password') copy[k] = row[k]; }
        return copy;
      }
      return row;
    });
  }
  if (typeof data === 'object' && 'password' in data) {
    var copy = {};
    for (var k in data) { if (k !== 'password') copy[k] = data[k]; }
    return copy;
  }
  return data;
}

function responseSuccess(data, message) {
  message = message || "Thành công";
  var result = {
    status: "success",
    data: data,
    message: message,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function responseError(message) {
  var result = {
    status: "error",
    message: message,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ─── SERVER CACHE (CacheService) — tăng tốc list/batch_list ─────────────────
// Cache JSON dữ liệu sheet 60 giây; tự xóa khi có create/update/delete/import.

function cacheGet_(sheetName) {
  try {
    var v = CacheService.getScriptCache().get('list_' + sheetName);
    return v ? JSON.parse(v) : null;
  } catch (e) { return null; }
}

function cachePut_(sheetName, data) {
  try {
    var s = JSON.stringify(data);
    if (s.length < 95000) { // giới hạn CacheService ~100KB/khóa
      CacheService.getScriptCache().put('list_' + sheetName, s, 60);
    }
  } catch (e) {}
}

function cacheClear_(sheetName) {
  try { CacheService.getScriptCache().remove('list_' + sheetName); } catch (e) {}
}

// ─── GOOGLE DRIVE PROJECT FOLDER HELPER ──────────────────────────────────────────

/**
 * Loại bỏ dấu tiếng Việt và ký tự đặc biệt, nối từ bằng dấu _
 */
function removeAccentsAndSpaces(str) {
  if (!str) return '';
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-zA-Z0-9\s]/g, '') // chỉ giữ lại chữ cái, số và khoảng trắng
            .trim()
            .replace(/\s+/g, '_'); // nối bằng dấu gạch dưới
}

/**
 * Lấy hoặc tự động tạo thư mục của từng dự án trên Drive theo quy chuẩn
 */
function getOrCreateProjectFolder(maDA, namThucHien, tenDA) {
  try {
    var rootId = "1F0ETsyLiklzeoD432CQddrcLin__d5WN";
    var parentFolder = DriveApp.getFolderById(rootId);
    var cleanName = removeAccentsAndSpaces(tenDA);
    var folderName = maDA + "_" + (namThucHien || "2026") + "_" + cleanName;
    
    var folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next().getUrl();
    }
    
    // Nếu chưa có, tiến hành tạo thư mục mới
    var newFolder = parentFolder.createFolder(folderName);
    return newFolder.getUrl();
  } catch (e) {
    Logger.log("Lỗi tạo thư mục Drive cho dự án: " + e.message);
    return "";
  }
}

/**
 * Tải file lên thư mục dự án và trả về liên kết xem trực tuyến (URL)
 */
function uploadProjectFile(maDA, namThucHien, tenDA, fileName, base64Data) {
  try {
    var rootId = "1F0ETsyLiklzeoD432CQddrcLin__d5WN";
    var parentFolder = DriveApp.getFolderById(rootId);
    var cleanName = removeAccentsAndSpaces(tenDA);
    var folderName = maDA + "_" + (namThucHien || "2026") + "_" + cleanName;
    
    var folder;
    var folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = parentFolder.createFolder(folderName);
    }
    
    var decoded = Utilities.base64Decode(base64Data.split(",")[1]);
    var blob = Utilities.newBlob(decoded, null, fileName);
    var file = folder.createFile(blob);
    return file.getUrl();
  } catch (e) {
    throw new Error("Lỗi tải file lên Drive: " + e.message);
  }
}

/**
 * Tra cứu Tên dự án dựa trên Mã dự án từ sheet "Dự án"
 */
function getTenDAByMaDA(maDA) {
  if (!maDA) return "";
  try {
    var duAnSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dự án");
    if (!duAnSheet) return "";
    var data = duAnSheet.getDataRange().getValues();
    if (data.length < 2) return "";
    // Dựa theo SCHEMA_MAP["Dự án"]: Cột A (0) là "Mã DA", Cột B (1) là "Tên dự án"
    var cleanMaDA = String(maDA).trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      var currentMaDA = String(data[i][0]).trim().toLowerCase();
      if (currentMaDA === cleanMaDA) {
        return data[i][1] || "";
      }
    }
  } catch (e) {
    Logger.log("Error in getTenDAByMaDA: " + e.message);
  }
  return "";
}

/**
 * Tra cứu Mã dự án dựa trên Tên dự án từ sheet "Dự án"
 */
function getMaDAByTenDA(tenDA) {
  if (!tenDA) return "";
  try {
    var duAnSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dự án");
    if (!duAnSheet) return "";
    var data = duAnSheet.getDataRange().getValues();
    if (data.length < 2) return "";
    // Dựa theo SCHEMA_MAP["Dự án"]: Cột A (0) là "Mã DA", Cột B (1) là "Tên dự án"
    var cleanTenDA = String(tenDA).trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      var currentTenDA = String(data[i][1]).trim().toLowerCase();
      if (currentTenDA === cleanTenDA) {
        return data[i][0] || "";
      }
    }
  } catch (e) {
    Logger.log("Error in getMaDAByTenDA: " + e.message);
  }
  return "";
}

/**
 * Tìm dòng cuối cùng thực tế chứa dữ liệu trong sheet (bằng cách quét ngược từ dưới lên)
 */
function getRealLastRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var lastCol = Math.max(1, sheet.getLastColumn());
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  for (var i = lastRow - 1; i >= 0; i--) {
    for (var j = 0; j < values[i].length; j++) {
      if (String(values[i][j]).trim() !== "") {
        return i + 1;
      }
    }
  }
  return 1;
}

// ─── TASK EMAIL & CALENDAR INTEGRATION ──────────────────────────────────────────

/**
 * Tra cứu Email của nhân viên dựa trên Họ tên từ sheet "Nhân sự"
 */
function getEmailByAssignee(hoTen) {
  if (!hoTen) return "";
  try {
    var crud = new CRUDService("Nhân sự");
    var users = crud.list();
    var cleanName = String(hoTen).trim().toLowerCase();
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].hoTen || '').trim().toLowerCase() === cleanName) {
        return users[i].email || "";
      }
    }
  } catch (e) {
    Logger.log("Error in getEmailByAssignee: " + e.message);
  }
  return "";
}

/**
 * Gửi email HTML chuẩn hóa thông báo giao nhiệm vụ mới và ghi trạng thái vào cột O (15)
 */
function sendTaskEmail(taskId) {
  var crud = new CRUDService("Nhiệm vụ");
  var task = crud.get(taskId);
  if (!task) throw new Error("Không tìm thấy nhiệm vụ!");

  var taskIdVal = task.maNV;
  var projectName = task.tenDA || getTenDAByMaDA(task.maDA);
  var description = task.moTa;
  var assignee = task.nguoiThucHien;
  var assigneeEmail = getEmailByAssignee(assignee);
  var deadlineStr = task.hanChot;

  if (!assigneeEmail || !assigneeEmail.match(/^[\w\.\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$/)) {
    throw new Error("Email của người thực hiện không hợp lệ hoặc trống!");
  }
  var deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) {
    throw new Error("Hạn chót không hợp lệ!");
  }

  // Định dạng ngày hạn chót dạng D/M/YYYY (ví dụ: 8/10/2025)
  var dd = deadline.getDate();
  var mm = deadline.getMonth() + 1;
  var yyyy = deadline.getFullYear();
  var formattedDeadline = dd + "/" + mm + "/" + yyyy;

  // Tạo link Thêm vào Google Calendar
  var yyyyStr = deadline.getFullYear();
  var mmStr = ('0' + (deadline.getMonth() + 1)).slice(-2);
  var ddStr = ('0' + deadline.getDate()).slice(-2);
  var dateCal = yyyyStr + mmStr + ddStr;

  var calTitle = encodeURIComponent("Nhiệm vụ: " + description);
  var calDetails = encodeURIComponent("Dự án: " + projectName + "\nNgười giao: Ban Giám đốc");
  var calUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + calTitle
    + "&dates=" + dateCal + "/" + dateCal
    + "&details=" + calDetails
    + "&ctz=Asia/Ho_Chi_Minh";

  // Nút Thêm vào Lịch Google
  var addCalendarButton = "<a href='" + calUrl + "' style='"
    + "background-color:#ede7f6;color:#8e24aa;padding:12px 24px;"
    + "text-decoration:none;border-radius:6px;font-size:16px;display:inline-block;margin:14px 10px 0 0;font-weight:bold;'"
    + " target='_blank'>"
    + "<span style='font-size:18px;vertical-align:middle;'>📅</span> "
    + "<b style='color:#8e24aa;'>Thêm vào Lịch Google</b>"
    + "</a>";

  // Nút Thêm vào Google Tasks
  var tasksUrl = "https://tasks.google.com/embed/list/~default";
  var addTasksButton = "<a href='" + tasksUrl + "' style='"
    + "background-color:#e3f2fd;color:#039be5;padding:12px 24px;"
    + "text-decoration:none;border-radius:6px;font-size:16px;"
    + "display:inline-block;margin:14px 0 0 0;font-weight:bold;'"
    + " target='_blank'>"
    + "<span style='font-size:18px;vertical-align:middle;'>📝</span> "
    + "<b style='color:#039be5;'>Thêm vào Google Tasks</b>"
    + "</a>";

  var addButtons = "<div style='margin:16px 0;'>" + addCalendarButton + addTasksButton + "</div>";

  var htmlBody =
    "<div style='font-family:Roboto,Arial,sans-serif;font-size:15px;color:#222'>" +
    "<div style='font-size:20px;font-weight:bold;color:#4CAF50;margin-bottom:12px;'>📋 Nhiệm vụ mới: <span style='color:#1976D2'>" + taskIdVal + "</span></div>" +
    "<p>Chào <b style='color:#1976D2'>" + assignee + " 😊</b>,</p>" +
    "<p><span style='color:#888'>Bạn được giao nhiệm vụ:</span> <b style='color:#E64A19'>" + description + "</b> <span>📌</span></p>" +
    "<p><span style='color:#888'>Thuộc Dự án:</span> <b style='color:#009688'>" + projectName + "</b> 🚧</p>" +
    "<p><span style='color:#888'>Hạn chót:</span> <b style='color:#D32F2F'>" + formattedDeadline + "</b> ⏰</p>" +
    "<p style='margin-top:12px'>Vui lòng hoàn thành đúng hạn.<br>Nếu gặp khó khăn, phản hồi trước 1 ngày.</p>" +
    addButtons +
    "<div style='font-size:13px;color:#888;margin-top:6px;'>* Nhấn <b>Thêm vào Google Tasks</b> để mở Google Tasks, sau đó copy/dán nội dung nhiệm vụ vào task mới.</div>" +
    "<hr style='border:none;border-top:1px solid #eee;margin:24px 0'>" +
    "<p style='color:#333;'>Trân trọng,<br><b style='color:#388E3C'>Ban Giám đốc 🚀</b></p>" +
    "</div>";

  // Nội dung text fallback
  var message =
    "Chào " + assignee + ",\n\n" +
    "Bạn được giao nhiệm vụ: " + description + "\n" +
    "Thuộc Dự án: " + projectName + "\n" +
    "Hạn chót: " + formattedDeadline + "\n" +
    "Vui lòng hoàn thành đúng hạn. Nếu gặp khó khăn, phản hồi trước 1 ngày.\n\n" +
    "Thêm vào Lịch Google: " + calUrl + "\n" +
    "Thêm vào Google Tasks: " + tasksUrl + "\n\n" +
    "Trân trọng,\nBan Giám đốc";

  var subject = "📋 Nhiệm vụ mới: " + taskIdVal;

  MailApp.sendEmail({
    to: assigneeEmail,
    subject: subject,
    body: message,
    htmlBody: htmlBody
  });

  // Cập nhật cột O (cột thứ 15) trên sheet "Nhiệm vụ"
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Nhiệm vụ");
  var allData = sheet.getDataRange().getValues();
  var targetIdStr = String(taskIdVal).trim();
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][0]).trim() === targetIdStr) {
      sheet.getRange(i + 1, 15).setValue(true);
      break;
    }
  }
  
  return "Đã gửi mail";
}

/**
 * Đồng bộ sự kiện vào Google Calendar mặc định, mời người nhận và ghi trạng thái vào cột P (16)
 */
function syncTaskCalendar(taskId) {
  var crud = new CRUDService("Nhiệm vụ");
  var task = crud.get(taskId);
  if (!task) throw new Error("Không tìm thấy nhiệm vụ!");

  var taskIdVal = task.maNV;
  var description = task.moTa;
  var assignee = task.nguoiThucHien;
  var assigneeEmail = getEmailByAssignee(assignee);
  var deadlineStr = task.hanChot;

  if (!assigneeEmail || !assigneeEmail.match(/^[\w\.\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$/)) {
    throw new Error("Email của người thực hiện không hợp lệ hoặc trống!");
  }
  var deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) {
    throw new Error("Hạn chót không hợp lệ!");
  }

  // Tạo event trên lịch cá nhân của tài khoản GAS và mời người nhận
  var calendar = CalendarApp.getDefaultCalendar();
  var event = calendar.createAllDayEvent(description, deadline, {
    guests: assigneeEmail,
    sendInvites: true
  });
  event.addPopupReminder(24 * 60);

  // Cập nhật cột P (cột thứ 16) trên sheet "Nhiệm vụ"
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Nhiệm vụ");
  var allData = sheet.getDataRange().getValues();
  var targetIdStr = String(taskIdVal).trim();
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][0]).trim() === targetIdStr) {
      sheet.getRange(i + 1, 16).setValue(true);
      break;
    }
  }

  return "Đã đồng bộ lịch";
}


// ========================================================================
// MODULE: THONG_BAO v2 - Tu dong tao thong bao realtime
// Ham duoc goi tu: onEditNotification (installable trigger)
// Ham WebApp: getUnreadNotifications, markNotificationRead, countUnreadNotifications
// ========================================================================

// --------------- HELPER: Tim index cot theo ten (fuzzy, bo dau) ---------------

/**
 * Chuan hoa chuoi: bo dau, lowercase, bo khoang trang thua
 * Vi du: "Phụ trách kỹ thuật" -> "phu trach ky thuat"
 */
function normalizeStr_(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\u00e0|\u00e1|\u1ea1|\u1ea3|\u00e3|\u00e2|\u1ea7|\u1ea5|\u1ead|\u1ea9|\u1eab|\u0103|\u1eb1|\u1eaf|\u1eb7|\u1eb3|\u1eb5/g, 'a')
    .replace(/\u00e8|\u00e9|\u1eb9|\u1ebb|\u1ebd|\u00ea|\u1ec1|\u1ebf|\u1ec7|\u1ec3|\u1ec5/g, 'e')
    .replace(/\u00ec|\u00ed|\u1ecb|\u1ec9|\u0129/g, 'i')
    .replace(/\u00f2|\u00f3|\u1ecd|\u1ecf|\u00f5|\u00f4|\u1ed3|\u1ed1|\u1ed9|\u1ed5|\u1ed7|\u01a1|\u1edf|\u1edd|\u1ee5|\u1ee1|\u1ee3/g, 'o')
    .replace(/\u00f9|\u00fa|\u1ee5|\u1ee7|\u0169|\u01b0|\u1eeb|\u1ee9|\u1ef1|\u1eed|\u1eef/g, 'u')
    .replace(/\u1ef3|\u00fd|\u1ef5|\u1ef7|\u1ef9/g, 'y')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tim index cot theo ten (so sanh normalizeStr_)
 * @param {Array} headers - mang ten cot
 * @param {string} colName - ten cot can tim (co the co hoac khong dau)
 * @return {number} index hoac -1
 */
function findColIdx_(headers, colName) {
  var normTarget = normalizeStr_(colName);
  for (var i = 0; i < headers.length; i++) {
    if (normalizeStr_(String(headers[i])) === normTarget) return i;
  }
  return -1;
}

// --------------- CORE: Tao va quan ly thong bao ---------------

/**
 * Tao Mao thong bao tu dong
 */
function genNotifId_() {
  var now = new Date();
  var ts = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyyMMddHHmmss');
  return 'TB' + ts + ('000' + Math.floor(Math.random() * 1000)).slice(-3);
}

/**
 * Tim sheet Thong bao (tim theo ten bat dau bang "Th" + co >= 7 cot)
 */
function getThongBaoSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    // So sanh normalizeStr_ de tim sheet "Thong bao"
    if (normalizeStr_(name) === 'thong bao') return sheets[i];
  }
  return null;
}

/**
 * Tim sheet theo ten (dung normalizeStr_)
 */
function getSheetByNorm_(normName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (normalizeStr_(sheets[i].getName()) === normName) return sheets[i];
  }
  return null;
}

/**
 * Lay danh sach nguoi phu trach Du an theo Ma DA
 * @param {string} maDA
 * @return {Array<string>} mang ten nguoi nhan
 */
function getRecipientsFromDA_(maDA) {
  if (!maDA) return [];
  var sheetDA = getSheetByNorm_('du an');
  if (!sheetDA) return [];
  
  var data = sheetDA.getDataRange().getValues();
  var headers = data[0];
  var idIdx = findColIdx_(headers, 'Ma DA');
  var ktIdx = findColIdx_(headers, 'Phu trach ky thuat');
  var ktoanIdx = findColIdx_(headers, 'Phu trach ke toan');
  
  for (var r = 1; r < data.length; r++) {
    if (idIdx >= 0 && String(data[r][idIdx]).trim() === String(maDA).trim()) {
      var recipients = [];
      if (ktIdx >= 0 && data[r][ktIdx]) recipients.push(String(data[r][ktIdx]).trim());
      if (ktoanIdx >= 0 && data[r][ktoanIdx]) recipients.push(String(data[r][ktoanIdx]).trim());
      return recipients.filter(function(v) { return v && v !== ''; });
    }
  }
  return [];
}

/**
 * Them 1 dong thong bao vao sheet Thong bao
 * Cau truc sheet Thong bao:
 *   A=Ma thong bao | B=Tieu de | C=Noi dung | D=Thoi gian | E=Da doc | F=Loai | G=Nguoi nhan | H=Ref ID | I=Ref Sheet
 */
function addNotification_(tieude, noidung, loai, nguoiNhan, refId, refSheet) {
  if (!tieude || !nguoiNhan) return;
  var tbSheet = getThongBaoSheet_();
  if (!tbSheet) {
    Logger.log('Khong tim thay sheet Thong bao');
    return;
  }
  
  var maTB = genNotifId_();
  var thoiGian = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
  
  tbSheet.appendRow([
    maTB,          // A: Ma thong bao
    tieude,        // B: Tieu de
    noidung,       // C: Noi dung
    thoiGian,      // D: Thoi gian
    '',            // E: Da doc - trong, update tu WebApp
    loai,          // F: Loai
    nguoiNhan,     // G: Nguoi nhan
    refId,         // H: Ref ID (Ma DA / Ma nhiem vu / ...)
    refSheet       // I: Ref Sheet (ten sheet nguon)
  ]);
  
  Logger.log('Thong bao: ' + maTB + ' | ' + tieude + ' | -> ' + nguoiNhan);
}

// --------------- TRIGGER: Cai dat va xu ly onEdit ---------------

/**
 * Danh sach sheet duoc theo doi va cach lay nguoi nhan
 * Key: normalizeStr_(sheetName)
 * Value: { recipientCols: [...], lookupDA: bool, fkDACol: string }
 */
var WATCHED_SHEETS_ = {
  'du an':     { idCol: 'Ma DA',       nameCol: 'Ten du an',       recipientCols: ['Phu trach ky thuat', 'Phu trach ke toan'], lookupDA: false },
  'goi thau':  { idCol: 'Ma GT',       nameCol: 'Ten goi thau',    recipientCols: [],                                          lookupDA: true,  fkDACol: 'Ma DA' },
  'hop dong':  { idCol: 'Ma HD',       nameCol: 'Ten HD',          recipientCols: [],                                          lookupDA: true,  fkDACol: 'Ma DA' },
  'phu luc hd':{ idCol: 'Ma PLHD',    nameCol: 'Noi dung PLHD',   recipientCols: [],                                          lookupDA: true,  fkDACol: 'Ma DA' },
  'nghiem thu':{ idCol: 'Ma HSNT',    nameCol: 'Ten DA',           recipientCols: [],                                          lookupDA: true,  fkDACol: 'Ma DA' },
  'nhiem vu':  { idCol: 'Ma nhiem vu', nameCol: 'Mo ta nhiem vu',  recipientCols: ['Nguoi thuc hien'],                         lookupDA: false }
};

/**
 * Installable trigger - goi tu ScriptApp trigger (khong phai simple onEdit)
 * Phat hien dong MOI duoc them vao cac sheet theo doi
 * 
 * Logic phat hien dong moi:
 *   - Edit xay ra o cot A (col index 1)
 *   - Row >= 2 (khong phai header)
 *   - e.oldValue trong hoac undefined (la dong moi, khong phai chinh sua cu)
 *   - e.value khac rong
 */
function onEditNotification(e) {
  if (!e || !e.range) return;
  
  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();
  
  // Chi xu ly cot A (Ma ID) va dong du lieu (>= 2)
  if (col !== 1 || row < 2) return;
  
  // Gia tri moi
  var newVal = e.value !== undefined ? e.value : range.getValue();
  if (!newVal || String(newVal).trim() === '') return;
  
  // Chi la dong moi neu oldValue trong/undefined
  if (e.oldValue && String(e.oldValue).trim() !== '') return;
  
  var sheet = range.getSheet();
  var sheetName = sheet.getName();
  var normSheet = normalizeStr_(sheetName);
  
  // Kiem tra co trong danh sach theo doi khong
  var cfg = WATCHED_SHEETS_[normSheet];
  if (!cfg) return;
  
  // Doc toan bo dong moi
  var lastCol = sheet.getLastColumn();
  var rowData = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // Lay Ma ID va Ten item
  var idIdx = findColIdx_(headers, cfg.idCol);
  var nameIdx = findColIdx_(headers, cfg.nameCol);
  
  var maId = idIdx >= 0 ? String(rowData[idIdx] || '').trim() : String(newVal).trim();
  var tenItem = nameIdx >= 0 ? String(rowData[nameIdx] || '').trim() : '';
  
  if (!maId) return;
  
  // Xac dinh nguoi nhan
  var recipients = [];
  
  // 1. Lay truc tiep tu dong (recipientCols)
  cfg.recipientCols.forEach(function(colName) {
    var idx = findColIdx_(headers, colName);
    if (idx >= 0 && rowData[idx]) {
      var val = String(rowData[idx]).trim();
      if (val && recipients.indexOf(val) === -1) recipients.push(val);
    }
  });
  
  // 2. Neu can, lookup tu sheet Du an theo Ma DA
  if (cfg.lookupDA) {
    var fkIdx = findColIdx_(headers, cfg.fkDACol || 'Ma DA');
    if (fkIdx >= 0 && rowData[fkIdx]) {
      var maDA = String(rowData[fkIdx]).trim();
      var daRecips = getRecipientsFromDA_(maDA);
      daRecips.forEach(function(r) {
        if (recipients.indexOf(r) === -1) recipients.push(r);
      });
    }
  }
  
  if (recipients.length === 0) {
    Logger.log('[THONG_BAO] Khong co nguoi nhan cho ' + maId + ' sheet=' + sheetName);
    return;
  }
  
  // Tao noi dung thong bao
  var tieude = '[' + sheetName + '] ' + (tenItem || maId) + ' - Vua duoc them moi';
  var noidung = 'Ma: ' + maId + (tenItem ? ' | Ten: ' + tenItem : '') + 
                ' | Ngay: ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm');
  
  // Tao thong bao cho moi nguoi nhan
  recipients.forEach(function(nguoiNhan) {
    addNotification_(tieude, noidung, sheetName, nguoiNhan, maId, sheetName);
  });
}

/**
 * Cai dat installable trigger - Chay 1 lan de kich hoat tu dong
 * Vao Extensions > Apps Script > Chon ham nay > Chay
 */
function installNotificationTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Xoa trigger cu neu co
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'onEditNotification') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Tao trigger moi (installable onEdit)
  ScriptApp.newTrigger('onEditNotification')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  
  Logger.log('Da cai dat trigger onEditNotification!');

}

/**
 * Go cai dat trigger
 */
function uninstallNotificationTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'onEditNotification') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log('Da go ' + removed + ' trigger(s)');

}

// --------------- WEBAPP API: Giao tiep voi WebApp ---------------

/**
 * Lay danh sach thong bao cho mot nguoi dung
 * Su dung trong WebApp khi user bam chuong
 * @param {string} nguoiDung - Ten nguoi dung (khop voi cot G)
 * @param {boolean} choChuaDoc - true = chi lay chua doc, false = lay tat ca
 * @return {Array} mang cac thong bao
 */
function getNotificationsForUser(nguoiDung, choChuaDoc) {
  if (!nguoiDung) return [];
  
  var tbSheet = getThongBaoSheet_();
  if (!tbSheet) return [];
  
  var data = tbSheet.getDataRange().getValues();
  var results = [];
  var normUser = normalizeStr_(nguoiDung);
  
  for (var r = 1; r < data.length; r++) {
    var maTB = String(data[r][0] || '').trim();
    if (!maTB) continue;
    
    var rowUser = normalizeStr_(String(data[r][6] || ''));
    if (rowUser !== normUser) continue;
    
    var daDoc = data[r][4] === '\u2705' || data[r][4] === true || String(data[r][4]).toLowerCase() === 'true';
    
    if (choChuaDoc && daDoc) continue;
    
    results.push({
      row: r + 1,           // so dong trong sheet (de update)
      maTB: maTB,
      tieude: data[r][1],
      noidung: data[r][2],
      thoigian: data[r][3],
      daDoc: daDoc,
      loai: String(data[r][5] || ''),
      nguoiNhan: String(data[r][6] || ''),
      refId: String(data[r][7] || ''),
      refSheet: String(data[r][8] || '')
    });
  }
  
  // Sap xep: chua doc truoc, moi nhat truoc
  results.sort(function(a, b) {
    if (a.daDoc !== b.daDoc) return a.daDoc ? 1 : -1;
    return b.row - a.row;
  });
  
  return results;
}

/**
 * Alias for getNotificationsForUser (legacy)
 */
function getUnreadNotifications(nguoiDung) {
  return getNotificationsForUser(nguoiDung, true);
}

/**
 * Dem so thong bao chua doc
 * @param {string} nguoiDung
 * @return {number}
 */
function countUnreadNotifications(nguoiDung) {
  return getNotificationsForUser(nguoiDung, true).length;
}

/**
 * Danh dau da doc khi user bam xem mot Du an / Nhiem vu / HĐ
 * Goi tu WebApp khi user bam vao item.
 *
 * @param {string} refId - Ma tham chieu (Ma DA / Ma nhiem vu / Ma HD...)
 * @param {string} nguoiDung - Ten nguoi dung hien tai
 * @param {string} refSheet - (tuy chon) Ten sheet nguon de loc chinh xac
 * @return {object} { success: bool, updated: number, message: string }
 */
function markNotificationRead(refId, nguoiDung, refSheet) {
  if (!refId || !nguoiDung) {
    return { success: false, updated: 0, message: 'Thieu refId hoac nguoiDung' };
  }
  
  var tbSheet = getThongBaoSheet_();
  if (!tbSheet) {
    return { success: false, updated: 0, message: 'Khong tim thay sheet Thong bao' };
  }
  
  var data = tbSheet.getDataRange().getValues();
  var normUser = normalizeStr_(nguoiDung);
  var normRef = String(refId).trim();
  var updated = 0;
  
  for (var r = 1; r < data.length; r++) {
    var rowRef = String(data[r][7] || '').trim();   // H: Ref ID
    var rowUser = normalizeStr_(String(data[r][6] || ''));
    var rowDaDoc = data[r][4];
    var rowRefSheet = String(data[r][8] || '').trim();
    
    var matchRef = rowRef === normRef;
    var matchUser = rowUser === normUser;
    var matchSheet = !refSheet || normalizeStr_(rowRefSheet) === normalizeStr_(refSheet);
    var chuaDoc = rowDaDoc !== '\u2705' && rowDaDoc !== true && String(rowDaDoc).toLowerCase() !== 'true' && normalizeStr_(rowDaDoc) !== 'da doc';
    
    if (matchRef && matchUser && matchSheet && chuaDoc) {
      tbSheet.getRange(r + 1, 5).setValue('\u2705');
      updated++;
    }
  }
  
  return { success: true, updated: updated, message: 'Da cap nhat ' + updated + ' thong bao' };
}

/**
 * Ham test nhanh: Tao thong bao mau
 * (Chi dung de kiem tra, khong dung trong production)
 */
function testNotificationSystem() {
  // Test tao thong bao
  addNotification_(
    '[Test] Du an XYZ duoc tao moi',
    'Ma: DA999 | Ten: Du an Test | Ngay: ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'),
    'Du an',
    'Tran Minh Tuan',
    'DA999',
    'Du an'
  );
  
  // Test getUnread
  var unread = getUnreadNotifications('Tran Minh Tuan');
  Logger.log('Thong bao chua doc cho Tran Minh Tuan: ' + unread.length);
  
  // Test markRead
  var result = markNotificationRead('DA999', 'Tran Minh Tuan');
  Logger.log('Mark read result: ' + JSON.stringify(result));
  Logger.log("Test complete - UI operations skipped in trigger context");
}

// ========================================================================
// MODULE: TƯ VẤN GIÁM SÁT (TVGS)
// - Đăng nhập nhà thầu TVGS bằng Mã số doanh nghiệp hoặc Email
// - Chỉ nhà thầu có tên trong sheet "Hợp đồng" với Tên HĐ chứa "giám sát"
// - Lịch báo cáo theo nhà thầu, cảnh báo email khi trễ hạn
// - 3 lần vi phạm => đánh dấu "Vi phạm kỷ luật" + email Ban Giám đốc
// ========================================================================

var TVGS_DEFAULT_PASSWORD = 'Nhathau123';
var TVGS_SHEET = 'Nhà thầu TVGS';
var TVGS_REPORT_SHEET = 'Báo cáo TVGS';
var TVGS_KEYWORD = 'giam sat'; // so sánh sau khi normalizeStr_

/**
 * Lấy danh sách hợp đồng TVGS (Tên HĐ chứa "giám sát") của một doanh nghiệp.
 * Truyền tenDN rỗng để lấy tất cả hợp đồng TVGS.
 * @return {Array<{maHD, tenHD, maDA, nhaThau, ngayHetHan, trangThai}>}
 */
function getTVGSContracts_(tenDN) {
  var crud = new CRUDService("Hợp đồng");
  var contracts = crud.list();
  var normTen = tenDN ? normalizeStr_(tenDN) : '';
  var results = [];
  for (var i = 0; i < contracts.length; i++) {
    var hd = contracts[i];
    var tenHD = normalizeStr_(String(hd.tenHD || ''));
    if (tenHD.indexOf(TVGS_KEYWORD) === -1) continue;
    if (normTen && normalizeStr_(String(hd.nhaThau || '')) !== normTen) continue;
    results.push({
      maHD: hd.maHD, tenHD: hd.tenHD, maDA: hd.maDA,
      nhaThau: hd.nhaThau, ngayHetHan: hd.ngayHetHan, trangThai: hd.trangThai
    });
  }
  return results;
}

/**
 * Tìm tài khoản TVGS theo Mã số doanh nghiệp hoặc Email
 */
function findTVGSAccount_(identifier) {
  if (!identifier) return null;
  var crud = new CRUDService(TVGS_SHEET);
  var accounts = crud.list();
  var idNorm = String(identifier).trim().toLowerCase();
  for (var i = 0; i < accounts.length; i++) {
    var maSo = String(accounts[i].maSoDN || '').trim().toLowerCase();
    var email = String(accounts[i].email || '').trim().toLowerCase();
    if ((maSo && maSo === idNorm) || (email && email === idNorm)) {
      return accounts[i];
    }
  }
  return null;
}

/**
 * Cập nhật cột "Báo cáo gần nhất" của tài khoản TVGS sau khi nộp báo cáo
 */
function updateTVGSLastReport_(maSoDN) {
  var crud = new CRUDService(TVGS_SHEET);
  var today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  crud.update(String(maSoDN).trim(), { baoCaoGanNhat: today });
}

/**
 * Đổi mật khẩu tài khoản TVGS
 */
function changeTVGSPassword(maSoDN, oldPassword, newPassword) {
  if (!maSoDN || !newPassword) throw new Error("Thiếu thông tin đổi mật khẩu");
  if (String(newPassword).length < 6) throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
  var acc = findTVGSAccount_(maSoDN);
  if (!acc) throw new Error("Không tìm thấy tài khoản TVGS: " + maSoDN);
  var currentPass = String(acc.password || '').trim() || TVGS_DEFAULT_PASSWORD;
  if (String(oldPassword) !== currentPass) throw new Error("Mật khẩu cũ không chính xác");
  var crud = new CRUDService(TVGS_SHEET);
  crud.update(String(acc.maSoDN).trim(), { password: String(newPassword) });
  return true;
}

/**
 * Đồng bộ tài khoản TVGS từ sheet Hợp đồng:
 * - Quét Hợp đồng có Tên HĐ chứa "giám sát"
 * - Tra Mã số doanh nghiệp từ cột A sheet "Nhà thầu" (khớp Tên Nhà thầu)
 * - Tạo tài khoản mới với mật khẩu mặc định Nhathau123 (không ghi đè tài khoản cũ)
 */
function syncTVGSAccounts() {
  var tvgsContracts = getTVGSContracts_('');
  if (tvgsContracts.length === 0) {
    return { added: 0, total: 0, message: "Không tìm thấy Hợp đồng nào có Tên HĐ chứa 'giám sát'" };
  }

  // Map tên nhà thầu (normalize) -> Mã số doanh nghiệp từ sheet Nhà thầu
  var nhaThauCrud = new CRUDService("Nhà thầu");
  var nhaThauList = nhaThauCrud.list();
  var maSoMap = {};
  nhaThauList.forEach(function(nt) {
    var ten = normalizeStr_(String(nt.tenNhaThau || ''));
    if (ten) maSoMap[ten] = String(nt.maSoNhaThau || '').trim();
  });

  // Danh sách tài khoản hiện có
  var crud = new CRUDService(TVGS_SHEET);
  var existing = crud.list();
  var existingNames = {};
  var existingMaSo = {};
  existing.forEach(function(acc) {
    existingNames[normalizeStr_(String(acc.tenDN || ''))] = true;
    existingMaSo[String(acc.maSoDN || '').trim()] = true;
  });

  // Gom tên nhà thầu TVGS duy nhất
  var seen = {};
  var added = 0;
  tvgsContracts.forEach(function(hd) {
    var tenDN = String(hd.nhaThau || '').trim();
    if (!tenDN) return;
    var norm = normalizeStr_(tenDN);
    if (seen[norm]) return;
    seen[norm] = true;
    if (existingNames[norm]) return;

    var maSo = maSoMap[norm] || '';
    if (maSo && existingMaSo[maSo]) return;

    crud.create({
      maSoDN: maSo || ('TVGS-' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMddHHmmss')),
      tenDN: tenDN,
      email: '',
      password: TVGS_DEFAULT_PASSWORD,
      chuKy: '',
      hanNop: '',
      soViPham: 0,
      trangThai: 'Hoạt động',
      baoCaoGanNhat: '',
      canhBaoGanNhat: '',
      ghiChu: 'Tự động tạo từ Hợp đồng'
    });
    added++;
  });

  return { added: added, total: Object.keys(seen).length };
}

// ─── TVGS AUTH ───────────────────────────────────────────────────────────────

AuthService.loginTVGS = function(identifier, password) {
  if (!identifier || !password) throw new Error("Vui lòng nhập Mã số doanh nghiệp/Email và Mật khẩu");

  var acc = findTVGSAccount_(identifier);
  if (!acc) throw new Error("Tài khoản không tồn tại. Liên hệ Quản lý để được cấp tài khoản TVGS.");

  var currentPass = String(acc.password || '').trim() || TVGS_DEFAULT_PASSWORD;
  if (String(password) !== currentPass) throw new Error("Mật khẩu không chính xác");

  // Chỉ nhà thầu có tên trong sheet Hợp đồng (Tên HĐ chứa "giám sát") mới được đăng nhập
  var contracts = getTVGSContracts_(acc.tenDN);
  if (contracts.length === 0) {
    throw new Error("Doanh nghiệp '" + acc.tenDN + "' không có Hợp đồng Tư vấn giám sát trong hệ thống.");
  }

  var profile = { role: 'TVGS', hoTen: acc.tenDN, hopDongs: contracts };
  for (var k in acc) {
    if (k !== 'password') profile[k] = acc[k];
  }
  return profile;
};

// ─── TVGS LỊCH BÁO CÁO & KIỂM TRA TRỄ HẠN ───────────────────────────────────

/**
 * Chuyển "Thứ 2".."Thứ 7", "Chủ nhật" -> JS weekday (0=CN..6=T7)
 */
function parseWeekday_(s) {
  var norm = normalizeStr_(String(s || ''));
  if (norm === 'chu nhat' || norm === 'cn') return 0;
  var m = norm.match(/thu\s*(\d)/);
  if (m) {
    var n = parseInt(m[1]);
    if (n >= 2 && n <= 7) return n - 1; // Thứ 2 = Monday(1)
  }
  return -1;
}

/**
 * Tính hạn nộp gần nhất ĐÃ QUA (Date, cuối ngày) theo chu kỳ của tài khoản.
 * @return {Object|null} { deadline: Date, periodStart: Date } hoặc null nếu chưa tới hạn nào
 */
function getLastDeadline_(chuKy, hanNop, now) {
  var norm = normalizeStr_(String(chuKy || ''));
  var d, start;

  function endOfDay(dt) {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59);
  }

  if (norm.indexOf('ngay') >= 0) { // Hàng ngày (chỉ tính ngày làm việc T2-T6)
    d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    }
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    return { deadline: endOfDay(d), periodStart: start };
  }

  if (norm.indexOf('tuan') >= 0) { // Hàng tuần
    var wd = parseWeekday_(hanNop);
    if (wd < 0) wd = 5; // mặc định Thứ 6
    d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    var guard = 0;
    while (d.getDay() !== wd && guard < 8) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
      guard++;
    }
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6, 0, 0, 0);
    return { deadline: endOfDay(d), periodStart: start };
  }

  if (norm.indexOf('thang') >= 0) { // Hàng tháng
    var day = parseInt(String(hanNop || '').replace(/[^\d]/g, ''));
    if (isNaN(day) || day < 1 || day > 28) day = 28;
    var thisMonth = new Date(now.getFullYear(), now.getMonth(), day);
    if (endOfDay(thisMonth) < now) {
      d = thisMonth;
    } else {
      d = new Date(now.getFullYear(), now.getMonth() - 1, day);
    }
    start = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate() + 1, 0, 0, 0);
    return { deadline: endOfDay(d), periodStart: start };
  }

  return null; // chưa thiết lập chu kỳ
}

/**
 * Lấy email Ban Giám đốc / Quản lý từ sheet Nhân sự
 */
function getManagerEmails_() {
  var emails = [];
  try {
    var crud = new CRUDService("Nhân sự");
    var users = crud.list();
    users.forEach(function(u) {
      var role = String(u.role || '');
      if (/admin|giám đốc|quản lý|trưởng phòng/i.test(role)) {
        var email = String(u.email || '').trim();
        if (email && emails.indexOf(email) === -1) emails.push(email);
      }
    });
  } catch (e) {
    Logger.log("getManagerEmails_ error: " + e.message);
  }
  return emails;
}

/**
 * KIỂM TRA BÁO CÁO TVGS TRỄ HẠN — chạy bởi trigger hàng ngày.
 * - Tài khoản có chu kỳ báo cáo + còn hợp đồng TVGS
 * - Không có báo cáo trong kỳ vừa qua => +1 vi phạm, email cảnh báo
 * - Đủ 3 vi phạm => đánh dấu "Vi phạm kỷ luật" + email Ban Giám đốc
 */
function checkTVGSReports() {
  var now = new Date();
  var crud = new CRUDService(TVGS_SHEET);
  var accounts = crud.list();
  if (accounts.length === 0) return { checked: 0, violations: 0 };

  var reportCrud = new CRUDService(TVGS_REPORT_SHEET);
  var reports = reportCrud.list();
  var managerEmails = getManagerEmails_();
  var checked = 0, violations = 0;

  accounts.forEach(function(acc) {
    try {
      if (!acc.chuKy || String(acc.chuKy).trim() === '') return;

      var win = getLastDeadline_(acc.chuKy, acc.hanNop, now);
      if (!win) return;
      checked++;

      // Đã cảnh báo cho kỳ này rồi thì bỏ qua (tránh đếm trùng)
      if (acc.canhBaoGanNhat) {
        var lastWarn = new Date(String(acc.canhBaoGanNhat));
        if (!isNaN(lastWarn.getTime()) && lastWarn >= win.deadline) return;
      }

      // Tìm báo cáo của doanh nghiệp trong kỳ
      var maSo = String(acc.maSoDN || '').trim();
      var hasReport = reports.some(function(r) {
        if (String(r.maSoDN || '').trim() !== maSo) return false;
        var rd = new Date(String(r.ngay));
        if (isNaN(rd.getTime())) return false;
        return rd >= win.periodStart && rd <= win.deadline;
      });
      if (hasReport) return;

      // Vi phạm: tăng đếm, cảnh báo
      var soViPham = (parseInt(acc.soViPham) || 0) + 1;
      var updateData = {
        soViPham: soViPham,
        canhBaoGanNhat: Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd')
      };
      var disciplined = soViPham >= 3;
      if (disciplined) updateData.trangThai = 'Vi phạm kỷ luật';
      crud.update(maSo, updateData);
      violations++;

      var deadlineStr = Utilities.formatDate(win.deadline, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
      var accEmail = String(acc.email || '').trim();

      // Email cảnh báo nhà thầu
      if (accEmail && accEmail.match(/^[\w\.\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$/)) {
        var subject = disciplined
          ? '🚫 [CPM 5.0] VI PHẠM KỶ LUẬT — Trễ hạn báo cáo giám sát lần thứ ' + soViPham
          : '⚠️ [CPM 5.0] Cảnh báo trễ hạn báo cáo giám sát (lần ' + soViPham + '/3)';
        var html =
          "<div style='font-family:Roboto,Arial,sans-serif;font-size:15px;color:#222'>" +
          "<p>Kính gửi <b>" + acc.tenDN + "</b>,</p>" +
          "<p>Hệ thống CPM 5.0 ghi nhận Quý đơn vị <b style='color:#D32F2F'>chưa nộp báo cáo Tư vấn giám sát</b> đúng hạn.</p>" +
          "<p>Hạn nộp kỳ vừa qua: <b style='color:#D32F2F'>" + deadlineStr + "</b> (Chu kỳ: " + acc.chuKy + ")</p>" +
          "<p>Số lần vi phạm lũy kế: <b style='color:#D32F2F'>" + soViPham + "/3</b></p>" +
          (disciplined
            ? "<p style='color:#D32F2F'><b>Quý đơn vị đã vi phạm 3 lần và bị đánh dấu VI PHẠM KỶ LUẬT. Ban Giám đốc đã được thông báo để xem xét xử lý theo Hợp đồng.</b></p>"
            : "<p>Vui lòng đăng nhập hệ thống và nộp báo cáo ngay. Đủ 3 lần vi phạm sẽ bị xử lý kỷ luật.</p>") +
          "<hr style='border:none;border-top:1px solid #eee;margin:20px 0'>" +
          "<p style='color:#333;'>Trân trọng,<br><b style='color:#388E3C'>Ban Quản lý dự án — CPM 5.0</b></p></div>";
        try {
          MailApp.sendEmail({ to: accEmail, subject: subject, htmlBody: html, body: subject });
        } catch (eMail) {
          Logger.log("Lỗi gửi mail TVGS cho " + accEmail + ": " + eMail.message);
        }
      }

      // Đủ 3 vi phạm: email Ban Giám đốc / Quản lý
      if (disciplined && managerEmails.length > 0) {
        var subjectBGD = '🚫 [CPM 5.0] Nhà thầu TVGS vi phạm kỷ luật: ' + acc.tenDN;
        var htmlBGD =
          "<div style='font-family:Roboto,Arial,sans-serif;font-size:15px;color:#222'>" +
          "<p>Kính gửi Ban Giám đốc,</p>" +
          "<p>Nhà thầu Tư vấn giám sát <b>" + acc.tenDN + "</b> (MSDN: " + maSo + ") đã <b style='color:#D32F2F'>trễ hạn báo cáo " + soViPham + " lần</b> và bị hệ thống đánh dấu <b style='color:#D32F2F'>VI PHẠM KỶ LUẬT</b>.</p>" +
          "<p>Đề nghị xem xét xử lý theo điều khoản Hợp đồng.</p>" +
          "<p style='color:#333;'>— Hệ thống CPM 5.0 (tự động)</p></div>";
        try {
          MailApp.sendEmail({ to: managerEmails.join(','), subject: subjectBGD, htmlBody: htmlBGD, body: subjectBGD });
        } catch (eMail2) {
          Logger.log("Lỗi gửi mail BGĐ: " + eMail2.message);
        }
        // Thông báo trên chuông cho Quản lý
        try {
          var crudNS = new CRUDService("Nhân sự");
          crudNS.list().forEach(function(u) {
            if (/admin|giám đốc|quản lý|trưởng phòng/i.test(String(u.role || ''))) {
              addNotification_(
                '[TVGS] ' + acc.tenDN + ' — Vi phạm kỷ luật',
                'Trễ hạn báo cáo giám sát ' + soViPham + ' lần. MSDN: ' + maSo,
                'TVGS', String(u.hoTen || ''), maSo, TVGS_SHEET
              );
            }
          });
        } catch (eTB) {
          Logger.log("Lỗi tạo thông báo TVGS: " + eTB.message);
        }
      }
    } catch (eAcc) {
      Logger.log("checkTVGSReports lỗi tài khoản " + (acc.maSoDN || '?') + ": " + eAcc.message);
    }
  });

  return { checked: checked, violations: violations };
}

/**
 * Cài đặt trigger kiểm tra báo cáo TVGS hàng ngày lúc 7h sáng.
 * Chạy 1 lần trong Apps Script Editor.
 */
function installTVGSTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkTVGSReports') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('checkTVGSReports')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  Logger.log('Đã cài đặt trigger checkTVGSReports (hàng ngày 7h)!');
}

// ========================================================================
// MODULE: QUYẾT TOÁN DỰ ÁN HOÀN THÀNH (Thông tư 91/2025/TT-BTC)
// - Khởi tạo hồ sơ quyết toán từ dữ liệu Dự án + Hợp đồng + Nghiệm thu
// - 6 sheet: Quyết toán DAHT (master) + Nguồn vốn / Chi phí / Văn bản /
//   Tài sản / Công nợ (chi tiết theo Mã QT)
// ========================================================================

/**
 * Khởi tạo hồ sơ quyết toán DAHT từ dữ liệu CPM của một dự án.
 * Tự kéo: Tên DA, TMĐT, các nguồn vốn (sheet Dự án); danh mục hợp đồng
 * (Mẫu 02), công nợ nhà thầu (Mẫu 07) từ sheet Hợp đồng.
 */
function createQuyetToanFromProject(maDA) {
  if (!maDA) throw new Error("Thiếu Mã dự án");

  var duAn = new CRUDService("Dự án").get(String(maDA).trim());
  if (!duAn) throw new Error("Không tìm thấy dự án: " + maDA);

  var qtCrud = new CRUDService("Quyết toán DAHT");

  // Không tạo trùng hồ sơ cho 1 dự án
  var existing = qtCrud.list();
  for (var i = 0; i < existing.length; i++) {
    if (String(existing[i].maDA).trim() === String(maDA).trim()) {
      throw new Error("Dự án này đã có hồ sơ quyết toán: " + existing[i].maQT);
    }
  }

  var parseMoney = function(v) {
    if (v === undefined || v === null || v === '') return 0;
    var n = parseFloat(String(v).replace(/\./g, '').replace(/,/g, '.'));
    return isNaN(n) ? 0 : n;
  };

  var nam = new Date().getFullYear();
  var master = qtCrud.create({
    maDA: duAn.maDA,
    tenCongTrinh: duAn.tenDA || '',
    namQT: nam,
    coQuanChuQuan: 'BAN QLDA ĐTXD TỈNH TÂY NINH',
    chuDauTu: 'Ban QLDA ĐTXD Khu vực 6',
    coQuanThamTra: 'Sở Tài chính tỉnh Tây Ninh',
    soToTrinh: '',
    diaDanh: 'Tân Châu',
    ngayLap: Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'),
    diaDiem: '',
    thoiGianKCHT: (duAn.ngayBatDau || '') + ' đến ngày ' + (duAn.ngayKetThuc || ''),
    ngayNghiemThu: '',
    ngayDuaVaoSD: '',
    donViTiepNhan: '',
    maDuAnKBNN: '',
    coQuanThanhToan: 'KBNN Khu vực XVIII',
    loaiVon: 'Vốn tỉnh',
    tongMucDauTu: parseMoney(duAn.tongMucDauTu),
    tongDuToan: parseMoney(duAn.tongMucDauTu),
    giaTriQT: 0,
    cpThietHai: 0,
    cpKhongTaoTS: 0,
    canCuPhapLy: '',
    nguoiLapBieu: '',
    giamDoc: '',
    trangThai: 'Đang lập',
    ghiChu: 'Khởi tạo tự động từ dữ liệu CPM'
  });
  var maQT = master.maQT;

  // 1. NGUỒN VỐN (Mẫu 01-I, Mẫu 03): mỗi nguồn vốn khác 0 của dự án 1 dòng
  var nvCrud = new CRUDService("QT Nguồn vốn");
  var sources = [
    { ten: 'Nguồn Chuẩn bị đầu tư', giaTri: parseMoney(duAn.nguonCBDT) },
    { ten: 'Nguồn NS tập trung', giaTri: parseMoney(duAn.nguonNSTT) },
    { ten: 'Nguồn thu tiền SDĐ', giaTri: parseMoney(duAn.nguonThuSDD) },
    { ten: 'Nguồn tăng thu tiền SDĐ tỉnh bổ sung', giaTri: parseMoney(duAn.nguonTangThuSDD) },
    { ten: 'Vốn tỉnh (XSKT)', giaTri: parseMoney(duAn.vonTinhXSKT) }
  ];
  sources.forEach(function(s) {
    if (s.giaTri > 0) {
      nvCrud.create({
        maQT: maQT, nguonVon: s.ten, nam: nam,
        vonKeHoach: s.giaTri, thanhToanKLHT: 0, tamUng: 0,
        vonKeHoachKB: s.giaTri, thanhToanKLHTKB: 0, tamUngKB: 0, ghiChu: ''
      });
    }
  });

  // 2. CHI PHÍ (Mẫu 01-II, Mẫu 04): tạo sẵn 7 nhóm khoản mục chuẩn
  var cpCrud = new CRUDService("QT Chi phí");
  var nhomChuan = ['Bồi thường, hỗ trợ, tái định cư', 'Xây dựng', 'Thiết bị',
                   'Quản lý dự án', 'Tư vấn', 'Chi phí khác', 'Dự phòng'];
  nhomChuan.forEach(function(nhom) {
    cpCrud.create({
      maQT: maQT, nhom: nhom, khoanMuc: 'Chi phí ' + nhom.toLowerCase(),
      tmdtDuyet: 0, duToanDuyet: 0, giaTriQT: 0, nguyenNhan: '', ghiChu: ''
    });
  });

  // 3. VĂN BẢN (Mẫu 02) + 4. CÔNG NỢ (Mẫu 07): kéo từ sheet Hợp đồng
  var vbCrud = new CRUDService("QT Văn bản");
  var cnCrud = new CRUDService("QT Công nợ");
  var hopDongs = new CRUDService("Hợp đồng").list().filter(function(hd) {
    return String(hd.maDA).trim() === String(maDA).trim();
  });
  hopDongs.forEach(function(hd) {
    vbCrud.create({
      maQT: maQT, loai: 'Hợp đồng',
      noiDung: 'Hợp đồng ' + (hd.tenHD || ''),
      soVanBan: hd.maHD || '', ngayBanHanh: hd.ngayKy || '',
      coQuan: hd.nhaThau || '', ghiChu: ''
    });
    var giaTriQT = parseMoney(hd.giaQuyetToan) || parseMoney(hd.giaHD);
    var daGiaiNgan = parseMoney(hd.luyKeThanhToan);
    var chenhLech = giaTriQT - daGiaiNgan;
    cnCrud.create({
      maQT: maQT, tenDonVi: hd.nhaThau || '', noiDung: hd.tenHD || '',
      giaTriQT: giaTriQT, daGiaiNgan: daGiaiNgan,
      phaiThu: chenhLech < 0 ? -chenhLech : 0,
      phaiTra: chenhLech > 0 ? chenhLech : 0,
      ghiChu: hd.maHD || ''
    });
  });

  return { maQT: maQT, soHopDong: hopDongs.length };
}

/**
 * Tải toàn bộ hồ sơ quyết toán (master + 5 sheet chi tiết) theo Mã QT
 */
function loadQuyetToanFull(maQT) {
  if (!maQT) throw new Error("Thiếu Mã QT");
  var clean = String(maQT).trim();
  var byQT = function(sheetName) {
    return new CRUDService(sheetName).list().filter(function(r) {
      return String(r.maQT).trim() === clean;
    });
  };
  return {
    master: new CRUDService("Quyết toán DAHT").get(clean),
    nguonVon: byQT("QT Nguồn vốn"),
    chiPhi: byQT("QT Chi phí"),
    vanBan: byQT("QT Văn bản"),
    taiSan: byQT("QT Tài sản"),
    congNo: byQT("QT Công nợ")
  };
}

/**
 * Xóa hồ sơ quyết toán + toàn bộ dòng chi tiết liên quan
 */
function deleteQuyetToanFull(maQT) {
  if (!maQT) throw new Error("Thiếu Mã QT");
  var clean = String(maQT).trim();
  var deleted = 0;
  ["QT Nguồn vốn", "QT Chi phí", "QT Văn bản", "QT Tài sản", "QT Công nợ"].forEach(function(sheetName) {
    var crud = new CRUDService(sheetName);
    var rows = crud.list().filter(function(r) { return String(r.maQT).trim() === clean; });
    rows.forEach(function(r) {
      try { crud.delete(r.id); deleted++; } catch (e) { Logger.log("Lỗi xóa " + r.id + ": " + e.message); }
    });
  });
  new CRUDService("Quyết toán DAHT").delete(clean);
  return { deletedRows: deleted };
}

/**
 * Gỡ trigger kiểm tra TVGS
 */
function uninstallTVGSTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkTVGSReports') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log('Đã gỡ ' + removed + ' trigger(s) TVGS');
}

// ─── AUTH360: Đăng nhập đơn giản cho module Site360 ──────────────────────────
// Không yêu cầu hợp đồng — chỉ cần email + mật khẩu từ sheet Nhà thầu TVGS
AuthService.login360 = function(email, password) {
  if (!email || !password) throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
  
  var emailLower = String(email).toLowerCase().trim();
  var sh = SS.getSheetByName('Nhà thầu TVGS');
  if (!sh) throw new Error('Không tìm thấy sheet Nhà thầu TVGS');
  
  var rows = sh.getDataRange().getValues();
  var headers = rows[0];
  
  // Tìm index các cột cần thiết
  var colEmail = headers.indexOf('Email');
  var colPass  = headers.indexOf('Mật khẩu');
  var colTen   = headers.indexOf('Tên doanh nghiệp');
  var colMaSo  = headers.indexOf('Mã số doanh nghiệp');
  var colTT    = headers.indexOf('Trạng thái');
  var colVaiTro = headers.indexOf('Vai Trò 360°');
  var colDuAn   = headers.indexOf('Dự Án 360°');
  if (colEmail < 0) throw new Error('Không tìm thấy cột Email trong sheet Nhà thầu TVGS');
  
  var found = null;
  for (var i = 1; i < rows.length; i++) {
    var rowEmail = String(rows[i][colEmail] || '').toLowerCase().trim();
    if (rowEmail === emailLower) { found = { row: rows[i], rowIndex: i + 1 }; break; }
  }
  if (!found) throw new Error('Email không tồn tại trong hệ thống');
  
  var row = found.row;
  
  // Kiểm tra trạng thái
  var tt = String(row[colTT] || '').toLowerCase();
  if (tt === 'khóa' || tt === 'khoa' || tt === 'blocked') {
    throw new Error('Tài khoản đã bị khóa. Liên hệ quản trị viên.');
  }
  
  // So sánh mật khẩu
  var storedPass = String(row[colPass] || '').trim();
  if (storedPass !== password.trim()) throw new Error('Mật khẩu không đúng');
  
  // Tạo session token 8 giờ
  var token = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      Date.now() + Math.random().toString(), Utilities.Charset.UTF_8)
  ).replace(/[^a-zA-Z0-9]/g,'').substring(0,32);
  
  var expiresAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  var duAn360 = colDuAn >= 0 ? String(row[colDuAn] || '').split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
  var vaiTro  = colVaiTro >= 0 ? (String(row[colVaiTro] || '') || 'Xem') : 'Xem';
  
  var session = { email: emailLower, tenDN: row[colTen] || '', maSoDN: row[colMaSo] || '',
    vaiTro: vaiTro, duAn360: duAn360, expiresAt: expiresAt };
  PropertiesService.getScriptProperties().setProperty('sess360_' + token, JSON.stringify(session));
  
  // Cập nhật lần đăng nhập cuối (nếu có cột)
  var colCuoi = headers.indexOf('Đăng Nhập 360° Cuối');
  if (colCuoi >= 0) sh.getRange(found.rowIndex, colCuoi + 1).setValue(new Date());

  return { token: token, email: emailLower, tenDN: session.tenDN, maSoDN: session.maSoDN,
    vaiTro: vaiTro, duAn360: duAn360, expiresAt: expiresAt };
};

// ═════════════════════════════════════════════════════════════════════════════
// TELEGRAM BOT — Thông báo hoạt động hệ thống + xác nhận trực tiếp trên Telegram
// ─────────────────────────────────────────────────────────────────────────────
// THIẾT LẬP (làm 1 lần):
// 1. Chat với @BotFather trên Telegram → /newbot → lấy BOT TOKEN.
// 2. Tạo group Telegram cho Ban quản lý, thêm bot vào group.
//    Lấy CHAT ID: thêm @getidsbot vào group (hoặc mở
//    https://api.telegram.org/bot<TOKEN>/getUpdates sau khi nhắn 1 tin trong group).
// 3. Apps Script → Project Settings → Script Properties → thêm:
//      TELEGRAM_BOT_TOKEN = <token BotFather cấp>
//      TELEGRAM_CHAT_ID   = <chat id group, ví dụ -1001234567890>
// 4. Deploy Web App phiên bản mới, sau đó chạy hàm installTelegramWebhook (Run 1 lần)
//    để bot nhận được nút bấm xác nhận + lệnh /tiendo.
// 5. (Tùy chọn) Chạy installDailyDigestTrigger để 7h sáng mỗi ngày bot tự gửi
//    báo cáo phân tích tiến độ Gantt vào group.
// ═════════════════════════════════════════════════════════════════════════════

var TG_WATCHED_SHEETS = {
  "Dự án": "🏗️", "Gói thầu": "📦", "Hợp đồng": "📝", "Phụ lục HĐ": "📎",
  "Nghiệm thu": "✅", "Nhiệm vụ": "🗂️", "Nhân sự": "👤", "Nhà thầu": "🏢",
  "Gantt": "📈", "Báo cáo": "📋", "Báo cáo TVGS": "🔍", "Nhà thầu TVGS": "🏢",
  "Quyết toán DAHT": "💰"
};

function tgProps_() {
  var props = PropertiesService.getScriptProperties();
  // TELEGRAM_CHAT_ID hỗ trợ 2 dạng:
  //   "-1002010998673"      → gửi vào group (tab General)
  //   "-1002010998673_254"  → gửi vào đúng TOPIC 254 của group (link t.me/c/2010998673/254)
  var rawChat = String(props.getProperty('TELEGRAM_CHAT_ID') || '').trim();
  var chatId = rawChat, threadId = '';
  var m = rawChat.match(/^(-?\d+)_(\d+)$/);
  if (m) { chatId = m[1]; threadId = m[2]; }
  return {
    token: props.getProperty('TELEGRAM_BOT_TOKEN') || '',
    chatId: chatId,
    threadId: threadId
  };
}

function tgApi_(method, payload) {
  var cfg = tgProps_();
  if (!cfg.token) return null;
  try {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + cfg.token + '/' + method, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    return JSON.parse(res.getContentText());
  } catch (e) {
    Logger.log('Telegram API error (' + method + '): ' + e.message);
    return null;
  }
}

// Gửi tin nhắn tới group quản lý. withAck=true → kèm nút "✅ Đã nắm thông tin"
function notifyTelegram_(text, withAck) {
  var cfg = tgProps_();
  if (!cfg.token || !cfg.chatId) return; // chưa cấu hình → bỏ qua êm
  var payload = { chat_id: cfg.chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (cfg.threadId) payload.message_thread_id = parseInt(cfg.threadId); // gửi vào đúng topic
  if (withAck) {
    payload.reply_markup = { inline_keyboard: [[{ text: '✅ Đã nắm thông tin', callback_data: 'ack' }]] };
  }
  tgApi_('sendMessage', payload);
}

// Nhãn hiển thị ngắn gọn cho 1 bản ghi (không bao giờ đưa mật khẩu vào tin nhắn)
function tgRecordLabel_(data) {
  if (!data) return '';
  var label = data.tenDA || data.tenCT || data.tenHD || data.tenGT || data.hoTen ||
              data.tenDN || data.tenNhaThau || data.workItem || data.moTa || data.tenCongTrinh || '';
  label = String(label);
  if (label.length > 70) label = label.substring(0, 70) + '…';
  var id = data.__id || data.maDA || data.id || data.maCT || data.maHD || data.maGT ||
           data.maNV || data.maSoDN || data.maSoNhaThau || data.maBC || data.maQT || '';
  var parts = [];
  if (id) parts.push('<code>' + id + '</code>');
  if (label) parts.push(label);
  return parts.join(' — ');
}

// Hook thông báo CRUD: gọi sau mỗi create/update/delete thành công.
// Luôn bọc try/catch — lỗi Telegram KHÔNG được phép làm hỏng API chính.
function tgNotifyCrud_(action, sheetName, data, actor) {
  try {
    var icon = TG_WATCHED_SHEETS[sheetName];
    if (!icon) return; // sheet không theo dõi
    var actionLabel = { create: '🆕 Tạo mới', update: '✏️ Cập nhật', delete: '🗑 <b>XÓA</b>' }[action] || action;
    var who = (actor && (actor.hoTen || actor.name || actor.email)) || 'Không rõ người thao tác';
    var time = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy');
    var lines = [
      actionLabel + ' ' + icon + ' <b>' + sheetName + '</b>',
      tgRecordLabel_(data)
    ].filter(Boolean);
    lines.push('👤 ' + who + ' • 🕐 ' + time);
    // Xóa là hành động nhạy cảm → kèm nút xác nhận để Quản lý bấm "đã nắm"
    notifyTelegram_(lines.join('\n'), action === 'delete');
  } catch (e) {
    Logger.log('tgNotifyCrud_ error: ' + e.message);
  }
}

// Xử lý update Telegram gửi về webhook (doPost)
function handleTelegramUpdate_(update) {
  var cfg = tgProps_();

  // 1. Người dùng bấm nút inline (xác nhận)
  if (update.callback_query) {
    var cb = update.callback_query;
    var fromName = ((cb.from && (cb.from.first_name || '') + ' ' + (cb.from.last_name || '')) || '').trim() || 'Ẩn danh';
    tgApi_('answerCallbackQuery', { callback_query_id: cb.id, text: 'Đã ghi nhận xác nhận của bạn ✅' });
    if (cb.message) {
      var newText = (cb.message.text || '') + '\n\n☑️ <b>' + fromName + '</b> đã xác nhận lúc ' +
                    Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy');
      tgApi_('editMessageText', {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: newText,
        parse_mode: 'HTML'
      });
    }
    return;
  }

  // 2. Lệnh chat: /tiendo — gửi ngay báo cáo phân tích tiến độ Gantt
  if (update.message && update.message.text) {
    var chatId = String(update.message.chat.id);
    // Chỉ phục vụ đúng group/chat đã cấu hình (tránh lộ dữ liệu cho người lạ chat với bot)
    if (cfg.chatId && chatId !== String(cfg.chatId)) return;
    var txt = update.message.text.trim().toLowerCase();
    if (txt.indexOf('/tiendo') === 0 || txt.indexOf('/baocao') === 0) {
      notifyTelegram_(buildGanttDigestText_(), false);
    } else if (txt.indexOf('/start') === 0 || txt.indexOf('/help') === 0) {
      notifyTelegram_('🤖 <b>CPM 5.0 Bot</b>\nLệnh khả dụng:\n/tiendo — Báo cáo phân tích tiến độ &amp; giá trị Gantt', false);
    }
  }
}

// Chạy 1 LẦN sau khi deploy Web App + cấu hình Script Properties
function installTelegramWebhook() {
  var url = ScriptApp.getService().getUrl();
  var res = tgApi_('setWebhook', { url: url, allowed_updates: ['message', 'callback_query'] });
  Logger.log('setWebhook → ' + JSON.stringify(res));
}

function removeTelegramWebhook() {
  Logger.log(JSON.stringify(tgApi_('deleteWebhook', {})));
}

// Gửi thử 1 tin để kiểm tra cấu hình
function testTelegram() {
  notifyTelegram_('🔔 CPM 5.0: kết nối Telegram thành công!', true);
}

// ═════════════════════════════════════════════════════════════════════════════
// PHÂN TÍCH TIẾN ĐỘ & GIÁ TRỊ GANTT (server) — dùng cho digest Telegram
// Cùng logic với panel "Phân tích tiến độ" trên trang Gantt (gantt.html).
// ═════════════════════════════════════════════════════════════════════════════

function ganttParseDate_(s) {
  if (!s) return null;
  s = String(s).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function ganttNorm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
}

// Phân loại 1 công tác Gantt. Trả về:
// { status: done|ahead|ontrack|atrisk|late|nodata|future, planned, actual, source }
function ganttClassifyTask_(t, reports, now) {
  var start = ganttParseDate_(t.ngayBatDau);
  var end = ganttParseDate_(t.ngayKetThuc);
  if (!start || !end || end < start) return { status: 'nodata', planned: null, actual: null, source: 'Thiếu ngày' };

  var planned;
  if (now < start) planned = 0;
  else if (now >= end) planned = 100;
  else planned = Math.round(((now - start) / (end - start)) * 100);

  // Tiến độ thực tế: ưu tiên báo cáo ngày gắn đúng Mã công tác → khớp tên hạng mục → trạng thái Gantt
  var actual = null, source = '';
  var best = null, bestDate = null;
  var tMaCT = String(t.maCT || '').trim();
  var tNameNorm = ganttNorm_(t.tenCT);
  for (var i = 0; i < reports.length; i++) {
    var r = reports[i];
    if (String(r.maDA || '').trim() !== String(t.maDA || '').trim()) continue;
    var pct = parseFloat(r.progressPercent);
    if (isNaN(pct)) continue;
    var match = false, viaCT = false;
    if (tMaCT && String(r.maCT || '').trim() === tMaCT) { match = true; viaCT = true; }
    else if (tNameNorm) {
      var wNorm = ganttNorm_(r.workItem);
      if (wNorm && (wNorm.indexOf(tNameNorm) >= 0 || tNameNorm.indexOf(wNorm) >= 0)) match = true;
    }
    if (!match) continue;
    var rd = ganttParseDate_(r.date) || new Date(0);
    var tier = viaCT ? 2 : 1; // báo cáo gắn đúng mã công tác luôn thắng khớp tên
    if (!best || tier > best.tier || (tier === best.tier && rd > bestDate)) {
      best = { pct: pct, tier: tier };
      bestDate = rd;
    }
  }
  if (best) {
    actual = Math.max(0, Math.min(100, best.pct));
    source = best.tier === 2 ? 'BC ngày (mã công tác)' : 'BC ngày (khớp tên)';
  } else if (/hoàn thành|hoan thanh|xong|100/.test(ganttNorm_(t.trangThai))) {
    actual = 100;
    source = 'Trạng thái Gantt';
  }

  if (now < start) return { status: 'future', planned: 0, actual: actual, source: source || '—' };
  if (actual === null) return { status: 'nodata', planned: planned, actual: null, source: '—' };
  if (actual >= 100) return { status: 'done', planned: planned, actual: 100, source: source };

  var delta = actual - planned;
  var daysLeft = Math.ceil((end - now) / 86400000);
  var status;
  if (now >= end || delta < -15) status = 'late';
  else if (delta < -5 || (daysLeft <= 7 && delta < 0)) status = 'atrisk';
  else if (delta <= 5) status = 'ontrack';
  else status = 'ahead';
  return { status: status, planned: planned, actual: actual, source: source };
}

function tgFmtMoney_(v) {
  var n = Math.round(parseFloat(v) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Digest văn bản gửi Telegram: tổng hợp trạng thái + danh sách trễ / nguy cơ
function buildGanttDigestText_() {
  var tasks = new CRUDService("Gantt", true).list();
  var reports = [];
  try { reports = new CRUDService("Báo cáo", true).list(); } catch (e) {}
  var now = new Date();

  var counts = { ahead: 0, ontrack: 0, atrisk: 0, late: 0, done: 0, nodata: 0, future: 0 };
  var pvSum = 0, evSum = 0;
  var lateList = [], riskList = [];

  tasks.forEach(function(t) {
    if (!String(t.tenCT || '').trim()) return;
    var c = ganttClassifyTask_(t, reports, now);
    counts[c.status]++;
    var gia = parseFloat(t.giaTriCT) || 0;
    if (c.planned !== null) pvSum += gia * c.planned / 100;
    if (c.actual !== null) evSum += gia * c.actual / 100;
    var line = '• <code>' + (t.maDA || '') + '</code> ' + String(t.tenCT).substring(0, 45) +
               ' (KH ' + c.planned + '% / TH ' + (c.actual === null ? '—' : c.actual + '%') + ')';
    if (c.status === 'late') lateList.push(line);
    if (c.status === 'atrisk') riskList.push(line);
  });

  var lines = [
    '📈 <b>PHÂN TÍCH TIẾN ĐỘ GANTT — ' + Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') + '</b>',
    '',
    '🚀 Vượt tiến độ: <b>' + counts.ahead + '</b>   ✅ Đúng tiến độ: <b>' + counts.ontrack + '</b>',
    '⚠️ Nguy cơ trễ: <b>' + counts.atrisk + '</b>   🔴 Trễ tiến độ: <b>' + counts.late + '</b>',
    '🏁 Hoàn thành: <b>' + counts.done + '</b>   ⏳ Chưa tới hạn: <b>' + counts.future + '</b>   ❔ Chưa có số liệu: <b>' + counts.nodata + '</b>',
    '',
    '💵 Giá trị KH đến nay (PV): <b>' + tgFmtMoney_(pvSum) + '</b>',
    '💰 Giá trị thực hiện (EV): <b>' + tgFmtMoney_(evSum) + '</b>',
    '📊 Chênh lệch (SV): <b>' + tgFmtMoney_(evSum - pvSum) + '</b>'
  ];
  if (lateList.length) {
    lines.push('', '🔴 <b>TRỄ TIẾN ĐỘ:</b>');
    lines = lines.concat(lateList.slice(0, 8));
    if (lateList.length > 8) lines.push('… và ' + (lateList.length - 8) + ' công tác khác');
  }
  if (riskList.length) {
    lines.push('', '⚠️ <b>NGUY CƠ TRỄ:</b>');
    lines = lines.concat(riskList.slice(0, 8));
    if (riskList.length > 8) lines.push('… và ' + (riskList.length - 8) + ' công tác khác');
  }
  lines.push('', '👉 Chi tiết: mở CPM 5.0 → Sơ đồ Gantt → nút "Phân tích tiến độ"');
  return lines.join('\n');
}

// ─── SỬA CHỮA DỮ LIỆU GANTT ──────────────────────────────────────────────────
// Cột "Mã công tác" từng sinh bằng ARRAYFORMULA; khi bị ghi đè giá trị tĩnh,
// công thức vỡ làm mất mã của các dòng khác. Hàm này điền lại mã TĨNH dạng
// <Mã dự án>-### (đánh số theo thứ tự dòng trong từng dự án, tôn trọng các mã
// đang có để không trùng). Chạy từ Apps Script Editor hoặc qua action 'gantt_repair'.
function repairGanttMaCT() {
  var sheet = SS.getSheetByName("Gantt");
  if (!sheet) throw new Error("Không tìm thấy sheet Gantt");
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { fixed: 0, total: 0 };

  var mapG = SCHEMA_MAP["Gantt"] || {};
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var colMaDA = -1, colMaCT = -1, colTenCT = -1;
  headers.forEach(function(h, i) {
    var k = mapG[h] || h;
    if (k === 'maDA' && colMaDA < 0) colMaDA = i;
    if (k === 'maCT' && colMaCT < 0) colMaCT = i;
    if (k === 'tenCT' && colTenCT < 0) colTenCT = i;
  });
  if (colMaDA < 0 || colMaCT < 0) throw new Error("Không tìm thấy cột Mã dự án / Mã công tác");

  // Ghi nhận số thứ tự lớn nhất đang dùng của từng dự án (mã còn sót lại)
  var maxSeq = {};
  for (var r = 1; r < data.length; r++) {
    var ct = String(data[r][colMaCT]).trim();
    var m = ct.match(/^(.+)-(\d+)$/);
    if (m) {
      var n = parseInt(m[2], 10);
      if (!maxSeq[m[1]] || n > maxSeq[m[1]]) maxSeq[m[1]] = n;
    }
  }

  var out = [];
  var fixed = 0;
  for (var i = 1; i < data.length; i++) {
    var maDA = String(data[i][colMaDA]).trim();
    var cur = String(data[i][colMaCT]).trim();
    var ten = colTenCT >= 0 ? String(data[i][colTenCT]).trim() : '';
    if ((!cur || cur.indexOf('#') === 0) && maDA && ten) {
      var seq = (maxSeq[maDA] || 0) + 1;
      maxSeq[maDA] = seq;
      cur = maDA + '-' + ('000' + seq).slice(-3);
      fixed++;
    }
    out.push([cur]);
  }

  if (fixed > 0) {
    sheet.getRange(2, colMaCT + 1, out.length, 1).setValues(out);
    SpreadsheetApp.flush();
    cacheClear_("Gantt");
  }
  return { fixed: fixed, total: data.length - 1 };
}

// Gửi digest hằng ngày (dùng bởi trigger)
function sendDailyGanttDigest() {
  notifyTelegram_(buildGanttDigestText_(), false);
}

// Chạy 1 LẦN để cài trigger 7h sáng mỗi ngày
function installDailyDigestTrigger() {
  var exists = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === 'sendDailyGanttDigest';
  });
  if (!exists) {
    ScriptApp.newTrigger('sendDailyGanttDigest').timeBased().everyDays(1).atHour(7).create();
    Logger.log('Đã cài trigger sendDailyGanttDigest lúc 7h sáng hằng ngày');
  } else {
    Logger.log('Trigger đã tồn tại — bỏ qua');
  }
}
