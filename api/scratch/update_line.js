const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 替換所有 LINE 按鈕的 alert 阻擋，直接讓它點擊前往
code = code.replace(
  /onClick=\{\(e\)\s*=>\s*\{\s*if\s*\(!affiliateConfig\.lineOfficialUrl\)\s*\{\s*e\.preventDefault\(\);\s*alert\([^)]+\);\s*\}\s*\}\}/g,
  ''
);

// 替換 href 確保即使尚未取得到也直通 https://lin.ee/XnkEyyl
code = code.replace(
  /href=\{affiliateConfig\.lineOfficialUrl\s*\|\|\s*['"][^'"]*['"]\}/g,
  "href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}"
);

// 替換 target
code = code.replace(
  /target=\{affiliateConfig\.lineOfficialUrl\s*\?\s*["']_blank["']\s*:\s*["'][^"']*["']\}/g,
  'target="_blank"'
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx successfully updated');

// 同時更新 data/store.json
const storePath = path.join(__dirname, 'data/store.json');
if (fs.existsSync(storePath)) {
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  if (!store.affiliateConfig) store.affiliateConfig = {};
  store.affiliateConfig.lineOfficialUrl = 'https://lin.ee/XnkEyyl';
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('data/store.json successfully updated');
}

