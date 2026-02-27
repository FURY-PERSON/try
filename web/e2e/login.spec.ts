import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Фронт фактов' })).toBeVisible();
  });

  test('shows login form', async ({ page }) => {
    await expect(page.getByText('Админ-панель')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.getByText('Некорректный email')).toBeVisible();
    await expect(page.getByText('Введите пароль')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.locator('#email').fill('wrong@email.com');
    await page.locator('#password').fill('wrongpassword');

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/admin/auth/login'),
      { timeout: 15000 },
    );

    await page.getByRole('button', { name: 'Войти' }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(401);

    await expect(page.getByText('Неверный email или пароль')).toBeVisible({ timeout: 5000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.locator('#email').fill('admin@factfront.app');
    await page.locator('#password').fill('admin123');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user redirected from protected routes', async ({ page }) => {
    const protectedRoutes = ['/questions', '/categories', '/daily-sets', '/questions/generate', '/collections'];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });
});
