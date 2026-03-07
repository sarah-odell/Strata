import { chromium } from 'playwright';
import { PlaywrightDriver, AgentRunner } from '@tangle-network/agent-browser-driver';

const BASE_URL = 'http://localhost:5173';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const driver = new PlaywrightDriver(page, {
  captureScreenshots: true,
});

const runner = new AgentRunner({
  driver,
  config: {
    model: 'sonnet',
    provider: 'claude-code',
    debug: false,
    maxHistoryTurns: 20,
    retries: 2,
    vision: true,
    screenshotInterval: 1,
  },
  onTurn: (turn) => {
    console.log(`Turn ${turn.turn}: ${turn.action.action}${turn.reasoning ? ' — ' + turn.reasoning.slice(0, 100) : ''}`);
  },
});

const result = await runner.run({
  goal: `You are a senior product designer auditing a PE intelligence platform called "Strata".

Navigate to ${BASE_URL} and systematically audit every view:

1. RADAR VIEW: Take a screenshot. Evaluate: typography hierarchy, spacing rhythm, color usage (should be semantic-only amber/muted palette on dark bg), data density, table readability, toolbar layout. Change the strategy dropdown and scenario toggles to verify interactive states.

2. DEAL LAB VIEW: Click the "Deal Lab" tab. Take a screenshot. Evaluate: form layout, prompt tool area, portfolio adjacency chip grid, radar chart rendering (labels, axes, fill colors), assumption pills.

3. RESEARCH VIEW: Click the "Research" tab. Take a screenshot. Evaluate: trigger form layout, results list, and if there's a research result, click into it to see the verdict cards and ensemble report layout.

4. INDUSTRY DEFINITIONS VIEW: Click the "Industry Definitions" tab. Take a screenshot. Evaluate: card layout, typography, readability.

For each view, provide a structured assessment:
- SCORE (1-10) for: Typography, Spacing, Color discipline, Information hierarchy, Overall polish
- TOP 3 ISSUES to fix (be specific: element name, what's wrong, what to do)
- WHAT WORKS WELL

Be ruthlessly critical. This is a professional intelligence platform — every pixel must earn its place. Flag anything that looks amateurish, inconsistent, or decorative without purpose.`,
  startUrl: BASE_URL,
  maxTurns: 40,
});

console.log('\n' + '='.repeat(80));
console.log('DESIGN AUDIT RESULT');
console.log('='.repeat(80));
console.log(`Success: ${result.success}`);
console.log(`Turns: ${result.turns.length}`);
console.log(`Duration: ${result.totalMs}ms`);
if (result.reason) console.log(`\nFinal Assessment:\n${result.reason}`);
console.log('='.repeat(80));

// Take final screenshots of each view
const views = ['Radar', 'Deal Lab', 'Research', 'Industry Definitions'];
for (const view of views) {
  const btn = page.locator(`button:has-text("${view}")`);
  if (await btn.count() > 0) {
    await btn.first().click();
    await page.waitForTimeout(500);
    const filename = `audit-results/screenshot-${view.toLowerCase().replace(/\s+/g, '-')}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`Saved: ${filename}`);
  }
}

await browser.close();
