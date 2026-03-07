import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Radar view
await page.screenshot({ path: 'audit-results/01-radar-full.png', fullPage: true });

// Deal Lab
await page.click('button:has-text("Deal Lab")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'audit-results/04-deallab-full.png', fullPage: true });

// Research
await page.click('button:has-text("Research")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'audit-results/07-research-full.png', fullPage: true });

// Click into research result
const resultCard = page.locator('.research-result-item');
if (await resultCard.count() > 0) {
  await resultCard.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'audit-results/08-research-detail-full.png', fullPage: true });
}

// Definitions
await page.click('button:has-text("Industry Definitions")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'audit-results/10-definitions-full.png', fullPage: true });

await browser.close();
console.log('All screenshots captured.');
