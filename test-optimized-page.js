const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Collect page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
    console.error('Stack:', error.stack);
  });

  // Navigate to the optimized page
  console.log('Navigating to http://localhost:3000/optimized...');
  
  try {
    await page.goto('http://localhost:3000/optimized', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'optimized-page.png', fullPage: true });
    console.log('Screenshot saved as optimized-page.png');
    
    // Check if there are any error logs
    const errorLogs = logs.filter(log => log.type === 'error');
    if (errorLogs.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errorLogs.forEach(log => {
        console.log(`Error: ${log.text}`);
        if (log.location) {
          console.log(`  at ${log.location.url}:${log.location.lineNumber}`);
        }
      });
    }
    
    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(300000); // 5 minutes
    
  } catch (error) {
    console.error('Navigation error:', error);
  } finally {
    await browser.close();
  }
})();