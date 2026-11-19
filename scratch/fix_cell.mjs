import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

const brokenCellRegex = /<div\s+key=\{day\.date\}\s+onClick=\{\(\) => setSelectedDateStr\(day\.date\)\}[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\)\}/;

const perfectCell = `<div
                  key={day.date}
                  onClick={() => setSelectedDateStr(day.date)}
                  className={\`relative cursor-pointer rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 flex flex-col justify-between transition-all duration-150 min-h-[92px] sm:min-h-[118px] group \${cardBg} \${flashStyle} \${
                    isSelected
                      ? 'ring-4 ring-indigo-600 ring-offset-2 shadow-lg z-10 scale-[1.02]'
                      : 'hover:shadow-md'
                  }\`}
                >
                  {/* 第一行顯示：日期與星期 */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                        {day.month}/{day.day} <span className="text-[11px] font-semibold text-slate-600">{day.weekdayStr}</span>
                      </span>
                      {day.bookingStatus === 'upcoming' ? (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded mt-1 inline-block w-fit leading-none">
                          ⌛ {day.saleOpenLabel}
                        </span>
                      ) : day.eventNote ? (
                        <span className="text-[10px] text-rose-600 font-bold truncate max-w-[70px] sm:max-w-[90px] leading-none mt-0.5">
                          {day.eventNote}
                        </span>
                      ) : null}
                    </div>

                    {/* 票價等級標籤 */}
                    <span
                      className={\`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap leading-none \${badgeColor}\`}
                    >
                      {day.tierLabel}
                    </span>
                  </div>

                  {/* 台幣價格 (即時日圓換算) */}
                  <div className="mt-2 text-right">
                    <div className="text-[10px] text-slate-500 font-medium">
                      {day.bookingStatus === 'upcoming' ? (
                        <span className="text-indigo-700 font-bold">預估開賣台幣</span>
                      ) : (
                        <>預估台幣 {hasPromo && <span className="text-emerald-700 font-bold">(快閃特惠)</span>}</>
                      )}
                    </div>
                    {hasPromo && (
                      <div className="text-[11px] text-slate-400 line-through tabular-nums leading-none">
                        \${baseTwd.toLocaleString()}
                      </div>
                    )}
                    <div className={\`text-base sm:text-xl font-extrabold tabular-nums tracking-tight \${priceColor}\`}>
                      \${finalTwd.toLocaleString()}
                    </div>
                  </div>

                  {/* 底部原幣與人潮指示 */}
                  <div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="tabular-nums font-bold">{day.currencySymbol}{ticketPriceVal.toLocaleString()}</span>
                    <span className="flex items-center gap-1 font-medium">
                      <span
                        className={\`w-1.5 h-1.5 rounded-full \${
                          day.crowdLevel < 40 ? 'bg-emerald-500' : day.crowdLevel <= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }\`}
                      ></span>
                      <span className="hidden sm:inline">{day.crowdStatus}</span>
                    </span>
                  </div>
                </div>
              );
            })}`;

code = code.replace(brokenCellRegex, perfectCell);
fs.writeFileSync(appPath, code, 'utf8');
console.log('Calendar cell restored perfectly!');

