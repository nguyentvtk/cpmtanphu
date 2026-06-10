# 🚀 WALKTHROUGH — CPM 5.0 PROJECT
> **Hệ thống Quản lý Dự án Xây dựng Thông minh**
> Framework: **BLAST (IPO Model)** | Backend: **Google Sheets & GAS** | Frontend: **Bootstrap 5**

---

## 📋 TỔNG QUAN DỰ ÁN

Dự án **CPM 5.0** là một giải pháp Web App toàn diện được thiết kế để quản lý các dự án đầu tư xây dựng. Hệ thống tập trung vào việc chuẩn hóa dữ liệu, tối ưu hóa quy trình phối hợp giữa các bộ phận (Kỹ thuật, Kế toán, Ban Giám đốc) và cung cấp cái nhìn trực quan về tiến độ.

### Các Module chính đã hoàn thiện:
1.  **Dashboard (Tổng quan)**: Biểu đồ Google Charts, thẻ chỉ số KPI và bộ lọc theo Năm/Trạng thái.
2.  **Quản lý Dự án**: Danh sách dạng Card, Progress bar tiến độ và quản lý thông tin 7 chữ số (Mã DA).
3.  **Bảng Kanban (Nhiệm vụ)**: Kéo thả công việc linh hoạt, thống kê hiệu suất theo từng nhân viên.
4.  **Quản lý Hợp đồng**: Phân vùng Gói thầu, Phụ lục, Nghiệm thu và tự động tính lũy kế thanh toán.
5.  **Sơ đồ Gantt**: Theo dõi tiến độ trên trục thời gian, tự động giãn khít cột trong tháng, hỗ trợ xem theo Ngày/Tuần/Tháng/Quý, và tích hợp tooltip di động.
6.  **Quản lý Nhà thầu**: Module mới hỗ trợ CRUD 2 chiều, import/export Excel, tự động validate MST 10 hoặc 13 chữ số, và phân quyền xóa (chỉ Admin/Giám đốc).
7.  **Hệ thống Bảo mật (RBAC)**: Phân quyền chi tiết cho 4 bộ phận, bảo vệ hành động xóa nhạy cảm.
8.  **Hệ thống Thông báo (Chuông thông báo)**: Thiết lập biểu tượng chuông trên Sidebar Header của Shell Container, tích hợp Offcanvas trượt trái cao cấp hiển thị cảnh báo phân quyền thông minh.
9.  **Module Báo cáo ngày (tích hợp từ app BQLDA Tân Phú)**: Nhân viên kỹ thuật nộp báo cáo thi công ngày trực tiếp trong CPM 5.0 (trang `baocao`), ghi vào sheet `Báo cáo`. Backend hỗ trợ song song payload từ app BQLDA Tân Phú cũ (tự nhận diện và chuyển đổi key). Nhân viên chỉ thấy báo cáo của mình, Quản lý trở lên thấy tất cả.
10. **Module Quyết toán DAHT (Thông tư 91/2025/TT-BTC)**: Lập hồ sơ quyết toán dự án hoàn thành ngay trong CPM 5.0 (trang `quyettoan`). Khởi tạo tự động từ dữ liệu Dự án + Hợp đồng (nguồn vốn, danh mục văn bản Mẫu 02, công nợ Mẫu 07); kế toán chỉnh sửa qua 6 tab (Thông tin chung / Nguồn vốn / Chi phí / Văn bản / Tài sản / Công nợ); in trọn bộ Bìa + Tờ trình + Mẫu 01-07 từ trình duyệt với phần dữ liệu theo dự án tô đỏ, số tiền tự đọc thành chữ. Dữ liệu lưu tại 6 sheet: `Quyết toán DAHT`, `QT Nguồn vốn`, `QT Chi phí`, `QT Văn bản`, `QT Tài sản`, `QT Công nợ` (tự tạo khi truy cập lần đầu).
11. **Module Tư vấn giám sát (TVGS)**: Cổng đăng nhập riêng cho Nhà thầu Tư vấn giám sát (nhận diện qua Tên HĐ chứa "giám sát" trong sheet `Hợp đồng`). Đăng nhập bằng Mã số doanh nghiệp hoặc Email, mật khẩu mặc định `Nhathau123`. Quản lý trở lên thiết lập lịch báo cáo (Hàng ngày/Tuần/Tháng); trễ hạn tự động gửi email cảnh báo, đủ 3 lần vi phạm bị đánh dấu "Vi phạm kỷ luật" và email báo Ban Giám đốc.

---

## 🏗️ KIẾN TRÚC HỆ THỐNG (IPO MODEL)

### 1. Inputs (01_Inputs)
- **Database**: Sử dụng Google Sheets làm cơ sở dữ liệu trung tâm.
- **Schema**: Định nghĩa 13 sheet dữ liệu chuẩn hóa (Dự án, Gói thầu, Hợp đồng, Nhiệm vụ...).

### 2. Process (02_Process)
- **Backend**: Google Apps Script (GAS).
- **Core Logic**: File [Code.gs](file:///D:/n3n/CPM5.0/02_Process/Code.gs) xử lý các yêu cầu CRUD, chuẩn hóa dữ liệu (Normalize) và xác thực người dùng.

### 3. Outputs (03_Outputs)
- **Frontend**: Giao diện HTML/JS thuần sử dụng Bootstrap 5.3.
- **Mobile-First**: Tối ưu hóa cho thiết bị di động với Sidebar linh hoạt.

---

## 🛠️ HƯỚNG DẪN TRIỂN KHAI (DEPLOYMENT ONLINE 100%)

Với **Cách 2**, toàn bộ giao diện (Frontend) và bộ xử lý dữ liệu (Backend) của **CPM 5.0** sẽ chạy trực tiếp trên máy chủ của Google. Bạn chỉ cần gửi link Web App cho các bộ phận là họ có thể đăng nhập và sử dụng từ bất kỳ đâu!

### Bước 1: Thiết lập Google Sheets
1. Tạo một file Google Spreadsheet mới.
2. Tạo đủ 15 Sheet với tên chính xác như sau:
   * `Dự án`, `Gói thầu`, `Hợp đồng`, `Phụ lục HĐ`, `Nghiệm thu`, `Nhiệm vụ`, `Nhân sự`, `Nhà thầu`, `Gantt`, `Holidays`, `Thông báo`, `Phản hồi người dùng`, `Nhật ký hoạt động`, `Nhà thầu TVGS`, `Báo cáo TVGS`.
   * Lưu ý: 2 sheet TVGS sẽ được backend tự tạo kèm tiêu đề cột khi truy cập lần đầu, nên có thể bỏ qua bước tạo thủ công.

### Bước 2: Cài đặt và cấu hình Google Apps Script
1. Tại Spreadsheet, chọn **Extensions** > **Apps Script**.
2. **Copy nội dung file [Code.gs](file:///D:/n3n/CPM5.0/02_Process/Code.gs)**, dán đè hoàn toàn vào file `Code.gs` trong Apps Script.
3. Trong giao diện Apps Script, bạn lần lượt tạo **13 file HTML** mới bằng cách nhấn vào dấu **`+` (Add a file)** > chọn **HTML**, đặt tên chính xác và copy-paste nội dung từ các file tương ứng trong thư mục `03_Outputs` trên máy tính của bạn:
   * Tạo file `login` ➔ Dán nội dung của [login.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/login.html)
   * Tạo file `index` ➔ Dán nội dung của [index.html](file:///D:/n3n/CPM5.0/03_Outputs/index.html)
   * Tạo file `projects` ➔ Dán nội dung của [projects.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/projects.html)
   * Tạo file `tasks` ➔ Dán nội dung của [tasks.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/tasks.html)
   * Tạo file `contracts` ➔ Dán nội dung của [contracts.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/contracts.html)
   * Tạo file `gantt` ➔ Dán nội dung của [gantt.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/gantt.html)
   * Tạo file `nhansu` ➔ Dán nội dung của [nhansu.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/nhansu.html)
   * Tạo file `api` ➔ Dán nội dung của [api.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/api.html)
   * Tạo file `contractors` ➔ Dán nội dung của [contractors.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/contractors.html)
   * Tạo file `tvgs` ➔ Dán nội dung của [tvgs.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/tvgs.html) *(Cổng nộp báo cáo của Nhà thầu TVGS)*
   * Tạo file `giamsat` ➔ Dán nội dung của [giamsat.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/giamsat.html) *(Trang quản lý TVGS nội bộ)*
   * Tạo file `baocao` ➔ Dán nội dung của [baocao.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/baocao.html) *(Báo cáo thi công ngày của nhân viên kỹ thuật)*
   * Tạo file `quyettoan` ➔ Dán nội dung của [quyettoan.html](file:///D:/n3n/CPM5.0/03_Outputs/pages/quyettoan.html) *(Quyết toán dự án hoàn thành theo TT 91/2025/TT-BTC)*
4. Nhấn **Save** (biểu tượng đĩa mềm).
5. **Kích hoạt kiểm tra báo cáo TVGS tự động**: Trong Apps Script Editor, chọn hàm `installTVGSTrigger` trên thanh công cụ ➔ nhấn **Run** (chạy 1 lần). Trigger sẽ tự chạy `checkTVGSReports` mỗi ngày lúc 7h sáng: phát hiện báo cáo trễ hạn, gửi email cảnh báo nhà thầu, đủ 3 vi phạm thì đánh dấu "Vi phạm kỷ luật" và email Ban Giám đốc.

### Bước 3: Triển khai Web App (QUAN TRỌNG)
1. Nhấn nút **Deploy** (Góc trên bên phải) > Chọn **New Deployment** (hoặc nếu đã triển khai trước đó, chọn **Manage Deployments** > Nhấp vào bút chì **Edit** > Chọn **New Version**).
2. Chọn **Select type** > **Web App**.
3. Cấu hình chính xác như sau:
   * **Description**: "CPM 5.0 Online"
   * **Execute as**: **Me** (Tài khoản Google của bạn)
   * **Who has access**: **Anyone** (Bất kỳ ai - để mọi người có thể vào form đăng nhập không cần login tài khoản Google của bạn).
4. Nhấn **Deploy** (hoặc **Re-deploy**).
5. **Copy Web App URL** được cấp (có dạng `https://script.google.com/macros/s/.../exec`).

---

## 🧪 KẾT QUẢ ĐẠT ĐƯỢC
Sau khi hoàn tất 3 bước trên, bạn chỉ cần **mở trực tiếp URL Web App** vừa copy trên bất kỳ trình duyệt nào (Máy tính hoặc Điện thoại):
* [x] **Trang Đăng nhập (login)** sẽ hiển thị đầu tiên vô cùng đẹp mắt.
* [x] Sau khi nhập tài khoản (`admin@cpm.vn` / `123456`), hệ thống sẽ chuyển hướng mượt mà sang **Dashboard Tổng quan**.
* [x] Menu Sidebar bên trái hoạt động hoàn hảo, cho phép bạn chuyển đổi giữa các module: Dự án, Nhiệm vụ Kanban, Hợp đồng, Gantt Chart một cách tức thời mà không lo bị mất tham số hay lỗi đường truyền!
* [x] **Nâng cấp Sơ đồ Gantt (Gantt Chart)**:
  * **Tự động giãn khít cột ngày**: Ở chế độ xem "Ngày", cột ngày tự động tính toán chiều rộng thích ứng hoàn hảo với không gian trống, hiển thị đủ số ngày trong tháng mà không có thanh cuộn ngang khi co giãn sidebar bên trái.
  * **Định vị nhãn công tác**: Tên công tác hiển thị đầy đủ, bắt đầu từ điểm bắt đầu thanh gantt và có hiệu ứng text-shadow trắng để nổi bật trên mọi màu nền.
  * **Nhãn dự án liền mạch**: Định dạng thông tin dự án dạng `DD/MM-DD/MM | Kỹ thuật: ... | Kế toán: ...` hiển thị đầy đủ trên thanh dự án nhờ tính năng `overflow: visible` và text-shadow đen sắc nét.
  * **Hệ thống Tooltip cao cấp**: Tích hợp global tooltip di động bằng Javascript, hiển thị Thời gian (xanh đậm) và Giá trị công tác dạng dấu chấm phân tách hàng nghìn (đỏ đậm) khi hover chuột vào thanh gantt.
  * **Biểu tượng nhân bản trực quan**: Cập nhật biểu tượng nhân bản dự án và nhân bản công tác thành biểu tượng copy (`bi-copy`) trực quan.
  * **Hiển thị có chọn lọc**: Chỉ hiển thị tiến độ chi tiết của các dự án khai báo trong sheet Gantt, đồng thời ẩn mã hiệu công tác và mã dự án để giao diện sạch sẽ.
* [x] **Module Quản lý Nhà thầu (Mới)**:
  * Tích hợp đầy đủ tính năng CRUD hai chiều kết nối trực tiếp với sheet `Nhà thầu`.
  * Hỗ trợ tải dữ liệu mẫu và Import/Export Excel nhanh chóng bằng SheetJS.
  * Tự động kiểm tra tính hợp lệ của Mã số thuế (MST) 10 hoặc 13 chữ số (định dạng `1234567890` hoặc `1234567890-123`).
  * Tích hợp kiểm soát quyền hạn: Chỉ tài khoản Admin hoặc Giám đốc mới có quyền xóa nhà thầu khỏi hệ thống.
  * Tự động tích hợp menu "Nhà thầu" vào Sidebar của toàn bộ các trang giao diện HTML.
  * **Liên kết dữ liệu Hợp đồng, Phụ lục HĐ, Nghiệm thu**: Chuyển đổi ô nhập "Tên nhà thầu" trong modal Chi tiết/Sửa Hợp đồng, Phụ lục HĐ, và Hồ sơ Nghiệm thu sang dạng dropdown select chọn trực tiếp từ danh sách nhà thầu của hệ thống.
* [x] **Định dạng hiển thị Cột K và Cột M (Sheet Nhiệm vụ)**:
  * **Cột K (Tiến độ %)**: Cập nhật tự động định dạng số `0%` trong Google Sheets sau mỗi lần Lưu/Cập nhật hoặc Import.
  * **Cột M (File)**: Đảm bảo chỉ lưu danh sách URL thuần cách nhau bởi dấu xuống dòng `\n`.
* [x] **Hệ thống Chuông thông báo (Mới nâng cấp)**:
  * Di chuyển biểu tượng chuông và badge đếm số đỏ về góc bên phải của Sidebar Header, cạnh nút đóng mobile (nếu có), giúp bố cục cân đối và chuyên nghiệp.
  * Thiết kế khung Offcanvas trượt trái thanh lịch hiển thị danh sách thông báo phân loại icon màu sắc trực quan (Info, Success, Warning, Danger).
  * Lọc thông báo thông minh theo phân quyền nghiêm ngặt và giới hạn 30 ngày gần đây: Nhân viên thường chỉ thấy các nhiệm vụ mới họ được giao trực tiếp và dự án mới họ trực tiếp phụ trách (Kỹ thuật/Kế toán) bắt đầu trong vòng 30 ngày gần đây; Quản lý/Giám đốc có thể xem các dự án mới của toàn hệ thống trong vòng 30 ngày gần đây.
  * Hỗ trợ cảnh báo thời gian thực: Nhiệm vụ mới giao, Dự án mới, Hợp đồng mới, Nhiệm vụ trễ hạn, Dự án chậm tiến độ và thông báo tùy chỉnh từ sheet `Thông báo`.
  * Quản lý trạng thái "Đã đọc" thông qua Local Storage hoặc cập nhật trạng thái "Đã đọc" trực tiếp lên Google Sheets khi nhấp chuột.
* [x] **Nâng cấp giao diện Module Hợp đồng (Mới nâng cấp)**:
  * Mã số Dự án hiển thị dưới dạng badge chữ mono màu Indigo nhạt (`bg-primary-subtle text-primary border border-primary-subtle fw-semibold`), thống nhất và làm nổi bật mã trên cả 4 tab: Gói thầu, Hợp đồng, Phụ lục HĐ, Nghiệm thu.
  * Cột Loại Gói thầu hiển thị badge phân loại màu sắc đặc trưng: Tư vấn (Cyan/Xanh nhạt), Xây lắp (Vàng/Cam), Thiết bị (Indigo/Primary nhạt), Phi tư vấn (Xám).
  * Cột Trạng thái Gói thầu hiển thị badge màu sắc động tương ứng: Đã hoàn thành (Xanh lá), Đang tổ chức LCNT (Vàng/Cam), Chưa triển khai/Chưa thực hiện (Xám).

---
*Tài liệu hướng dẫn nâng cấp Web App Online 100% — CPM 5.0*
