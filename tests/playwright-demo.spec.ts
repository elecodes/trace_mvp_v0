// playwright-demo.spec.ts
import { test, expect } from '@playwright/test';

test('Demo: login as demo user → dashboard navigation', async ({ page }) => {
  // Open login page
  await page.goto('http://localhost:3000/login');

  // Click the demo user button (text: "Login as demo user")
  const demoBtn = page.getByRole('button', { name: 'Login as demo user' });
  await expect(demoBtn).toBeVisible();
  await demoBtn.click();

  // Wait for navigation to /dashboard
  await page.waitForURL('**/dashboard');

  // Verify dashboard header is visible (adjust selector if needed)
  const dashboardHeader = page.getByRole('heading', { name: /panel de control trace/i });
  await expect(dashboardHeader).toBeVisible();

  // Optional screenshot for proof
  await page.screenshot({ path: 'dashboard-demo.png' });

  // Create a new project
  await page.click('text=Nuevo Proyecto');
  await page.waitForURL('**/projects/new');
  await page.fill('input#name', 'Demo Project');
  await page.fill('textarea#description', 'Automated demo project');
  await page.click('button:has-text("Crear Proyecto")');
  // Wait for navigation to the new project's page
  await page.waitForURL(/\/projects\/[^/]+$/);
  const projectHeader = page.getByRole('heading', { name: /Demo Project/i });
  await expect(projectHeader).toBeVisible();

  // Create a new asset within the project
  await page.click('text=Nuevo Asset');
  await page.waitForURL('**/assets/new');
  await page.fill('input[name="title"]', 'Demo Asset');
  await page.fill('textarea[name="description"]', 'Asset created by demo');
  // Assume there is a file input for image upload with test id "asset-image"
  const filePath = 'tests/fixtures/sample-image.png';
  await page.setInputFiles('input[data-testid="asset-image"]', filePath);
  await page.click('button:has-text("Crear Asset")');
  // Verify asset appears in list
  await expect(page.getByText('Demo Asset')).toBeVisible();

  // Lifecycle: view asset details
  await page.click('a:has-text("Demo Asset")');
  await page.waitForURL(/\/assets\/[^/]+$/);
  await expect(page.getByRole('heading', { name: /Demo Asset/i })).toBeVisible();

  // Edit asset
  await page.click('text=Edit');
  await page.fill('input[name="title"]', 'Demo Asset Updated');
  await page.click('button:has-text("Save")');
  await expect(page.getByText('Demo Asset Updated')).toBeVisible();

  // Delete asset
  await page.click('button:has-text("Delete")');
  await page.click('button:has-text("Confirm")');
  await expect(page.getByText('Demo Asset Updated')).toBeHidden();

  // Optional final screenshot
  await page.screenshot({ path: 'full-demo.png' });
});
