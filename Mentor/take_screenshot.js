const puppeteer = require('puppeteer');
const handler = require('serve-handler');
const http = require('http');

const server = http.createServer((request, response) => {
  return handler(request, response, { public: 'r:/RONE_Studio/RONE_MentorOS' });
});

server.listen(3002, async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Need to bypass Auth first
  await page.goto('http://localhost:3002/Mentor/mentor-dashboard.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'r:/RONE_Studio/RONE_MentorOS/Mentor/screenshot_initial.png' });
  
  console.log('Clicking Evaluations tab...');
  await page.evaluate(() => { if (window.switchMentorSection) window.switchMentorSection('evaluations'); else console.log('NO SWITCH FUNCTION'); });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'r:/RONE_Studio/RONE_MentorOS/Mentor/screenshot_eval_tab.png' });
  
  console.log('Clicking Evaluate button...');
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-evaluate');
    if (btn) btn.click();
    else console.log('NO EVALUATE BUTTON');
  });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'r:/RONE_Studio/RONE_MentorOS/Mentor/screenshot_modal.png' });
  
  await browser.close();
  server.close();
});
