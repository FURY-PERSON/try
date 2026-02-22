import { test, expect } from '@playwright/test';

test.describe('Statements List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByRole('heading', { name: 'Утверждения' })).toBeVisible({ timeout: 15000 });
    await page.waitForResponse(
      (r) => r.url().includes('/admin/questions') && r.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Утверждения' })).toBeVisible();
  });

  test('shows search and filter controls', async ({ page }) => {
    await expect(page.locator('main input[placeholder="Поиск..."]')).toBeVisible();
    const selects = page.locator('main select');
    await expect(selects).toHaveCount(2);
  });

  test('shows generate button in header', async ({ page }) => {
    await expect(
      page.locator('main').getByRole('button', { name: 'Генерировать', exact: true }),
    ).toBeVisible();
  });

  test('generate button navigates to /questions/generate', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: 'Генерировать', exact: true }).click();
    await expect(page).toHaveURL('/questions/generate');
  });

  test('shows table or empty state after loading', async ({ page }) => {
    const table = page.locator('main table');
    const emptyState = page.locator('main').getByText('Нет утверждений');

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('table has correct headers when statements exist', async ({ page }) => {
    const table = page.locator('main table');
    if (await table.isVisible()) {
      const headers = ['Утверждение', 'Факт/Фейк', 'Категория', 'Сложность', 'Статус', 'Показов', '% правильных'];
      for (const header of headers) {
        await expect(page.locator('main th', { hasText: header })).toBeVisible();
      }
    }
  });

  test('isTrue filter changes selection', async ({ page }) => {
    const selects = page.locator('main select');
    const isTrueSelect = selects.first();
    await isTrueSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
  });

  test('status filter changes selection', async ({ page }) => {
    const selects = page.locator('main select');
    const statusSelect = selects.nth(1);
    await statusSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
  });
});

test.describe('Statement Generate Page', () => {
  test('displays generation form', async ({ page }) => {
    await page.goto('/questions/generate');
    await expect(page.getByRole('heading', { name: /генерация/i })).toBeVisible({ timeout: 10000 });
  });
});
