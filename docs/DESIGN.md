# Bữa Nhà · Design System (Hệ thống Thiết kế UI/UX)

> **LƯU Ý BẮT BUỘC:** Tài liệu này là nguồn chân lý duy nhất (Single Source of Truth) cho toàn bộ giao diện của ứng dụng Bữa Nhà. **Tất cả các trang tiếp theo (Trợ lý gợi ý món, Góc bếp/Công thức, Giỏ hàng, Thanh toán, Chi tiết đơn hàng & Theo dõi robot) bắt buộc phải đọc kỹ và tuân thủ tuyệt đối các quy tắc trong tài liệu này trước khi lập trình.**

---

## 1. Triết lý & Tinh thần thiết kế (Core Design Spirit)

- **Tinh thần chủ đạo: "Bữa cơm gia đình"** — Ấm cúng, tươi mới, mộc mạc, đáng tin cậy như bước vào một gian bếp thân thuộc của gia đình Việt, không tạo cảm giác một phần mềm thương mại lạnh lẽo hay template AI công nghiệp.
- **Tư duy "De-boxed" (Giảm bỏ mọi thứ vào hộp)**:
  - Loại bỏ các đường viền 1px (`border: 1px solid ...`) và các hộp thẻ nền trắng nằm đè lên nền kem.
  - Hình ảnh sản phẩm, món ăn được bo góc mềm mại và đặt **trực tiếp** trên nền kem ấm, tách biệt bằng khoảng trắng thoáng đãng.
  - **Không bao giờ lồng hộp trong hộp** (no cards inside cards).
- **Nhịp điệu dải màu (Color Band Rhythm)**:
  - Thay vì lặp lại cùng một kiểu khối trên nền trắng, trang web sử dụng các dải màu xen kẽ tràn toàn màn hình (full-bleed edge-to-edge): dải yến mạch ấm (`#F3EDE2`), dải xanh rừng đậm (`#0F3D2E`).
- **Giao diện mobile-first**:
  - Chuẩn hiển thị cơ sở là **Mobile 390px** (iPhone 14/15/Pixel).
  - Tuyệt đối không để phát sinh lỗi cuộn ngang (`overflow-x` / `scrollWidth > 390px`).
  - Nút bấm và vùng chạm cảm ứng (touch targets) tối thiểu $\ge 44\text{px}$.

---

## 2. Bảng màu & Design Tokens (Color Palette)

Hệ thống token màu được định nghĩa tại `:root` trong `frontend/src/styles.css`:

| Tên Token | Mã màu Hex | Ý nghĩa & Vị trí sử dụng |
|---|---|---|
| `--paper` | `#faf7f2` | **Nền canvas chính**: Tông kem ấm (warm linen/cream), tạo cảm giác ấm cúng, dịu mắt. |
| `--surface` | `#ffffff` | **Nền bề mặt**: Dùng rất tiết kiệm cho header thanh điều hướng, ô nhập liệu (input). |
| `--bg-warm` / `--pale` | `#f3ede2` | **Dải yến mạch**: Nền dải gợi ý trợ lý, dải danh mục nổi bật, tạo nhịp nghỉ thị giác. |
| `--green` | `#0f3d2e` | **Màu chủ đạo (Brand Anchor)**: Xanh rừng thực vật đậm đà. Dùng cho Hero, dải quy trình giao hàng, tiêu đề chính, nút bấm chính. |
| `--green-dark` | `#08241a` | Trạng thái hover/active của nút bấm chính, dải thanh thông báo demo trên cùng. |
| `--accent-action` | `#15803d` | **Màu hành động chuẩn WCAG AA**: Xanh lá đậm đạt tương phản với chữ trắng. Dùng cho nút bấm, liên kết (`.text-link`), nhãn dẫn (`.eyebrow`), icon hành động. |
| `--accent-surface` | `#16a34a` | Dùng cho mảng màu sáng, icon trang trí kích thước lớn. |
| `--accent-tint` | `#eaf5eb` | Nền nhạt cho các pill badge, trạng thái đang chọn (active filter). |
| `--warm-accent` | `#a8491f` | **Màu nhấn ấm (Cam đất đậm)**: Dùng rất tiết kiệm cho chữ nhỏ/nhãn eyebrow trên nền yến mạch `#f3ede2`. Đạt độ tương phản cao, chống lóa, gợi hơi ấm của lửa bếp. |
| `--warm-tint` | `#fbeee6` | Nền cam đất rất nhạt khi hover các nút nhấn ấm. |
| `--ink` | `#1c1917` | **Màu chữ chính**: Đen ấm dịu mắt (Warm Charcoal), không dùng đen tuyền `#000000`. |
| `--ink-soft` | `#44403c` | **Màu chữ phụ**: Chữ miêu tả, đoạn văn bản đọc. |
| `--muted` | `#78716c` | **Màu chữ nhạt**: Thông tin quy cách gói, ghi chú nguồn gốc hàng. |
| Chữ trên nền tối | `#ffffff`, `#d1e0d7`, `#86efac` | Màu chữ trắng và xanh pastel tươi sáng trên nền xanh rừng `#0F3D2E`. |

---

## 3. Typography (Kiểu chữ & Cỡ chữ)

### 3.1. Phông chữ (Font Families)
- **Tiêu đề & Heading**: `'Plus Jakarta Sans', sans-serif` (weights: `600`, `800`) — Rõ nét, hình học hiện đại, đáng tin cậy.
- **Nội dung thân bài & UI**: `'Be Vietnam Pro', sans-serif` (weights: `400`, `600`, `700`) — Chuẩn dấu tiếng Việt, thân thiện, dễ đọc ở kích thước nhỏ.

### 3.2. Bảng phân cấp cỡ chữ trên Mobile (Mobile 390px Scale)
- **H1 (Hero / Tiêu đề trang)**: `24px - 32px`, `line-height: 1.22`, `font-weight: 800`.
- **H2 (Tiêu đề khối / Section heading)**: `20px - 21px`, `line-height: 1.25 - 1.28`, `font-weight: 800`.
- **H2 trong Dải xanh giao hàng**: `26px`, `line-height: 1.25`, `font-weight: 800`, chữ trắng.
- **H3 (Tiêu đề công thức / Thẻ bước)**: `17px - 18px`, `line-height: 1.35`, `font-weight: 700`.
- **Nhãn dẫn (Eyebrow)**: `13px`, `font-weight: 600 - 700`, màu `--accent-action` (`#15803D`) hoặc `--warm-accent` (`#A8491F`), căn lề trái thẳng trục.
- **Đoạn văn (Body Text)**: `13.5px - 14px`, `line-height: 1.55 - 1.6`, màu `--ink-soft`.
- **Tên sản phẩm**: `14px`, `font-weight: 600`, `line-height: 1.35`, giới hạn 2 dòng (`-webkit-line-clamp: 2`).
- **Giá sản phẩm**: `16.5px - 17px`, `font-weight: 800`, màu `--green`, kèm chữ "đ" rõ ràng, không gạch chân.
- **Quy cách gói & Nguồn gốc**: `11px - 11.5px`, màu `--muted`.

---

## 4. Bố cục, Lề & Trục căn chỉnh (Layout, Spacing & Grid)

### 4.1. Trục căn lề cơ sở Mobile: 24px
- Mọi trang trên mobile phải có container với lề:
  ```css
  .container {
    padding: 16px 24px 90px; /* 90px đáy để không bị Bottom Nav che */
  }
  ```
- **Quy tắc thẳng hàng tuyệt đối**: Tất cả tiêu đề khối (gồm cả dòng `eyebrow` và thẻ `h2`) phải căn trái đúng lề **24px**, thẳng hàng dọc với nhau từ đầu trang tới chân trang.
- Nút liên kết phụ (`Xem tất cả →`, `Khám phá công thức →`) nằm cùng hàng với tiêu đề ở phía sát lề phải:
  ```css
  .section-heading {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 16px;
    width: 100%;
    text-align: left;
  }
  ```

### 4.2. Dải màu tràn viền (Full-Bleed Responsive Sizing)
Khi muốn tạo một dải màu nền tràn sát mép màn hình (edge-to-edge) mà nội dung bên trong vẫn căn đúng trục 24px:
```css
.full-bleed-band {
  margin: 36px -24px;
  padding: 34px 24px;
  border-radius: 0;
  border: none;
}
```

### 4.3. Thanh cuộn ngang cảm ứng (Edge-to-edge Horizontal Scroll)
Áp dụng cho danh mục tròn, thanh lọc chip:
```css
.horizontal-scroll-row {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -24px;
  padding: 0 24px;
  scrollbar-width: none;
}
.horizontal-scroll-row::-webkit-scrollbar {
  display: none;
}
```

### 4.4. Lưới sản phẩm (Product Grid)
- Mobile: 2 cột cân xứng:
  ```css
  .product-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 12px;
  }
  ```

---

## 5. Bo góc & Hiệu ứng (Radius & Elevation)

- **Bo tròn dạng Pill / Viên thuốc (`border-radius: 100px` / `9999px`)**:
  - Dùng cho: Thanh tìm kiếm (`.search-box`), nút bấm CTA chính (`.button.primary`), nút dải giao hàng, chip danh mục (`.chip`), badge nổi bật.
- **Bo góc ảnh sản phẩm**: `border-radius: 18px` (`overflow: hidden`).
- **Bo góc ảnh công thức / Card lớn**: `border-radius: 20px`.
- **Bo tròn tuyệt đối (`border-radius: 50%`)**:
  - Avatar danh mục (`width: 64px; height: 64px; border-radius: 50%`).
  - Nút thêm nhanh vào giỏ (`width: 38px; height: 38px; border-radius: 50%`).
- **Bóng đổ (Box Shadow)**:
  - Chỉ dùng bóng đổ rất khẽ trên nền ảnh/avatar: `box-shadow: 0 2px 6px rgba(44, 38, 30, 0.05)`.
  - Nút thêm giỏ: `box-shadow: 0 2px 6px rgba(21, 128, 61, 0.25)`.
  - **Tuyệt đối không dùng bóng đổ xám đục nặng nề của template SaaS.**

---

## 6. Quy tắc Chi tiết cho từng Thành phần (Component Rules)

### 6.1. Thẻ sản phẩm (Product Card) — Chuẩn De-boxed
- **Không có viền hộp**: `border: none; background: transparent; box-shadow: none;`
- **Ảnh sản phẩm**: Chiều cao `145px`, bo góc `18px`, `object-fit: cover`.
- **Thông tin**: Nằm ngay bên dưới ảnh trên nền kem:
  - Nhãn phân loại nhỏ màu xanh (`11px`).
  - Tên sản phẩm in đậm vừa (`14px`, 600).
  - Quy cách (`11.5px`, màu `--muted`).
  - Hàng chân thẻ: Giá tiền in đậm to (`16.5px`, `--green`) bên trái, nút dấu cộng tròn xanh lá (`38x38px`) bên phải.

### 6.2. Thẻ công thức (Recipe Card)
- **Không có viền hộp**.
- **Ảnh món ăn**: Phải là ảnh món ăn **đã nấu chín hoàn chỉnh** (không dùng ảnh thịt sống hay cọng rau thô). Ảnh phủ kín toàn bộ khung trên (`object-fit: cover`, bo góc `20px`, chiều cao `190px`).
- **Thông tin**: Nằm trực tiếp dưới ảnh:
  - Thời gian và số người kèm icon Lucide nhỏ (`12.5px`, `--muted`).
  - Tên món ăn in đậm rõ nét (`18px`).
  - Dòng hành động: `Chọn nguyên liệu →` (`13.5px`, `--accent-action`).

### 6.3. Dải 3 cam kết (Promise Strip)
- Xếp thành **3 cột ngang** đều nhau trên mobile:
  - Hàng trên: Icon Lucide màu `--accent-action` (`22x22px`).
  - Hàng dưới: Đoạn chữ ngắn gọn (`11.5px`, font-weight 600, căn giữa).
- Hoàn toàn không viền, không nền card riêng, không bóng đổ.

### 6.4. Danh mục sản phẩm (Categories)
- Khung hình tròn `64x64px`, `border-radius: 50%`.
- Ảnh hoặc icon đặc trưng nằm trong hình tròn.
- Tên danh mục in chữ thường (`13px`, font-weight 600) nằm ngay bên dưới hình tròn.

### 6.5. 3 bước giao hàng (Delivery Steps)
- Cột số thứ tự (`01`, `02`, `03`) phải có **chiều rộng cố định** (`flex: 0 0 32px; width: 32px; font-variant-numeric: tabular-nums;`) để phần tiêu đề của cả 3 bước thẳng hàng dọc tuyệt đối.

### 6.6. Nút bấm (Buttons)
- **Nút CTA chính**: Nền xanh rừng `--green` hoặc `--accent-action`, bo tròn viên thuốc (`100px`), chữ trắng, chiều cao tối thiểu `48px`, font-weight 600.
- **Nút liên kết văn bản (`.text-link`)**: Màu `--accent-action`, kèm mũi tên nhỏ `ArrowRight` (`size={14}`), căn giữa theo chiều dọc.
- **Icon**: Sử dụng bộ icon `lucide-react`, kích thước từ `16px` đến `24px`. Tuyệt đối không dùng emoji làm icon.

---

## 7. Những điều TUYỆT ĐỐI CẤM (Anti-patterns & Prohibitions)

1. ❌ **CẤM đóng hộp mọi thứ**: Không bọc card vào viền xám 1px hoặc đổ bóng thô lên từng khối. Mọi thứ phải nằm tự nhiên trên nền kem ấm.
2. ❌ **CẤM dùng gradient tím, neon, cyber**: Không dùng bất kỳ gradient nào mang phong cách AI template hoặc tech crypto.
3. ❌ **CẤM dùng emoji làm icon**: Bắt buộc dùng icon SVG chuẩn từ thư viện `lucide-react`.
4. ❌ **CẤM dùng chữ đen thuần `#000000`**: Toàn bộ chữ dùng tông đen ấm `--ink: #1c1917`.
5. ❌ **CẤM viết IN HOA toàn bộ (ALL-CAPS) cho nhãn hoặc tiêu đề**: Dùng câu thường chuẩn tiếng Việt (Sentence case). Ví dụ: Dùng *"Đi chợ tiện lợi"*, không dùng *"ĐI CHỢ TIỆN LỢI"*.
6. ❌ **CẤM làm lệch trục căn lề 24px**: Không để tiêu đề các khối bị thụt ra thụt vào lệch hàng nhau.
7. ❌ **CẤM dùng chữ màu cam nhạt thiếu tương phản trên nền yến mạch**: Phải dùng cam đất đậm đà `--warm-accent: #a8491f` để đảm bảo chuẩn tương phản đọc tốt.
8. ❌ **CẤM gạch chân chữ "đ" ở giá tiền**: Hiển thị dạng chữ số rõ ràng (ví dụ: `15.000 đ`).
9. ❌ **CẤM gắn nhãn "MINH HỌA" / "DEMO" lên từng sản phẩm con**: Mọi ghi chú demo chỉ gom về 1 thanh thông báo duy nhất ở đầu trang hoặc chân trang.
10. ❌ **CẤM dùng ảnh nguyên liệu sống cho thẻ công thức nấu ăn**: Thẻ món ăn phải dùng ảnh mâm cơm hoặc món đã nấu chín bắt mắt.
11. ❌ **CẤM tạo lỗi cuộn ngang trên mobile 390px**: Mọi thanh cuộn ngang phải ẩn thanh cuộn xấu và không đẩy `scrollWidth` của tài liệu vượt quá chiều rộng màn hình.

---

## 8. Checklist nghiệm thu khi làm trang mới (Pre-delivery Checklist)

Trước khi gửi kết quả một trang mới cho người dùng đánh giá:
- [ ] Đã đọc `docs/DESIGN.md` và tuân thủ đúng bảng màu, cỡ chữ, bo góc.
- [ ] Nền trang sử dụng tông kem ấm `#faf7f2` xuyên suốt.
- [ ] Tiêu đề khối căn trái đúng trục lề 24px.
- [ ] Không có các khối hộp đóng khung viền 1px không cần thiết.
- [ ] Nút bấm, touch targets tối thiểu $\ge 44\text{px}$.
- [ ] Chạy lệnh build kiểm tra TypeScript và CSS không bị lỗi.
- [ ] Chạy kịch bản kiểm tra kích thước: `docScrollWidth === 390` (không cuộn ngang).
- [ ] Chụp ảnh màn hình thực tế ở kích thước mobile 390px để tự soi xét trước khi bàn giao.
