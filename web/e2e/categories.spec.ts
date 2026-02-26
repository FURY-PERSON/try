import { test, expect } from '@playwright/test';

test.describe('Categories Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/categories');
    // Wait for page heading to confirm the page rendered
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible({ timeout: 15000 });
    // Wait for categories data to load
    await page.waitForResponse(
      (r) => r.url().includes('/admin/categories') && r.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible();
  });

  test('shows add button', async ({ page }) => {
    await expect(page.locator('main').getByRole('button', { name: /Добавить/ })).toBeVisible();
  });

  test('shows table with seeded categories', async ({ page }) => {
    const table = page.locator('main table');
    await expect(table).toBeVisible();

    const headers = ['Иконка', 'Название', 'Название (EN)', 'Slug', 'Порядок', 'Статус'];
    for (const header of headers) {
      await expect(page.locator('main').getByRole('columnheader', { name: header, exact: true })).toBeVisible();
    }

    // Verify at least one seeded category exists (Science is in the nameEn column)
    await expect(page.locator('main td', { hasText: 'Science' }).first()).toBeVisible();
  });

  test('open create dialog and cancel', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#nameEn')).toBeVisible();
    await expect(page.locator('#slug')).toBeVisible();
    await expect(page.getByText('Иконка (emoji)')).toBeVisible();
    await expect(page.locator('#sortOrder')).toBeVisible();

    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByText('Новая категория')).not.toBeVisible();
  });

  test('create a new category', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    const slug = 'test-e2e-' + Date.now();
    await page.locator('#name').fill('Тестовая E2E');
    await page.locator('#nameEn').fill('Test E2E');
    await page.locator('#slug').fill(slug);
    // Select emoji via the emoji picker
    const emojiPickerTrigger = page.getByText('Иконка (emoji)').locator('..').locator('.cursor-pointer');
    await emojiPickerTrigger.click();
    await page.waitForTimeout(300);
    const emojiButton = page.locator('button', { hasText: '🧪' }).first();
    await expect(emojiButton).toBeVisible();
    await emojiButton.click();
    await page.locator('#sortOrder').fill('99');

    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByText('Категория создана')).toBeVisible({ timeout: 10000 });
  });

  test('edit a category', async ({ page }) => {
    await expect(page.locator('main table')).toBeVisible();

    const editButtons = page.locator('main button').filter({ has: page.locator('svg.lucide-pencil') });
    await editButtons.first().click();

    await expect(page.getByText('Редактировать категорию')).toBeVisible();
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText('Категория обновлена')).toBeVisible({ timeout: 10000 });
  });

  test('delete a category shows confirmation', async ({ page }) => {
    await expect(page.locator('main table')).toBeVisible();

    let dialogAppeared = false;
    page.once('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    // Each row's action cell has two buttons: edit (pencil) and delete (trash)
    // Select the second button in the first row's action cell
    const actionCells = page.locator('main table tbody tr').first().locator('td').last();
    const deleteButton = actionCells.locator('button').nth(1);
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    await page.waitForTimeout(1000);
    expect(dialogAppeared).toBeTruthy();
  });

  test('create dialog validates empty fields', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByText('Введите название').first()).toBeVisible();
  });
});
