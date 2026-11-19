import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 替換頂部 Header 的 LINE 諮詢按鈕
code = code.replace(
  /href=\{\`https:\/\/line\.me\/R\/oaMessage\/@272tfkev[\s\S]*?\`\}/,
  "href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}"
);

// 2. 替換開賣提醒卡片中的 LINE 按鈕
const oldCardRegex = /<a\s+href=\{\`https:\/\/line\.me\/R\/oaMessage\/@272tfkev[\s\S]*?<span>💬 點此用 LINE 預約<\/span>\s*<\/a>/;

const newCardBtn = `<a
                          href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(\`您好！我想預約 \${currentDayData.dateStr}【\${currentPark.name}】開賣通知與早鳥特惠 🏰✨\`);
                            }
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                        >
                          <span>💬 點此加入 LINE 預約</span>
                        </a>`;

code = code.replace(oldCardRegex, newCardBtn);

// 確保沒有任何遺漏的 oaMessage
code = code.replace(/https:\/\/line\.me\/R\/oaMessage\/@272tfkev\/\?[^"'\`]+/g, 'https://lin.ee/XnkEyyl');

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx fixed: All LINE links now use https://lin.ee/XnkEyyl');
