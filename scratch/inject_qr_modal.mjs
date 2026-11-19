import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 注入 state
const stateTarget = `const [openAlertEmail, setOpenAlertEmail] = useState<string>('');`;
const newState = `const [openAlertEmail, setOpenAlertEmail] = useState<string>('');
  const [showLineModal, setShowLineModal] = useState<boolean>(false);
  const [lineModalTargetDate, setLineModalTargetDate] = useState<string>('');
  const [copiedLineId, setCopiedLineId] = useState<boolean>(false);

  // 跨平台智慧 LINE 點擊處理 (手機直通喚醒 App，電腦版彈出官方高解析 QR Code 彈窗，徹底杜絕 line.me 官網跳轉)
  const handleLineClick = (e: React.MouseEvent, dateTarget?: string) => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        // 行動裝置直接跳轉 lin.ee 喚醒 LINE App
        return;
      }
      // 電腦桌面端：阻止直接跳轉以防 LINE 伺服器重定向到首頁，改在網頁上直接彈出專屬加好友 QR Code 彈窗
      e.preventDefault();
      setLineModalTargetDate(dateTarget || '');
      setShowLineModal(true);
      if (dateTarget && navigator.clipboard) {
        navigator.clipboard.writeText(\`您好！我想預約 \${dateTarget} 開賣通知與早鳥特惠 🏰✨\`).catch(() => {});
      }
    }
  };`;

code = code.replace(stateTarget, newState);

// 2. 更新頂部 Header 的 LINE 按鈕
const oldHeaderLine = `<a
              href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-black text-white bg-[#06C755] hover:bg-[#05b34c] transition-all rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>💬</span>
              <span>LINE 諮詢</span>
            </a>`;

const newHeaderLine = `<a
              href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleLineClick(e)}
              className="px-3 py-1.5 text-xs font-black text-white bg-[#06C755] hover:bg-[#05b34c] transition-all rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>💬</span>
              <span>LINE 諮詢</span>
            </a>`;

code = code.replace(oldHeaderLine, newHeaderLine);

// 3. 更新首頁大橫幅的 LINE 按鈕
const oldBannerLine = `<a
                    href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    💬 加入 LINE 官方帳號通知
                  </a>`;

const newBannerLine = `<a
                    href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleLineClick(e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    💬 加入 LINE 官方帳號通知
                  </a>`;

code = code.replace(oldBannerLine, newBannerLine);

// 4. 更新開賣卡片整合區塊的 LINE 按鈕
const oldCardLine = `<a
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

const newCardLine = `<a
                          href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => handleLineClick(e, \`\${currentDayData.dateStr}【\${currentPark.name}】\`)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                        >
                          <span>💬 點此加入 LINE 預約</span>
                        </a>`;

code = code.replace(oldCardLine, newCardLine);

// 5. 在頁面最下方（AdminModal 之前）注入專屬 LineQrModal 彈窗組件
const modalMarkup = `
      {/* 🟢 電腦版專屬 LINE 官方帳號加入好友 QR Code 彈窗 (保證 100% 成功，絕不被 LINE 官網首頁攔截) */}
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

              {lineModalTargetDate && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 text-xs font-bold leading-relaxed">
                  ✨ 已為您鎖定 <span className="underline font-black text-emerald-700">{lineModalTargetDate}</span> 預約！
                  <br />
                  <span className="text-[11px] text-emerald-700 font-medium">（掃碼加好友後，在聊天室直接貼上送出即可完成登記）</span>
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

code = code.replace('{/* 後台管理員登入與設定彈窗 */}', `${modalMarkup}\n      {/* 後台管理員登入與設定彈窗 */}`);

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx successfully upgraded with LineQrModal!');

