import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should handle canary enable endpoint correctly', async ({ request }) => {
    const response = await request.post('/api/admin/canary/enable', {
      headers: {
        'X-API-Key': process.env.ADMIN_API_KEY || 'test-key'
      },
      data: {
        model: 'test-model',
        clients: ['client1', 'client2']
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });

  test('should handle invalid API key correctly', async ({ request }) => {
    const response = await request.post('/api/admin/canary/enable', {
      headers: {
        'X-API-Key': 'invalid-key'
      },
      data: {
        model: 'test-model'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });
});

test.describe('Frontend Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    await expect(page).toHaveTitle(/BETRIX/);
  });

  test('should have proper performance monitoring', async ({ page }) => {
    const perfMonitor = await page.getByTestId('performance-monitor');
    await expect(perfMonitor).toBeVisible();
  });
});