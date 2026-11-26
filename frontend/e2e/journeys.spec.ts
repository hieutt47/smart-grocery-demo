import {test, expect} from '@playwright/test';

test('A: home quick moods, random picker, recipe search and saved collection', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: /Hôm nay ăn gì/})).toBeVisible();

  // No cart or orders links in navigation
  await expect(page.getByRole('link', {name: 'Giỏ hàng'})).toHaveCount(0);
  await expect(page.getByRole('link', {name: 'Đơn hàng'})).toHaveCount(0);

  // Random picker is available on demand without crowding the first visit.
  await expect(page.locator('.home-picker-disclosure')).not.toHaveAttribute('open', '');
  await page.locator('.home-picker-disclosure > summary').click();
  await page.getByRole('button', {name: 'Chọn ngẫu nhiên', exact: true}).click();
  await expect(page.locator('.random-picker-result')).toBeVisible();

  // Saving by keyboard is independent from opening the recipe.
  const save = page.locator('.recipe-save-btn').first();
  await expect(page.locator('.recipe-card-link button')).toHaveCount(0);
  await save.focus();
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(/\/$/);
  await expect(save).toHaveAttribute('aria-pressed', 'true');
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

test('home starts with recipes and preserves optional meal tools', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.home-intro .button.primary')).toHaveCount(1);
  await page.locator('.home-intro').getByRole('link', {name: 'Xem công thức', exact: true}).click();
  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.locator('.recipe-card').first()).toBeVisible();
  await page.goto('/');
  await page.evaluate(() => {
    const shares: ShareData[] = [];
    Object.defineProperty(window, '__testShares', {value: shares, configurable: true});
    Object.defineProperty(navigator, 'share', {configurable: true, value: async (data: ShareData) => { shares.push(data); }});
  });
  const disclosure = page.locator('.home-picker-disclosure');
  await expect(disclosure).not.toHaveAttribute('open', '');
  await disclosure.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(disclosure.getByRole('link', {name: 'Xem gợi ý ăn trưa'})).toHaveAttribute('href', '/assistant?mode=lunch');
  const lunchName = await disclosure.locator('.random-picker-info > strong').innerText();
  await disclosure.getByRole('button', {name: 'Rủ đồng nghiệp', exact: true}).click();
  const lunchShares = await page.evaluate(() => Reflect.get(window, '__testShares') as ShareData[]);
  expect(lunchShares[0].title).toContain(lunchName);
  expect(lunchShares[0].url).toContain('/assistant?mode=lunch');
  await expect(page).toHaveURL(/\/$/);
  await disclosure.getByRole('button', {name: 'Tự nấu', exact: true}).click();
  await expect(disclosure.getByRole('button', {name: 'Tự nấu', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await disclosure.getByRole('button', {name: 'Chọn cho nhóm', exact: true}).click();
  await expect(disclosure.getByRole('button', {name: 'Đang chọn cho nhóm'})).toHaveAttribute('aria-pressed', 'true');
  await disclosure.getByRole('button', {name: 'Chọn ngẫu nhiên cho nhóm', exact: true}).click();
  const recipeName = await disclosure.locator('.random-picker-info > strong').innerText();
  await disclosure.getByRole('button', {name: `Chia sẻ món ${recipeName}`, exact: true}).click();
  const shares = await page.evaluate(() => Reflect.get(window, '__testShares') as ShareData[]);
  expect(shares).toHaveLength(2);
  expect(shares[1].title).toContain(recipeName);
  expect(shares[1].url).toContain('/cook?ids=');
  await expect(page).toHaveURL(/\/$/);
  await disclosure.getByRole('link', {name: 'Xem cách nấu'}).click();
  await expect(page).toHaveURL(/\/cook\?ids=/);
  await expect(page.locator('.ingredient-list')).toBeVisible();
});

test('tablet uses one primary navigation and keeps recipe metadata together', async ({page}) => {
  for (const width of [680, 681, 768, 900, 901]) {
    await page.setViewportSize({width, height: 1024});
    await page.goto('/');
    await expect(page.locator('.recipe-card').first()).toBeVisible();
    if (width <= 900) {
      await expect(page.locator('.commerce-links')).toBeHidden();
      await expect(page.locator('.mobile-nav')).toBeVisible();
    } else {
      await expect(page.locator('.commerce-links')).toBeVisible();
      await expect(page.locator('.mobile-nav')).toBeHidden();
    }
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      metadataWrap: [...document.querySelectorAll('.recipe-meta span')].map(node => getComputedStyle(node).whiteSpace)
    }));
    expect(layout.overflow).toBe(0);
    expect(layout.metadataWrap.every(value => value === 'nowrap')).toBe(true);
  }
});

test('recipe pagination resets for filters, search and browser history', async ({page}) => {
  await page.goto('/recipes');
  await expect(page.locator('.recipe-card')).toHaveCount(12);
  await page.getByRole('button', {name: 'Xem thêm 12 công thức', exact: true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(24);
  await page.getByRole('button', {name: 'Nhanh gọn (≤ 20 phút)', exact: true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(12);
  await page.getByRole('button', {name: 'Xem thêm 12 công thức', exact: true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(24);
  const search = page.getByRole('textbox', {name: 'Tìm món ăn hoặc công thức'});
  await search.fill('ga rang');
  await page.getByRole('button', {name: 'Tìm công thức', exact: true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/filter=nhanh/);
  await expect(page.locator('.recipe-card')).toHaveCount(12);
  await page.getByRole('button', {name: 'Tất cả món', exact: true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(12);
  for (const count of [24, 36, 48, 60]) {
    await page.getByRole('button', {name: 'Xem thêm 12 công thức', exact: true}).click();
    await expect(page.locator('.recipe-card')).toHaveCount(count);
  }
  await expect(page.getByRole('button', {name: /Xem thêm .* công thức/})).toHaveCount(0);
});

test('assistant mode follows URL and browser history without sending messages', async ({page}) => {
  let messagesSent = 0;
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().endsWith('/assistant/messages')) messagesSent++;
  });
  await page.goto('/assistant?mode=lunch');
  const cook = page.getByRole('button', {name: 'Tự nấu', exact: true});
  const lunch = page.getByRole('button', {name: 'Ăn trưa ngoài', exact: true});
  await expect(lunch).toHaveAttribute('aria-pressed', 'true');
  await cook.click();
  await expect(page).toHaveURL(/\/assistant$/);
  await expect(cook).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('textbox', {name: 'Nhập nhu cầu bữa ăn của bạn'})).toBeVisible();
  await page.goBack();
  await expect(lunch).toHaveAttribute('aria-pressed', 'true');
  await page.goForward();
  await expect(cook).toHaveAttribute('aria-pressed', 'true');
  expect(messagesSent).toBe(0);
});

test('recipe photography uses exact IDs and a neutral fallback on missing or failed images', async ({page}) => {
  await page.goto('/');
  const photo = page.locator('[data-recipe-id="rau-muong-xao"]');
  await expect(photo).toHaveAttribute('data-photo-status', 'available');
  await expect(photo.locator('img')).toHaveAttribute('srcset', /480w, .*960w/);
  await expect.poll(() => photo.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const pork = page.locator('[data-recipe-id="thit-kho-trung"] img');
  await expect(pork).toHaveAttribute('srcset', /480w, .*678w/);
  await expect.poll(() => pork.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.home-featured .recipe-card').filter({has: pork}).getByRole('link', {name: 'HungryHuy', exact: true})).toHaveAttribute('href', /hungryhuy\.com\/how-to-make-thit/);
  const tofu = page.locator('[data-recipe-id="dau-hu-nhoi-thit-sot-ca"] img');
  await expect(tofu).toHaveAttribute('srcset', /480w, .*533w/);
  await expect.poll(() => tofu.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.recipe-card-link .recipe-photo-credit')).toHaveCount(0);
  await expect(page.locator('.home-featured svg text')).toHaveCount(0);
  await page.getByRole('link', {name: 'Xem công thức Rau muống xào tỏi', exact: true}).click();
  await expect(page.locator('.cook-single-art img')).toHaveAttribute('loading', 'eager');
  await page.goto('/recipes?q=ga%20rang');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await expect(page.locator('[data-recipe-id="ga-rang-gung"]')).toHaveAttribute('data-photo-status', 'missing');
  await expect(page.locator('.recipe-card img')).toHaveCount(0);
  await page.goto('/about');
  await expect(page.getByRole('link', {name: 'Rau muống xào tỏi — Andy Wright'})).toBeVisible();
  await page.route('**/assets/rau-muong-xao-*.webp', route => route.abort());
  await page.goto('/cook?ids=rau-muong-xao');
  await expect(page.locator('.cook-single-art [data-photo-status="missing"]')).toBeVisible();
  await expect(page.locator('.cook-single-art img')).toHaveCount(0);
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
  await expect(page.getByRole('heading', {name: /Hôm nay ăn gì/})).toBeVisible();

  await context.clearCookies();
  await context.addCookies([{name: 'grocery_session', value: 'expired-token-for-test', url: 'http://127.0.0.1:8001'}]);
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Phiên làm việc đã hết hạn'})).toBeVisible();
});

test('personalization onboarding ranks recipes for selected persona', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Món quen dễ bắt đầu'})).toBeVisible();
  await page.getByRole('button', {name: /Eat Clean & Giữ dáng/}).click();
  await expect(page.getByRole('heading', {name: /Đề xuất chuẩn gu Eat Clean & Giữ dáng/})).toBeVisible();
  await expect(page.locator('.recipe-match-pill').first()).toBeVisible();
});
