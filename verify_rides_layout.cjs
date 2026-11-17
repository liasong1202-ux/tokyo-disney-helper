const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // 1. 東京 Land 下的 rides
  const ridesSection = await page.$('#rides');
  if (ridesSection) {
    await ridesSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/984b7263-8547-4fe6-9826-dce5a88d9029/verify_tokyo_land_rides.png' });
    console.log('Saved verify_tokyo_land_rides.png');
  }

  // 點擊東京 Sea
  const buttons = await page.$$('#rides button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('海洋 (Sea)')) {
      await btn.click();
      console.log('Clicked Tokyo Sea button');
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/984b7263-8547-4fe6-9826-dce5a88d9029/verify_tokyo_sea_rides.png' });
      console.log('Saved verify_tokyo_sea_rides.png');
      break;
    }
  }

  // 切換至香港
  const headerBtns = await page.$$('button');
  for (const btn of headerBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('香港')) {
      await btn.click();
      console.log('Switched to Hong Kong');
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  // 滾動到香港 rides 並點擊「魔雪奇緣焦點」
  const ridesHk = await page.$('#rides');
  if (ridesHk) {
    await ridesHk.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    const hkButtons = await page.$$('#rides button');
    for (const btn of hkButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('魔雪奇緣焦點')) {
        await btn.click();
        console.log('Clicked HK Frozen button');
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/984b7263-8547-4fe6-9826-dce5a88d9029/verify_hk_frozen_rides.png' });
        console.log('Saved verify_hk_frozen_rides.png');
        break;
      }
    }
  }

  // 切換至上海
  for (const btn of await page.$$('button')) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('上海')) {
      await btn.click();
      console.log('Switched to Shanghai');
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  // 滾動到上海 rides 並點擊「瘋狂動物城焦點」
  const ridesSh = await page.$('#rides');
  if (ridesSh) {
    await ridesSh.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    const shButtons = await page.$$('#rides button');
    for (const btn of shButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('瘋狂動物城焦點')) {
        await btn.click();
        console.log('Clicked Shanghai Zootopia button');
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/984b7263-8547-4fe6-9826-dce5a88d9029/verify_shanghai_zootopia_rides.png' });
        console.log('Saved verify_shanghai_zootopia_rides.png');
        break;
      }
    }
  }

  // 也截一張日曆上方 Toolbar 的圖
  const toolbar = await page.$('section.bg-white.rounded-2xl.border.border-slate-200\\/80');
  if (toolbar) {
    await toolbar.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity/brain/984b7263-8547-4fe6-9826-dce5a88d9029/verify_toolbar_shortcut.png' });
    console.log('Saved verify_toolbar_shortcut.png');
  }

  await browser.close();
  console.log('Verification completed successfully!');
})();
