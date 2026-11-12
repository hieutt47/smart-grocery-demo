# Theo dõi tiến độ Bữa Nhà

**Cập nhật gần nhất:** 28/10/2026  
**Mục tiêu ngắn hạn:** hoàn thiện demo v0.1 có thể mở qua đường dẫn online, đi hết hai hành trình và được người dùng thử độc lập.  
**Cách làm:** hoàn thiện từng mục nhỏ, kiểm tra xong rồi cập nhật ngay tại báo cáo này; không mở rộng đồng thời mọi phần.

## 1. Đọc nhanh

- **Hiện tại:** đã có demo chạy cục bộ; chưa đủ bằng chứng nghiệm thu v0.1.
- **Việc đang ưu tiên theo yêu cầu mới:** Visual Overhaul V2 đã có trang chủ và giao diện dùng chung trong bản build cục bộ; chưa hoàn tất kiểm định/nhất quán toàn bộ màn hình.
- **Việc tiếp theo:** phản biện ảnh V2, sửa và chụp vòng hai; kiểm tra 390/768/1440px, hoàn thiện các trang còn lại và chạy hồi quy trên đúng bản V2. Sau vòng giao diện mới tiếp tục **1.2** và các kiểm định phát hành còn thiếu. Chưa triển khai online.
- **Chưa xác nhận:** CI online, container hoạt động, URL demo HTTPS và thử nghiệm tác vụ với người dùng.
- **Không thuộc đợt này:** AI thật, thanh toán thật, vận hành nhà cung cấp và robot/thang máy thật.

Đây là bảng điều phối theo thứ tự thực hiện, không thay thế [backlog T01–T24](BACKLOG.md). Bằng chứng kỹ thuật chi tiết ở [VALIDATION.md](VALIDATION.md); phản hồi người dùng ở [DEMO.md](DEMO.md). Không tính phần trăm tổng thể vì độ lớn các mục khác nhau.

## 2. Nền tảng đã có

| Phần | Đã triển khai | Giới hạn / bằng chứng |
|---|---|---|
| Mua trực tiếp | Danh mục, tìm kiếm, giỏ, đổi số lượng, đặt đơn | Giá và hàng mẫu, không thu tiền |
| Chọn món và nguyên liệu | Công thức, khẩu phần, chọn nguyên liệu cần mua, tính số gói | 30 SKU, 12 công thức, 3 bữa ăn mẫu; nội dung chưa được chuyên gia duyệt |
| Trợ lý | Quy tắc tiếng Việt, ngân sách/số người/thời gian, đổi món giữ ngữ cảnh | Không gọi mô hình AI; khả năng hiểu câu nói có giới hạn |
| Đơn và giao hàng | Hẹn giờ, trạng thái robot, lịch sử, mua lại có xem trước | Robot và giao hàng là mô phỏng |
| Nền kỹ thuật | FastAPI + React/Vite, SQLite/Alembic, tách phiên, báo giá và chống trùng đơn | Một tiến trình; chưa có tài khoản hoặc lưu trữ bền vững trên hosting dự kiến |
| Kiểm thử | 53 test backend đạt ngày 25/10; build/TypeScript và ESLint V2 đạt ngày 28/10 | 14/14 E2E đạt trước V2; chưa chạy hồi quy trên V2, không dùng kết quả cũ để nghiệm thu bản mới |
| Phản hồi ban đầu | FB-001 tích cực về hình thức và độ dễ nhìn | Chưa chứng minh người dùng tự hoàn thành tác vụ |

## 3. Quy ước cập nhật

- **Chưa làm:** chưa bắt đầu mục của đợt hoàn thiện này, không có nghĩa tính năng chưa tồn tại.
- **Đang làm:** có công việc đang được thực hiện; phải nêu việc đang làm cụ thể.
- **Chờ:** bị chặn bởi công cụ, quyền truy cập, đầu vào hoặc mục phụ thuộc.
- **Cần kiểm lại:** có kết quả cũ hoặc lượt chạy bị ngắt, chưa đủ bằng chứng cho đợt này.
- **Đã xong:** đạt điều kiện trong bảng, có ngày hoàn thành và bằng chứng; chỉ đúng với phiên bản đã kiểm tra.

Mỗi lần hoàn thành một mục: cập nhật trạng thái, ngày, bằng chứng và nhật ký cuối trang; chuyển “Việc tiếp theo” sang mục kế tiếp. Nếu thay đổi mã ảnh hưởng kết quả cũ, đổi mục liên quan thành “Cần kiểm lại”, không xóa lịch sử đã đạt. Báo cáo subagent chỉ là đầu vào: phải kiểm tra kết quả thực tế trước khi ghi “Đã xong”.

Không tự ghi ngày dự kiến thành ngày hoàn thành. Chỉ cam kết lịch khi đủ đầu vào; hiện chưa chốt hạn hoàn tất từng chặng. Làm một mục chính tại một thời điểm; nếu bị chặn thì ghi lý do và chuyển sang mục độc lập phù hợp, không tự mở thêm tính năng.

## 4. Chặng 1 — Kiểm định kỹ thuật và bằng chứng

**Trạng thái:** đang thực hiện. **Liên quan:** T02, T07, T21, T22, T24.  
**Điều kiện đóng chặng:** các kiểm tra trên cùng phiên bản đạt, có bằng chứng CI/container và tài liệu thống nhất.

| ID | Việc cần hoàn thành | Trạng thái | Điều kiện hoàn thành | Ngày xong / bằng chứng / bước tiếp |
|---|---|---|---|---|
| 1.1 | Xác minh bộ test backend | Đã xong | Toàn bộ pytest đạt | 25/10/2026: `& ".\.venv\Scripts\python.exe" -m pytest -q` → 53 passed, 5.86s; mã ứng dụng nền `89dd560`, chưa sửa mã ứng dụng trong lượt chạy; có cảnh báo deprecation và cache permission |
| 1.2 | Kiểm tra lint và format Python | Cần kiểm lại | Ruff check và format check đều đạt | Chạy lại; không có báo cáo hoàn tất từ lượt subagent bị ngắt |
| 1.3 | Kiểm tra frontend | Đã xong | ESLint, TypeScript và production build đều đạt | 28/10/2026: `npm run build --prefix frontend` (gồm TypeScript) đạt, 1600 modules, 4.93s; `npm run lint --prefix frontend` đạt trên mã V2. JS `index-BHpqOkqH.js`, CSS `index-CQU0Hq8X.css`; chưa thay thế kiểm tra hành vi/ảnh |
| 1.4 | Kiểm thử hai trình duyệt | Cần kiểm lại | Toàn bộ 7 kịch bản hiện có đạt trên Chromium mobile và Firefox desktop; thêm hồi quy tìm kiếm toàn cục/danh mục V2 | Lịch sử: 14/14 đạt ngày 26/10 trong 42.3s và chạy lại trước V2 ngày 28/10. Chưa chạy suite sau thay đổi V2; `.last-run.json` passed là kết quả cũ, không phải bằng chứng V2. Server kiểm thử dùng `.cache/e2e.db`, không dùng `grocery.db` |
| 1.5 | Xác minh CI GitHub | Chờ | Workflow đúng commit hoàn tất thành công, có mã/đường dẫn run | GitHub plugin đã cài nhưng lỗi kết nối/xác thực; `gh` chưa có trên PATH ở lần kiểm tra 25/10 |
| 1.6 | Xác minh Docker | Chờ | Build và smoke-test health/session/cart đạt trên container | Docker chưa có trên PATH ở lần kiểm tra 25/10; có thể lấy bằng chứng từ job CI container khi truy cập được |
| 1.7 | Đồng bộ trạng thái tài liệu | Chưa làm | START_HERE, BACKLOG, VALIDATION, DEPLOYMENT không mâu thuẫn và ghi bằng chứng mới | Đã sửa một phần thông tin GitHub trong 3 tài liệu ở working tree; chưa hoàn tất đồng bộ sau kiểm định |

## 5. Chặng 2 — Đưa demo online

**Trạng thái:** chờ Chặng 1 và quyền triển khai. **Liên quan:** T04, T22.  
**Điều kiện đóng chặng:** mở được URL HTTPS thật, chạy trọn A/B và xử lý rõ cold start/mất phiên.

| ID | Việc cần hoàn thành | Trạng thái | Điều kiện hoàn thành | Ngày xong / bằng chứng / bước tiếp |
|---|---|---|---|---|
| 2.1 | Xác nhận tài khoản, quyền và gói hosting | Chờ | Có quyền Render, xác nhận triển khai và gói miễn phí phù hợp | Chủ dự án xác nhận; không tự nâng lên gói trả phí |
| 2.2 | Triển khai phiên bản đã kiểm tra | Chưa làm | Health đạt, có URL HTTPS, commit và thời điểm deploy | Dùng Dockerfile/render.yaml hiện có nếu kiểm định đạt |
| 2.3 | Kiểm tra hành trình A online | Chưa làm | Tìm hàng → giỏ → giao ngay → trạng thái → mua lại hoạt động | Ghi thiết bị/trình duyệt và kết quả; dùng thông tin mẫu |
| 2.4 | Kiểm tra hành trình B online | Chưa làm | Gợi ý món → đổi món → chọn nguyên liệu → hẹn giờ → trạng thái hoạt động | Kiểm tra trên điện thoại thật; ghi kết quả |
| 2.5 | Kiểm tra lỗi mạng và vòng đời phiên | Chưa làm | HTTPS/cookie/nguồn ghi hợp lệ; reload, thử lại không trùng đơn; cold start/restart/mất phiên có hướng xử lý | Lưu rõ SQLite trên hosting là tạm thời, không hứa giữ lịch sử lâu dài |

## 6. Chặng 3 — Thử người dùng và sửa UX

**Trạng thái:** chưa làm. **Liên quan:** T05, T23.  
**Điều kiện đóng chặng:** có quan sát thật, sửa lỗi chặn và ít nhất hai người dùng hoàn thành A/B sau sửa mà không được chỉ từng bước. Mẫu thử nhỏ chỉ là kiểm chứng định tính, không đại diện thị trường.

| ID | Việc cần hoàn thành | Trạng thái | Điều kiện hoàn thành | Ngày xong / bằng chứng / bước tiếp |
|---|---|---|---|---|
| 3.1 | Chuẩn bị và hẹn buổi thử | Chưa làm | Thống nhất tác vụ, bản demo và lịch với stakeholder + 2 người dùng | Tái sử dụng kịch bản và mẫu ghi nhận trong DEMO; không làm lại tài liệu từ đầu |
| 3.2 | Ghi nhận thử nghiệm độc lập | Chưa làm | Ghi mức trợ giúp, thời gian, chỗ nhầm và hiểu đúng AI/tiền/robot | FB-001 chỉ là phản hồi thị giác, không thay thế mục này |
| 3.3 | Chốt danh sách sửa theo mức độ | Chưa làm | Mỗi vấn đề có cách tái hiện, ưu tiên và tiêu chí đạt | Ưu tiên chặn tác vụ/gây hiểu sai; phản hồi tích cực lịch sử không thay thế việc duyệt hướng giao diện mới |
| 3.4 | Sửa lần lượt và bổ sung hồi quy | Chưa làm | Mỗi lỗi đã chọn được sửa, kiểm tra trong browser và thêm test phù hợp | Tách lỗi thực tế thành mục con `3.4a`, `3.4b`… khi đã có quan sát |
| 3.5 | Thử lại sau sửa | Chưa làm | Không còn lỗi chặn; người thử hiểu mô phỏng và tự hoàn thành A/B | Ghi nhận mới trong DEMO, không tự suy ra từ test tự động |

## 7. Chặng 4 — Củng cố trợ lý và dữ liệu mẫu

**Trạng thái:** chờ đầu vào thử nghiệm. **Liên quan:** T08, T12–T17, T21.  
**Nguyên tắc:** chỉ mở rộng theo nhu cầu đã quan sát. Hạng mục nâng cao không ảnh hưởng nghiệm thu có thể chuyển sau v0.1 với quyết định được ghi rõ.

| ID | Việc cần hoàn thành | Trạng thái | Điều kiện hoàn thành | Ngày xong / bằng chứng / bước tiếp |
|---|---|---|---|---|
| 4.1 | Chốt bộ câu nói tiếng Việt cần hỗ trợ | Chưa làm | Có tình huống thực tế được phép ghi nhận và kết quả mong đợi | Không hứa hiểu mọi câu; chốt phạm vi trước khi sửa parser |
| 4.2 | Sửa trợ lý theo bộ tình huống | Chưa làm | Bộ test đạt; giữ ngữ cảnh, ràng buộc và cơ chế an toàn dị ứng | Tái sử dụng provider hiện có; không tự thêm giỏ/đặt đơn hoặc nới ngân sách |
| 4.3 | Rà soát công thức và ánh xạ SKU | Chưa làm | Đơn vị/khẩu phần/số gói nhất quán, xử lý thiếu hàng rõ; giá gợi ý khớp quote backend | Nội dung chưa duyệt vẫn phải ghi mẫu; không tự xóa DB để seed lại |
| 4.4 | Kiểm tra lại trợ lý → nguyên liệu → giỏ | Chưa làm | Test backend và hành trình browser liên quan đạt sau sửa | Ghi phiên bản kiểm tra và các giới hạn còn lại |

## 8. Chặng 5 — Nghiệm thu demo v0.1

**Trạng thái:** chưa làm. **Liên quan:** T22–T24.  
**Điều kiện phát hành:** CI/container đạt, A/B online đạt, UAT có bằng chứng, không còn lỗi chặn và không khiến người dùng hiểu nhầm mô phỏng thành dịch vụ thật.

| ID | Việc cần hoàn thành | Trạng thái | Điều kiện hoàn thành | Ngày xong / bằng chứng / bước tiếp |
|---|---|---|---|---|
| 5.1 | Chạy kiểm tra cuối trên phiên bản chốt | Chưa làm | Bộ kiểm tra kỹ thuật và smoke-test online đạt trên cùng phiên bản | Kết quả 1.1 không thay thế kiểm tra cuối nếu mã đã đổi |
| 5.2 | Chốt tài liệu bàn giao và lỗi đã biết | Chưa làm | Hướng dẫn chạy, giới hạn dữ liệu, API nếu đổi, video/ảnh cần thiết và release notes thống nhất | Phân biệt bằng chứng tự động với phản hồi người thật |
| 5.3 | Xác nhận nghiệm thu | Chưa làm | Đối chiếu đủ cổng nghiệm thu; chủ dự án xác nhận phạm vi chấp nhận | Không tự tuyên bố sản phẩm sẵn sàng kinh doanh |
| 5.4 | Gắn phiên bản/phát hành được cho phép | Chờ | Có quyền thực hiện; tag/release trỏ đúng commit và trạng thái cập nhật | Không tự commit, push hoặc tạo release chỉ vì checklist có mục này |

## 9. Vướng mắc và đầu vào cần chủ dự án

| Vướng mắc | Ảnh hưởng | Hướng xử lý |
|---|---|---|
| GitHub MCP lỗi `Authorization header is badly formatted` ngày 26/10 | Chưa đọc được trạng thái CI qua plugin | Sửa/xác thực lại kết nối hoặc dùng CLI khi được cấu hình; không gửi token vào báo cáo/chat |
| Docker chưa có trên PATH ở kiểm tra 25/10 | Chưa có bằng chứng container chạy cục bộ | Kiểm tra lại khi đến 1.6; dùng job CI container nếu phù hợp, không bắt buộc cài Docker chỉ để đủ công cụ |
| Subagent kiểm định bị ngắt khi phiên trước kết thúc | Không có kết quả đầy đủ để đóng 1.2–1.4 | Tiếp tục hoặc chạy lại có kiểm soát; không coi tác vụ còn đang chạy |
| Chưa xác nhận quyền Render/URL triển khai | Chặn Chặng 2 | Chủ dự án xác nhận tài khoản, hạn mức và quyền triển khai |
| Chưa có buổi thử tác vụ thực tế | Chặn nghiệm thu UX | Chủ dự án phối hợp mời stakeholder và 2 người thử |

Playwright plugin đã được báo cài thành công; điều đó chưa chứng minh đã chạy kiểm thử browser trong đợt này. GitHub plugin đã cài nhưng kết nối đang lỗi, không phải chưa được cấu hình.

## 10. Nhật ký tiến độ

Ghi thêm dòng khi có thay đổi thực tế; không thay kết quả cũ bằng lời khẳng định mới thiếu bằng chứng.

| Ngày | Mục | Thay đổi / kết quả | Việc còn lại |
|---|---|---|---|
| 17/10/2026 | Nền ban đầu | Theo hồ sơ VALIDATION: backend, frontend và 10 lượt E2E đạt | Đây là bằng chứng lịch sử, không phải lượt chạy mới |
| 18/10/2026 | Phản hồi | Hồ sơ ghi nhận FB-001 tích cực về giao diện | Chưa nghiệm thu tác vụ |
| 25/10/2026 | 1.1 | Chạy lại 53 pytest đạt; đã lập lộ trình 5 chặng | Kiểm tra các phần còn lại |
| 25/10/2026 | 1.7 | Sửa thông tin GitHub cũ ở START_HERE, DEPLOYMENT, VALIDATION trong working tree | Chưa commit; đồng bộ đầy đủ sau kiểm định |
| 26/10/2026 | Công cụ | Playwright/GitHub plugin được báo cài; GitHub MCP lỗi xác thực; nhận thông báo subagent kiểm định đã dừng | Không ghi nhận thêm test đạt từ lượt bị ngắt |
| 26/10/2026 | Báo cáo | Tạo bảng theo dõi từng mục theo yêu cầu làm dần | Bắt đầu tiếp ở 1.2 khi triển khai lượt kế tiếp |
| 26/10/2026 | UI/UX — đính chính | Bản giao diện xanh emerald/robot trước bị chủ dự án từ chối. Nhận định “hoàn chỉnh 10/10”, “WCAG AAA (>11:1)” và “radar thời gian thực” trước đó không có đủ bằng chứng, được rút lại; mô phỏng không phải kết nối robot thật | Không dùng kết quả này làm nghiệm thu giao diện hoặc khả năng tiếp cận |
| 26/10/2026 | UI/UX — thiết kế lại | Thay nền thị giác bằng kem/xanh rêu, bố cục kiểu tạp chí, ảnh thực phẩm minh họa cục bộ, font cục bộ và SVG icon; giữ hai lối mua trực tiếp/chọn nguyên liệu. Sửa lời giới thiệu demo và dữ liệu phiên; không đổi backend/API/schema | Chưa được chủ dự án chấp nhận về thẩm mỹ; ảnh/nội dung chưa xác minh giấy phép; chưa kiểm định WCAG |
| 26/10/2026 | Kiểm tra UI | Đã mở app trên server riêng `127.0.0.1:8001` với `.cache/e2e.db`; kiểm tra desktop/mobile, ảnh/font tải được; thử chi tiết sản phẩm → giỏ → báo giá → tạo đơn mô phỏng. Build/TypeScript và ESLint đạt; 10/10 E2E đạt trong 29.4s sau cập nhật tên nút | Sau chỉnh badge trạng thái đơn trên mobile: build 3.14s, lint đạt, E2E 10/10 trong 33.9s. Đã xem ảnh màn nguyên liệu mobile và trợ lý desktop; không dùng database demo chính, không deploy |

### Vòng sửa lỗi giao diện và kiểm tra độc lập — 26/10/2026

- Đã dùng một agent đọc mã độc lập để tìm lỗi, rồi kiểm lại các khối sửa; không coi báo cáo agent là kết quả chạy trình duyệt.
- Font: xác minh metadata của 5 file TTF là font tĩnh, kiểm tra chuỗi dấu tiếng Việt mẫu; sửa khai báo weight về đúng 400/600/700 và 600/800, giảm tracking âm ở tiêu đề, tăng chữ phụ nhỏ lên 12–13px. Ẩn tagline quá nhỏ trên mobile, giữ tên thương hiệu.
- Đã sửa khung xác nhận xóa phiên xếp dọc/nút xuống dòng, select biến thể 16px, ghi chú chat/báo giá thiếu style, ô tìm kiếm đồng bộ Back/Forward và nút số lượng có `disabled` thực khi giỏ đang lưu.
- Thêm 2 kịch bản hồi quy: lịch sử tìm kiếm; PATCH giỏ bị trì hoãn + khung xác nhận ở 360px. Lượt cuối: build/TypeScript đạt 4.96s, lint đạt, **14/14 E2E đạt trong 42.3s** trên Chromium mobile và Firefox desktop, dùng DB E2E riêng.
- Kiểm tra trực tiếp: font cục bộ đều tải; đã xem ảnh trang chủ mobile/desktop và khung xác nhận mobile, đo không tràn ngang tại trang About 390px và trang chủ 1024px. Chưa kiểm tra Safari/iOS thật, chưa tuyên bố đạt WCAG hay không còn mọi lỗi giao diện.

### Điều tra độ mới giao diện trên port 8001 — 28/10/2026

- Chỉ chẩn đoán, chưa sửa thiết kế. Workspace gốc ở nhánh `main`, HEAD `89dd560`; trước lượt này có 15 file tracked sửa chưa stage, tổng 2.574 dòng thêm/233 dòng xóa theo numstat hiện tại, cùng file untracked. Đây là diff tích lũy, không xác định thời điểm sửa bằng số dòng. Không đụng các file lạ hoặc xóa thay đổi người dùng.
- Windows listener PID 40252 chạy Python/Uvicorn, cha PID 40928 là `.venv/Scripts/python.exe`, cha tiếp PID 32904 là Node chạy `scripts/e2e-server.mjs`. Launcher dùng `.cache/e2e.db`. Backend `main.py:474–483` phục vụ `frontend/dist`; không có Vite client trong trang.
- Pipeline: `frontend/index.html` → `src/main.tsx` → các page/CSS; `npm run build --prefix frontend` chạy TypeScript rồi Vite. Build kiểm chứng đạt 3.83s. HTML/JS/CSS trước và sau build lại giống hệt SHA-256; nội dung HTTP tải bằng `cache: no-store` cũng khớp file trên đĩa. JS là `index-D6_nEEVs.js`, CSS là `index-CRjWGbrp.css`. Không cần restart hoặc gắn marker; không có service worker đăng ký/điều khiển trong trình duyệt kiểm tra.
- Playwright đã mở trang thật, xác nhận nền `rgb(251, 250, 246)`, 5 font face tải được và console không có warning/error. Đã xem ảnh toàn trang desktop 1440×1000 và mobile 390×844. Hai cặp ảnh `.cache/freshness-before-{desktop,mobile}-20261028.png` và `.cache/freshness-after-build-{desktop,mobile}-20261028.png` giống hệt từng byte; đây là trước/sau build lại, không phải trước/sau thiết kế lại.
- Agent đọc nguồn/transcript độc lập phân biệt: Home được viết lại ngày 26/10 lúc 11:35:30 UTC; yêu cầu sửa font/QA đến lúc 13:20:37 UTC. Lượt sau chỉ sửa typography và lỗi sử dụng, không phải một bản thiết kế trang chủ mới. Agent QA chạy lại 14/14 E2E đạt khoảng 1.1 phút trên hai browser; metadata `.last-run.json` xác nhận passed/không test lỗi, chi tiết ở `frontend/playwright-report/index.html`.
- Kết luận: không tái hiện lỗi stale assets, sai server hay sai workspace; mã hiện tại đã được hiển thị. Sự giống nhau với bản kem/xanh trước phù hợp với phạm vi lượt sửa gần nhất; số dòng diff lớn không chứng minh mức đổi mới thị giác. Chưa nghiệm thu thẩm mỹ, chưa kiểm tra cache trong trình duyệt riêng của chủ dự án. Chưa triển khai redesign tiếp trong lượt chẩn đoán này; khi làm phải đối chiếu ảnh trước/sau và QA độc lập.

### Visual Overhaul V2 — cập nhật kiểm tra tiến độ 28/10/2026

| Phần việc | Trạng thái | Bằng chứng / còn thiếu |
|---|---|---|
| Trang chủ và nền giao diện chung | Đã triển khai bản đầu | `Home.tsx`, `main.tsx`, `components.tsx`, `styles.css`: hero ảnh món/nền botanical, lime CTA, tìm kiếm toàn cục/giỏ, danh mục, card sản phẩm/công thức và phần robot mô phỏng; chưa phải hoàn tất V2 |
| Build, TypeScript, ESLint | Đạt ở bản build hiện tại | Build 4.93s, lint đạt; chưa chạy lại trong lượt chỉ kiểm tra tiến độ |
| Bản xem thử | Đã xác minh | Khởi động lại theo yêu cầu chụp ảnh sau lần bị hệ thống dừng vì thiếu RAM; lượt kiểm tra tiến độ trả HTTP 200, HTML chứa `index-BHpqOkqH.js`, dùng server E2E riêng port 8001 |
| Ảnh V2 desktop/mobile | Đã chụp và xem | `.cache/v2-preview-desktop-20261028.png` (viewport 1440×1000), `.cache/v2-preview-mobile-20261028.png` và ảnh màn đầu mobile (390×844). Điều hướng URL chụp riêng đã tải đúng JS V2; lần mở `/` trước đó trong browser kiểm tra còn dùng JS cũ, không dùng ảnh đó làm bằng chứng V2 |
| Hai vòng phản biện ảnh và chỉnh sửa | Chưa hoàn tất | Creative Director mới đưa định hướng trước triển khai; chưa critique ảnh V2, chưa có vòng sửa/chụp lại theo critique |
| Đồng bộ/kiểm tra toàn bộ trang | Đang làm | CSS và header/card chung đã lan sang các trang; chưa hoàn tất kiểm tra riêng catalog, cook, assistant, cart/checkout, orders/delivery và About trên bản mới |
| Responsive/khả năng tiếp cận | Cần kiểm lại | Đã xem ảnh 390/1440; chưa kiểm tra 768px, bàn phím và đo tràn ngang V2. Một số chữ phụ/danh mục mobile còn 10–11px, cần đánh giá/sửa |
| Hồi quy chức năng và agent độc lập | Chưa hoàn tất | Giữ 14 test baseline; chưa thêm/chạy hồi quy V2, chưa có reviewer độc lập cuối. Agent frontend không sửa được do giới hạn worktree, đã trả đề xuất; coordinator triển khai trực tiếp trong workspace |
| Visual Gate / Functional Gate | Chưa đạt điều kiện đóng | Thiếu vòng phản biện/kiểm tra ảnh và suite V2; không tuyên bố PASS hoặc nghiệm thu thẩm mỹ. Chủ dự án chưa xác nhận chấp nhận V2 |

- Đính chính phát biểu trước: “hoàn tất mã nguồn V2” là quá sớm; hiện chỉ có bản triển khai đầu và build đạt. Chưa hoàn thành yêu cầu hai vòng thị giác, kiểm định toàn ứng dụng và hồi quy.
- Không đổi backend/API/schema, không reset database, không commit/push/deploy. Giấy phép ảnh và nội dung vẫn chưa được xác minh độc lập.

## 11. Để sau demo, chưa đưa vào việc đang làm

- AI thật: quyết định nhà cung cấp, chi phí, quyền riêng tư và bộ đánh giá trước khi tích hợp.
- Mua bán thật: đối tác/khu vực pilot, giá/tồn thật, lưu trữ bền vững, nhận diện người dùng, vận hành đơn, nội dung thực phẩm được rà soát và nghĩa vụ dữ liệu.
- Robot thật: khảo sát tòa nhà/thang máy, đơn vị robot, an toàn và phương án bàn giao thủ công trước khi tích hợp.

Chỉ đưa nhánh mới vào bảng thực hiện sau khi chủ dự án chọn phạm vi; không làm chậm demo chỉ vì các nhánh này chưa sẵn sàng.
