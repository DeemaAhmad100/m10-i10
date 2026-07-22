// Frontend lead — author this Playwright smoke test.
// Verifies the /extract page renders, accepts input, and displays
// typed entity results from the api service.
import { test, expect } from '@playwright/test';

test('extract page renders and returns entities', async ({ page }) => {
  await page.goto('http://localhost:3000/extract');
  
  // Verify the page loaded with the title
  await expect(page.locator('h1')).toContainText('Extract — Named Entity Recognition');
  
  // Verify the textarea and button are present
  const textarea = page.locator('textarea');
  const submitButton = page.locator('button:has-text("Extract")');
  
  await expect(textarea).toBeVisible();
  await expect(submitButton).toBeVisible();
  
  // Submit with sample text
  const sampleText = "Ginger is a root used in cooking. Add it to stir-fry dishes.";
  await textarea.fill(sampleText);
  await submitButton.click();
  
  // Wait for entities to render
  const entities = page.locator('[data-testid="entity-span"]');
  await expect(entities.first()).toBeVisible({ timeout: 5000 });
  
  // Verify entity structure (should have at least one entity with text, label, and offsets)
  const entityCount = await entities.count();
  expect(entityCount).toBeGreaterThan(0);
  
  // Verify first entity contains expected fields
  const firstEntity = entities.first();
  await expect(firstEntity.locator('strong')).toBeVisible();
  const entityText = await firstEntity.textContent();
  expect(entityText).toMatch(/\d+–\d+/);
});
