# HỒ SƠ BÀN GIAO Ý TƯỞNG DỰ ÁN
## Ứng dụng đi chợ thông minh tích hợp AI và robot giao hàng tại chung cư

**Tên dự án:** Chưa đặt tên chính thức. Tạm gọi **AI Smart Grocery & Robot Delivery**.  
**Ngày tổng hợp:** 17/10/2026  
**Phiên bản:** Concept Brief v1.0 – đầu vào để AI agent xây dựng kế hoạch triển khai  
**Giai đoạn:** Đã đủ định hướng để lập kế hoạch **demo tương tác**, chưa phải đặc tả triển khai sản phẩm thương mại.  
**Mục đích tài liệu:** Ghi lại đầy đủ ý tưởng, các quyết định đã thống nhất, điểm còn mở và các giới hạn của bản demo. AI agent cần coi đây là nguồn yêu cầu gốc, **không tự biến các ý tưởng đang cân nhắc thành yêu cầu bắt buộc**.

---

## 1. Tóm tắt điều hành

Dự án hướng tới một **ứng dụng di động mua thực phẩm và nguyên liệu nấu ăn dành cho cư dân chung cư nói chung**, kết hợp ba trải nghiệm trong một:

1. **Đi chợ online thuận tiện:** Người dùng tìm sản phẩm cần mua, thêm vào giỏ và đặt giao đến căn hộ. Người mua tìm **sản phẩm**, không cần tự chọn từng cửa hàng hay nhà cung cấp.
2. **Trợ lý AI hỗ trợ ăn uống và nấu ăn:** AI gợi ý món khi người dùng không biết ăn gì; tiếp nhận yêu cầu tự nhiên; lập gợi ý theo số người, thời gian và ngân sách; cung cấp công thức trực quan từng bước; liệt kê nguyên liệu để người dùng **tích chọn món cần mua** và đưa vào giỏ ngay. AI hỗ trợ cả **một món riêng lẻ** lẫn **cả bữa ăn nhiều món**, không ép dùng combo.
3. **Giao hàng chặng cuối bằng robot:** Hướng tới việc robot nhận hàng tại điểm tiếp nhận/tập kết ở chung cư và giao đến cửa căn hộ, khắc phục sự bất tiện hoặc hạn chế di chuyển của shipper trong một số tòa nhà.

**Tinh thần sản phẩm:** *AI làm nhiều, người dùng thao tác ít.* Giao diện phải dễ hiểu ngay lần đầu; AI chủ động gợi ý vừa đủ, không làm phiền; khách không bị ép làm khảo sát, lên thực đơn cố định hoặc trả lời nhiều câu hỏi.

**Ưu tiên ngay lúc này:** Tạo **bản demo tương tác có giao diện điện thoại** để người đề xuất/đồng phát triển ý tưởng (anh Hải) có thể xem, thử và phản hồi. Không cần hoàn thiện logistics nhiều nhà cung cấp, vận hành robot thật hoặc chính sách nội bộ trước khi demo.

## 2. Bối cảnh và vấn đề cần giải quyết

- Nhiều người bận rộn, đi làm về mệt, không biết hôm nay ăn gì; việc nghĩ món, tìm công thức, kiểm tra nguyên liệu rồi chuyển sang nơi khác để mua gây mất thời gian.
- Các ứng dụng đi chợ hiện tại là tham chiếu về hành vi mua hàng (như dịch vụ đi chợ trong Grab và bTaskee), **không phải yêu cầu sao chép giao diện hoặc mô hình**.
- Cư dân chung cư muốn nhận hàng thuận tiện; ở một số nơi, việc shipper đi vào các tầng/căn hộ có thể bị hạn chế vì quy định quản lý và an ninh.
- Cơ hội đặt ra: Liên thông **quyết định ăn gì → biết nấu thế nào → mua đúng nguyên liệu → nhận hàng tận cửa** trong một ứng dụng.
- Hướng giao hàng robot lấy cảm hứng từ những mô hình giao hàng tự động ở Trung Quốc. Đây là **định hướng ý tưởng**, không mặc định đã được chứng minh khả thi cho từng tòa nhà tại Việt Nam.

## 3. Đối tượng khách hàng

**Đã thống nhất:** Cư dân **các chung cư nói chung**, **không giới hạn chung cư cao cấp**.

Những tình huống sử dụng có thể dùng để thiết kế demo (chỉ là giả định/persona để kiểm thử):
- Người đi làm muốn mua thực phẩm nhanh, hoặc không có sức nghĩ món sau giờ làm.
- Người sống một mình/cặp đôi muốn nấu một món đơn giản trong ngân sách.
- Gia đình muốn mua nguyên liệu cho nhiều người và có thể hẹn giờ nhận trước bữa tối.
- Người đã biết cần mua gì và **không muốn phải tương tác với AI**.

Chưa xác định khu chung cư đầu tiên, thành phố, nhóm tuổi trọng tâm, quy mô người dùng hoặc phân khúc giá; AI agent không nên tự coi các giả định đó là quyết định đã chốt.

## 4. Định vị và giá trị khác biệt

**Định vị mong muốn:** Trải nghiệm **đi chợ** và **trợ lý ăn uống AI** được kết hợp thành một sản phẩm thống nhất, với robot là phương thức giao hàng chặng cuối tạo khác biệt.

Không định vị app chỉ là chatbot nấu ăn; cũng không coi AI là rào cản bắt buộc trước khi mua sắm. Người dùng có thể bắt đầu từ hai hướng độc lập nhưng liên thông:
- **Biết mình cần gì:** Tìm thực phẩm → chọn số lượng → giỏ hàng → đặt hàng.
- **Chưa biết ăn gì:** Nhận gợi ý/hỏi AI → chọn món → xem công thức → tích nguyên liệu → giỏ hàng → đặt hàng.

**Thông điệp diễn giải nội bộ:** *Từ nghĩ món, chọn đồ đến nhận hàng tận cửa – tất cả trong một ứng dụng.* Đây là mô tả giá trị, **chưa phải slogan chính thức**.

## 5. Mô hình nguồn hàng và kinh doanh (mức ý tưởng)

**Đã thống nhất về hướng dài hạn:** Hợp tác với **nhiều nhà cung cấp/cửa hàng/siêu thị/đầu mối**; nền tảng kết nối cung – cầu và điều phối đơn. Nền tảng đóng vai trò trung gian tổ chức trải nghiệm mua hàng. Khách hàng lựa chọn **theo sản phẩm**, không phải tự duyệt và chia giỏ theo cửa hàng.

Trao đổi ban đầu có đề cập giá bán có thể có chênh lệch so với giá đầu vào, nhưng cần hợp lý so với thị trường. **Chưa chốt** cơ chế định giá, hoa hồng, phí giao, trách nhiệm chất lượng, quyền sở hữu hàng hóa hay hợp đồng đối tác.

**Giả định đơn giản hóa riêng cho bản demo:** Coi như toàn bộ danh mục sản phẩm **đã nằm tại một điểm tập kết/địa điểm duy nhất**, có thể xử lý như một kho hàng ảo. **Không mô phỏng việc gom hàng từ nhiều nguồn** trong phiên bản đầu; đây không phải thay đổi chiến lược nhiều nhà cung cấp lâu dài.

Ở sản phẩm thực tế, vẫn cần khả năng minh bạch nguồn gốc, chất lượng và thông tin sản phẩm. Việc khách không phải chọn nhà cung cấp không đồng nghĩa che giấu thông tin xuất xứ.

## 6. Chức năng và yêu cầu trải nghiệm đã thống nhất

### 6.1. Trang chủ và tiếp cận lần đầu
- Khách được **xem sản phẩm, khám phá món ăn và tương tác với AI ngay**, không bắt đăng nhập hoặc chọn chung cư trước.
- Đến bước xác nhận đơn hàng mới yêu cầu thông tin cần thiết như địa chỉ chung cư/tòa/tầng/căn hộ và thông tin liên hệ; có thể lưu cho lần sau nếu được đồng ý.
- Trang chủ có đường vào rõ ràng cho **Đi chợ ngay** và **Hôm nay ăn gì? / AI gợi ý**, không gây nhầm lẫn.
- Có tìm kiếm nổi bật; thiết kế dùng ngôn ngữ đơn giản, dễ hiểu với nhiều nhóm tuổi.

### 6.2. Danh mục sản phẩm, tìm kiếm và giỏ hàng
- Người dùng tìm, xem chi tiết, chọn số lượng và thêm sản phẩm vào giỏ.
- Tập trung vào **thực phẩm, nguyên liệu nấu ăn và một số nhu yếu phẩm liên quan**; phạm vi SKU cụ thể chưa chốt.
- Hệ thống tự ghép sản phẩm từ danh mục cung ứng; **không bắt khách chọn cửa hàng**.
- Giỏ hàng cho phép thêm/bớt/sửa số lượng, hiển thị giá từng món, tổng tiền dự kiến và các khoản phí nếu có.
- Không hứa giá/tồn kho thật nếu demo dùng dữ liệu mô phỏng.

### 6.3. Trợ lý AI – nguyên tắc tương tác
- Chọn phương án **trợ lý chủ động nhưng không làm phiền**: gợi ý nhẹ trên trang chủ, có thể bỏ qua; có ô/chat để người dùng chủ động hỏi.
- Không liên tục bật hộp thoại, không bắt người dùng trả lời chuỗi câu hỏi dài.
- AI hiểu tiếng Việt tự nhiên, ngay cả khi yêu cầu mơ hồ: “Hôm nay mệt quá, ăn gì nhanh?”, “Muốn nấu gà rang gừng”, “Nhà có 3 người, tầm 150 nghìn”.
- AI cần hỗ trợ **cả chọn một món và gợi ý cả bữa ăn**. Đọc ý định từ câu nói, không bắt chọn chế độ cứng.
- Nếu khách nói “Không thích, đổi món khác” thì giữ ngữ cảnh và gợi ý tiếp, không hỏi lại từ đầu.
- Cá nhân hóa có thể dùng sở thích đã xác nhận và lịch sử khi có sự đồng ý, nhưng **nhu cầu hiện tại được coi trọng**; không suy luận cứng rằng ăn/mua gì hôm trước thì hôm nay phải thích tương tự.
- Có thể đề xuất theo thời gian nấu, số người, ngân sách, khẩu vị và yêu cầu hiện tại.
- AI được **linh hoạt điều chỉnh công thức và gợi ý**; người dùng không muốn quy trình phê duyệt công thức quá rườm rà. Dù vậy hệ thống vẫn cần phòng ngừa các sai sót thiết yếu về dị ứng, an toàn thực phẩm và thông tin dinh dưỡng, **xử lý chủ yếu ở hậu trường**.

### 6.4. Công thức nấu ăn
- Khi chọn món, người dùng xem **hướng dẫn nấu trực quan từng bước**, ngắn gọn, rõ ràng, phù hợp lúc đang đứng bếp.
- **Không ưu tiên tích hợp video trong demo**, vì phức tạp về nội dung/bản quyền và không phù hợp mục tiêu đơn giản ban đầu.
- Công thức thể hiện nguyên liệu, định lượng, số khẩu phần, các bước chế biến và (khi có dữ liệu đủ tin cậy) thời gian/ước tính dinh dưỡng.
- Cho phép AI điều chỉnh linh hoạt theo số người, ngân sách, khẩu vị, nguyên liệu thay thế và nhu cầu phát sinh.
- Ý tưởng ban đầu là xây dựng một **nguồn công thức uy tín, hướng tới món Việt**, để AI tham khảo thay vì bịa đặt vô căn cứ. **Nguồn dữ liệu, API, quyền sử dụng, bản quyền ảnh/nội dung chưa được xác minh và chưa chốt**. AI agent cần lập hạng mục khảo sát nguồn và giấy phép trước sản phẩm thật.
- Calo và thông tin dinh dưỡng là **ước tính có nguồn/cơ sở**, không được trình bày như số đo chính xác tuyệt đối hoặc tư vấn y tế.

### 6.5. Từ công thức đến mua nguyên liệu
- Ngay dưới công thức có **danh sách nguyên liệu** và lượng cần dùng cho số khẩu phần đã chọn.
- Khách **tích chọn những nguyên liệu mình cần mua**, bỏ qua những thứ đã có; sau đó thêm các mục được tích vào giỏ.
- **Không cần** tính năng bắt khai báo mọi đồ đang có trong tủ lạnh, không bắt người dùng xây dựng “kho thực phẩm cá nhân”.
- Có thể điều chỉnh số lượng trước thanh toán. Khi triển khai thật cần xử lý chênh lệch giữa định lượng công thức và quy cách bán của nhà cung cấp.

### 6.6. Gợi ý theo ngân sách
- Ý tưởng đã được đánh giá tích cực và nên ưu tiên: người dùng nói khoảng ngân sách (ví dụ 100.000đ cho 2 người), AI gợi ý món hoặc bữa ăn tương ứng và chuẩn bị nguyên liệu.
- Giá trong đề xuất **phải lấy từ dữ liệu sản phẩm của hệ thống** ở phiên bản thực tế; demo có thể dùng giá mẫu có nhãn rõ ràng.
- Thuật toán tối ưu rẻ nhất/chất lượng nhất/cân bằng **chưa chốt**, không cần hỏi/chốt ngay.

### 6.7. Mua lại đơn hoặc giỏ hàng cũ
- Ý tưởng đã được chọn là có ích: khách có thể **mua lại đơn/giỏ hàng quen thuộc**, sau đó tùy chỉnh trước khi xác nhận.
- Việc đặt tên/lưu nhiều mẫu giỏ hàng là ý tưởng mở rộng, **chưa bắt buộc**.

### 6.8. Đặt hàng và lịch giao
- Có **hai hình thức**: **Giao ngay** và **Hẹn giờ giao**.
- Người dùng chọn thời điểm, xem địa chỉ nhận tại chung cư và xác nhận đơn.
- Các phương thức thanh toán thực tế chưa chốt. Trong demo chỉ cần **checkout mô phỏng**, tuyệt đối không thể hiện như đã thu tiền thật.
- Đơn hàng có màn hình trạng thái rõ ràng.

### 6.9. Giao hàng bằng robot
- Robot là **định hướng quan trọng của dự án**, nhận hàng tại điểm tập kết/tiếp nhận và hướng tới giao **đến tận cửa căn hộ**, không chỉ tới sảnh.
- Bản demo chỉ cần **mô phỏng tuyến/trạng thái giao hàng**, chẳng hạn: xác nhận đơn → chuẩn bị → sẵn sàng giao → robot nhận hàng → đang đến căn hộ → đã giao.
- **Chưa quyết định** loại robot, cơ chế đi thang máy, cửa an ninh, kết nối ban quản lý, hoạt động đa tòa, tải trọng, xử lý sự cố hoặc chi phí vận hành. Đây là các rủi ro kiểm chứng quan trọng trước khi làm thật.

### 6.10. Chụp ảnh sản phẩm trước khi giao
- Từng được đề xuất: trước khi giao, sản phẩm thực tế sẽ được **chụp ảnh** để khách có thể xem.
- **Đã thống nhất hoãn quyết định chi tiết**: chưa chốt ai chụp, ai kiểm định, khách có cần bấm xác nhận hay không, hoặc ảnh ảnh hưởng luồng giao như thế nào.
- Demo có thể trình bày **“Ảnh sản phẩm trước khi giao”** dưới dạng thẻ/hình minh họa hoặc trạng thái, không cần xây dựng quy trình duyệt ảnh.

## 7. Nguyên tắc UX/UI

1. **Dễ sử dụng ngay lần đầu, không cần người dùng đoán nút dùng để làm gì.**
2. **Ít thao tác và ít câu hỏi.** Tính năng phức tạp được che sau giao diện đơn giản; ưu tiên hành động chính rõ ràng.
3. **AI là lựa chọn hỗ trợ, không phải cửa bắt buộc.** Người đã biết cần mua gì phải được mua ngay.
4. **AI chủ động vừa đủ.** Gợi ý hữu ích, không gây phiền, không ép người dùng theo thực đơn cố định.
5. **Lên thực đơn tuần, nếu có, chỉ là kế hoạch mềm.** Có thể đổi mỗi ngày; không phải trọng tâm demo.
6. **Hướng dẫn sử dụng lần đầu:** Có thể thêm onboarding theo ngữ cảnh sau; **không phải ưu tiên ban đầu**. Nhưng dễ hiểu từ thiết kế đầu tiên là yêu cầu cốt lõi.
7. **Ưu tiên giao diện mobile-first**, thân thiện cho người dùng phổ thông; phong cách thương hiệu, bảng màu, logo, tên app **chưa chốt**.

## 8. Hai hành trình cốt lõi cần thể hiện trong demo

### Hành trình A – Khách đã biết cần mua gì
1. Mở app → xem trang chủ ngay, không yêu cầu đăng nhập.
2. Tìm “thịt bò”, “rau cải”, “trứng” hoặc duyệt danh mục.
3. Xem sản phẩm → chọn số lượng → thêm giỏ.
4. Mở giỏ → chỉnh số lượng/tổng tiền.
5. Chọn **Giao ngay** hoặc **Hẹn giờ**, cung cấp địa chỉ căn hộ khi xác nhận đơn.
6. Đặt hàng mô phỏng → theo dõi trạng thái robot → hoàn tất mô phỏng.

### Hành trình B – Khách chưa biết ăn gì
1. Mở app → thấy lời gợi ý nhẹ “Hôm nay ăn gì?” hoặc vào trợ lý AI.
2. Nói tự nhiên: “Tối nay có 100k cho 2 người, muốn nấu nhanh” hoặc “Muốn làm gà rang gừng”.
3. AI đề xuất món phù hợp; khách có thể yêu cầu đổi mà không nhập lại hết.
4. Chọn **một món** hoặc chọn **bữa ăn nhiều món** nếu chính khách muốn.
5. Xem công thức **từng bước**, định lượng theo số người.
6. Trong danh sách nguyên liệu, **tích những thứ cần mua** → đưa vào giỏ.
7. Xem/chỉnh giỏ, chọn hình thức giao → xác nhận đơn mô phỏng → xem robot giao tới căn hộ.

## 9. Gợi ý phạm vi bản demo đầu tiên (đầu vào để agent lập kế hoạch, chưa phải thiết kế đóng băng)

**Dạng trình diễn khuyến nghị:** Web app **mobile-first**, mở được bằng đường link trên điện thoại hoặc trình duyệt; có thể tương tác thật với các bước chính mà không cần xuất bản app native ngay. Có thể dùng dữ liệu sản phẩm/công thức/đơn hàng mẫu và robot mô phỏng.

**Những màn hình tối thiểu nên được agent cân nhắc:**
- Trang chủ / tìm kiếm / khám phá sản phẩm.
- Danh mục, danh sách sản phẩm, chi tiết sản phẩm.
- Khu vực AI gợi ý món và hội thoại đơn giản.
- Chi tiết món + công thức từng bước + danh sách nguyên liệu có checkbox.
- Giỏ hàng và đặt hàng mô phỏng (chọn giao ngay/hẹn giờ, nhập căn hộ).
- Theo dõi đơn/robot mô phỏng.
- Lịch sử đơn và thao tác **Mua lại**.

**Demo AI có thể có hai mức**, agent cần đề xuất cách triển khai và minh bạch mức nào là thật: (1) kịch bản/mẫu gợi ý tương tác phục vụ trình diễn; (2) tích hợp model thật với dữ liệu công thức và sản phẩm mẫu. Không được giả một chatbot kịch bản rồi giới thiệu là AI vận hành thật.

**Demo chất lượng cần chứng minh:** Khách đi hết cả hai hành trình, nút có tác dụng nhất quán, thông tin trong giỏ và đơn giữ đúng, đổi số lượng cập nhật tổng tiền, hẹn giờ hoạt động trong mô phỏng, các trạng thái giao hàng rõ ràng, UI dễ hiểu ngay lần đầu.

## 10. Ý tưởng cân nhắc sau demo / không ưu tiên lúc này

- Tính năng chia sẻ giỏ hàng cho cả gia đình: **đã được nêu nhưng chưa chọn ưu tiên**.
- Tạo thực đơn cả tuần: chỉ là khả năng mở rộng, phải linh hoạt và không ép tuân thủ.
- Tự động nhận diện thực phẩm trong tủ lạnh hoặc quản lý tồn kho gia đình: **không ưu tiên**, vì người dùng muốn tích nguyên liệu cần mua cho nhanh.
- Xây dựng và lưu nhiều mẫu giỏ có tên riêng: ý tưởng mở rộng của chức năng mua lại.
- Công cụ lựa chọn tối ưu hóa nguồn hàng dựa trên chất lượng/giá: chưa có tiêu chí chốt.
- Quy trình ảnh trước giao và xác nhận chất lượng chi tiết; hoàn trả, khiếu nại.
- Gom hàng thực từ nhiều nhà cung cấp, giao tách nhiều lần, tối ưu chặng đầu/chặng cuối.
- Dashboard nhà cung cấp, quản trị kho/vận hành đầy đủ, hợp đồng và thanh quyết toán.
- Robot thật, điều khiển thang máy, tích hợp tòa nhà, bản đồ indoor.
- Video hướng dẫn nấu ăn và kho nội dung video có bản quyền.
- Thanh toán thật và phát hành lên App Store/Google Play.

## 11. Những điều tuyệt đối không được hiểu nhầm

- **Không chỉ phục vụ chung cư cao cấp.** Đối tượng là chung cư nói chung.
- **Không bắt khách chọn nhà cung cấp.** Khách tìm sản phẩm và mua theo nhu cầu.
- **Không bắt dùng AI.** Mua sắm trực tiếp luôn là đường đi ngắn.
- **Không bắt lên kế hoạch ăn uống cố định.** AI phải linh hoạt theo hôm nay.
- **Không ép mua combo.** Có thể chọn đúng một món hoặc nhiều món.
- **Không tự động thêm tất cả nguyên liệu nếu khách không muốn.** Khách **tích những nguyên liệu cần mua**.
- **Không bắt khách khai báo thực phẩm trong nhà.** Không xây tính năng quản lý tủ lạnh cho demo.
- **Không bắt đăng nhập/chọn chung cư trước khi được xem app.** Chỉ thu dữ liệu cần thiết khi đặt hàng.
- **Không bắt xác nhận ảnh sản phẩm ở demo.** Quy trình này chưa chốt.
- **Không coi hàng thật đến từ một nguồn duy nhất.** Một điểm tập kết chỉ là đơn giản hóa phục vụ demo.
- **Không tự nhận đã giải quyết bản quyền công thức, tích hợp thang máy, chất lượng nguồn hàng hay pháp lý.** Đây vẫn là hạng mục nghiên cứu/kiểm chứng.

## 12. Các quyết định đang để mở và rủi ro thực tế

**Kinh doanh/vận hành:** Nhà cung cấp cụ thể, địa bàn triển khai đầu, cấu trúc giá/chiết khấu/phí, quản lý tồn kho, kiểm định thực phẩm, quy trình đổi trả và SLA giao hàng.

**Robot/tòa nhà:** Có được phép hoạt động trong từng chung cư không? Ai cấp quyền ra vào? Tích hợp thang máy/cửa kiểm soát, tuyến đi, điểm đặt robot, an toàn va chạm, xử lý khi không giao được, bảo dưỡng và hiệu quả kinh tế.

**AI/dữ liệu:** Quyền sử dụng kho công thức và ảnh; dữ liệu đáng tin cậy cho món Việt; cách tính khẩu phần, ước lượng dinh dưỡng, xử lý dị ứng/an toàn thực phẩm; quyền riêng tư và cơ chế đồng ý lưu lịch sử/sở thích; kiểm thử chất lượng câu trả lời khi AI điều chỉnh công thức.

**Đặt hàng:** Thanh toán thực, xác thực tài khoản, địa chỉ giao, vùng phục vụ, liên lạc với khách, việc robot vào thang máy và tới đúng cửa căn hộ.

**Lưu ý:** Demo không phải chứng minh mô hình vận hành thật khả thi hoặc đã có đối tác. Agent nên tách **“trải nghiệm cần mô phỏng”** khỏi **“giả thuyết kinh doanh/kỹ thuật cần kiểm chứng”**.

## 13. Các ví dụ câu nói thực tế AI nên hiểu

- “Hôm nay đi làm về mệt quá, có món nào nấu trong 20 phút không?”
- “Tối nay 2 người, khoảng 100k, không biết ăn gì.”
- “T muốn nấu gà rang gừng.”
- “Đổi món khác đi, hôm nay không thích cá.”
- “Lên cho nhà 3 người bữa cơm khoảng 150k.”
- “T chỉ cần mua thịt bò với cà chua thôi.”

Người dùng không phải điền một form dài; AI hiểu ý định, dùng thông tin đã nêu, và chỉ hỏi thêm khi thực sự thiếu dữ liệu quan trọng. Giá/khẩu phần/calo chỉ được trình bày ở mức mà dữ liệu cho phép.

## 14. Tiêu chí đánh giá chất lượng bản demo

- Người xem hiểu ngay app để **đi chợ** và **gợi ý món để mua nguyên liệu**.
- Có thể thử **hai hành trình A/B** trọn vẹn, không gặp ngõ cụt.
- Có thể **chọn nguyên liệu cần mua** mà không phải khai báo danh sách nguyên liệu đã có.
- Có thể mua **một món riêng lẻ**, không bị kéo sang combo.
- Có thể chọn **giao ngay/hẹn giờ** và xem mô phỏng robot đến **cửa căn hộ**.
- AI hỗ trợ tự nhiên, thay đổi ý định linh hoạt; không hỏi dồn hoặc áp kế hoạch cứng.
- Nút và trạng thái có ý nghĩa rõ ràng, không chỉ là hình ảnh tĩnh.
- Người xem hiểu phần nào là dữ liệu/AI/robot mô phỏng, phần nào đã được triển khai thật.
- Giao diện gọn, ít bước, có tính thuyết phục để trình bày với anh Hải và lấy phản hồi.

## 15. Đầu ra yêu cầu từ AI agent tiếp theo

Hãy sử dụng hồ sơ này để **tạo kế hoạch thực thi chi tiết**, **chưa vội viết code**. Kế hoạch phải:

1. Tóm tắt đúng tầm nhìn và ranh giới giữa **đã thống nhất / giả định để demo / chưa quyết định**.
2. Đề xuất **phạm vi MVP demo** và những hạng mục loại khỏi demo để tránh phình dự án.
3. Chia thành các giai đoạn khả thi (product flows → UX wireframe → UI prototype → dữ liệu mẫu → chức năng tương tác → AI thử nghiệm → robot mô phỏng → kiểm thử → buổi trình bày/nhận phản hồi).
4. Lập **danh sách công việc chi tiết**, thứ tự phụ thuộc, đầu ra của từng việc, tiêu chí hoàn thành và mức độ ưu tiên.
5. Mô tả rõ **hai hành trình người dùng** và các màn hình/trạng thái tối thiểu cần thiết.
6. Đề xuất kiến trúc kỹ thuật và công nghệ **phù hợp riêng cho bản demo**, giải thích lựa chọn và điểm đánh đổi; không tự coi quyết định kỹ thuật là đã được chủ dự án chốt.
7. Tách rõ **mock data, chức năng thực, tích hợp AI thực, robot mô phỏng, tích hợp robot thật**; tránh giới thiệu khả năng chưa có.
8. Đưa ra cách tổ chức dữ liệu sản phẩm – công thức – nguyên liệu – giỏ hàng – đơn hàng – lịch giao để demo nhất quán.
9. Có kế hoạch kiểm thử UI/UX, luồng checkout, sửa giỏ, hẹn giờ, AI gợi ý, và bảo đảm demo hoạt động ổn định khi trình bày.
10. Nêu riêng các rủi ro/giả thuyết cần xác minh khi tiến tới vận hành thương mại, nhưng **không biến chúng thành điều kiện cản trở làm demo**.
11. Giữ tiêu chí ưu tiên xuyên suốt: **đơn giản, tiện lợi, mobile-first, AI linh hoạt không làm phiền, robot giao tận cửa là định hướng khác biệt**.
12. Nếu thông tin còn thiếu nhưng không cản trở việc lập kế hoạch, **tự đưa giả định có nhãn và tiếp tục**, không hỏi hàng loạt câu hỏi vụn vặt.

**Yêu cầu cuối cùng cho agent:** Hãy xuất kế hoạch thành cấu trúc có thể giao việc (milestone, epic, user story/task, dependency, acceptance criteria), kèm thứ tự triển khai và phạm vi bản demo đầu tiên. Không được tự khẳng định đã có nguồn công thức được cấp phép, nhà cung cấp ký kết, công nghệ robot hoạt động thật hay thanh toán thật.

---

**Trạng thái kết luận:** Ý tưởng đã đủ rõ để tiến hành thiết kế và lập kế hoạch demo. Chưa cần chốt thêm chi tiết nhỏ trước bước này.
