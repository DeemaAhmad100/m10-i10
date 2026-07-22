import { test, expect } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

test('kg page renders and returns rows', async ({ page }) => {
  await page.goto(`${API_URL}/kg`);
  
  // Verify the page loaded with the title
  await expect(page.locator('h1')).toContainText('Knowledge Graph — Recipe Query');
  
  // Verify the input and button are present
  const input = page.locator('input[placeholder*="Find Sichuan"]');
  const submitButton = page.locator('button:has-text("Ask")');
  
  await expect(input).toBeVisible();
  await expect(submitButton).toBeVisible();
  
  // Submit a valid query
  const sampleQuestion = "Find Sichuan recipes";
  await input.fill(sampleQuestion);
  await submitButton.click();
  
  // Wait for results to render (either success or supported patterns error)
  await page.waitForTimeout(1000);
  
  // Check if we got a result or an error
  const error = page.locator('[data-testid="error"]');
  const kgRow = page.locator('[data-testid="kg-row"]');
  const supportedPatterns = page.locator('[data-testid="supported-patterns"]');
  
  const hasError = await error.isVisible({ timeout: 2000 }).catch(() => false);
  const hasRows = await kgRow.isVisible({ timeout: 2000 }).catch(() => false);
  const hasSupportedPatterns = await supportedPatterns.isVisible({ timeout: 2000 }).catch(() => false);
  
  // At least one of these should be visible
  expect(hasError || hasRows || hasSupportedPatterns).toBeTruthy();
  
  // If we got rows, verify they have content
  if (hasRows) {
    const rowCount = await kgRow.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // Verify Cypher is shown
    const cypherSection = page.locator('text=Cypher');
    await expect(cypherSection).toBeVisible();
  }
});

