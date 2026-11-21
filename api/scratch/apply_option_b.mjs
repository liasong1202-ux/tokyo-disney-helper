import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 移除右上角多餘的單獨按鈕，讓視覺乾淨
const oldRightBtn = `<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>⏰ 尚未到開放訂票時間（入園前 2 個月開賣）</span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900">
                        想訂 <span className="text-indigo-700">{currentDayData.month}月{currentDayData.day}日</span> 的門票嗎？預計於 <span className="underline font-black text-rose-600">{currentDayData.saleOpenDate} 台灣時間 13:00</span> 開放預訂！
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        不用自己設鬧鐘苦等！挑選您喜歡的<strong>迪士尼專屬守護角色</strong>，在下方填入 Email，當 Klook / KKday 與官網<strong>一開放預訂</strong>，該角色將第一秒以<strong>專屬配色圖文祝賀信</strong>與訂票連結通知您！
                      </p>
                    </div>

                    {/* LINE 官方帳號開賣推播按鈕 */}
                    <a
                      href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <span className="text-base">💬</span>
                      <span>加 LINE 接收開賣通知</span>
                    </a>
                  </div>`;

const newHeaderSection = `<div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>⏰ 尚未到開放訂票時間（入園前 2 個月開賣）</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black text-slate-900">
                      想訂 <span className="text-indigo-700">{currentDayData.month}月{currentDayData.day}日</span> 的門票嗎？預計於 <span className="underline font-black text-rose-600">{currentDayData.saleOpenDate} 台灣時間 13:00</span> 開放預訂！
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      不用自己設鬧鐘苦等！挑選您喜歡的<strong>迪士尼專屬守護角色</strong>，在下方選擇【LINE 一鍵預約】或【Email 專屬通知】，開賣第一秒準時推播專屬祝賀與訂票連結給您！
                    </p>
                  </div>`;

if (code.includes(oldRightBtn)) {
  code = code.replace(oldRightBtn, newHeaderSection);
  console.log('Replaced top section cleanly');
} else {
  console.log('oldRightBtn not matched directly, checking regex...');
  code = code.replace(
    /<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">[\s\S]*?<span>加 LINE 接收開賣通知<\/span>\s*<\/a>\s*<\/div>/,
    newHeaderSection
  );
  console.log('Regex top section replaced');
}

// 2. 在角色台詞框下方，放入完整的【方式一 (LINE)】+【方式二 (Email)】
const oldFormBlock = `<form onSubmit={handleTicketOpenAlertSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                      <input
                        type="email"
                        required
                        value={openAlertEmail}
                        onChange={(e) => setOpenAlertEmail(e.target.value)}
                        placeholder={\`輸入您的信箱，由【\${activeChar.shortName}】開賣當刻發信通知...\`}
                        className="px-4 py-3 text-xs sm:text-sm bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 font-medium flex-1 shadow-2xs"
                        style={{ outlineColor: activeChar.themeColor }}
                      />
                      <button
                        type="submit"
                        disabled={submittingSub}
                        className={\`px-6 py-3 bg-gradient-to-r \${activeChar.buttonGradient} \${activeChar.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-all active:scale-95 disabled:opacity-60\`}
                      >
                        <Bell className="w-4 h-4" />
                        <span>由【\${activeChar.shortName}】預約開賣第一秒通知</span>
                      </button>
                    </form>`;

const newDualNoticeSection = `{/* 🎯 雙通道開賣預約中心：方式一 (LINE) / 方式二 (Email) */}
                    <div className="pt-3 space-y-3.5 border-t border-slate-200/80">
                      <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-rose-500 animate-pulse" />
                          <span>選擇開賣通知方式（{currentDayData.month}月{currentDayData.day}日 開賣第一秒準時推播）：</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">任選一種即可完成登記</span>
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
                              <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">免打字·秒速登記</span>
                            </div>
                            <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                              點擊自動前往 LINE 並複製「{currentDayData.dateStr}」預約訊息，送出即可！
                            </div>
                          </div>
                        </div>

                        <a
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
                          <span>💬 點此用 LINE 預約</span>
                        </a>
                      </div>

                      {/* 分隔線 OR */}
                      <div className="relative flex py-0.5 items-center">
                        <div className="flex-grow border-t border-slate-300/80"></div>
                        <span className="shrink mx-3 text-xs font-black text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                          或者使用 Email 接收信件
                        </span>
                        <div className="flex-grow border-t border-slate-300/80"></div>
                      </div>

                      {/* 方式二：Email 專屬圖文信 */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                          <span>【方式二】由【{activeChar.shortName}】發送專屬 Email 開賣通知：</span>
                          <span className="text-[10px] text-slate-500 font-normal">（零垃圾信，開賣當天當刻寄達）</span>
                        </div>
                        <form onSubmit={handleTicketOpenAlertSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
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
                            <span>由【\${activeChar.shortName}】預約 Email 通知</span>
                          </button>
                        </form>
                      </div>
                    </div>`;

if (code.includes(oldFormBlock)) {
  code = code.replace(oldFormBlock, newDualNoticeSection);
  console.log('Replaced form block with perfect dual notice section');
} else {
  console.log('oldFormBlock not matched directly, checking regex...');
  code = code.replace(
    /<form onSubmit=\{handleTicketOpenAlertSubmit\}[\s\S]*?<\/button>\s*<\/form>/,
    newDualNoticeSection
  );
  console.log('Regex form block replaced');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx successfully upgraded to Perfect Option B!');

