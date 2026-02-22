import { test, expect } from '@playwright/test';

test.describe('Statement Create Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/questions/create');
    await expect(page.getByRole('heading', { name: 'Создать утверждение' })).toBeVisible({ timeout: 15000 });
  });

  test('displays create form with all sections', async ({ page }) => {
    await expect(page.locator('#statement')).toBeVisible();
    await expect(page.locator('#isTrue')).toBeVisible();
    await expect(page.locator('#explanation')).toBeVisible();
    await expect(page.locator('#source')).toBeVisible();
    await expect(page.locator('#sourceUrl')).toBeVisible();
    await expect(page.locator('#language')).toBeVisible();
    await expect(page.locator('#categoryId')).toBeVisible();
    await expect(page.locator('#difficulty')).toBeVisible();
  });

  test('back button navigates to statements list', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Назад' }).click();
    await expect(page).toHaveURL('/questions');
  });

  test('validates required fields on submit', async ({ page }) => {
    await page.locator('#difficulty').fill('');
    await page.locator('#statement').fill('');
    await page.locator('#explanation').fill('');
    await page.locator('#source').fill('');

    await page.getByRole('button', { name: 'Создать утверждение' }).click();

    await expect(page.getByText('Минимум 10 символов').first()).toBeVisible();
  });

  test('create a fake statement successfully', async ({ page }) => {
    // Wait for categories to load
    await page.waitForResponse(
      (r) => r.url().includes('/admin/categories') && r.status() === 200,
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(500);

    // Fill statement
    await page.locator('#statement').fill('Великая Китайская стена видна из космоса невооружённым глазом');
    await page.locator('#isTrue').selectOption('false');

    // Fill explanation
    await page.locator('#explanation').fill('Это распространённый миф. Астронавты подтвердили, что стену невозможно увидеть из космоса без специального оборудования.');
    await page.locator('#source').fill('NASA');

    // Set params
    await page.locator('#language').selectOption('ru');
    await page.locator('#difficulty').fill('2');

    // Select first category
    const categorySelect = page.locator('#categoryId');
    const options = categorySelect.locator('option:not([disabled])');
    const optionCount = await options.count();
    if (optionCount > 0) {
      const firstValue = await options.first().getAttribute('value');
      if (firstValue) await categorySelect.selectOption(firstValue);
    }

    // Submit
    await page.getByRole('button', { name: 'Создать утверждение' }).click();

    await expect(page.getByText('Утверждение создано')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/questions', { timeout: 10000 });
  });
});

test.describe('Statements List Page - Add Button', () => {
  test('shows add button and navigates to create page', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByRole('heading', { name: 'Утверждения' })).toBeVisible({ timeout: 15000 });

    const addButton = page.locator('main').getByRole('button', { name: 'Добавить' });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page).toHaveURL('/questions/create');
  });
});
