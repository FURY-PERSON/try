import { test, expect } from '@playwright/test';

test.describe('Dialog/Modal Centering', () => {
  test('categories dialog opens centered', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    // The dialog container should be centered (flex items-center justify-center)
    const dialogOverlay = page.locator('.fixed.inset-0.flex.items-center.justify-center');
    await expect(dialogOverlay).toBeVisible();

    // The dialog content should be visible
    const dialogContent = page.locator('.bg-surface.rounded-2xl.p-6');
    await expect(dialogContent).toBeVisible();

    // Check the dialog box position is roughly centered
    const box = await dialogContent.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const viewportCenterX = viewport.width / 2;
      const viewportCenterY = viewport.height / 2;

      // Should be roughly centered (within 100px tolerance)
      expect(Math.abs(centerX - viewportCenterX)).toBeLessThan(100);
      expect(Math.abs(centerY - viewportCenterY)).toBeLessThan(200);
    }
  });

  test('backdrop click closes dialog', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    // Click on the backdrop (the dark overlay)
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/40');
    await backdrop.click({ position: { x: 10, y: 10 } });

    await expect(page.getByText('Новая категория')).not.toBeVisible();
  });

  test('X button closes dialog', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    // Click the X button (last button in dialog header area with svg)
    const closeButton = page.locator('.bg-surface.rounded-2xl button').filter({ has: page.locator('svg.lucide-x') });
    await closeButton.click();

    await expect(page.getByText('Новая категория')).not.toBeVisible();
  });

  test('Escape key closes dialog', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая категория')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByText('Новая категория')).not.toBeVisible();
  });

  test('reference page dialog opens centered', async ({ page }) => {
    await page.goto('/reference');
    await expect(page.getByRole('heading', { name: 'Никнеймы и аватары' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новое прилагательное')).toBeVisible();

    const dialogOverlay = page.locator('.fixed.inset-0.flex.items-center.justify-center');
    await expect(dialogOverlay).toBeVisible();
  });

  test('collections page dialog opens centered', async ({ page }) => {
    await page.goto('/collections');
    await expect(page.getByRole('heading', { name: 'Подборки' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    await page.locator('main').getByRole('button', { name: /Добавить/ }).click();
    await expect(page.getByText('Новая подборка')).toBeVisible();

    const dialogOverlay = page.locator('.fixed.inset-0.flex.items-center.justify-center');
    await expect(dialogOverlay).toBeVisible();
  });
});
