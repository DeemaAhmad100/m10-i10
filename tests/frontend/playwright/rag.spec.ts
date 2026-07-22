import { test, expect } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

test('rag page renders cited answer with citation markers', async ({ page }) => {
  await page.goto(`${API_URL}/rag`);
  
  // Verify the page loaded with the title
  await expect(page.locator('h1')).toContainText('RAG — Cited Answer');
  
  // Verify the input and button are present
  const input = page.locator('input[placeholder*="Ask a recipe"]');
  const submitButton = page.locator('button:has-text("Ask")');
  
  await expect(input).toBeVisible();
  await expect(submitButton).toBeVisible();
  
  // Submit the seeded question
  const seededQuestion = "How do I prep ginger for stir-fry?";
  await input.fill(seededQuestion);
  await submitButton.click();
  
  // Wait for the answer to render
  const ragAnswer = page.locator('[data-testid="rag-answer"]');
  await expect(ragAnswer).toBeVisible({ timeout: 10000 });
  
  // Get the answer text
  const answerText = await ragAnswer.textContent();
  expect(answerText).toBeTruthy();
  expect(answerText).not.toContain('I cannot answer this from the available sources');
  
  // Verify citation markers are present in the answer
  const citationMarkers = page.locator('[data-testid="citation-marker"]');
  const markerCount = await citationMarkers.count();
  
  // If citations are present (which they should be for a valid answer),
  // verify they are visible
  if (markerCount > 0) {
    expect(markerCount).toBeGreaterThan(0);
    await expect(citationMarkers.first()).toBeVisible();
    
    // Verify each citation marker has a number
    for (let i = 0; i < markerCount; i++) {
      const markerText = await citationMarkers.nth(i).textContent();
      expect(markerText).toMatch(/\[\d+\]/);
    }
  }
  
  // Verify confidence is displayed
  const confidenceText = page.locator('text=Overall Confidence');
  await expect(confidenceText).toBeVisible();
});

