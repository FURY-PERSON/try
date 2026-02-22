import { test, expect } from '@playwright/test';

test.describe('Daily Sets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/daily-sets');
    // Wait for page heading to confirm the page rendered
    await expect(page.getByRole('heading', { name: 'Ежедневные наборы' })).toBeVisible({ timeout: 15000 });
    // Wait for data to load
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
    // The header button has a "+" icon prefix — use first() since empty state also has "Создать набор"
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
    // Click the first "Создать набор" button (header button)
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
    // Wait for the heading to appear
    await expect(page.getByRole('heading', { name: 'Создать ежедневный набор' })).toBeVisible({ timeout: 15000 });
  });

  test('displays create form', async ({ page }) => {
    await expect(page.locator('#date')).toBeVisible();
    await expect(page.locator('#theme')).toBeVisible();
    await expect(page.locator('#themeEn')).toBeVisible();
  });

  test('shows selected questions counter', async ({ page }) => {
    await expect(page.getByText(/Выбранные вопросы/)).toBeVisible();
  });

  test('back button navigates to daily sets list', async ({ page }) => {
    await page.locator('button, a').filter({ hasText: 'Назад' }).first().click();
    await expect(page).toHaveURL('/daily-sets');
  });

  test('create button is disabled without 5 questions', async ({ page }) => {
    const submitButton = page.locator('main').getByRole('button', { name: 'Создать набор' });
    await expect(submitButton).toBeDisabled();
  });
});
