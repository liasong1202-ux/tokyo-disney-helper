import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. 替換 Header 處的 Logo 與標題
const oldHeaderLogo = `<div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl" role="img" aria-label="castle">🏰</span>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                {currentPark.name}門票降價助手
              </span>
            </div>`;

const newHeaderLogo = `<div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl" role="img" aria-label="castle">🏰</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                    {selectedParkId === 'tokyo' ? '東京迪士尼門票情報' :
                     selectedParkId === 'hongkong' ? '香港迪士尼門票情報' :
                     selectedParkId === 'shanghai' ? '上海迪士尼門票情報' :
                     '加州迪士尼門票情報'}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.5 rounded-md font-bold">
                    海外樂園門票情報
                  </span>
                </div>
              </div>
            </div>`;

if (code.includes(oldHeaderLogo)) {
  code = code.replace(oldHeaderLogo, newHeaderLogo);
  console.log('Successfully updated Header Logo & Dynamic Title!');
} else {
  console.log('oldHeaderLogo not found directly, trying regex...');
  code = code.replace(
    /<div className="flex items-center gap-2 shrink-0">[\s\S]*?\{currentPark\.name\}門票降價助手[\s\S]*?<\/div>/,
    newHeaderLogo
  );
  console.log('Regex Header Logo applied!');
}

// 2. 加上動態同步 document.title 的 useEffect
const titleEffectCode = `
  // 動態同步瀏覽器分頁標題，對齊【方案1+方案4】
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const parkNames: Record<DisneyParkId, string> = {
      tokyo: '東京迪士尼門票情報',
      hongkong: '香港迪士尼門票情報',
      shanghai: '上海迪士尼門票情報',
      usa: '加州迪士尼門票情報',
    };
    const parkTitle = parkNames[selectedParkId] || '海外樂園門票情報';
    document.title = \`\${parkTitle} - 即時低價日曆・開賣提醒・人潮預報【海外樂園情報站】\`;
  }, [selectedParkId]);
`;

// 插入在 selectedParkId 定義附近
if (!code.includes('動態同步瀏覽器分頁標題')) {
  code = code.replace(
    'const currentPark = DISNEY_PARKS[selectedParkId] || DISNEY_PARKS.tokyo;',
    `const currentPark = DISNEY_PARKS[selectedParkId] || DISNEY_PARKS.tokyo;${titleEffectCode}`
  );
  console.log('Successfully injected dynamic document.title useEffect!');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('App.tsx updated successfully!');
