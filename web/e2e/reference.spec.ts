import { test, expect } from '@playwright/test';

test.describe('Nicknames & Avatars Page (Reference)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reference');
    await expect(page.getByRole('heading', { name: 'Никнеймы и аватары' })).toBeVisible({ timeout: 15000 });
    await page.waitForResponse(
      (r) => r.url().includes('/admin/reference/') && r.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('displays page heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Никнеймы и аватары' })).toBeVisible();
    await expect(page.getByText('Прилагательные, животные и эмоджи для персонализации')).toBeVisible();
  });

  test('shows three tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Прилагательные' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Животные' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Эмоджи' })).toBeVisible();
  });

  test('default tab is Adjectives', async ({ page }) => {
    // Adjectives tab should be active by default
    const headers = page.locator('main th');
    await expect(headers.getByText('Русский')).toBeVisible();
    await expect(headers.getByText('English')).toBeVisible();
  });

  test('switch to Animals tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Животные' }).click();
    await page.waitForTimeout(500);

    const headers = page.locator('main th');
    await expect(headers.getByText('Эмоджи')).toBeVisible();
    await expect(headers.getByText('Русский')).toBeVisible();
    await expect(headers.getByText('English')).toBeVisible();
  });

  test('switch to Emojis tab', async ({ page }) => {
    await page.getByText('Эмоджи', { exact: true }).click();
    await page.waitForTimeout(500);

    const headers = page.locator('main th');
    await expect(headers.getByText('Эмоджи')).toBeVisible();
    await expect(headers.getByText('Категория')).toBeVisible();
  });

  test('Adjectives tab: shows add button', async ({ page }) => {
    await expect(page.locator('main').getByRole('button', { name: /Добавить/ })).toBeVisible();
  });

  test('Adjectives tab: open create dialog and cancel', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новое прилагательное')).toBeVisible();

    await expect(page.locator('#textRu')).toBeVisible();
    await expect(page.locator('#textEn')).toBeVisible();

    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByText('Новое прилагательное')).not.toBeVisible();
  });

  test('Adjectives tab: create adjective validates empty fields', async ({ page }) => {
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новое прилагательное')).toBeVisible();

    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByText('Введите прилагательное (RU)')).toBeVisible();
  });

  test('Animals tab: open create dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Животные' }).click();
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новое животное')).toBeVisible();

    await expect(page.locator('#textRu')).toBeVisible();
    await expect(page.locator('#textEn')).toBeVisible();
    // Emoji picker should be visible (label "Эмоджи")
    const emojiLabels = page.locator('label', { hasText: 'Эмоджи' });
    await expect(emojiLabels.first()).toBeVisible();

    await page.getByRole('button', { name: 'Отмена' }).click();
  });

  test('Emojis tab: open create dialog', async ({ page }) => {
    await page.getByText('Эмоджи', { exact: true }).click();
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новый эмоджи')).toBeVisible();

    await expect(page.locator('#category')).toBeVisible();

    await page.getByRole('button', { name: 'Отмена' }).click();
  });

  test('page does not crash on tab switches', async ({ page }) => {
    // Switch through all tabs rapidly
    await page.getByRole('button', { name: 'Животные' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Эмоджи' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Прилагательные' }).click();
    await page.waitForTimeout(300);

    // Page should still be functional
    await expect(page.getByRole('heading', { name: 'Никнеймы и аватары' })).toBeVisible();
  });
});
