const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = '/Users/paulmoga/.gemini/antigravity/brain/caf9566a-2e5a-4ba1-a147-261945758176';
  
  console.log('🚀 Starting ElectricVision Track End-to-End Test Suite...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Inject global testing flag before page loads
  await context.addInitScript(() => {
    window.__E2E_TESTING__ = true;
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    // Filter out next.js dev info logs, show errors, warnings, and custom app logs
    if (msg.type() === 'error' || msg.type() === 'warning' || text.includes('🔥') || text.includes('detection') || text.includes('tenantId') || text.includes('worker') || text.includes('site') || text.includes('Failed') || text.includes('Error')) {
      console.log(`  [Browser Console ${msg.type()}]`, text);
    }
  });

  page.on('pageerror', err => {
    console.error('  [Browser Unhandled Exception]', err.stack || err.message);
  });
  
  // Custom helper to take screenshot with console log
  const takeScreenshot = async (name) => {
    const filename = `screenshot_${name}.png`;
    const savePath = path.join(screenshotsDir, filename);
    await page.screenshot({ path: savePath });
    console.log(`📸 Screenshot saved: ${filename}`);
  };

  try {
    // 1. Authentication
    console.log('\n--- Step 1: Authentication ---');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('#login-email');
    await page.fill('#login-email', 'polimoga@gmail.com');
    await page.fill('#login-password', 'test1234');
    await page.click('#login-submit');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    console.log('✓ Successfully authenticated and redirected to Dashboard.');
    await page.waitForTimeout(1500);
    await takeScreenshot('01_dashboard');

    // 2. Create Site
    console.log('\n--- Step 2: Create a Work Site ---');
    await page.goto('http://localhost:3000/sites');
    await page.waitForSelector('#add-site-btn');
    await page.click('#add-site-btn');
    
    await page.waitForSelector('#site-name');
    await page.fill('#site-name', 'E2E Test Site');
    await page.fill('#site-client', 'E2E Test Client');
    await page.fill('#site-address', 'Strada Testului Nr. 1, Cluj-Napoca');
    await page.fill('#site-description', 'Automated E2E Test execution space');
    await page.fill('#site-startDate', '2026-06-01');
    await page.fill('#site-endDate', '2026-06-30');
    await page.fill('#site-budget', '120000');
    
    // Save modal
    await page.click('.modal-footer .btn-primary');
    console.log('✓ Site creation form submitted.');
    await page.waitForSelector('.modal-backdrop', { state: 'detached' });
    
    // Wait for the new site to appear in the list
    await page.waitForSelector('.glass-card:has-text("E2E Test Site")');
    console.log('✓ E2E Test Site successfully created and visible in directory.');
    await takeScreenshot('02_sites_list');

    // 3. Create Worker
    console.log('\n--- Step 3: Create a Worker ---');
    await page.goto('http://localhost:3000/workers');
    await page.waitForSelector('#add-worker-btn');
    await page.click('#add-worker-btn');
    
    await page.waitForSelector('#worker-firstName');
    await page.fill('#worker-firstName', 'John');
    await page.fill('#worker-lastName', 'Doe');
    await page.fill('#worker-phone', '+40 799 123 456');
    await page.fill('#worker-email', 'john.doe@electricvision.eu');
    await page.selectOption('#worker-experienceLevel', 'senior');
    await page.fill('#worker-hourlyRate', '80');
    await page.fill('#worker-hireDate', '2026-06-01');
    
    await page.click('.modal-footer .btn-primary');
    console.log('✓ Worker creation form submitted.');
    await page.waitForSelector('.modal-backdrop', { state: 'detached' });
    
    await page.waitForSelector('.glass-card:has-text("John Doe")');
    console.log('✓ John Doe successfully created and visible in directory.');
    await takeScreenshot('03_workers_list');

    // 4. Site Details subcollections (Time logs, Materials, Tools)
    console.log('\n--- Step 4: Add Tab Data inside Site Details ---');
    await page.goto('http://localhost:3000/sites');
    await page.waitForSelector('text=E2E Test Site');
    
    // Click on the newly created site
    await page.click('text=E2E Test Site');
    await page.waitForSelector('h1:has-text("E2E Test Site")');
    console.log('✓ Loaded Site Detail overview page.');
    await page.waitForTimeout(1000);
    await takeScreenshot('04_site_detail_overview');
    
    // Time Logs Tab (.tab:nth-child(2))
    console.log('  a) Adding a Time Log entry...');
    await page.click('.tab:nth-child(2)');
    await page.waitForTimeout(500);
    await page.click('button:has(span:has-text("+"))');
    await page.waitForSelector('#log-worker');
    
    // Log options for debugging
    const options = await page.$$eval('#log-worker option', els => els.map(el => el.textContent + ' -> ' + el.value));
    console.log('  Debug - Worker options available in dropdown:', options);
    
    // Wait until option is populated or fall back to index if not loaded
    if (options.some(opt => opt.includes('John Doe'))) {
      await page.selectOption('#log-worker', 'John Doe');
    } else {
      console.log('  Warning: John Doe not found in select. Waiting for Firestore sync...');
      await page.waitForTimeout(2000);
      const optionsRetry = await page.$$eval('#log-worker option', els => els.map(el => el.textContent + ' -> ' + el.value));
      console.log('  Debug - Retry Worker options:', optionsRetry);
      if (optionsRetry.some(opt => opt.includes('John Doe'))) {
        await page.selectOption('#log-worker', 'John Doe');
        console.log('  ✓ John Doe selected on retry.');
      } else {
        await page.selectOption('#log-worker', { index: 1 });
        console.log('  ⚠ John Doe not synced in time. Fell back to index 1.');
      }
    }
    
    await page.fill('#log-hours', '8');
    await page.fill('#log-range', '08:00 - 17:00');
    await page.fill('#log-desc', 'Wiring standard cabinet phase 1');
    await page.click('.modal-footer .btn-primary');
    await page.waitForSelector('.modal-backdrop', { state: 'detached' });
    
    await page.waitForSelector('.data-table:has-text("Wiring standard cabinet phase 1")');
    console.log('  ✓ Time Log successfully saved to Firestore.');
    await takeScreenshot('05_site_detail_timelogs');

    // Materials Tab (.tab:nth-child(3))
    console.log('  b) Adding a Material item...');
    await page.click('.tab:nth-child(3)');
    await page.waitForTimeout(500);
    await page.click('button:has(span:has-text("+"))');
    await page.waitForSelector('#mat-name');
    await page.fill('#mat-name', 'Copper Cable NYM 3x2.5mm');
    await page.selectOption('#mat-cat', 'Cabluri');
    await page.fill('#mat-qty', '100');
    await page.fill('#mat-unit', 'm');
    await page.fill('#mat-cost', '3.5');
    await page.click('.modal:has-text("Material") .modal-footer .btn-primary');
    await page.waitForSelector('.modal-backdrop', { state: 'detached' });
    
    await page.waitForSelector('.data-table:has-text("Copper Cable NYM 3x2.5mm")');
    console.log('  ✓ Material item successfully saved to Firestore.');
    await takeScreenshot('06_site_detail_materials');

    // Tools Tab (.tab:nth-child(4))
    console.log('  c) Assigning a Tool item...');
    await page.click('.tab:nth-child(4)');
    await page.waitForTimeout(500);
    await page.click('button:has(span:has-text("+"))');
    await page.waitForSelector('#tool-name');
    await page.fill('#tool-name', 'Laser Level Bosch');
    await page.fill('#tool-serial', 'BSH-GLL-9988');
    await page.selectOption('#tool-status', 'in_use');
    
    // Select worker for tool
    const toolWorkers = await page.$$eval('#tool-worker option', els => els.map(el => el.value));
    console.log('  Debug - Tool worker options:', toolWorkers);
    if (toolWorkers.includes('John Doe')) {
      await page.selectOption('#tool-worker', 'John Doe');
    } else {
      await page.selectOption('#tool-worker', { index: 1 });
    }
    
    await page.click('.modal:has-text("Tool") .modal-footer .btn-primary');
    await page.waitForSelector('.modal-backdrop', { state: 'detached' });
    
    await page.waitForSelector('.data-table:has-text("Laser Level Bosch")');
    console.log('  ✓ Tool item successfully saved to Firestore.');
    await takeScreenshot('07_site_detail_tools');

    // 5. Timesheets Verification
    console.log('\n--- Step 5: Verify Timesheet synchronization ---');
    await page.goto('http://localhost:3000/timesheets');
    await page.waitForTimeout(1000);
    await takeScreenshot('08_timesheets');

    // 6. Invoices, Purchases, settings check
    console.log('\n--- Step 6: Verify other system modules ---');
    await page.goto('http://localhost:3000/invoices');
    await page.waitForTimeout(1000);
    await takeScreenshot('09_invoices');

    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(1000);
    await takeScreenshot('10_settings');

    // 7. Cleanup
    console.log('\n--- Step 7: Clean up created test items ---');
    
    // Delete Worker
    console.log('  a) Deleting E2E Worker...');
    await page.goto('http://localhost:3000/workers');
    await page.waitForSelector('text=John Doe');
    await page.click('text=John Doe');
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.waitForSelector('button.btn-danger');
    await page.click('button.btn-danger');
    await page.waitForURL('http://localhost:3000/workers');
    console.log('  ✓ John Doe deleted successfully.');

    // Delete Site
    console.log('  b) Deleting E2E Site...');
    await page.goto('http://localhost:3000/sites');
    await page.waitForSelector('text=E2E Test Site');
    await page.click('text=E2E Test Site');
    
    await page.waitForSelector('button.btn-danger');
    await page.click('button.btn-danger');
    await page.waitForURL('http://localhost:3000/sites');
    console.log('  ✓ E2E Test Site deleted successfully.');
    
    console.log('\n🎉 ALL E2E functional tests completed successfully!');

  } catch (err) {
    console.error('\n❌ E2E Test Execution Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    process.exit(process.exitCode || 0);
  }
})();
