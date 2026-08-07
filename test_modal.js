const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file://R:/RONE_Studio/RONE_MentorOS/Aspirant/aspirant-dashboard.html', { waitUntil: 'networkidle0' });
  
  // Click manage sync
  await page.click('#btn-toggle-cms');
  await page.waitForTimeout(500);
  
  // Click fetch quotebank
  await page.click('#btn-sync-quotebank');
  await page.waitForTimeout(5000); // wait for fetch
  
  // Click first eye icon
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for(let btn of btns) {
      if(btn.innerHTML.includes('👁️')) {
        btn.click();
        break;
      }
    }
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/jlpms/.gemini/antigravity-ide/brain/e80a4422-0683-456a-af44-07fe7f95c240/test_modal.png' });
  await browser.close();
})();
