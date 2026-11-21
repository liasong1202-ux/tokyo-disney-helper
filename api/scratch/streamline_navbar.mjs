import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 修改標題為「海外樂園門票情報」
code = code.replace(
  /<div className="flex items-center gap-2 shrink-0">[\s\S]*?\{currentPark\.name\}門票降價助手[\s\S]*?<\/div>/,
  `<div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl" role="img" aria-label="castle">🏰</span>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                海外樂園門票情報
              </span>
            </div>`
);

// 2. 徹底移除中間 5 個文字選單
const navRegex = /\{\/\*\s*Zone 2:\s*錨點導航\s*\*\/\}[\s\S]*?<nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-600">[\s\S]*?<\/nav>/;
if (navRegex.test(code)) {
  code = code.replace(navRegex, '{/* 導覽選單已精簡，保留舒適留白 */}');
  console.log('Successfully removed 5 text nav links!');
} else {
  // Regex fallback
  code = code.replace(
    /<nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-600">[\s\S]*?<\/nav>/,
    ''
  );
  console.log('Nav links removed with fallback regex');
}

// 3. 移除右側突兀的「🔔 開賣提醒 (5大角色)」長按鈕，只保留綠色 LINE 通知按鈕與匯率標籤
const buttonRegex = /\{\/\*\s*快速開賣預約\s*\*\/\}[\s\S]*?<button[\s\S]*?🔔 開賣提醒 \(5大角色\)[\s\S]*?<\/button>/;
if (buttonRegex.test(code)) {
  code = code.replace(buttonRegex, '');
  console.log('Successfully removed cluttered open-sale button from navbar!');
} else {
  code = code.replace(
    /<button\s+type="button"\s+onClick=\{handleJumpToFutureSale\}[\s\S]*?🔔 開賣提醒 \(5大角色\)[\s\S]*?<\/button>/,
    ''
  );
  console.log('Button removed with fallback regex');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx cleaned and streamlined successfully!');

// 4. 同步更新 index.html 的 title
const indexPath = path.join(root, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(
  /<title>.*?<\/title>/,
  '<title>海外樂園門票情報 - 日本東京・香港・上海・加州迪士尼即時比價與人潮預報</title>'
);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html title updated to 海外樂園門票情報');

