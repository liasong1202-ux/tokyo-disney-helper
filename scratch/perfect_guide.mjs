import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 加入 handleJumpToFutureSale 函數
const jumpFunc = `
  // 一鍵直達 2027 未開賣日期 5 大角色通知中心
  const handleJumpToFutureSale = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSelectedYear(2027);
    setSelectedMonth(2);
    setSelectedDateStr('2027-02-04');
    setTimeout(() => {
      const el = document.getElementById('compare');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };
`;

code = code.replace(
  'const handleTicketOpenAlertSubmit = async (e: React.FormEvent) => {',
  `${jumpFunc}\n  const handleTicketOpenAlertSubmit = async (e: React.FormEvent) => {`
);

// 2. 讓頂部的「🔔 開賣提醒」按鈕點擊後直接跳轉至 2027年2月4日 角色通知卡片
code = code.replace(
  /<a\s+href="#subscribe"\s+className="px-3 py-1\.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all rounded-xl flex items-center gap-1\.5 whitespace-nowrap cursor-pointer shrink-0"\s*>\s*<Bell className="w-3\.5 h-3\.5 text-indigo-600" \/>\s*<span>開賣提醒<\/span>\s*<\/a>/,
  `<button
              type="button"
              onClick={handleJumpToFutureSale}
              className="px-3 py-1.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>🔔 開賣提醒 (5大角色)</span>
            </button>`
);

// 3. 在首頁大橫幅底部加上「一鍵直達 2027 年 5 大角色開賣預約」按鈕
const bannerShortcut = `
                <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleJumpToFutureSale}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-black cursor-pointer hover:underline"
                  >
                    <span>👑 想預約 2027 年過年寒假門票？點此一鍵直達【5 大迪士尼角色開賣提醒】➜</span>
                  </button>
                  <a
                    href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    💬 加入 LINE 官方帳號通知
                  </a>
                </div>`;

code = code.replace(
  /<div className="pt-2 border-t border-white\/15 flex items-center justify-between gap-2">[\s\S]*?💬 加入 LINE 官方帳號通知\s*<\/a>\s*<\/div>/,
  bannerShortcut
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx shortcut added successfully!');
