import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for dashboard stats to load
    await page.waitForResponse((r) => r.url().includes('/admin/stats/dashboard'), { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('displays dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();
    await expect(page.getByText('Обзор состояния контента WordPulse')).toBeVisible();
  });

  test('displays 6 stat cards with correct labels', async ({ page }) => {
    const labels = [
      'Пользователи',
      'Активно сегодня',
      'Всего вопросов',
      'Одобрено',
      'На модерации',
      'Ежедневных наборов',
    ];

    for (const label of labels) {
      await expect(page.locator('main').getByText(label)).toBeVisible();
    }
  });

  test('stat cards show numeric values after loading', async ({ page }) => {
    // Stat values are inside the grid cards in main
    const statCards = page.locator('main .grid .text-2xl.font-bold');
    await expect(statCards.first()).toBeVisible();

    const values = await statCards.allTextContents();
    expect(values.length).toBe(6);

    for (const value of values) {
      expect(value.trim()).toMatch(/^[\d\s,.]+$/);
    }
  });
});
