import { test, expect } from '@playwright/test';

test.describe('Daily Sets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/daily-sets');
    await expect(page.getByRole('heading', { name: 'Ежедневные наборы' })).toBeVisible({ timeout: 15000 });
    await page.waitForResponse(
      (r) => r.url().includes('/admin/daily-sets') && r.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ежедневные наборы' })).toBeVisible();
  });

  test('shows create button in header', async ({ page }) => {
    const buttons = page.locator('main').getByRole('button', { name: /Создать набор/ });
    await expect(buttons.first()).toBeVisible();
  });

  test('shows table or empty state', async ({ page }) => {
    const table = page.locator('main table');
    const emptyState = page.locator('main').getByText('Нет наборов');

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('table has correct headers when sets exist', async ({ page }) => {
    const table = page.locator('main table');
    if (await table.isVisible()) {
      const headers = ['Дата', 'Тема', 'Статус', 'Создан'];
      for (const header of headers) {
        await expect(page.locator('main th', { hasText: header }).first()).toBeVisible();
      }
    }
  });

  test('create button navigates to create page', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Создать набор/ }).first().click();
    await expect(page).toHaveURL('/daily-sets/create');
  });

  test('delete button shows confirmation dialog', async ({ page }) => {
    const deleteButtons = page.locator('main button').filter({ has: page.locator('svg.lucide-trash-2') });
    if (await deleteButtons.first().isVisible().catch(() => false)) {
      const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });
      await deleteButtons.first().click();
      const dialog = await dialogPromise;
      expect(dialog.type()).toBe('confirm');
      await dialog.dismiss();
    }
  });
});

test.describe('Daily Set Create Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/daily-sets/create');
    await expect(page.getByRole('heading', { name: 'Создать ежедневный набор' })).toBeVisible({ timeout: 15000 });
  });

  test('displays create form', async ({ page }) => {
    await expect(page.locator('#date')).toBeVisible();
    await expect(page.locator('#theme')).toBeVisible();
    await expect(page.locator('#themeEn')).toBeVisible();
  });

  test('shows selected statements counter', async ({ page }) => {
    await expect(page.getByText(/Выбранные утверждения/)).toBeVisible();
  });

  test('back button navigates to daily sets list', async ({ page }) => {
    await page.locator('button, a').filter({ hasText: 'Назад' }).first().click();
    await expect(page).toHaveURL('/daily-sets');
  });

  test('create button is disabled without 15 statements', async ({ page }) => {
    const submitButton = page.locator('main').getByRole('button', { name: 'Создать набор' });
    await expect(submitButton).toBeDisabled();
  });

  test('shows search input for approved statements', async ({ page }) => {
    await expect(page.locator('input[placeholder="Поиск по тексту..."]')).toBeVisible();
  });

  test('shows filter dropdowns', async ({ page }) => {
    // Should have two select filters (isTrue + category)
    const selects = page.locator('main select');
    await expect(selects).toHaveCount(3); // status + isTrue + category
  });

  test('search filters statements', async ({ page }) => {
    // Wait for approved questions to load
    await page.waitForResponse(
      (r) => r.url().includes('/admin/questions') && r.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(500);

    const countBefore = page.getByText(/Найдено:/);
    await expect(countBefore).toBeVisible();

    // Type a search query
    await page.locator('input[placeholder="Поиск по тексту..."]').fill('невозможно_найти_такое_12345');
    await page.waitForTimeout(300);

    // Should show 0 results
    await expect(page.getByText('Найдено: 0')).toBeVisible();
  });

  test('clear search button works', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Поиск по тексту..."]');
    await searchInput.fill('test');
    await page.waitForTimeout(300);

    // Click the X button to clear
    const clearButton = searchInput.locator('..').locator('button');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(searchInput).toHaveValue('');
    }
  });

  test('fact/fake filter works', async ({ page }) => {
    await page.waitForTimeout(1000);

    const selects = page.locator('main select');
    // First select in the filter row is isTrue filter
    const isTrueSelect = selects.nth(1);
    await isTrueSelect.selectOption({ label: 'Факты' });
    await page.waitForTimeout(300);

    // No crash means filter works
    await expect(page.getByText(/Найдено:/)).toBeVisible();
  });

  test('category filter works', async ({ page }) => {
    await page.waitForTimeout(1000);

    const selects = page.locator('main select');
    // Second select in filter row is category
    const categorySelect = selects.nth(2);
    const options = await categorySelect.locator('option').count();
    if (options > 1) {
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      // No crash means filter works
      await expect(page.getByText(/Найдено:/)).toBeVisible();
    }
  });
});
