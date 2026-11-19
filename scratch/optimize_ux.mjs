import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 在日曆格子點擊加入平滑滑動到 booking-reminder-card，並在未開賣格子加上 🔔 預約開賣 標籤
// 尋找 onClick={() => setSelectedDateStr(day.date)}
const oldCalendarClick = `                  onClick={() => setSelectedDateStr(day.date)}
                  className={\`relative cursor-pointer rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 flex flex-col justify-between transition-all duration-150 min-h-[92px] sm:min-h-[118px] group \${cardBg} \${flashStyle} \${
                    isSelected
                      ? 'ring-4 ring-indigo-600 ring-offset-2 shadow-lg z-10 scale-[1.02]'
                      : 'hover:shadow-md'
                  }\`}`;

const newCalendarClick = `                  onClick={() => {
                    setSelectedDateStr(day.date);
                    if (day.bookingStatus === 'upcoming') {
                      setTimeout(() => {
                        const target = document.getElementById('booking-reminder-card');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          target.classList.add('ring-4', 'ring-rose-400', 'scale-[1.01]');
                          setTimeout(() => {
                            target.classList.remove('ring-4', 'ring-rose-400', 'scale-[1.01]');
                          }, 1200);
                        }
                      }, 60);
                    }
                  }}
                  className={\`relative cursor-pointer rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 flex flex-col justify-between transition-all duration-200 min-h-[92px] sm:min-h-[118px] group \${cardBg} \${flashStyle} \${
                    isSelected
                      ? 'ring-4 ring-indigo-600 ring-offset-2 shadow-lg z-10 scale-[1.02]'
                      : 'hover:shadow-md'
                  }\`}`;

if (code.includes(oldCalendarClick)) {
  code = code.replace(oldCalendarClick, newCalendarClick);
  console.log('Successfully updated calendar cell click with auto-scroll!');
} else {
  console.log('Target oldCalendarClick not found, trying regex...');
  code = code.replace(
    /onClick=\{\(\) => setSelectedDateStr\(day\.date\)\}\s+className=\{\`relative cursor-pointer rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 flex flex-col justify-between transition-all duration-150 min-h-\[92px\] sm:min-h-\[118px\] group \$\{cardBg\} \$\{flashStyle\} \$\{[\s\S]*?hover:shadow-md'[\s\S]*?\}\`\}/,
    newCalendarClick
  );
  console.log('Regex calendar cell click applied!');
}

// 2. 在日曆格子底部的 crowdStatus 旁加上 🔔 預約開賣 膠囊標籤
const oldCrowdStatusBlock = `<div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="tabular-nums font-bold">{day.currencySymbol}{ticketPriceVal.toLocaleString()}</span>
                    <span className="flex items-center gap-1 font-medium">
                      <span
                        className={\`w-1.5 h-1.5 rounded-full \${
                          day.crowdLevel < 40 ? 'bg-emerald-500' : day.crowdLevel <= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }\`}
                      ></span>
                      <span className="hidden sm:inline">{day.crowdStatus}</span>
                    </span>
                  </div>`;

const newCrowdStatusBlock = `<div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="tabular-nums font-bold">{day.currencySymbol}{ticketPriceVal.toLocaleString()}</span>
                    {day.bookingStatus === 'upcoming' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shadow-2xs group-hover:bg-rose-100 group-hover:scale-105 transition-all">
                        🔔 預約開賣
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium">
                        <span
                          className={\`w-1.5 h-1.5 rounded-full \${
                            day.crowdLevel < 40 ? 'bg-emerald-500' : day.crowdLevel <= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }\`}
                        ></span>
                        <span className="hidden sm:inline">{day.crowdStatus}</span>
                      </span>
                    )}
                  </div>`;

if (code.includes(oldCrowdStatusBlock)) {
  code = code.replace(oldCrowdStatusBlock, newCrowdStatusBlock);
  console.log('Successfully added 🔔 預約開賣 badge to calendar cell!');
} else {
  console.log('oldCrowdStatusBlock not found directly, checking regex...');
  code = code.replace(
    /<div className="mt-1 pt-1 border-t border-black\/5 flex items-center justify-between text-\[10px\] text-slate-500">[\s\S]*?<span className="hidden sm:inline">\{day\.crowdStatus\}<\/span>\s*<\/span>\s*<\/div>/,
    newCrowdStatusBlock
  );
  console.log('Regex calendar cell badge applied!');
}

// 3. 升級「尚未開放訂票時間」卡片：加上 id="booking-reminder-card"，整合 LINE 與 Email 二選一
const oldReminderCardHeaderRegex = /\{\/\*\s*尚未到開放訂票時間（入園前 2 個月開賣）\s*\*\/\}[\s\S]*?return \(\s*<div className=\{\`\$\{activeChar\.cardBg\} border-2 \$\{activeChar\.cardBorder\} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300\`\}>/;

// 我們檢查這張卡片從 return 到表單結束的整體替換
const cardStartTarget = `return (
                <div className={\`\${activeChar.cardBg} border-2 \${activeChar.cardBorder} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300\`}>`;

const newCardStart = `return (
                <div id="booking-reminder-card" className={\`\${activeChar.cardBg} border-2 \${activeChar.cardBorder} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300 scroll-mt-20\`}>`;

code = code.replace(cardStartTarget, newCardStart);

// 移除頂部單獨漂浮的 LINE 按鈕
const oldFloatingLineBtnRegex = /\{\/\*\s*LINE 官方帳號開賣推播按鈕\s*\*\/\}[\s\S]*?<a\s+href=\{\`https:\/\/line\.me\/R\/oaMessage\/@272tfkev[\s\S]*?<\/a>/;
code = code.replace(oldFloatingLineBtnRegex, '{/* LINE 按鈕已移至下方整合通知中心 */}');

// 替換底部的表單區，改為「二擇一雙通道通知中心」
const oldFormTargetRegex = /\{\/\*\s*Email 預約送出表單[^\*]*\s*\*\/\}[\s\S]*?<form onSubmit=\{handleTicketOpenAlertSubmit\}[\s\S]*?<\/form>/;

const newIntegratedNoticeCenter = `{/* 整合式雙通道通知中心 (LINE 與 Email 二擇一，直覺不混淆) */}
                    <div className="pt-3 border-t-2 border-slate-200/80 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-rose-500 animate-bounce" />
                          <span>選擇開賣通知方式（{currentDayData.month}月{currentDayData.day}日 開賣第一秒準時推播）：</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">任選一種即可完成預約</span>
                      </div>

                      {/* 方式一：LINE 一鍵預約 (免打字直通) */}
                      <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center text-white text-xl font-bold shadow-xs shrink-0">
                            💬
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                              <span>【方式一】用 LINE 一鍵預約開賣</span>
                              <span className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">免打字·秒速登記</span>
                            </div>
                            <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                              點擊自動開啟 LINE 並帶入「{currentDayData.dateStr}」預約訊息，發送即可！
                            </div>
                          </div>
                        </div>

                        <a
                          href={\`https://line.me/R/oaMessage/@272tfkev/?\${encodeURIComponent(\`您好！我想預約 \${currentDayData.dateStr}【\${currentPark.name}】開賣通知與早鳥特惠 🏰✨\`)}\`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                        >
                          <span>💬 點此用 LINE 預約</span>
                        </a>
                      </div>

                      {/* 分隔線 OR */}
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="shrink mx-3 text-xs font-black text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                          或者使用 Email 接收信件
                        </span>
                        <div className="flex-grow border-t border-slate-300"></div>
                      </div>

                      {/* 方式二：Email 專屬圖文信 */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                          <span>【方式二】由【{activeChar.shortName}】發送專屬 Email 開賣通知：</span>
                          <span className="text-[10px] text-slate-500 font-normal">（零垃圾信，開賣當天當刻寄達）</span>
                        </div>
                        <form onSubmit={handleTicketOpenAlertSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="email"
                            required
                            value={openAlertEmail}
                            onChange={(e) => setOpenAlertEmail(e.target.value)}
                            placeholder={\`請輸入接收開賣通知的 Email，將由【\${activeChar.shortName}】開賣當刻發信通知...\`}
                            className="px-4 py-3 text-xs sm:text-sm bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 font-medium flex-1 shadow-2xs"
                            style={{ outlineColor: activeChar.themeColor }}
                          />
                          <button
                            type="submit"
                            disabled={submittingSub}
                            className={\`px-6 py-3 bg-gradient-to-r \${activeChar.buttonGradient} \${activeChar.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-all active:scale-95 disabled:opacity-60\`}
                          >
                            <Bell className="w-4 h-4" />
                            <span>由【{activeChar.shortName}】預約 Email 通知</span>
                          </button>
                        </form>
                      </div>
                    </div>`;

if (oldFormTargetRegex.test(code)) {
  code = code.replace(oldFormTargetRegex, newIntegratedNoticeCenter);
  console.log('Successfully replaced form with integrated dual notice center!');
} else {
  console.log('oldFormTargetRegex not matched directly, checking...');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx rewrite completed!');
