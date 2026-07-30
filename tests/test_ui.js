const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');

const port = 0; // Use random available port
const server = http.createServer((request, response) => {
  return handler(request, response, { public: path.join(__dirname, '..') });
});

(async () => {
  // Start local server to serve files
  await new Promise(resolve => server.listen(port, resolve));

  const args = process.argv.slice(2);
  const fileToTest = args[0] || 'index.html'; // Default to index.html if not provided
  
  const actualPort = server.address().port;
  const testUrl = `http://localhost:${actualPort}/${fileToTest}`;

  console.log(`🔍 Testing UI page: ${testUrl}`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  let errorCount = 0;
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      if (msg.text().includes('favicon.ico') || msg.text().includes('status of 404')) {
        // ignore 404s for missing assets during local testing
        return;
      }
      console.log('❌ CONSOLE ERROR:', msg.text());
      errorCount++;
    } else if (msg.type() === 'warning') {
      // Ignore warnings
    } else {
      console.log('ℹ️ LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('💥 PAGE ERROR (Syntax/Runtime):', err.toString());
    errorCount++;
  });

  page.on('requestfailed', request => {
    if (request.url().includes('favicon.ico')) return; // ignore favicon
    console.log(`⚠️ FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
    errorCount++;
  });

  try {
    await page.goto(testUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // wait for delayed scripts
  } catch(err) {
    console.log('💥 NAVIGATION ERROR:', err.message);
    errorCount++;
  }

  await browser.close();
  server.close();

  if (errorCount > 0) {
    console.error(`\n❌ TEST FAILED: Found ${errorCount} errors on ${fileToTest}. Fix them before pushing!`);
    process.exit(1);
  } else {
    console.log(`\n✅ TEST PASSED: No errors found on ${fileToTest}.`);
    process.exit(0);
  }
})();
