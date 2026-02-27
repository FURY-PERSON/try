import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('admin@factfront.app');
  await page.locator('#password').fill('admin123');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page).toHaveURL('/', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
