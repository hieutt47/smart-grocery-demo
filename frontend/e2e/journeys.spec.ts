import {test, expect} from '@playwright/test';

test('A: direct purchase, immediate delivery, reload, reorder preview', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: /Bữa ngon bắt đầu/})).toBeVisible();
  await page.getByRole('link', {name: 'Khám phá gian chợ', exact: true}).click();
  await page.getByRole('textbox', {name: 'Tìm kiếm sản phẩm trong danh mục'}).fill('thit bo');
  await page.getByRole('button', {name: 'Tìm', exact: true}).click();
  await page.getByRole('button', {name: 'Thêm Thịt bò vào giỏ hàng', exact: true}).click();
  await expect(page.getByRole('status')).toContainText('Đã thêm');
  await page.goto('/cart');
  await expect(page.getByRole('heading', {name: 'Thịt bò', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Tăng số lượng'}).click();
  await expect(page.locator('.summary-total')).toContainText('110.000');
  await page.reload();
  await expect(page.locator('.summary-total')).toContainText('110.000');
  await page.getByRole('link', {name: 'Tiến hành chọn giờ & đặt đơn'}).click();
  await page.getByRole('button', {name: 'Dùng thông tin mẫu'}).click();
  await page.getByRole('button', {name: 'Kiểm tra & chốt đơn', exact: true}).click();
  await page.getByRole('button', {name: 'Tạo đơn mô phỏng', exact: true}).click();
  await expect(page).toHaveURL(/\/orders\/[a-f0-9]+/);
  await page.getByRole('button', {name: 'Hoàn tất giao ngay', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Một hành trình đã hoàn tất!'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Một hành trình đã hoàn tất!'})).toBeVisible();
  await page.getByRole('button', {name: 'Mua lại đơn hàng này'}).click();
  await expect(page.getByRole('heading', {name: 'Xem trước sản phẩm mua lại'})).toBeVisible();
  await page.getByRole('button', {name: /Ghép vào giỏ/}).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.locator('.summary-total')).toContainText('110.000');
});

test('B: budget assistant, context change, selective ingredients and scheduled delivery', async ({page}) => {
  await page.goto('/assistant');
  await expect(page.getByText('Chào bạn, hôm nay gian bếp nhà mình thế nào?')).toBeVisible();
  await page.getByRole('textbox', {name: 'Nhu cầu bữa ăn'}).fill('Tối nay 2 người, 100k');
  await page.getByRole('button', {name: 'Gửi yêu cầu'}).click();
  await expect(page.locator('.suggestion-card').first()).toBeVisible();
  await page.getByRole('button', {name: 'Không thích ăn cá', exact: true}).click();
  await expect(page.locator('.user-message').last()).toContainText('không thích cá');
  await page.locator('.suggestion-card').last().getByRole('link', {name: 'Chọn món này'}).click();
  await expect(page.getByRole('heading', {name: 'Mua đúng thứ bạn cần'})).toBeVisible();
  await expect(page.locator('input[type=checkbox]:checked')).toHaveCount(0);
  await page.locator('.ingredient-list input').first().check();
  await expect(page.getByRole('button', {name: /Thêm 1 mục vào giỏ/})).toBeEnabled();
  await page.getByRole('button', {name: /Thêm 1 mục vào giỏ/}).click();
  await expect(page.locator('.cart-row')).toHaveCount(1);
  await page.getByRole('link', {name: 'Tiến hành chọn giờ & đặt đơn'}).click();
  await page.getByRole('button', {name: 'Dùng thông tin mẫu'}).click();
  await page.getByRole('radio', {name: /Hẹn giờ nhận hàng/}).check();
  await page.getByRole('button', {name: 'Kiểm tra & chốt đơn', exact: true}).click();
  await page.getByRole('button', {name: 'Tạo đơn mô phỏng', exact: true}).click();
  await expect(page.locator('.status-pill.large')).toHaveText('Chờ giờ giao');
  await page.getByRole('button', {name: 'Tua đến giờ giao (mô phỏng)'}).click();
  await expect(page.getByRole('heading', {name: 'Một hành trình đã hoàn tất!'})).toBeVisible();
});

test('mobile layout, ingredient state on servings change, and empty search', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/');
  await expect(page.getByRole('heading', {name: /Bữa ngon bắt đầu/})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.goto('/cook?ids=ga-rang-gung');
  const checkbox = page.locator('.ingredient-list input').first();
  await checkbox.check();
  await page.getByRole('button', {name: 'Tăng số lượng'}).click();
  await expect(checkbox).toBeChecked();
  await expect(page.getByRole('heading', {name: 'Nguyên liệu cần cho 3 người'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.goto('/products?q=zzzz');
  await expect(page.getByRole('heading', {name: 'Chưa tìm thấy sản phẩm phù hợp'})).toBeVisible();
});

test('session reset is explicit and clears only current session', async ({page, context}) => {
  await page.goto('/products');
  await page.getByRole('button', {name: 'Thêm Trứng gà vào giỏ hàng', exact: true}).click();
  await expect(page.getByRole('status')).toContainText('Đã thêm');
  await page.goto('/about');
  await page.getByRole('button', {name: 'Xóa toàn bộ dữ liệu phiên của tôi'}).click();
  await page.getByRole('button', {name: 'Xác nhận xóa sạch'}).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/cart');
  await expect(page.getByRole('heading', {name: 'Giỏ hàng đang trống'})).toBeVisible();
  await context.clearCookies();
  await context.addCookies([{name: 'grocery_session', value: 'expired-token-for-test', url: 'http://127.0.0.1:8001'}]);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Phiên demo đã kết thúc'})).toBeVisible();
  await page.getByRole('button', {name: 'Bắt đầu phiên làm việc mới'}).click();
  await expect(page.getByRole('heading', {name: /Bữa ngon bắt đầu/})).toBeVisible();
});


test('catalog search stays aligned with browser history', async ({page}) => {
  await page.goto('/products?q=trung');
  const search = page.getByRole('textbox', {name: 'Tìm kiếm sản phẩm trong danh mục'});
  await search.fill('ca chua');
  await page.getByRole('button', {name: 'Tìm', exact: true}).click();
  await expect(page).toHaveURL(/q=ca\+chua/);
  await page.goBack();
  await expect(search).toHaveValue('trung');
  await expect(page.getByText('cho từ khóa “trung”', {exact: false})).toBeVisible();
});

test('mobile confirmation fits and cart quantity is disabled while saving', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/products');
  await page.getByRole('button', {name: 'Thêm Trứng gà vào giỏ hàng', exact: true}).click();
  await expect(page.getByRole('status')).toContainText('Đã thêm');
  await page.goto('/cart');
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/cart', async route => {
    if (route.request().method() === 'PATCH') await pending;
    await route.continue();
  });
  const increase = page.getByRole('button', {name: 'Tăng số lượng'});
  await increase.click();
  try {
    await expect(increase).toBeDisabled();
  } finally {
    release();
  }
  await expect(increase).toBeEnabled();
  await page.goto('/about');
  await page.getByRole('button', {name: 'Xóa toàn bộ dữ liệu phiên của tôi'}).click();
  await expect(page.getByRole('button', {name: 'Xác nhận xóa sạch'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.getByRole('button', {name: 'Giữ lại', exact: true}).click();
});

test('fresh browser sessions can immediately read their committed cart', async ({browser}) => {
  for (let i = 0; i < 8; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const failures: number[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 400) failures.push(response.status());
    });
    await page.goto('http://127.0.0.1:8001/cart');
    await expect(page.getByRole('heading', {name: 'Giỏ hàng đang trống'})).toBeVisible();
    expect(failures).toEqual([]);
    const cookies = await context.cookies();
    expect(cookies.find(c => c.name === 'grocery_session')).toMatchObject({httpOnly: true, sameSite: 'Lax'});
    await context.close();
  }
});
