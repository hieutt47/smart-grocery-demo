# Giao việc cho Antigravity — Bữa Nhà / Demo v0.1

## Prompt gửi một lần

> Làm Technical Implementation Agent cho workspace này. Đọc `START_HERE.md`, `docs/VALIDATION.md` (nếu có), backlog trong `docs/`, rồi đối chiếu `readme.md` — đây là Concept Brief gốc, không ghi đè. Tiếp tục các hạng mục còn thiếu; không xây lại những phần đã chạy. Giữ React/TypeScript/Vite + Python/FastAPI/SQLAlchemy/SQLite/Alembic. Bản đầu dùng trợ lý quy tắc có nhãn, dữ liệu mẫu, checkout và robot mô phỏng. Không gọi API trả phí, không đổi stack, không public mã nguồn hoặc triển khai dịch vụ trả phí. Chỉ sửa file trong workspace. Trước khi sửa, kiểm tra Git diff và xác nhận không có agent khác đang chỉnh cùng file. Chạy kiểm thử liên quan, sửa nguyên nhân thay vì giảm test. Mỗi đợt chỉ xử lý một nhóm việc còn thiếu, báo kết quả bằng file `docs/ANTIGRAVITY_REPORT.md`: file đã sửa, lệnh kiểm tra + kết quả thực, blocker, việc tiếp theo. Không báo hoàn tất những việc chưa chạy; không bịa URL deploy hoặc phản hồi stakeholder. Không tạo thêm subagent. Trả lời ngắn, tối đa 10 dòng sau mỗi đợt.

## Hiện trạng tại lúc bàn giao

- Đã có backend và UI cho hai hành trình, dữ liệu 30 SKU/12 công thức/3 bữa mẫu.
- Backend baseline: 53 test đã qua. Có sửa race tạo phiên bằng dependency transaction `scope="function"`; đọc báo cáo kiểm thử mới nhất trước khi tiếp tục.
- Agent triển khai đã dừng. Baseline: 10 ca trình duyệt qua trên Chromium/Firefox. Đọc VALIDATION.md và tiếp tục các mục chưa xong trong BACKLOG.md.
- GitHub/Render chưa xác nhận kết nối: không mặc định có quyền truy cập hoặc đã triển khai.
- Windows workspace có ký tự `&`: dùng đối số đường dẫn và các npm scripts đã chuẩn bị; không tự ghép shell command chứa đường dẫn không được quote.
- Python: `.venv/Scripts/python.exe`. Node đã cài. Browser cache: `.cache/browsers`.
- Chạy E2E từ **gốc workspace** để tránh giới hạn ghi SQLite của sandbox khi cwd ở frontend.
- Không chép credentials, `.venv`, `.tools`, `.cache`, database hoặc thông tin liên hệ vào Git.

## Ranh giới của lần giao việc

Đây là hướng dẫn cho Antigravity, **không phải bằng chứng Antigravity đã được khởi chạy**. Phiên điều phối hiện tại không có công cụ gửi lệnh trực tiếp vào sidebar VS Code. Sau khi Antigravity tạo báo cáo, người điều phối đọc báo cáo và diff, kiểm tra lại các thay đổi quan trọng.
