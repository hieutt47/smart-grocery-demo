// Run from repository root with the E2E server on port 8001.
import {chromium} from '../frontend/node_modules/playwright/index.mjs';
import {mkdirSync, renameSync} from 'node:fs';
import {resolve} from 'node:path';

const output = resolve('artifacts');
mkdirSync(output, {recursive: true});
const baseURL = process.env.DEMO_URL || 'http://127.0.0.1:8001';
const browser = await chromium.launch();
const mobile = await browser.newContext({viewport: {width: 360, height: 800}, deviceScaleFactor: 1});
const phone = await mobile.newPage();
await phone.goto(baseURL);
await phone.getByRole('heading', {name: /Bữa nhà đủ đầy/}).waitFor();
await phone.screenshot({path: resolve(output, 'home-mobile-360.png'), fullPage: true});
await phone.goto(`${baseURL}/cook?ids=ga-rang-gung`);
await phone.getByRole('heading', {name: 'Mua đúng thứ bạn cần'}).waitFor();
await phone.screenshot({path: resolve(output, 'recipe-mobile-360.png'), fullPage: true});
await mobile.close();

const context = await browser.newContext({viewport: {width: 1280, height: 800}, recordVideo: {dir: output, size: {width: 1280, height: 800}}});
const page = await context.newPage();
const video = page.video();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
async function beat(text, action) {
  const started = Date.now();
  await action();
  await page.evaluate(text => {
    let caption = document.getElementById('walkthrough-caption');
    if (!caption) {
      caption = document.createElement('div');
      caption.id = 'walkthrough-caption';
      caption.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:99999;background:#163e31;color:white;padding:12px 24px;border-radius:12px;font:17px system-ui;max-width:85vw;box-shadow:0 4px 24px #0003;pointer-events:none';
      document.body.append(caption);
    }
    caption.textContent = text;
  }, text);
  await page.waitForTimeout(Math.max(15000 - (Date.now() - started), 1000));
  console.log(text);
}
await beat('Bữa Nhà · Demo trải nghiệm · Giá mẫu, không thu tiền, robot mô phỏng', async () => {
  await page.goto(baseURL);
  await page.getByRole('heading', {name: /Bữa nhà đủ đầy/}).waitFor();
  await page.screenshot({path: resolve(output, 'home-desktop.png'), fullPage: true});
});
await beat('A · Biết cần mua gì? Đi chợ trực tiếp, không cần hỏi trợ lý.', async () => {
  await page.getByRole('link', {name: 'Đi chợ ngay', exact: true}).click();
  await page.getByRole('textbox', {name: 'Tìm sản phẩm'}).fill('thit bo');
  await page.getByRole('button', {name: 'Tìm', exact: true}).click();
  await page.getByRole('button', {name: 'Thêm Thịt bò', exact: true}).click();
});
await beat('Giỏ hàng · Thay số lượng, xem tổng giá mẫu; tải lại vẫn giữ giỏ.', async () => {
  await page.goto(`${baseURL}/cart`);
  await page.getByRole('button', {name: 'Tăng số lượng'}).click();
  await page.locator('.summary-total').filter({hasText: '110.000'}).waitFor();
  await page.reload();
  await page.locator('.summary-total').filter({hasText: '110.000'}).waitFor();
  await page.screenshot({path: resolve(output, 'cart-desktop.png'), fullPage: true});
});
await beat('Chỉ đến bước đặt đơn mới nhập căn hộ. Dùng thông tin mẫu, không dùng dữ liệu thật.', async () => {
  await page.getByRole('link', {name: 'Chọn giờ & đặt đơn'}).click();
  await page.getByRole('button', {name: 'Dùng thông tin mẫu'}).click();
  await page.getByRole('button', {name: 'Kiểm tra đơn', exact: true}).click();
});
await beat('Xác nhận đơn mô phỏng · Robot giao từ điểm tập kết đến căn hộ.', async () => {
  await page.getByRole('button', {name: 'Tạo đơn mô phỏng', exact: true}).click();
  await page.getByRole('button', {name: 'Hoàn tất mô phỏng', exact: true}).waitFor();
  await page.screenshot({path: resolve(output, 'delivery-desktop.png'), fullPage: true});
});
await beat('Hoàn tất mô phỏng · Không có thanh toán hay robot thật.', async () => {
  await page.getByRole('button', {name: 'Hoàn tất mô phỏng', exact: true}).click();
  await page.getByRole('heading', {name: 'Một hành trình đã hoàn tất!'}).waitFor();
});
await beat('B · Chưa biết ăn gì? Trợ lý demo dùng quy tắc, chưa tích hợp mô hình AI.', async () => {
  await page.goto(`${baseURL}/assistant`);
  await page.getByRole('textbox', {name: 'Nhu cầu bữa ăn'}).fill('Tối nay 2 người, 100k');
  await page.getByRole('button', {name: 'Gửi yêu cầu'}).click();
  await page.locator('.suggestion-card').first().waitFor();
  await page.screenshot({path: resolve(output, 'assistant-desktop.png'), fullPage: true});
});
await beat('Đổi sở thích hiện tại · Giữ ngữ cảnh số người và ngân sách.', async () => {
  await page.getByRole('button', {name: 'Hôm nay không thích cá', exact: true}).click();
  await page.locator('.user-message').last().filter({hasText: 'không thích cá'}).waitFor();
});
await beat('Công thức tự biên soạn, chưa thẩm định · Chỉ tích nguyên liệu còn thiếu.', async () => {
  await page.locator('.suggestion-card').last().getByRole('link', {name: 'Chọn món'}).click();
  await page.getByRole('heading', {name: 'Mua đúng thứ bạn cần'}).waitFor();
  await page.locator('.ingredient-list input').first().check();
  await page.getByRole('button', {name: /Thêm 1 mục vào giỏ/}).scrollIntoViewIfNeeded();
});
await beat('Nguyên liệu được đổi sang gói bán · Giỏ chỉ có phần đã chọn.', async () => {
  await page.getByRole('button', {name: /Thêm 1 mục vào giỏ/}).click();
  await page.locator('.cart-row').waitFor();
});
await beat('Hẹn giờ giao · Theo giờ Việt Nam; đơn vẫn chỉ là mô phỏng.', async () => {
  await page.getByRole('link', {name: 'Chọn giờ & đặt đơn'}).click();
  await page.getByRole('button', {name: 'Dùng thông tin mẫu'}).click();
  await page.getByRole('radio', {name: /Hẹn giờ giao/}).check();
  await page.getByRole('button', {name: 'Kiểm tra đơn', exact: true}).click();
  await page.getByRole('button', {name: 'Tạo đơn mô phỏng', exact: true}).click();
  await page.locator('.status-pill.large').filter({hasText: 'Chờ giờ giao'}).waitFor();
});
await beat('Tua mô phỏng đến giờ giao · Tải lại vẫn giữ trạng thái đơn.', async () => {
  await page.getByRole('button', {name: 'Tua đến giờ giao — mô phỏng'}).click();
  await page.getByRole('heading', {name: 'Một hành trình đã hoàn tất!'}).waitFor();
  await page.reload();
  await page.getByRole('heading', {name: 'Một hành trình đã hoàn tất!'}).waitFor();
});
await beat('Mua lại · Xem trước và xác nhận ghép vào giỏ; không tự đặt đơn mới.', async () => {
  await page.getByRole('button', {name: 'Mua lại đơn này'}).click();
  await page.getByRole('heading', {name: 'Xem trước mua lại'}).waitFor();
});
await beat('Mời anh Hải thử hai hành trình và ghi phản hồi · Chưa có phản hồi stakeholder được thu thập.', async () => {
  await page.goto(`${baseURL}/about`);
  await page.getByRole('button', {name: 'Xóa dữ liệu phiên của tôi'}).waitFor();
});
await context.close();
renameSync(await video.path(), resolve(output, 'walkthrough.webm'));
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
console.log('Saved screenshots and approximately 3.5-minute captioned walkthrough.');
