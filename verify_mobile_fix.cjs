const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // 檢查是否有橫向溢出
  const scrollInfo = await page.evaluate(() => {
    return {
      windowWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    };
  });
  console.log('Mobile Scroll Info:', JSON.stringify(scrollInfo));

  // 1. 首頁手機視角截圖
  await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/984b7263-8547-4fe6-9826-dce5a88d9029/mobile_view_fixed_390.png' });
  console.log('Saved mobile_view_fixed_390.png');

  // 2. 滾動至日曆區塊截圖
  const calSection = await page.$('#calendar');
  if (calSection) {
    await calSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/984b7263-8547-4fe6-9826-dce5a88d9029/mobile_calendar_fixed_390.png' });
    console.log('Saved mobile_calendar_fixed_390.png');
  }

  // 3. 測試後端登入 API
  const loginRes = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'disney888' })
      });
      const data = await res.json();
      return { status: res.status, data };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Local Admin Login API test:', JSON.stringify(loginRes));

  await browser.close();
})();

