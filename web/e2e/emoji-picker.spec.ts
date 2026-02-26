import { test, expect } from '@playwright/test';

test.describe('Emoji Picker', () => {
  test('categories page: emoji picker opens and selects emoji', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    // Open create dialog
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    // Click on the emoji picker
    const emojiPickerTrigger = page.getByText('Иконка (emoji)').locator('..').locator('.cursor-pointer');
    await emojiPickerTrigger.click();

    // Emoji dropdown should appear with categories
    await expect(page.getByText('Животные').first()).toBeVisible();
    await expect(page.getByText('Наука').first()).toBeVisible();

    // Select an emoji
    const foxEmoji = page.locator('button', { hasText: '🦊' }).first();
    await foxEmoji.click();

    // Dropdown should close and emoji should be displayed
    await expect(emojiPickerTrigger.getByText('🦊')).toBeVisible();
  });

  test('collections page: emoji picker works', async ({ page }) => {
    await page.goto('/collections');
    await expect(page.getByRole('heading', { name: 'Подборки' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая подборка')).toBeVisible();

    // The emoji picker should be present
    await expect(page.getByText('Иконка').first()).toBeVisible();
  });

  test('reference page animals tab: emoji picker works', async ({ page }) => {
    await page.goto('/reference');
    await expect(page.getByRole('heading', { name: 'Никнеймы и аватары' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    // Switch to Animals tab
    await page.getByRole('button', { name: 'Животные' }).click();
    await page.waitForTimeout(500);

    // Open create dialog
    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новое животное')).toBeVisible();

    // Emoji picker should be present
    const emojiLabel = page.locator('label', { hasText: 'Эмоджи' });
    await expect(emojiLabel.first()).toBeVisible();
  });

  test('emoji picker closes on outside click', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    // Open emoji picker
    const emojiPickerTrigger = page.getByText('Иконка (emoji)').locator('..').locator('.cursor-pointer');
    await emojiPickerTrigger.click();
    await expect(page.getByText('Животные').first()).toBeVisible();

    // Click outside
    await page.locator('#name').click();

    // Dropdown should close
    await page.waitForTimeout(300);
    const dropdown = page.locator('.absolute.z-50.top-full');
    await expect(dropdown).not.toBeVisible();
  });
});
