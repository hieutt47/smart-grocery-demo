# Ảnh món ăn — nguồn, giấy phép và trạng thái

Cập nhật 2026-11-25. **3/60 món mẫu có ảnh thật đã kiểm tra; 57 món còn thiếu.** Không ảnh AI, render, cartoon, hotlink hoặc ảnh của món khác. Lô này chưa commit/deploy.

## Manifest local

| Recipe ID | Asset trong frontend/src/assets/recipes/ | Kích thước | Bytes |
|---|---|---|---|
| rau-muong-xao | rau-muong-xao-480.webp | 480×360 | 42704 |
| rau-muong-xao | rau-muong-xao-960.webp | 960×720 | 135320 |
| thit-kho-trung | thit-kho-trung-480.webp | 480×724 | 33752 |
| thit-kho-trung | thit-kho-trung-678.webp | 678×1023 | 56448 |
| dau-hu-nhoi-thit-sot-ca | dau-hu-nhoi-thit-480.webp | 480×720 | 45044 |
| dau-hu-nhoi-thit-sot-ca | dau-hu-nhoi-thit-533.webp | 533×800 | 59102 |

Mapping runtime: `frontend/src/recipe-photos.ts`, exact ID và own-property check, không index/prefix/fuzzy. Srcset dùng chiều rộng thực, không phóng to nguồn nhỏ. Resize và WebP quality0.82 bằng canvas Chromium; không sinh nội dung. Bản JPEG chỉ ở `.cache/food-photo-source/`, không bundle.

### Rau muống xào tỏi

- Tác giả Andy Wright; [Commons](https://commons.wikimedia.org/wiki/File:Rau_mu%E1%BB%91ng_x%C3%A0o_t%E1%BB%8Fi.jpg), [Flickr Morning Glory](https://www.flickr.com/photos/95172615@N00/3363763779), [CC BY2.0](https://creativecommons.org/licenses/by/2.0/).
- Metadata chụp2009-03-11, Commons ghi Flickr license review2009-03-26. Đã mở ảnh tải: rau muống chín và tỏi trên đĩa. Không dùng cho bò xào rau muống.
- Giữ tỷ lệ4:3, crop center. Credit cạnh ảnh và trang About.

### Thịt kho trứng

- Tác giả HungryHuy / Huyzee Vu; [Flickr gốc](https://www.flickr.com/photos/142284085@N06/40779385193/), [Commons mirror](https://commons.wikimedia.org/wiki/File:Vietnamese_thit_kho,_braised_pork_belly_and_boiled_eggs.jpg), CC BY2.0.
- Flickr upload2019; Commons ghi review2020. Đã mở nguồn678×1023: tô thịt kho chín với trứng luộc; không phải ảnh AI hoặc thịt sống theo provenance và quan sát có thể kiểm tra, không tuyên bố giám định tuyệt đối.
- Tác giả yêu cầu link recipe cạnh ảnh. Đã xác minh URL nguyên văn từ Flickr HTML: https://www.hungryhuy.com/how-to-make-thit-heo-kho-voi-trung-vietnamese-braised-pork-with-hard-boiled-eggs/ . Không sao chép nội dung công thức của tác giả.
- Crop50%78% ưu tiên tô món ở phần dưới; nguồn portrait, không ép méo. Descriptor large678w đúng intrinsic.

### Đậu hũ dồn thịt sốt cà chua

- Tác giả HungryHuy / Huyzee Vu; [Flickr gốc](https://www.flickr.com/photos/142284085@N06/46956611564/), [Commons metadata](https://commons.wikimedia.org/wiki/File:Pork_stuffed_fried_tofu,_with_tomato_and_onion.jpg), CC BY2.0, upload2019.
- Đã mở ảnh nguồn533×800: đậu chiên có nhân thịt, sốt cà và hành, bày trên đĩa trước chảo. Mapping chỉ `dau-hu-nhoi-thit-sot-ca`, KHÔNG dùng cho món đậu sốt cà không thịt.
- Link recipe tác giả yêu cầu, kiểm nguyên văn trong Flickr HTML: https://www.hungryhuy.com/pork-stuffed-tofu-in-tomato-sauce/ . Không copy recipe content.
- Crop50%78% ưu tiên đĩa thành phẩm. Srcset480/533w, không giả960.

### Attribution và quyền sử dụng

Các ảnh được tải local từ nguồn được nêu; không ngụ ý tác giả bảo trợ app. `RecipePhotoCredit` hiển thị author + link nguồn/recipe + license + thông báo resize/WebP/crop ngay cạnh ảnh ở card, Cook, assistant và picker; About có tổng hợp. Credit không lồng trong link mở công thức. CC BY áp dụng ảnh, không cấp license cho mã nguồn ứng dụng.

## Nguồn bị chặn / bị loại

- Wikimedia upload trả429/Retry-After120, dừng tải ở host đó. Lô2 tìm nguồn photographer Flickr riêng, kiểm license trên chính Flickr rồi tải thành công200; không dùng proxy để né hạn mức.
- Candidate `Caramelized Pork and Eggs.jpg` của Kingofthepings CCBY-SA3.0 không tải được nên không dùng. Tương tự hai ảnh đậu hũ Phương Huy trước đó.
- Loại bò xào hành tây/rau bí, canh cá lóc vì không khớp món; không lấy ảnh gần giống lấp chỗ trống.
- Hero meal.jpg cũ chưa có hồ sơ provenance đủ nên không dùng Home. Không xóa asset legacy hoặc khẳng định quyền toànrepo đã được kiểm.

## Fallback / công việc tiếp

57 món mẫu, custom và lunch chưa có ảnh xác minh dùng fallback trung tính, không ảnh món khác. Lunch list bỏ thumbnail trống hẹp. Không hoàn thành gallery chỉ vì fallback chạy. Ba món nổi bật Home hiện đều có ảnh riêng; batch12 đầu Catalog vẫn thiếu nhiều ảnh.

## Kiểm thử

- Lô1: lint/typecheck/build,16E2E đạt27.1s; QA/UI/code scoped PASS sau2vòng. QA badge9.98:1, pantry44px, Cooklề24, nooverflow390/768/1440. LOW bộ khẩu phần desktop xa tên món chưa xử lý.
- Lô2 mới nhất: lint/typecheck/build đạt; full16E2E đạt22.3s. Trước đó2test fail do selector creditHungryHuy trùng2ảnh; đã scope theo recipe card, không đổi hành vi app để né test.
- Bản480WebP lô1 đo DPR1:42704encoded/43004transferbytes. LCP/CLS chưa đo, không khẳng định tăng tốc.
- QA/UI/code lô2 đang chạy tuần tự cho crop/credit/layout3ảnh; kết quả cập nhật trong PROGRESS.md. Không deploy.
