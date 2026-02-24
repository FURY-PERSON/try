import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sidebar shows app title and subtitle', async ({ page }) => {
    await expect(page.locator('aside').getByText('Факт или Фейк')).toBeVisible();
    await expect(page.locator('aside').getByText('Админ-панель')).toBeVisible();
  });

  test('sidebar shows all navigation items', async ({ page }) => {
    const navItems = ['Дашборд', 'Утверждения', 'AI Генерация', 'Ежедневные наборы', 'Категории', 'Подборки'];
    for (const item of navItems) {
      await expect(page.locator('aside').getByText(item)).toBeVisible();
    }
  });

  test('sidebar shows logout button', async ({ page }) => {
    await expect(page.locator('aside').getByText('Выйти')).toBeVisible();
  });

  test('navigate to Утверждения', async ({ page }) => {
    await page.locator('aside').getByText('Утверждения').click();
    await expect(page).toHaveURL('/questions');
    await expect(page.getByText('Утверждения').first()).toBeVisible();
  });

  test('navigate to AI Генерация', async ({ page }) => {
    await page.locator('aside').getByText('AI Генерация').click();
    await expect(page).toHaveURL('/questions/generate');
  });

  test('navigate to Ежедневные наборы', async ({ page }) => {
    await page.locator('aside').getByText('Ежедневные наборы').click();
    await expect(page).toHaveURL('/daily-sets');
    await expect(page.getByText('Ежедневные наборы').first()).toBeVisible();
  });

  test('navigate to Категории', async ({ page }) => {
    await page.locator('aside').getByText('Категории').click();
    await expect(page).toHaveURL('/categories');
    await expect(page.getByText('Категории').first()).toBeVisible();
  });

  test('navigate to Подборки', async ({ page }) => {
    await page.locator('aside').getByText('Подборки').click();
    await expect(page).toHaveURL('/collections');
    await expect(page.getByText('Подборки').first()).toBeVisible();
  });

  test('navigate back to Дашборд', async ({ page }) => {
    await page.locator('aside').getByText('Категории').click();
    await expect(page).toHaveURL('/categories');

    await page.locator('aside').getByText('Дашборд').click();
    await expect(page).toHaveURL('/');
  });

  test('logout redirects to login', async ({ page }) => {
    await page.locator('aside').getByText('Выйти').click();
    await expect(page).toHaveURL('/login');
  });
});
