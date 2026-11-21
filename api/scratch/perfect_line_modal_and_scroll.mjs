import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 注入 state 與 handleOpenLineModal
const stateAnchor = `const [openAlertEmail, setOpenAlertEmail] = useState<string>('');`;
const newStates = `const [openAlertEmail, setOpenAlertEmail] = useState<string>('');
  const [showLineModal, setShowLineModal] = useState<boolean>(false);
  const [lineModalTargetDate, setLineModalTargetDate] = useState<string>('');
  const [copiedLineId, setCopiedLineId] = useState<boolean>(false);

  // 跨平台智慧 LINE 加好友彈窗與自動複製預約訊息
  const handleOpenLineModal = (dateTarget?: string) => {
    const defaultMsg = dateTarget 
      ? \`您好！我想預約 \${dateTarget} 開賣通知與早鳥特惠 🏰✨\`
      : '您好！我想諮詢海外樂園門票最新促銷折扣碼與人潮情報 🎟️';

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(defaultMsg).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        // 手機直接跳轉 lin.ee 喚醒 LINE App，且剪貼簿已複製好預約字串
        window.location.href = 'https://lin.ee/XnkEyyl';
        return;
      }
      // 電腦桌面端：彈出超高質感官方加好友 QR Code 彈窗
      setLineModalTargetDate(dateTarget || '');
      setShowLineModal(true);
    }
  };`;

if (!code.includes('handleOpenLineModal')) {
  code = code.replace(stateAnchor, newStates);
  console.log('Injected Line Modal states and handler');
}

// 2. 日曆格子加上 🔔 預約開賣 標籤 + 點擊自動平滑滾動到預約卡片
const oldCellClickRegex = /onClick=\{\(\) => setSelectedDateStr\(day\.date\)\}/;
code = code.replace(
  oldCellClickRegex,
  `onClick={() => {
                    setSelectedDateStr(day.date);
                    if (day.bookingStatus === 'upcoming') {
                      setTimeout(() => {
                        const target = document.getElementById('booking-reminder-card');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 60);
                    }
                  }}`
);

// 日曆格子底部加上 🔔 預約開賣 膠囊標籤
const oldCrowdStatusRegex = /<span className="flex items-center gap-1 font-medium">\s*<span\s+className=\{\`w-1\.5 h-1\.5 rounded-full \$\{[\s\S]*?\{day\.crowdStatus\}<\/span>\s*<\/span>/;
const newCrowdStatusBadge = `{day.bookingStatus === 'upcoming' ? (
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
                    )}`;
code = code.replace(oldCrowdStatusRegex, newCrowdStatusBadge);

// 3. 開賣卡片加上 id="booking-reminder-card"
code = code.replace(
  /<div className=\{\`\$\{activeChar\.cardBg\} border-2 \$\{activeChar\.cardBorder\} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300\`\}>/,
  `<div id="booking-reminder-card" className={\`\${activeChar.cardBg} border-2 \${activeChar.cardBorder} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300 scroll-mt-20\`}>`
);

// 4. 方式一 LINE 按鈕改用 handleOpenLineModal
const oldLineBtnRegex = /<a\s+href=\{affiliateConfig\.lineOfficialUrl[\s\S]*?<span>💬 點此用 LINE 預約<\/span>\s*<\/a>/;
const newLineBtn = `<button
                          type="button"
                          onClick={() => handleOpenLineModal(\`\${currentDayData.dateStr}【\${currentPark.name}】\`)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                        >
                          <span>💬 點此用 LINE 預約</span>
                        </button>`;
code = code.replace(oldLineBtnRegex, newLineBtn);

// 5. 頂部 Header 的 LINE 按鈕也改用 handleOpenLineModal
code = code.replace(
  /<a\s+href=\{affiliateConfig\.lineOfficialUrl\s*\|\|\s*'https:\/\/lin\.ee\/XnkEyyl'\}\s+target="_blank"\s+rel="noopener noreferrer"\s+className="px-3 py-1\.5 text-xs font-black text-white bg-\[#06C755\][\s\S]*?<span>LINE 通知<\/span>\s*<\/a>/,
  `<button
              type="button"
              onClick={() => handleOpenLineModal()}
              className="px-3 py-1.5 text-xs font-black text-white bg-[#06C755] hover:bg-[#05b34c] transition-all rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>💬</span>
              <span>LINE 通知</span>
            </button>`
);

// 6. 注入超高質感的【LINE 官方加好友彈窗】LineQrModal
const lineModalMarkup = `
      {/* 🟢 官方加好友高解析 QR Code 彈窗 (電腦版專屬直通，自動記憶預約日期，100% 成功加好友) */}
      {showLineModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLineModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 彈窗頂部 */}
            <div className="bg-[#06C755] text-white p-5 pt-6 relative">
              <button
                type="button"
                onClick={() => setShowLineModal(false)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 text-white flex items-center justify-center transition-colors cursor-pointer text-base font-bold"
              >
                ✕
              </button>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#06C755] text-2xl font-black shadow-md mx-auto mb-2.5">
                💬
              </div>
              <h3 className="text-lg font-black tracking-tight">海外樂園門票情報</h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">LINE 官方帳號即時情報與開賣提醒</p>
            </div>

            {/* 彈窗主體 QR Code */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200 inline-block shadow-inner mx-auto">
                <img
                  src="https://qr-official.line.me/gs/M_272tfkev_GW.png"
                  alt="LINE Official QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-lg"
                />
              </div>

              {lineModalTargetDate ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 text-xs font-bold leading-relaxed text-left">
                  ✨ 已為您複製預約訊息至剪貼簿！
                  <br />
                  <span className="text-emerald-700 font-extrabold text-[11px]">
                    「您好！我想預約 {lineModalTargetDate} 開賣通知與早鳥特惠 🏰✨」
                  </span>
                  <br />
                  <span className="text-[10px] text-slate-500 font-normal">（掃碼加好友後，在聊天室直接「貼上」送出即可完成登記）</span>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 text-xs font-bold leading-relaxed">
                  ✨ 歡迎加入官方 LINE！隨時掌握最新門票降價與人潮預報
                </div>
              )}

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
                  <span>📱 請使用手機相機或 LINE 掃描條碼加好友</span>
                </div>
                <p className="text-[11px] text-slate-400">亦可在 LINE「加入好友 ➜ ID搜尋」輸入官方帳號：</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="font-mono font-black text-sm text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    @272tfkev
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText('@272tfkev');
                        setCopiedLineId(true);
                        setTimeout(() => setCopiedLineId(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    {copiedLineId ? '已複製！' : '複製 ID'}
                  </button>
                </div>
              </div>

              {/* 電腦版 LINE 快捷打開 */}
              <div className="pt-2 border-t border-slate-100">
                <a
                  href="https://lin.ee/XnkEyyl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>💻 若電腦已安裝 LINE，點此嘗試開啟</span>
                  <span>➜</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
`;

if (!code.includes('showLineModal &&')) {
  code = code.replace(
    '{/* 後台管理員登入與設定彈窗 */}',
    `${lineModalMarkup}\n      {/* 後台管理員登入與設定彈窗 */}`
  );
  console.log('Injected lineModalMarkup successfully');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('All updates written to App.tsx successfully!');

