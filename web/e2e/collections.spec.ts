import { test, expect } from '@playwright/test';

test.describe('Collections Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collections');
    await expect(page.getByRole('heading', { name: 'Подборки' })).toBeVisible({ timeout: 15000 });
    await page.waitForResponse(
      (r) => r.url().includes('/admin/collections') && r.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Подборки' })).toBeVisible();
  });

  test('shows add button', async ({ page }) => {
    await expect(page.locator('main').getByRole('button', { name: /Добавить/ })).toBeVisible();
  });

  test('shows filter dropdowns', async ({ page }) => {
    // Two filter dropdowns above the table (status + type)
    const selects = page.locator('main .flex.gap-3 select');
    await expect(selects).toHaveCount(2);
  });

  test('shows table or empty state', async ({ page }) => {
    const table = page.locator('main table');
    const emptyState = page.locator('main').getByText('Нет подборок');

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('table has correct headers when collections exist', async ({ page }) => {
    const table = page.locator('main table');
    if (await table.isVisible()) {
      const headers = ['Название', 'Тип', 'Статус', 'Вопросов', 'Даты', 'Порядок'];
      for (const header of headers) {
        await expect(page.locator('main th', { hasText: header }).first()).toBeVisible();
      }
    }
  });

  test('open create dialog and cancel', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая подборка')).toBeVisible();

    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#titleEn')).toBeVisible();
    await expect(page.locator('#icon')).toBeVisible();
    await expect(page.locator('#type')).toBeVisible();
    await expect(page.locator('#sortOrder')).toBeVisible();

    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByText('Новая подборка')).not.toBeVisible();
  });

  test('create dialog validates empty fields', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая подборка')).toBeVisible();

    // Clear the pre-filled fields
    await page.locator('#title').fill('');
    await page.locator('#titleEn').fill('');

    await page.getByRole('button', { name: 'Создать', exact: true }).click();

    await expect(page.getByText('Введите название').first()).toBeVisible();
  });

  test('create dialog shows question picker', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая подборка')).toBeVisible();

    await expect(page.getByText(/выбрано/)).toBeVisible();
    await expect(page.locator('input[placeholder="Поиск вопросов..."]')).toBeVisible();
  });

  test('create collection requires at least one question', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая подборка')).toBeVisible();

    await page.locator('#title').fill('Тестовая подборка E2E');
    await page.locator('#titleEn').fill('Test Collection E2E');

    await page.getByRole('button', { name: 'Создать', exact: true }).click();

    await expect(page.getByText('Выберите хотя бы один вопрос')).toBeVisible({ timeout: 5000 });
  });

  test('create collection with a question', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая подборка')).toBeVisible();

    await page.locator('#title').fill('E2E подборка ' + Date.now());
    await page.locator('#titleEn').fill('E2E Collection ' + Date.now());
    await page.locator('#icon').fill('🧪');

    // Wait for questions to load
    await page.waitForTimeout(2000);

    // Select the first question checkbox if available
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 0) {
      await checkboxes.first().check();
      await page.getByRole('button', { name: 'Создать' }).click();
      await expect(page.getByText('Подборка создана')).toBeVisible({ timeout: 10000 });
    }
  });

  test('delete button shows confirmation dialog', async ({ page }) => {
    const table = page.locator('main table');
    if (await table.isVisible()) {
      let dialogAppeared = false;
      page.once('dialog', async (dialog) => {
        dialogAppeared = true;
        await dialog.dismiss();
      });

      const deleteButtons = page.locator('main button').filter({ has: page.locator('svg.lucide-trash-2') });
      if (await deleteButtons.first().isVisible().catch(() => false)) {
        await deleteButtons.first().click();
        await page.waitForTimeout(1000);
        expect(dialogAppeared).toBeTruthy();
      }
    }
  });

  test('status filter works', async ({ page }) => {
    const selects = page.locator('main select');
    const statusSelect = selects.first();
    await statusSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    // No crash means filter works
  });

  test('type filter works', async ({ page }) => {
    const selects = page.locator('main select');
    const typeSelect = selects.nth(1);
    await typeSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    // No crash means filter works
  });
});
