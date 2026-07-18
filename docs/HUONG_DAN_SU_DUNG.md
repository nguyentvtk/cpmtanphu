# 📘 HƯỚNG DẪN SỬ DỤNG CPM 5.0 — THEO TỪNG VAI TRÒ

> **Hệ thống Quản lý Dự án Đầu tư Xây dựng — Ban QLDA Tân Phú**
> Backend: Google Sheets + Google Apps Script (GAS) · Frontend: Bootstrap 5
> Bản online: https://cpmtanphu.vercel.app · Bản GAS Web App: link `/exec` do quản trị viên cấp

---

## 0. TÓM TẮT NHANH (đọc trước khi triển khai)

| Nội dung | Thông tin |
|---|---|
| Địa chỉ truy cập | Link Vercel (`cpmtanphu.vercel.app`) hoặc link GAS Web App `.../exec` |
| Thiết bị | Máy tính, máy tính bảng, điện thoại — chỉ cần trình duyệt (Chrome/Edge/Safari) |
| Đăng nhập nội bộ | **Email** + **Mật khẩu** (do quản trị viên tạo trong sheet `Nhân sự`) |
| Đăng nhập nhà thầu giám sát | **Mã số doanh nghiệp** hoặc **Email** + mật khẩu mặc định `Nhathau123` |
| 4 nhóm vai trò | ① Ban Giám đốc / Admin · ② Quản lý / Trưởng phòng · ③ Nhân viên (Kỹ thuật, Kế toán) · ④ Nhà thầu TVGS (bên ngoài) |

> ⚠️ **Lưu ý quan trọng:** Tài khoản mẫu `admin@cpm.vn / 123456` trong tài liệu cũ **KHÔNG dùng được**. Hệ thống xác thực theo đúng danh sách email trong sheet `Nhân sự`. Xem mục **1.2** để biết cách tạo tài khoản.

---

## 1. DÀNH CHO QUẢN TRỊ VIÊN (ADMIN) — THIẾT LẬP HỆ THỐNG

### 1.1. Kiến trúc & nơi lưu dữ liệu
- Toàn bộ dữ liệu nằm trong **1 file Google Spreadsheet** (24 sheet: `Dự án`, `Gói thầu`, `Hợp đồng`, `Phụ lục HĐ`, `Nghiệm thu`, `Nhiệm vụ`, `Nhân sự`, `Nhà thầu`, `Gantt`, `Holidays`, `Thông báo`, `Báo cáo`, các sheet `QT *` cho quyết toán, `Nhà thầu TVGS`, `Báo cáo TVGS`…).
- Backend là **Google Apps Script** (`Code.gs`) gắn với file Sheet đó, deploy dạng **Web App**.
- Giao diện chạy song song 2 nơi: **GAS Web App** (bản gốc, dữ liệu trực tiếp) và **Vercel** (bản tĩnh, gọi ngược về cùng API GAS).

### 1.2. Tạo / cấp tài khoản nhân viên
Mở sheet **`Nhân sự`**, mỗi dòng là một người dùng. Các cột quan trọng:

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| Mã NV | Mã nhân viên (duy nhất) | `NV003` |
| Họ tên | Tên hiển thị | `Trần Minh Tuấn` |
| Email | **Dùng để đăng nhập** | `minhtuantran.tn@gmail.com` |
| Mật khẩu | **Dùng để đăng nhập** | `a123` |
| Chức vụ | Hiển thị + xét quyền | `Giám đốc`, `Cán bộ kỹ thuật`, `Cán bộ kế toán` |
| Phòng ban | Nhóm bộ phận | `Ban Giám đốc`, `Kỹ thuật - Thẩm định`, `Kế toán - Tài chính` |
| Phân quyền (role) | Cấp quyền hệ thống | `Admin` hoặc `Nhân viên` |

**Quy tắc phân quyền (RBAC):**
- Người dùng được coi là **Quản trị/Giám đốc** (toàn quyền, kể cả **xóa nhà thầu**) nếu `Phân quyền = Admin` **hoặc** `Chức vụ` chứa chữ "Giám đốc".
- Người dùng được coi là **Quản lý trở lên** (xem *tất cả* báo cáo ngày, thiết lập lịch TVGS) nếu `role`/`Chức vụ` chứa: `Admin`, `Giám đốc`, `Quản lý`, `Trưởng phòng`.
- Còn lại là **Nhân viên thường**: chỉ thấy dữ liệu liên quan đến mình.

> 💡 Muốn cấp quyền xóa/quản lý cho ai, chỉ cần sửa cột **Chức vụ** hoặc **Phân quyền** của người đó rồi lưu Sheet. Không cần sửa code.

### 1.3. Deploy / cập nhật hệ thống (khi có thay đổi code)
**A. Cập nhật backend (Code.gs) & giao diện GAS:**
1. Mở Spreadsheet → **Extensions → Apps Script**.
2. Dán đè nội dung mới của `02_Process/Code.gs` và các file HTML trong `03_Outputs`.
3. **Deploy → Manage Deployments → Edit (bút chì) → New Version → Deploy.**
4. Giữ cấu hình: **Execute as: Me**, **Who has access: Anyone**.

**B. Cập nhật bản Vercel (tùy chọn):** trên máy đã cài Git + Python, chạy:
```
python build_vercel.py     # đóng gói 03_Outputs → dist_vercel
deploy.bat                 # commit + push GitHub → Vercel tự build
```

**C. Bật kiểm tra TVGS tự động (chạy 1 lần):** trong Apps Script, chọn hàm `installTVGSTrigger` → **Run**. Hệ thống sẽ tự chạy `checkTVGSReports` mỗi sáng 7h: phát hiện báo cáo trễ, gửi email cảnh báo, đủ 3 vi phạm thì đánh dấu "Vi phạm kỷ luật" và email Ban Giám đốc.

### 1.4. Máy tính mới cần cài gì (để build/deploy)
| Thành phần | Vai trò | Ghi chú |
|---|---|---|
| **Trình duyệt** (Chrome/Edge) | Dùng app | Bắt buộc |
| **Git** | Đẩy code lên GitHub → Vercel | Chỉ cần cho người deploy |
| **Python 3.12** | Chạy `build_vercel.py` | Chỉ cần cho người deploy |
| Node.js (tùy chọn) | Nếu dùng `vercel` CLI / server test | Không bắt buộc |

> Người dùng cuối (nhân viên, lãnh đạo) **không cần cài gì** — chỉ mở link bằng trình duyệt.

---

## 2. VAI TRÒ: BAN GIÁM ĐỐC / ADMIN

**Bạn thấy toàn bộ hệ thống và có mọi quyền.**

### Đăng nhập
1. Mở link hệ thống → tab **👤 Nhân viên**.
2. Nhập **Email** + **Mật khẩu** của bạn → **Đăng nhập**.
3. Vào thẳng **Tổng quan (Dashboard)**.

### Việc nên làm hằng ngày
- **Dashboard:** theo dõi 4 chỉ số (Tổng dự án, Nhiệm vụ đang làm, Hợp đồng, Nhiệm vụ hoàn thành); lọc theo **Năm** / **Trạng thái**; xem biểu đồ dự án theo loại và trạng thái nhiệm vụ.
- **🔔 Chuông thông báo** (góc phải sidebar): xem dự án mới, hợp đồng mới, nhiệm vụ trễ hạn, dự án chậm tiến độ trong 30 ngày — bạn thấy của **toàn hệ thống**.
- **Gantt:** nhìn tổng thể tiến độ các dự án trên trục thời gian (xem theo Ngày/Tuần/Tháng/Quý).

### Quyền đặc biệt chỉ bạn có
- **Xóa nhà thầu** (trang Nhà thầu — nút thùng rác chỉ hiện với bạn).
- Duyệt/giám sát **tất cả báo cáo ngày**, **tất cả hồ sơ quyết toán**, **lịch báo cáo TVGS**.

---

## 3. VAI TRÒ: QUẢN LÝ / TRƯỞNG PHÒNG

**Bạn điều phối công việc và giám sát bộ phận.** Đăng nhập giống mục 2.

### Chức năng chính
- **Nhiệm vụ (Kanban):** kéo–thả công việc giữa các cột trạng thái; xem thống kê hiệu suất theo nhân viên; giao việc mới (người được giao sẽ nhận thông báo).
- **Dự án:** tạo/sửa dự án, gán **Phụ trách Kỹ thuật** và **Phụ trách Kế toán**, cập nhật % tiến độ.
- **Báo cáo ngày:** bạn xem được **tất cả** báo cáo thi công của nhân viên (nhân viên thường chỉ thấy của họ).
- **Tư vấn giám sát (trang Giám sát):** thiết lập **lịch báo cáo** cho từng nhà thầu TVGS (Hàng ngày / Tuần / Tháng); bấm **"Kiểm tra ngay"** để rà trễ hạn thủ công.
- **Chuông thông báo:** thấy cảnh báo cấp hệ thống (dự án mới, hợp đồng mới, trễ hạn).

---

## 4. VAI TRÒ: NHÂN VIÊN KỸ THUẬT

**Trọng tâm: cập nhật tiến độ thi công và nộp báo cáo ngày.** Đăng nhập giống mục 2 (tab 👤 Nhân viên).

### 4.1. Báo cáo thi công ngày (quan trọng nhất)
1. Menu **Báo cáo ngày**.
2. Chọn **Dự án**, nhập **ngày**, **nội dung thi công**, **nhân lực/thiết bị**, **khối lượng**, **đính kèm ảnh/URL** nếu có.
3. **Chọn "Công tác Gantt"** tương ứng (dropdown tự lọc theo dự án) và nhập **Tiến độ (%) = % lũy kế hoàn thành của công tác đó** — đây là nguồn số liệu để hệ thống phân tích tiến độ tự động (xem mục 6B).
4. Bấm **Lưu** → báo cáo ghi vào sheet `Báo cáo`.
4. Bạn **chỉ thấy báo cáo của chính mình**; Quản lý/Giám đốc thấy tất cả.

### 4.2. Cập nhật nhiệm vụ
- Vào **Nhiệm vụ (Kanban):** kéo thẻ việc của bạn sang cột trạng thái phù hợp; cập nhật **% tiến độ (cột K)**; đính kèm **URL file** (cột M — mỗi link một dòng).

### 4.3. Theo dõi
- **Dự án / Gantt:** xem dự án bạn phụ trách Kỹ thuật và mốc thời gian.
- **🔔 Thông báo:** bạn chỉ nhận cảnh báo về **nhiệm vụ được giao trực tiếp** và **dự án bạn trực tiếp phụ trách** (30 ngày gần đây).

> ❌ Bạn **không có** nút xóa nhà thầu và không sửa được dữ liệu ngoài phạm vi phụ trách.

---

## 5. VAI TRÒ: NHÂN VIÊN KẾ TOÁN

**Trọng tâm: hợp đồng, thanh toán và quyết toán.** Đăng nhập giống mục 2.

### 5.1. Quản lý hợp đồng
- Menu **Hợp đồng** — 4 tab: **Gói thầu · Hợp đồng · Phụ lục HĐ · Nghiệm thu**.
- Thêm/sửa gói thầu, hợp đồng, phụ lục, hồ sơ nghiệm thu; hệ thống **tự tính lũy kế thanh toán**.
- Ô **"Tên nhà thầu"** là dropdown chọn từ danh sách sheet `Nhà thầu` (không gõ tay).
- Badge màu giúp nhận biết nhanh: Loại gói thầu (Tư vấn/Xây lắp/Thiết bị/Phi tư vấn) và Trạng thái (Hoàn thành/Đang LCNT/Chưa triển khai).

### 5.2. Quyết toán dự án hoàn thành (TT 91/2025/TT-BTC)
1. Menu **Quyết toán DAHT** → **Lập hồ sơ** → chọn **Mã DA**.
2. Hệ thống **tự khởi tạo** từ dữ liệu Dự án + Hợp đồng (nguồn vốn, danh mục văn bản Mẫu 02, công nợ Mẫu 07).
3. Chỉnh sửa qua **6 tab:** Thông tin chung · Nguồn vốn · Chi phí · Văn bản · Tài sản · Công nợ.
4. **In trọn bộ** Bìa + Tờ trình + Mẫu 01–07 từ trình duyệt: phần dữ liệu theo dự án tô **đỏ**, số tiền **tự đọc thành chữ**.
5. Dữ liệu lưu tại 6 sheet `Quyết toán DAHT`, `QT Nguồn vốn`, `QT Chi phí`, `QT Văn bản`, `QT Tài sản`, `QT Công nợ` (tự tạo lần đầu truy cập).

### 5.3. Nhà thầu
- Menu **Nhà thầu:** thêm/sửa, **Import/Export Excel**, hệ thống tự kiểm tra **MST 10 hoặc 13 chữ số**. (Xóa: chỉ Admin/Giám đốc.)

---

## 6. VAI TRÒ: NHÀ THẦU TƯ VẤN GIÁM SÁT (TVGS) — NGƯỜI DÙNG BÊN NGOÀI

**Cổng riêng để nộp báo cáo giám sát.**

### Đăng nhập
1. Mở link hệ thống → tab **🏗️ Tư vấn giám sát**.
2. Nhập **Mã số doanh nghiệp** (hoặc Email đã đăng ký) + mật khẩu **`Nhathau123`** (mặc định lần đầu).
3. **Đổi mật khẩu** ngay sau lần đăng nhập đầu tiên.

### Nhiệm vụ
- Nộp **báo cáo giám sát** theo **lịch** mà Ban QLDA thiết lập (Hàng ngày / Tuần / Tháng).
- **Trễ hạn** → hệ thống tự gửi **email cảnh báo**. Đủ **3 lần vi phạm** → bị đánh dấu **"Vi phạm kỷ luật"** và email báo Ban Giám đốc.
- Nhà thầu TVGS được nhận diện tự động qua Hợp đồng có tên chứa chữ **"giám sát"**.

---

## 6B. PHÂN TÍCH TIẾN ĐỘ & GIÁ TRỊ THỰC HIỆN (trang Sơ đồ Gantt)

Trang **Sơ đồ Gantt** có nút **"📈 Phân tích tiến độ"** (góc phải thanh công cụ). Hệ thống tự so sánh **tiến độ kế hoạch** với **tiến độ thực tế** của từng công tác và phân loại:

| Trạng thái | Ý nghĩa | Điều kiện |
|---|---|---|
| 🚀 Vượt tiến độ | Thực hiện nhanh hơn kế hoạch | TH% > KH% + 5 |
| ✅ Đúng tiến độ | Bám sát kế hoạch | Chênh lệch trong ±5% |
| ⚠️ Nguy cơ trễ | Cần đôn đốc | Chậm 5–15%, hoặc còn ≤7 ngày mà chưa đạt KH |
| 🔴 Trễ tiến độ | Cần xử lý ngay | Chậm >15%, hoặc quá hạn mà chưa xong |
| 🏁 Hoàn thành | Đã đạt 100% | — |
| ⏳ Chưa tới hạn | Công tác chưa bắt đầu | — |
| ❔ Chưa có số liệu | Chưa có báo cáo thực tế nào khớp | — |

**Cách tính:**
- **KH%** (kế hoạch) = thời gian đã trôi qua ÷ tổng thời gian công tác (theo ngày bắt đầu/kết thúc trên Gantt).
- **TH%** (thực hiện) lấy từ **Báo cáo ngày** của cán bộ kỹ thuật: ưu tiên báo cáo **gắn đúng Mã công tác Gantt**, sau đó mới khớp theo tên hạng mục; nếu không có thì dùng trạng thái "Hoàn thành" trên Gantt.
- **Giá trị:** PV = Giá trị công tác × KH%, EV = Giá trị công tác × TH%, SV = EV − PV (âm là chậm giá trị).
- Panel còn hiển thị **ghi nhận TVGS gần nhất** của từng dự án (đánh giá chất lượng, vi phạm).

**📌 Quy định cho Cán bộ QLDA (quan trọng để số liệu chính xác):** khi nộp **Báo cáo ngày**, hãy chọn đúng **"Công tác Gantt"** trong form (dropdown tự lọc theo dự án, chọn xong tự điền tên hạng mục) và nhập **Tiến độ (%) = % LŨY KẾ hoàn thành của công tác đó** (không phải % của riêng ngày hôm ấy). Báo cáo không gắn công tác vẫn hợp lệ nhưng hệ thống phải đoán theo tên, kém chính xác hơn.

---

## 6C. THÔNG BÁO TELEGRAM CHO BAN QUẢN LÝ

Khi cấu hình xong, mọi thao tác **Tạo mới / Cập nhật / Xóa** trên các sheet quan trọng (Dự án, Hợp đồng, Nhiệm vụ, Báo cáo, Nhà thầu, Gantt, Quyết toán…) sẽ được bot nhắn ngay vào group Telegram của Ban quản lý, kèm **tên người thao tác + thời gian**. Hành động **Xóa** kèm nút **"✅ Đã nắm thông tin"** — Quản lý bấm trực tiếp trên Telegram để xác nhận (tin nhắn tự ghi lại ai đã xác nhận, lúc nào).

**Lệnh chat với bot (trong group):**
- `/tiendo` — nhận ngay **báo cáo phân tích tiến độ & giá trị Gantt** (số công tác vượt/đúng/nguy cơ/trễ, PV/EV/SV, danh sách công tác trễ).
- Ngoài ra bot tự gửi báo cáo này **7h sáng mỗi ngày** (nếu bật trigger).

**Thiết lập (Admin làm 1 lần):**
1. Telegram → chat với **@BotFather** → `/newbot` → đặt tên → nhận **BOT TOKEN**.
2. Tạo **group Telegram** cho Ban quản lý, thêm bot vào group. Lấy **CHAT ID** của group (thêm @getidsbot vào group, hoặc mở `https://api.telegram.org/bot<TOKEN>/getUpdates` sau khi nhắn 1 tin).
3. Apps Script → ⚙️ **Project Settings → Script Properties** → thêm 2 khóa:
   - `TELEGRAM_BOT_TOKEN` = token ở bước 1
   - `TELEGRAM_CHAT_ID` = chat id ở bước 2 (group thường bắt đầu bằng `-100`)
   - 💡 Group có bật **Topics** (diễn đàn): muốn bot gửi vào đúng topic, dùng dạng `chatid_topicid`, ví dụ `-1002010998673_254` (topic 254 — lấy số cuối trong link `t.me/c/…/254`)
4. **Deploy phiên bản mới** của Web App (bắt buộc, để code mới chạy).
5. Trong Apps Script Editor chạy lần lượt (Run 1 lần mỗi hàm):
   - `testTelegram` — kiểm tra bot nhắn được vào group.
   - `installTelegramWebhook` — bật nút xác nhận + lệnh /tiendo.
   - `installDailyDigestTrigger` — bật báo cáo tự động 7h sáng.

> 🔒 Bot chỉ trả lời đúng group có CHAT_ID đã cấu hình — người lạ chat với bot sẽ không nhận được dữ liệu.
> Chưa cấu hình Telegram thì hệ thống vẫn chạy bình thường (bỏ qua thông báo, không lỗi).

---

## 7. QUY TRÌNH PHỐI HỢP MẪU (một dự án điển hình)

1. **Giám đốc/Quản lý** tạo **Dự án**, gán phụ trách Kỹ thuật + Kế toán.
2. **Kế toán** lập **Gói thầu → Hợp đồng**, chọn **Nhà thầu**; nhà thầu giám sát tự sinh cổng TVGS.
3. **Quản lý** thiết lập **lịch báo cáo TVGS** và giao **Nhiệm vụ** trên Kanban.
4. **Kỹ thuật** nộp **Báo cáo ngày** + cập nhật **% tiến độ**; **Nhà thầu TVGS** nộp báo cáo giám sát đúng hạn.
5. **Giám đốc** theo dõi **Dashboard + Gantt + Chuông thông báo**.
6. Khi dự án hoàn thành → **Kế toán** lập **Quyết toán DAHT** và in hồ sơ theo TT 91/2025.

---

## 8. XỬ LÝ SỰ CỐ THƯỜNG GẶP

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| "Email hoặc Mật khẩu không chính xác" | Email/mật khẩu chưa khớp sheet `Nhân sự`. Admin kiểm tra đúng cột Email & Mật khẩu. |
| "Failed to fetch" khi đăng nhập | GAS Web App chưa deploy với quyền **Anyone**, hoặc mở file offline. Dùng link `/exec` hoặc link Vercel, không mở trực tiếp file HTML. |
| Dashboard hiện số 0 giây lát rồi mới có số | Bình thường — dữ liệu tải từ Google Sheets qua iframe, chờ 2–5 giây. |
| Trang tải chậm / lỗi tải nhiều lần | Google Sheets giới hạn truy vấn (429). Chờ 1–2 phút rồi tải lại; hệ thống có cache 60 giây. |
| Không thấy nút Xóa nhà thầu | Đúng thiết kế — chỉ Admin/Giám đốc mới có. |
| Nhà thầu TVGS không đăng nhập được | Kiểm tra Mã số DN trong sheet `Nhà thầu TVGS`; mật khẩu mặc định `Nhathau123`. Chạy `tvgs_sync` (nút Đồng bộ) để tạo mới từ Hợp đồng. |

---

## 9. LIÊN HỆ HỖ TRỢ
- **Zalo:** 0818156116 · **Email:** nguyentvtk@gmail.com
- **Youtube hướng dẫn:** kênh Nguyễn Hoàng

---
*CPM 5.0 — Tài liệu hướng dẫn sử dụng theo vai trò · Cập nhật 17/07/2026*
