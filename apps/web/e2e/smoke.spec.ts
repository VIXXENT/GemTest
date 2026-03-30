import { test, expect } from '@playwright/test'

test.describe('GemTest Smoke Test', () => {
  test('should load the dashboard correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('/', { waitUntil: 'networkidle' })

    // Check for the main title using role and regex
    // eslint-disable-next-line @typescript-eslint/typedef
    const heading = page.getByRole('heading', { name: /GemTest Monorepo/i })
    await expect(heading).toBeVisible({ timeout: 15000 })
  })
})
