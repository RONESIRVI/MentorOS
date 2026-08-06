const puppeteer = require('puppeteer');
const handler = require('serve-handler');
const http = require('http');

const server = http.createServer((request, response) => {
  return handler(request, response, { public: 'r:/RONE_Studio/RONE_MentorOS' });
});

server.listen(3000, async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    await dialog.accept();
  });
  
  await page.goto('http://localhost:3000/Mentor/mentor-dashboard.html', { waitUntil: 'domcontentloaded' });
  
  console.log('Clicking Evaluations tab...');
  await page.evaluate(() => window.switchMentorSection('evaluations'));
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Evaluate on first item...');
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-evaluate');
    if (btn) btn.click();
    else console.log('No evaluate button found!');
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  console.log('Setting marks and feedback...');
  await page.evaluate(() => {
    if (document.getElementById('eval-marks')) document.getElementById('eval-marks').value = '85';
    if (document.getElementById('eval-feedback')) document.getElementById('eval-feedback').value = 'Good job\nKeep it up';
  });
  
  console.log('Clicking Save...');
  await page.evaluate(() => {
    const saveBtn = document.querySelector('#eval-modal button[onclick="saveEval()"]');
    if (saveBtn) saveBtn.click();
    else console.log('No save button found!');
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
  server.close();
});
