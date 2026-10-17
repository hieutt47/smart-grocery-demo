# Bữa Nhà — demo đi chợ & robot giao hàng

Demo mobile-first có hai lối vào: mua trực tiếp hoặc nhờ trợ lý gợi ý món. Tên “Bữa Nhà” là tên tạm cho bản trình diễn; [readme.md](readme.md) giữ nguyên hồ sơ ý tưởng gốc.

**Trợ lý dùng quy tắc/kịch bản, chưa gọi mô hình AI. Giá, tồn kho, thanh toán và robot đều mô phỏng. Không nhập thông tin cá nhân thật.** Chưa có URL public hoặc repo GitHub; xem trạng thái thực tế trong [báo cáo kiểm thử](docs/VALIDATION.md).

## Chạy tại máy

Cần Python 3.12+, uv, Node.js 24 và npm. Chạy lệnh từ thư mục gốc dự án (đường dẫn có dấu `&` cần được đặt trong dấu nháy khi chuyển thư mục).

```powershell
uv sync --frozen
npm.cmd ci --prefix frontend
npm.cmd run build --prefix frontend
uv run python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Mở http://127.0.0.1:8000. Lần khởi động tự chạy migration và seed idempotent. API docs: http://127.0.0.1:8000/docs. SQLite lưu ở `grocery.db`; phiên tồn tại 24 giờ và bị xóa khi hết hạn qua lần gọi API tiếp theo. Nút xóa dữ liệu ở trang “Về bản demo” chỉ xóa phiên hiện tại.

Riêng workspace bàn giao đã có `.venv`: có thể chạy `./.venv/Scripts/python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --no-access-log` trực tiếp. Nếu cần chạy uv trong sandbox Windows, đặt `$env:UV_CACHE_DIR=Join-Path (Get-Location) '.cache/uv'` và `$env:UV_PYTHON_INSTALL_DIR=Join-Path (Get-Location) '.tools/python'` để dùng thư mục ghi được; không dùng Python shim của hệ thống nếu shim đó chưa hoạt động.

Nếu sửa giao diện, chạy thêm `npm.cmd run dev --prefix frontend`, mở http://127.0.0.1:5173; Vite proxy API về cổng 8000. Trên macOS/Linux dùng `npm` thay `npm.cmd`.

## Kiểm thử

```powershell
uv run ruff check backend
uv run ruff format --check backend
uv run pytest -q
npm.cmd run lint --prefix frontend
npm.cmd run build --prefix frontend
node frontend/node_modules/@playwright/test/cli.js install chromium firefox
node frontend/node_modules/@playwright/test/cli.js test --config frontend/playwright.config.ts
```

Trên máy bàn giao, browser đã tải vào `.cache/browsers`: đặt `$env:PLAYWRIGHT_BROWSERS_PATH=Join-Path (Get-Location) '.cache/browsers'` trước lệnh Playwright. Trình kiểm thử tự mở server cổng 8001 với database riêng. Windows sandbox có thể chặn Firefox; dùng terminal thông thường. Không dùng database E2E làm dữ liệu demo chính.

## Bàn giao

- [Kiến trúc & ERD](docs/ARCHITECTURE.md), [quyết định kỹ thuật](docs/adr/001-stack.md), [OpenAPI](docs/openapi.json).
- [Backlog T01–T24](docs/BACKLOG.md): trạng thái, phụ thuộc, tiêu chí chấp nhận.
- [Triển khai Render miễn phí](docs/DEPLOYMENT.md), [kịch bản trình diễn & phản hồi](docs/DEMO.md).
- [Nguồn nội dung & giấy phép](docs/SOURCES.md), [bằng chứng kiểm thử](docs/VALIDATION.md).

Chỉ phục vụ demo: một tiến trình API, SQLite tạm thời trên Render, chưa có đăng nhập, thanh toán thật, điều phối đa kho, robot thật, hoặc dữ liệu dinh dưỡng đã thẩm định.
