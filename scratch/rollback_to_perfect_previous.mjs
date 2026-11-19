import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 移除注入的 state 與 handleLineClick
code = code.replace(
  /const \[showLineModal, setShowLineModal\][\s\S]*?const handleLineClick =[\s\S]*?\}\s*\}\s*;/m,
  ''
);

// 2. 移除 document.title useEffect
code = code.replace(
  /\/\/ 動態同步瀏覽器分頁標題，對齊【方案1\+方案4】[\s\S]*?\}, \[selectedParkId\]\);/m,
  ''
);

// 3. 恢復 Header 的 Logo 與網站名稱
code = code.replace(
  /<div className="flex items-center gap-2 shrink-0">[\s\S]*?海外樂園門票情報[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  `<div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl" role="img" aria-label="castle">🏰</span>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                {currentPark.name}門票降價助手
              </span>
            </div>`
);

// 4. 恢復 Header 的 LINE 按鈕
code = code.replace(
  /<a\s+href=\{affiliateConfig\.lineOfficialUrl\s*\|\|\s*'https:\/\/lin\.ee\/XnkEyyl'\}\s+target="_blank"\s+rel="noopener noreferrer"\s+onClick=\{\(e\)\s*=>\s*handleLineClick\(e\)\}[\s\S]*?<span>LINE 諮詢<\/span>\s*<\/a>/,
  `<a
              href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-black text-white bg-[#06C755] hover:bg-[#05b34c] transition-all rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>💬</span>
              <span>LINE 通知</span>
            </a>`
);

// 5. 恢復首頁大橫幅的 LINE 按鈕
code = code.replace(
  /<a\s+href=\{affiliateConfig\.lineOfficialUrl\s*\|\|\s*'https:\/\/lin\.ee\/XnkEyyl'\}\s+target="_blank"\s+rel="noopener noreferrer"\s+onClick=\{\(e\)\s*=>\s*handleLineClick\(e\)\}[\s\S]*?💬 加入 LINE 官方帳號通知\s*<\/a>/,
  `<a
                    href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    💬 加入 LINE 官方帳號通知
                  </a>`
);

// 6. 恢復日曆格子的點擊事件與底部的 crowdStatus
code = code.replace(
  /onClick=\{\(\) => \{\s*setSelectedDateStr\(day\.date\);[\s\S]*?\}\s*\}\s*className=\{\`relative cursor-pointer rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 flex flex-col justify-between transition-all duration-\d+ min-h-\[92px\] sm:min-h-\[118px\] group \$\{cardBg\} \$\{flashStyle\} \$\{[\s\S]*?hover:shadow-md'[\s\S]*?\}\`\}/,
  `onClick={() => setSelectedDateStr(day.date)}
                  className={\`relative cursor-pointer rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 flex flex-col justify-between transition-all duration-150 min-h-[92px] sm:min-h-[118px] group \${cardBg} \${flashStyle} \${
                    isSelected
                      ? 'ring-4 ring-indigo-600 ring-offset-2 shadow-lg z-10 scale-[1.02]'
                      : 'hover:shadow-md'
                  }\`}`
);

code = code.replace(
  /\{day\.bookingStatus === 'upcoming' \? \([\s\S]*?🔔 預約開賣[\s\S]*?\) : \([\s\S]*?\}\s*<\/div>/,
  `<span className="flex items-center gap-1 font-medium">
                        <span
                          className={\`w-1.5 h-1.5 rounded-full \${
                            day.crowdLevel < 40 ? 'bg-emerald-500' : day.crowdLevel <= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }\`}
                        ></span>
                        <span className="hidden sm:inline">{day.crowdStatus}</span>
                      </span>
                  </div>`
);

// 7. 恢復開賣卡片的開頭與右上角按鈕
code = code.replace(
  /<div id="booking-reminder-card" className=\{\`\$\{activeChar\.cardBg\} border-2 \$\{activeChar\.cardBorder\} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300 scroll-mt-20\`\}>/,
  `<div className={\`\${activeChar.cardBg} border-2 \${activeChar.cardBorder} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300\`}>`
);

code = code.replace(
  /\{\/\* LINE 按鈕已移至下方整合通知中心 \*\/\}/,
  `{/* LINE 官方帳號開賣推播按鈕 */}
                    <a
                      href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <span className="text-base">💬</span>
                      <span>加 LINE 接收開賣通知</span>
                    </a>`
);

// 8. 恢復底部的 Email 預約表單，移除方式一/方式二
code = code.replace(
  /\{\/\* 整合式雙通道通知中心[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/,
  `{/* Email 預約送出表單 (按鈕與輸入框光暈隨選用角色配色) */}
                    <form onSubmit={handleTicketOpenAlertSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
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
                    </form>`
);

// 9. 移除注入的 LineQrModal
code = code.replace(
  /\{\/\* 🟢 電腦版專屬 LINE 官方帳號加入好友 QR Code 彈窗[\s\S]*?\{\/\* 後台管理員登入與設定彈窗 \*\/\}/,
  `{/* 後台管理員登入與設定彈窗 */}`
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx successfully rolled back to previous version!');

// 10. 恢復 index.html
const indexPath = path.join(root, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(
  /<title>.*?<\/title>/,
  '<title>東京迪士尼門票降價與人潮預報助手 - 台幣即時低價日曆・開賣提醒・角色圖文通知</title>'
);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html title rolled back!');

