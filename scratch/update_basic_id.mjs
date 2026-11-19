import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 在開賣卡片處，將 LINE 按鈕改為動態帶入日期
const oldCardLineBtn = `<a
                      href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                      target="_blank"
                      rel="noopener noreferrer"
                      
                      className="px-4 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <span className="text-base">💬</span>
                      <span>加 LINE 接收開賣通知</span>
                    </a>`;

const newCardLineBtn = `<a
                      href={\`https://line.me/R/oaMessage/@272tfkev/?\${encodeURIComponent(\`您好！我想預約 \${currentDayData.dateStr}【\${currentPark.name}】開賣通知與早鳥特惠 🏰✨\`)}\`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="點擊自動帶入預約日期發送給官方 LINE"
                      className="px-4 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 group"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">💬</span>
                      <div className="text-left">
                        <div className="leading-tight">加 LINE 預約這天開賣</div>
                        <div className="text-[10px] text-emerald-100 font-normal">自動帶入 {currentDayData.dateStr}</div>
                      </div>
                    </a>`;

if (code.includes(oldCardLineBtn)) {
  code = code.replace(oldCardLineBtn, newCardLineBtn);
  console.log('Successfully replaced card LINE button with prefill URL!');
} else {
  // Regex replacement for robustness
  code = code.replace(
    /<a\s+href=\{affiliateConfig\.lineOfficialUrl\s*\|\|\s*'https:\/\/lin\.ee\/XnkEyyl'\}\s+target="_blank"\s+rel="noopener noreferrer"\s+className="px-4 py-2\.5 bg-\[#06C755\][\s\S]*?加 LINE 接收開賣通知<\/span>\s*<\/a>/,
    newCardLineBtn
  );
  console.log('Regex replaced card LINE button!');
}

// 2. 頂部 Header 的 LINE 按鈕
code = code.replace(
  /<a\s+href=\{affiliateConfig\.lineOfficialUrl\s*\|\|\s*'https:\/\/lin\.ee\/XnkEyyl'\}\s+target="_blank"\s+rel="noopener noreferrer"\s+className="px-3 py-1\.5 text-xs font-black text-white bg-\[#06C755\][\s\S]*?<span>LINE 通知<\/span>\s*<\/a>/,
  `<a
              href="https://line.me/R/oaMessage/@272tfkev/?%E6%82%A8%E5%A5%BD%EF%BC%81%E6%88%91%E6%83%B3%E8%AB%AE%E8%A9%A2%E6%B5%B7%E5%A4%96%E6%A8%82%E5%9C%92%E9%96%80%E7%A5%A8%E6%9C%80%E6%96%B0%E4%BF%83%E9%8A%销%E6%8A%98%E6%89%A3%E7%A2%BC%E8%88%87%E4%BA%BA%E6%BD%AE%E6%83%85%E5%A0%B1%20%F0%9F%8E%9F%EF%B8%8F"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-black text-white bg-[#06C755] hover:bg-[#05b34c] transition-all rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>💬</span>
              <span>LINE 諮詢</span>
            </a>`
);

// 3. 訂閱區塊的 LINE 按鈕
code = code.replace(
  /<a\s+href=\{affiliateConfig\.lineOfficialUrl\s*\|\|\s*'https:\/\/lin\.ee\/XnkEyyl'\}\s+target="_blank"\s+rel="noopener noreferrer"\s+className="inline-flex items-center gap-1\.5 px-3 py-1\.5 bg-\[#06C755\][\s\S]*?💬 加入 LINE 官方帳號通知\s*<\/a>/,
  `<a
                    href="https://line.me/R/oaMessage/@272tfkev/?%E6%82%A8%E5%A5%BD%EF%BC%81%E6%88%91%E6%83%B3%E5%8A%A0%E5%85%A5%E3%80%90%E6%B5%B7%E5%A4%96%E6%A8%82%E5%9C%92%E9%96%80%E7%A5%A8%E6%83%85%E5%A0%B1%E3%80%91%EF%BC%8C%E6%8E%A5%E6%94%B6%E6%9C%80%E6%96%B0%E9%99%90%E6%99%82%E7%89%B9%E6%83%A0%E8%88%87%E6%97%A9%E9%B3%A5%E9%99%8D%E5%83%B9%E5%BF%AB%E8%A8%8A%20%F0%9F%8E%81"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    💬 加入 LINE 官方帳號通知
                  </a>`
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx updated successfully with Basic ID!');

