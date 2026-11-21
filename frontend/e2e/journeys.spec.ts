import {test, expect} from '@playwright/test';

test('A: home quick moods, random picker, recipe search and saved collection', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: /Hôm nay ăn gì/})).toBeVisible();

  // No cart or orders links in navigation
  await expect(page.getByRole('link', {name: 'Giỏ hàng'})).toHaveCount(0);
  await expect(page.getByRole('link', {name: 'Đơn hàng'})).toHaveCount(0);

  // Random picker works
  await page.getByRole('button', {name: 'Chọn ngẫu nhiên'}).click();
  await expect(page.locator('.random-picker-result')).toBeVisible();

  // Save a recipe from Home and verify it appears in /saved
  await page.locator('.recipe-save-btn').first().click();
  await expect(page.getByRole('status')).toContainText('Đã lưu');
  await page.goto('/saved');
  await expect(page.locator('.recipe-card')).toHaveCount(1);

  // Search recipes from header
  const search = page.getByRole('textbox', {name: 'Tìm món ăn hoặc công thức'});
  await search.fill('ga rang');
  await page.getByRole('button', {name: 'Tìm công thức', exact: true}).click();
  await expect(page).toHaveURL(/\/recipes\?q=ga/);
  await expect(page.locator('.recipe-card')).toHaveCount(1);
});

test('B: AI assistant office prompts, cook checklist and save/share', async ({page}) => {
  await page.goto('/assistant');
  await expect(page.getByText('Chào bạn, hôm nay gian bếp nhà mình thế nào?')).toBeVisible();
  await page.getByRole('textbox', {name: 'Nhập nhu cầu bữa ăn của bạn'}).fill('Tối nay 2 người, 100k');
  await page.getByRole('button', {name: 'Gửi yêu cầu'}).click();
  await expect(page.locator('.suggestion-card').first()).toBeVisible();

  await page.getByRole('button', {name: 'Không thích ăn cá', exact: true}).click();
  await expect(page.locator('.user-message').last()).toContainText('không thích cá');

  await page.locator('.suggestion-card').last().getByRole('link', {name: 'Chọn món này'}).click();
  await expect(page.getByRole('heading', {name: 'Checklist đi chợ'})).toBeVisible();

  // Select an ingredient and verify checklist summary updates
  await page.locator('.ingredient-list input').first().check();
  await expect(page.getByRole('button', {name: 'Sao chép danh sách đi chợ'})).toBeEnabled();
});

test('mobile layout, redirect legacy routes, and session reset', async ({page, context}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/');
  await expect(page.getByRole('heading', {name: /Hôm nay ăn gì/})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

  // Legacy /cart and /products redirect cleanly
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/recipes/);

  // Cook page on mobile has no horizontal overflow
  await page.goto('/cook?ids=ga-rang-gung');
  const checkbox = page.locator('.ingredient-list input').first();
  await checkbox.check();
  await page.getByRole('button', {name: 'Tăng số lượng'}).click();
  await expect(checkbox).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

  // Session reset works
  await page.goto('/about');
  await page.getByRole('button', {name: 'Xóa dữ liệu phiên của tôi'}).click();
  await page.getByRole('button', {name: 'Xác nhận xóa sạch'}).click();
  await expect(page).toHaveURL(/\/$/);

  await context.clearCookies();
  await context.addCookies([{name: 'grocery_session', value: 'expired-token-for-test', url: 'http://127.0.0.1:8001'}]);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Phiên làm việc đã hết hạn'})).toBeVisible();
});
