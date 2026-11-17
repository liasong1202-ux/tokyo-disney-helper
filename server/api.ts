import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

// 跨環境安全取得路徑 (相容 ESM、CommonJS 與 Vercel Serverless)
let resolvedDir = process.cwd();
try {
  if (typeof __dirname !== 'undefined') {
    resolvedDir = __dirname;
  } else if (typeof import.meta !== 'undefined' && import.meta?.url) {
    resolvedDir = path.dirname(fileURLToPath(import.meta.url));
  }
} catch {
  resolvedDir = process.cwd();
}

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.resolve(resolvedDir, '../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

export interface Subscriber {
  id: string;
  email: string;
  targetMonth: string; // e.g. '2026-11', '2026-12', '2027-01', 'all'
  targetPark: 'land' | 'sea' | 'both';
  alertType?: 'promo' | 'ticket_open' | 'both'; // promo=降價特惠通知, ticket_open=開放訂票開賣通知, both=兩者皆通知
  targetDate?: string; // 若指定特定未開賣日期 e.g. '2027-01-15'
  saleOpenDate?: string; // 預計開賣日 e.g. '2026-11-15'
  characterId?: string; // 'mickey' | 'minnie' | 'donald' | 'duffy' | 'pooh'
  createdAt: string;
  lastNotifiedAt?: string;
}

export interface CharacterInfo {
  id: string;
  name: string;
  shortName: string;
  title: string;
  greeting: string;
  speech: string;
  themeColor: string;
  secondaryColor: string;
  bgGradient: string;
  cardBg: string;
  buttonGradient: string;
  avatarUrl: string;
  iconEmoji: string;
}

export const CHARACTERS_MAP: Record<string, CharacterInfo> = {
  mickey: {
    id: 'mickey',
    name: '米奇 (Mickey Mouse)',
    shortName: '米奇',
    title: '歡慶隊長 · 奇妙夢想守護者',
    greeting: '🎉 恭喜可以買票嚕！',
    speech: '米奇來報喜囉！夢想成真的時刻到了，您關注的東京迪士尼門票今天正式開放預訂囉！準備好迎接最棒的魔法一天了嗎？快把票帶回家吧！',
    themeColor: '#dc2626',
    secondaryColor: '#facc15',
    bgGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    cardBg: '#fef2f2',
    buttonGradient: 'linear-gradient(90deg, #dc2626, #b91c1c)',
    avatarUrl: '/characters/mickey.png',
    iconEmoji: '👑',
  },
  minnie: {
    id: 'minnie',
    name: '米妮 (Minnie Mouse)',
    shortName: '米妮',
    title: '甜美大使 · 浪漫旅程領航員',
    greeting: '💖 恭喜可以買票嚕！',
    speech: '哈囉親愛的！米妮帶著滿滿愛心來提醒您～最期待的夢幻迪士尼之旅即將啟程，今天正式開賣囉！快牽著最重要的人一起出發吧！',
    themeColor: '#ec4899',
    secondaryColor: '#be185d',
    bgGradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    cardBg: '#fdf2f8',
    buttonGradient: 'linear-gradient(90deg, #ec4899, #db2777)',
    avatarUrl: '/characters/minnie.png',
    iconEmoji: '💖',
  },
  donald: {
    id: 'donald',
    name: '唐老鴨 (Donald Duck)',
    shortName: '唐老鴨',
    title: '衝鋒隊長 · 超熱血開賣大使',
    greeting: '⚡ 嘎嘎！恭喜可以買票嚕！',
    speech: '嘎嘎嘎！開賣啦開賣啦！唐老鴨第一秒就衝來通知你了～快點點進去預訂購票！熱門日期的門票要趕快卡位，衝啊！',
    themeColor: '#0284c7',
    secondaryColor: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    cardBg: '#f0f9ff',
    buttonGradient: 'linear-gradient(90deg, #0284c7, #0369a1)',
    avatarUrl: '/characters/donald.png',
    iconEmoji: '⚡',
  },
  duffy: {
    id: 'duffy',
    name: '達菲熊 (Duffy Bear)',
    shortName: '達菲熊',
    title: '海洋萌主 · 溫暖療癒大使',
    greeting: '🧸 暖暖問候！恭喜可以買票嚕！',
    speech: '暖暖的問候～我是達菲！今天東京迪士尼門票悄悄開賣囉。達菲跟雪莉玫已經在海洋園區準備好最溫暖的擁抱，好期待見到你喔～',
    themeColor: '#b45309',
    secondaryColor: '#0284c7',
    bgGradient: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    cardBg: '#fefce8',
    buttonGradient: 'linear-gradient(90deg, #b45309, #92400e)',
    avatarUrl: '/characters/duffy.png',
    iconEmoji: '🧸',
  },
  pooh: {
    id: 'pooh',
    name: '小熊維尼 (Winnie the Pooh)',
    shortName: '小熊維尼',
    title: '甜蜜幸運星 · 百畝森林好朋友',
    greeting: '🍯 恭喜可以買票嚕！甜滋滋～',
    speech: '嗡嗡嗡～就像在樹洞裡找到滿滿一大罐蜂蜜一樣開心！今天開賣囉，慢慢挑選你最想搭的蜜蜂罐旋轉冒險，享受甜滋滋的一天吧～',
    themeColor: '#d97706',
    secondaryColor: '#dc2626',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    cardBg: '#fefce8',
    buttonGradient: 'linear-gradient(90deg, #f59e0b, #d97706)',
    avatarUrl: '/characters/pooh.png',
    iconEmoji: '🍯',
  },
};

export interface ClickLog {
  id: string;
  platform: 'Klook' | 'KKday' | 'Official';
  dateStr: string;
  park: 'land' | 'sea';
  ticketType: 'adult' | 'junior' | 'child';
  priceTwd: number;
  source: 'web' | 'email';
  timestamp: string;
}

export interface PromoConfig {
  active: boolean;
  platform: 'Klook' | 'KKday';
  title: string;
  code: string;
  discountRate: number; // e.g. 0.85 for 85折
  fixedDiscountTwd: number; // e.g. 50
  badge: string;
  updatedAt: string;
}

export interface AffiliateConfig {
  klookUrl: string;
  kkdayUrl: string;
  officialUrl: string;
  klookDefaultCode: string;
  klookDefaultDesc: string;
  kkdayDefaultBonus: string;
  lineOfficialUrl?: string; // LINE 官方帳號加好友連結 e.g. https://line.me/R/ti/p/@your_line_id
}

export interface EmailSettings {
  resendApiKey: string;
  fromEmail: string;
  fromName: string;
  adminPassword: string;
}

export interface StoreData {
  subscribers: Subscriber[];
  clicks: ClickLog[];
  clickCounts: {
    Klook: number;
    KKday: number;
    Official: number;
  };
  affiliateConfig: AffiliateConfig;
  activePromo: PromoConfig | null;
  emailSettings: EmailSettings;
  exchangeRateCache: {
    rate: number;
    updatedAt: string;
    source: string;
  };
  emailHistory: {
    id: string;
    subject: string;
    recipientCount: number;
    sentAt: string;
    status: string;
  }[];
}

const DEFAULT_STORE: StoreData = {
  subscribers: [
    {
      id: 'demo-1',
      email: 'disney_lover_demo@example.com',
      targetMonth: '2026-11',
      targetPark: 'both',
      createdAt: new Date().toISOString(),
    }
  ],
  clicks: [],
  clickCounts: {
    Klook: 0,
    KKday: 0,
    Official: 0,
  },
  affiliateConfig: {
    klookUrl: 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/?aid=YOUR_KLOOK_AID&utm_campaign=ticket_calendar',
    kkdayUrl: 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan?cid=YOUR_KKDAY_CID&ud1=price_calendar',
    officialUrl: 'https://www.tokyodisneyresort.jp/tc/ticket/',
    klookDefaultCode: 'DISNEYTW88',
    klookDefaultDesc: '結帳輸入優惠碼現省 NT$100',
    kkdayDefaultBonus: '購票即享日本高速 eSIM 1GB 體驗組',
  },
  activePromo: null,
  emailSettings: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    fromName: '東京迪士尼降價與人潮預報助手',
    adminPassword: process.env.ADMIN_PASSWORD || 'disney888',
  },
  exchangeRateCache: {
    rate: 0.215,
    updatedAt: new Date().toISOString(),
    source: '預設匯率 (待自動同步)',
  },
  emailHistory: [],
};

// 記憶體備援快取 (防止在 Serverless 唯讀或冷啟動環境下噴錯)
let memoryStore: StoreData = structuredClone(DEFAULT_STORE);

export function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        // 在無權限建立目錄時直接返回記憶體備援
        return memoryStore;
      }
    }
    if (!fs.existsSync(DB_FILE)) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
      } catch {
        return memoryStore;
      }
      memoryStore = structuredClone(DEFAULT_STORE);
      return memoryStore;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const result: StoreData = {
      ...DEFAULT_STORE,
      ...parsed,
      affiliateConfig: { ...DEFAULT_STORE.affiliateConfig, ...(parsed.affiliateConfig || {}) },
      emailSettings: {
        ...DEFAULT_STORE.emailSettings,
        ...(parsed.emailSettings || {}),
        resendApiKey: parsed.emailSettings?.resendApiKey || process.env.RESEND_API_KEY || '',
      },
      clickCounts: { ...DEFAULT_STORE.clickCounts, ...(parsed.clickCounts || {}) },
    };
    memoryStore = result;
    return result;
  } catch (err) {
    console.warn('Failed to load store from disk, using memory store:', err);
    return memoryStore;
  }
}

export function saveStore(data: StoreData): void {
  memoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        return;
      }
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save store to disk, persisted in memory:', err);
  }
}

// 自動抓取最新日圓對台幣匯率 (JPY -> TWD)
export async function fetchLatestJpyRate(force = false): Promise<{ rate: number; updatedAt: string; source: string }> {
  const store = loadStore();
  const lastUpdated = new Date(store.exchangeRateCache.updatedAt).getTime();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  if (!force && store.exchangeRateCache.source !== '預設匯率 (待自動同步)' && lastUpdated > oneHourAgo) {
    return store.exchangeRateCache;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/JPY');
    if (res.ok) {
      const json = (await res.json()) as { rates?: { TWD?: number } };
      const twdRate = json?.rates?.TWD;
      if (typeof twdRate === 'number' && twdRate > 0.1 && twdRate < 0.5) {
        const roundedRate = Number(twdRate.toFixed(4));
        store.exchangeRateCache = {
          rate: roundedRate,
          updatedAt: new Date().toISOString(),
          source: '國際即時匯率 API (自動同步)',
        };
        saveStore(store);
        return store.exchangeRateCache;
      }
    }
  } catch {
    // 離線或沙盒環境時保留既有匯率
  }

  return store.exchangeRateCache;
}

// 透過 Resend API 發送 HTML 信件
async function sendResendEmail(params: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!params.apiKey || params.apiKey.trim() === '') {
    return { ok: false, error: '尚未設定 Resend API Key（請至站長後台填入您的 Resend API Key）' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = (await response.json()) as { id?: string; message?: string; name?: string };
    if (!response.ok) {
      return { ok: false, error: data.message || `Resend 錯誤 (${response.status})` };
    }
    return { ok: true, id: data.id };
  } catch (err: any) {
    return { ok: false, error: err?.message || '發信網路連線失敗' };
  }
}

// 產生精美的降價促銷 Email HTML 模板 (內嵌聯盟行銷按鈕)
function buildPromoEmailHtml(store: StoreData, promo: PromoConfig, customMessage?: string): string {
  const rate = store.exchangeRateCache.rate || 0.215;
  const baseLowestTwd = Math.round(8900 * rate);
  const promoLowestTwd = Math.max(1200, Math.round(baseLowestTwd * promo.discountRate) - promo.fixedDiscountTwd);
  const savedTwd = baseLowestTwd - promoLowestTwd;

  const targetUrl =
    promo.platform === 'Klook' ? store.affiliateConfig.klookUrl : store.affiliateConfig.kkdayUrl;

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>${promo.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans TC',sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);border:2px solid #10b981;">
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:28px 24px;text-align:center;color:#ffffff;">
      <div style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:900;font-size:12px;padding:4px 12px;border-radius:999px;margin-bottom:10px;">
        ⚡ 東京迪士尼突發降價快報
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:900;line-height:1.4;">
        🏰 ${promo.title}
      </h1>
      <p style="margin:8px 0 0;font-size:14px;color:#e0e7ff;">
        您訂閱的東京迪士尼門票監控系統偵測到最新平台限時特惠！
      </p>
    </div>

    <div style="padding:28px 24px;">
      ${
        customMessage
          ? `<div style="background:#f8fafc;border-left:4px solid #6366f1;padding:12px 16px;margin-bottom:20px;color:#334155;font-size:14px;line-height:1.6;">${customMessage}</div>`
          : ''
      }

      <div style="background:#ecfdf5;border:2px dashed #10b981;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:13px;color:#047857;font-weight:700;">淡季平日最低入手價 (成人一日パスポート)</div>
        <div style="margin:8px 0;">
          <span style="font-size:16px;color:#94a3b8;text-decoration:line-through;margin-right:8px;">原價 NT$ ${baseLowestTwd.toLocaleString()}</span>
          <span style="font-size:32px;font-weight:900;color:#065f46;">NT$ ${promoLowestTwd.toLocaleString()}</span>
        </div>
        <div style="font-size:13px;color:#059669;font-weight:700;">
          🔥 每張現省 NT$ ${savedTwd.toLocaleString()}！雙人出遊立省 NT$ ${(savedTwd * 2).toLocaleString()}
        </div>
        <div style="margin-top:14px;background:#ffffff;display:inline-block;padding:8px 18px;border-radius:10px;border:1px solid #a7f3d0;">
          <span style="font-size:12px;color:#64748b;">結帳專屬折扣碼：</span>
          <strong style="font-size:16px;color:#ea580c;font-family:monospace;letter-spacing:1px;">${promo.code}</strong>
        </div>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${targetUrl}" target="_blank" style="display:inline-block;background:linear-gradient(90deg,#f97316,#ea580c);color:#ffffff;font-weight:900;font-size:16px;text-decoration:none;padding:16px 32px;border-radius:14px;box-shadow:0 6px 15px rgba(234,88,12,0.3);">
          🛒 立即前往 ${promo.platform} 搶訂特惠門票 →
        </a>
      </div>

      <div style="border-top:1px solid #e2e8f0;padding-top:18px;margin-top:24px;display:flex;justify-content:space-between;font-size:13px;color:#64748b;">
        <div>
          💡 其他比價通道：
          <a href="${store.affiliateConfig.klookUrl}" style="color:#ea580c;font-weight:700;text-decoration: underline;margin-right:10px;">Klook 客路特惠</a>
          <a href="${store.affiliateConfig.kkdayUrl}" style="color:#0284c7;font-weight:700;text-decoration: underline;">KKday 送網卡方案</a>
        </div>
      </div>
    </div>

    <div style="background:#f8fafc;padding:16px 24px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
      東京迪士尼門票降價與人潮預報助手 · 實時台幣低價日曆
    </div>
  </div>
</body>
</html>`;
}

// 讀取角色高畫質 PNG (優先) 或向量 SVG 並轉為 Data URI，確保在 Email 與預覽視窗均能 100% 呈現真實角色立繪
function getCharacterAvatarBase64(charId: string): string {
  try {
    const pngPath = path.resolve(__dirname, '../public/characters', `${charId}.png`);
    if (fs.existsSync(pngPath)) {
      const buffer = fs.readFileSync(pngPath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    const svgPath = path.resolve(__dirname, '../public/characters', `${charId}.svg`);
    if (fs.existsSync(svgPath)) {
      const content = fs.readFileSync(svgPath, 'utf-8');
      const base64 = Buffer.from(content).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    }
  } catch (err) {
    console.error('Failed to load character image:', err);
  }
  return `/characters/${charId}.png`;
}

// 產生歡迎訂閱確認信 HTML (支援降價特惠通知 + 尚未開賣日期的「開放訂票提醒」)
function buildWelcomeEmailHtml(store: StoreData, subscriber: Subscriber): string {
  const rate = store.exchangeRateCache.rate || 0.215;
  const lowestTwd = Math.round(8900 * rate);
  const isTicketOpenAlert = subscriber.alertType === 'ticket_open' || Boolean(subscriber.targetDate);
  const charId = subscriber.characterId || 'mickey';
  const char = CHARACTERS_MAP[charId] || CHARACTERS_MAP.mickey;
  const avatarSrc = getCharacterAvatarBase64(char.id);

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans TC',sans-serif;">
  <div style="max-width:580px;margin:24px auto;background:#ffffff;border-radius:20px;overflow:hidden;border:2px solid #6366f1;">
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:24px;text-align:center;color:#ffffff;">
      <div style="font-size:36px;">${isTicketOpenAlert ? '🎟️' : '🏰'}</div>
      <h2 style="margin:8px 0 0;font-size:22px;font-weight:900;">
        ${isTicketOpenAlert ? '東京迪士尼「開放訂票＆降價提醒」設定成功！' : '東京迪士尼降價通知訂閱成功！'}
      </h2>
    </div>
    <div style="padding:24px;color:#334155;font-size:14px;line-height:1.7;">
      <p>您好！我們已成功將 <strong>${subscriber.email}</strong> 加入東京迪士尼門票監控名單。</p>
      
      <!-- 專屬守護角色資訊 (真圖呈現) -->
      <div style="background:#f8fafc;border:2px solid ${char.themeColor};border-radius:16px;padding:14px;margin:16px 0;display:flex;align-items:center;">
        <div style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid ${char.themeColor};box-shadow:0 3px 8px rgba(0,0,0,0.12);background:#ffffff;margin-right:14px;flex-shrink:0;">
          <img src="${avatarSrc}" alt="${char.name}" style="width:100%;height:100%;display:block;object-fit:cover;" />
        </div>
        <div>
          <div style="font-size:12px;color:#64748b;">您的專屬開賣守護角色</div>
          <div style="font-size:16px;font-weight:900;color:${char.themeColor};">${char.name}（${char.title}）</div>
          <div style="font-size:13px;color:#334155;margin-top:2px;">「開賣當天，我會第一秒帶著圖文祝賀信來通知您預約訂票喔！」</div>
        </div>
      </div>

      ${
        subscriber.targetDate
          ? `<div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:14px;padding:16px;margin:16px 0;color:#78350f;">
              <div style="font-weight:900;font-size:15px;">⏰ 您預約監控的入園日期：${subscriber.targetDate}</div>
              <div style="margin-top:4px;font-size:13px;">
                東京迪士尼門票於<strong>入園前 2 個月（預計 ${subscriber.saleOpenDate || '開賣日'} 台灣時間 13:00）</strong>開放預訂！<br/>
                一旦該日期正式開放訂票或釋出早鳥折扣碼，${char.shortName} 將第一時間寄送圖文祝賀信通知您預約訂票！
              </div>
            </div>`
          : `<p>只要您關注的月份<strong>開放訂票</strong>，或 <strong>Klook / KKday</strong> 釋出限量快閃折扣碼，系統會在第一時間寄信通知您！</p>`
      }
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:18px 0;">
        <div>📌 <strong>目前淡季最低票價：</strong>約 NT$ ${lowestTwd.toLocaleString()} (¥8,900)</div>
        <div>🎁 <strong>Klook 常駐優惠碼：</strong><code style="color:#ea580c;font-weight:bold;">${store.affiliateConfig.klookDefaultCode}</code> (${store.affiliateConfig.klookDefaultDesc})</div>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${store.affiliateConfig.klookUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;margin:4px;">前往 Klook 查看目前可訂票日</a>
        <a href="${store.affiliateConfig.kkdayUrl}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;margin:4px;">前往 KKday 查看送eSIM方案</a>
      </div>
    </div>
  </div>
 </body>
</html>`;
}

// 產生「指定入園日期正式開放訂票！」圖文通知信 HTML (含 5 位迪士尼角色專屬問候與聯盟行銷訂票按鈕)
export function buildTicketOpenEmailHtml(
  store: StoreData,
  targetDate: string,
  parkLabel: string,
  customNote?: string,
  characterId?: string
): string {
  const rate = store.exchangeRateCache.rate || 0.215;
  const estTwd = Math.round(9400 * rate);
  const char = CHARACTERS_MAP[characterId || 'mickey'] || CHARACTERS_MAP.mickey;
  const avatarSrc = getCharacterAvatarBase64(char.id);

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>${char.shortName}祝賀：東京迪士尼【${targetDate}】門票今天開賣囉！</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans TC',sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:24px;overflow:hidden;border:3px solid ${char.themeColor};box-shadow:0 12px 30px rgba(0,0,0,0.1);">
    
    <!-- 頂部：迪士尼角色專屬祝賀 Header (含角色頭像大圖) -->
    <div style="background:${char.bgGradient};padding:32px 24px;text-align:center;color:#ffffff;position:relative;">
      <!-- 角色大頭貼圖案 -->
      <div style="width:84px;height:84px;border-radius:50%;overflow:hidden;border:4px solid #ffffff;box-shadow:0 6px 16px rgba(0,0,0,0.3);margin:0 auto 12px;background:#ffffff;">
        <img src="${avatarSrc}" alt="${char.name}" style="width:100%;height:100%;display:block;object-fit:cover;" />
      </div>

      <div style="display:inline-block;background:#ffffff;color:${char.themeColor};font-weight:900;font-size:13px;padding:5px 16px;border-radius:999px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        🏰 ${char.name} · 開賣第一秒圖文快訊
      </div>
      
      <!-- 角色名與祝賀詞 -->
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:900;line-height:1.35;text-shadow:0 2px 4px rgba(0,0,0,0.2);">
        ${char.greeting}
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#fef08a;font-weight:700;">
        🎉 您預約的【${targetDate}】東京迪士尼門票正式開賣囉！
      </p>
    </div>

    <!-- 角色圖文對話卡片 (依所選角色專屬配色呈現) -->
    <div style="background:${char.cardBg};border-bottom:2px dashed ${char.themeColor};padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:84px;vertical-align:top;text-align:center;">
            <div style="width:76px;height:76px;border-radius:18px;overflow:hidden;border:3px solid ${char.themeColor};box-shadow:0 4px 12px rgba(0,0,0,0.15);background:#ffffff;margin:0 auto;display:flex;align-items:center;justify-content:center;">
              <img src="${avatarSrc}" alt="${char.name}" style="width:100%;height:100%;display:block;object-fit:contain;" />
            </div>
            <div style="font-size:13px;font-weight:900;color:${char.themeColor};margin-top:6px;">${char.shortName}</div>
          </td>
          <td style="vertical-align:top;padding-left:16px;">
            <div style="background:#ffffff;border:2px solid ${char.themeColor};border-radius:16px;padding:14px 16px;position:relative;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
              <div style="font-size:12px;color:${char.themeColor};font-weight:800;margin-bottom:4px;">【${char.title}】開賣廣播：</div>
              <div style="font-size:14px;color:#1e293b;line-height:1.6;font-weight:600;">
                「${char.speech}」
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:28px 24px;color:#334155;font-size:14px;line-height:1.7;">
      ${
        customNote
          ? `<div style="background:#f8fafc;border-left:4px solid ${char.themeColor};padding:12px 16px;margin-bottom:20px;color:#334155;font-size:13px;line-height:1.6;">${customNote}</div>`
          : ''
      }
      
      <!-- 門票資訊與預估價格卡片 -->
      <div style="background:${char.cardBg};border:2px dashed ${char.themeColor};border-radius:16px;padding:18px;margin-bottom:24px;">
        <div style="font-size:15px;">📅 <strong>開放預訂入園日：</strong><span style="color:#0f172a;font-weight:900;font-size:17px;">${targetDate}</span> (${parkLabel})</div>
        <div style="margin-top:8px;">💰 <strong>今日匯率換算預估價：</strong>約 <strong style="color:${char.themeColor};font-size:20px;">NT$ ${estTwd.toLocaleString()}</strong> 起</div>
        <div style="margin-top:8px;">🎁 <strong>Klook 結帳專屬折扣碼：</strong><code style="background:#ffffff;color:${char.themeColor};border:1px solid ${char.themeColor};font-weight:900;padding:3px 10px;border-radius:6px;font-size:14px;">${store.affiliateConfig.klookDefaultCode}</code> (${store.affiliateConfig.klookDefaultDesc})</div>
        <div style="margin-top:6px;font-size:12px;color:#64748b;">⚡ 提醒：東京迪士尼門票採入園前 60 天每日台灣時間 13:00 開賣，熱門週末門票極易額滿！</div>
      </div>

      <!-- 聯盟行銷訂票按鈕 (大按鈕，高轉化率，角色專屬主題色) -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${store.affiliateConfig.klookUrl}" target="_blank" style="display:inline-block;background:${char.buttonGradient};color:#ffffff;font-weight:900;font-size:16px;text-decoration:none;padding:16px 32px;border-radius:14px;margin:6px;box-shadow:0 6px 16px rgba(0,0,0,0.25);">
          🏰 由${char.shortName}帶路：立即前往 Klook 預訂 ${targetDate} 門票 →
        </a>
        <br/>
        <a href="${store.affiliateConfig.kkdayUrl}" target="_blank" style="display:inline-block;background:#0284c7;color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:12px;margin:6px;box-shadow:0 4px 12px rgba(2,132,199,0.3);">
          🔵 前往 KKday 預訂 (${store.affiliateConfig.kkdayDefaultBonus}) →
        </a>
        <br/>
        <a href="${store.affiliateConfig.officialUrl}" target="_blank" style="display:inline-block;color:#64748b;font-weight:600;font-size:12px;text-decoration:underline;margin-top:8px;">
          亦可至東京迪士尼官網預訂 (日圓結帳需 1.5% 海外手續費)
        </a>
      </div>

      <div style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:20px;font-size:12px;color:#94a3b8;text-align:center;">
        東京迪士尼門票降價與人潮預報助手 · 由 ${char.name} 為您傳送開賣通知
      </div>
    </div>
  </div>
</body>
</html>`;
}

// 解析 Request JSON Body (支援 Node 原生串流、Express 與 Vercel Serverless pre-parsed body)
async function readJsonBody(req: IncomingMessage): Promise<any> {
  const reqAny = req as any;
  if (reqAny.body !== undefined && reqAny.body !== null) {
    if (typeof reqAny.body === 'object') {
      return reqAny.body;
    }
    if (typeof reqAny.body === 'string' && reqAny.body.trim()) {
      try {
        return JSON.parse(reqAny.body);
      } catch {
        return {};
      }
    }
  }

  return new Promise((resolve) => {
    let body = '';
    // 防呆超時：若在 Serverless 環境中 stream 已被消費，1.5 秒內強制結束防卡死
    const timer = setTimeout(() => {
      if (body) {
        try { resolve(JSON.parse(body)); } catch { resolve({}); }
      } else {
        resolve({});
      }
    }, 1500);

    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      clearTimeout(timer);
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

function sendJson(res: ServerResponse, status: number, payload: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const reqUrl = req.url || '/';
  const urlObj = new URL(reqUrl, 'http://localhost');
  let pathname = urlObj.pathname;

  // 跨環境解析：當 Vercel rewrite 轉發至 /api 時，提取實際 API 路由
  const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-now-route-matches'] as string) || '';
  if (pathname === '/api' || pathname === '/api/') {
    const queryPath = urlObj.searchParams.get('path') || (req as any).query?.path;
    if (queryPath) {
      pathname = queryPath.startsWith('/') ? `/api${queryPath}` : `/api/${queryPath}`;
    } else if (matchedPath && matchedPath.startsWith('/api/')) {
      pathname = matchedPath;
    }
  }

  // 移除尾部斜線
  if (pathname.length > 5 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  if (!pathname.startsWith('/api/')) {
    return false;
  }

  // 1. 取得前端公開狀態 (聯盟行銷連結、目前生效中的促銷、最新匯率、總訂閱人數)
  if (pathname === '/api/public-state' && req.method === 'GET') {
    const rateInfo = await fetchLatestJpyRate(false);
    const store = loadStore();
    sendJson(res, 200, {
      affiliateConfig: store.affiliateConfig,
      activePromo: store.activePromo,
      exchangeRate: rateInfo,
      subscriberCount: 12480 + store.subscribers.length,
      realSubscriberCount: store.subscribers.length,
    });
    return true;
  }

  // 2. 強制刷新即時匯率
  if (pathname === '/api/exchange-rate/refresh' && req.method === 'POST') {
    const rateInfo = await fetchLatestJpyRate(true);
    sendJson(res, 200, { ok: true, exchangeRate: rateInfo });
    return true;
  }

  // 3. 訪客送出 Email 訂閱 (支援「降價特惠通知」與「尚未開賣日期的開放訂票通知」)
  if (pathname === '/api/subscribe' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const targetMonth = String(body.targetMonth || 'all');
      const targetPark = (body.targetPark || 'both') as 'land' | 'sea' | 'both';
      const alertType = (body.alertType || 'both') as 'promo' | 'ticket_open' | 'both';
      const targetDate = body.targetDate ? String(body.targetDate) : undefined;
      const saleOpenDate = body.saleOpenDate ? String(body.saleOpenDate) : undefined;
      const characterId = body.characterId ? String(body.characterId) : 'mickey';

      if (!email || !email.includes('@')) {
        sendJson(res, 400, { ok: false, error: '請輸入有效的 Email 信箱' });
        return true;
      }

      const store = loadStore();
      let subscriber = store.subscribers.find(
        (s) => s.email === email && (s.targetDate || '') === (targetDate || '')
      );
      const isNew = !subscriber;

      if (!subscriber) {
        subscriber = {
          id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          email,
          targetMonth,
          targetPark,
          alertType,
          targetDate,
          saleOpenDate,
          characterId,
          createdAt: new Date().toISOString(),
        };
        store.subscribers.unshift(subscriber);
        saveStore(store);
      } else {
        subscriber.targetMonth = targetMonth;
        subscriber.targetPark = targetPark;
        subscriber.alertType = alertType;
        subscriber.targetDate = targetDate;
        subscriber.saleOpenDate = saleOpenDate;
        subscriber.characterId = characterId;
        saveStore(store);
      }

      // 若有設定 Resend API Key，自動寄送歡迎確認信
      let welcomeEmailSent = false;
      if (store.emailSettings.resendApiKey) {
        const fromHeader = `${store.emailSettings.fromName} <${store.emailSettings.fromEmail}>`;
        const subject = targetDate
          ? `🎟️ 開賣提醒設定成功！東京迪士尼【${targetDate}】開放訂票將立即通知您`
          : '🏰 訂閱成功！東京迪士尼門票降價與開放訂票通知';
        const emailResult = await sendResendEmail({
          apiKey: store.emailSettings.resendApiKey,
          from: fromHeader,
          to: [email],
          subject,
          html: buildWelcomeEmailHtml(store, subscriber),
        });
        welcomeEmailSent = emailResult.ok;
      }

      sendJson(res, 200, {
        ok: true,
        isNew,
        welcomeEmailSent,
        subscriberCount: 12480 + store.subscribers.length,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message || '訂閱處理失敗' });
      return true;
    }
  }

  // 4. 記錄聯盟行銷按鈕點擊 (並回傳目標跳轉網址)
  if (pathname === '/api/click' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const platform = (body.platform || 'Klook') as 'Klook' | 'KKday' | 'Official';
      const dateStr = String(body.dateStr || '2026-11-10');
      const park = (body.park || 'land') as 'land' | 'sea';
      const ticketType = (body.ticketType || 'adult') as 'adult' | 'junior' | 'child';
      const priceTwd = Number(body.priceTwd || 0);

      const store = loadStore();
      store.clickCounts[platform] = (store.clickCounts[platform] || 0) + 1;
      store.clicks.unshift({
        id: `clk-${Date.now()}`,
        platform,
        dateStr,
        park,
        ticketType,
        priceTwd,
        source: 'web',
        timestamp: new Date().toISOString(),
      });
      // 保留最近 500 筆詳細點擊紀錄
      if (store.clicks.length > 500) {
        store.clicks = store.clicks.slice(0, 500);
      }
      saveStore(store);

      const targetUrl =
        platform === 'Klook'
          ? store.affiliateConfig.klookUrl
          : platform === 'KKday'
          ? store.affiliateConfig.kkdayUrl
          : store.affiliateConfig.officialUrl;

      sendJson(res, 200, { ok: true, targetUrl, clickCounts: store.clickCounts });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 站長身份驗證小幫手 (檢查請求中的密碼金鑰)
  function isAuthorizedAdmin(req: IncomingMessage, currentStore: StoreData): boolean {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const customHeader = (req.headers['x-admin-password'] as string) || '';
    const expectedPassword = currentStore.emailSettings.adminPassword || 'disney888';
    return (token && token === expectedPassword) || (customHeader && customHeader === expectedPassword);
  }

  // 4.1 站長身分登入驗證
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const store = loadStore();
      const expectedPassword = store.emailSettings.adminPassword || 'disney888';
      const inputPass = String(body.password || '').trim();

      if (inputPass && inputPass === expectedPassword) {
        sendJson(res, 200, { ok: true, token: expectedPassword, message: '站長身份驗證成功！' });
      } else {
        sendJson(res, 401, { ok: false, error: '密碼錯誤！請輸入正確的站長管理密碼。' });
      }
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 4.2 站長修改後台管理密碼
  if (pathname === '/api/admin/change-password' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const store = loadStore();
      const expectedPassword = store.emailSettings.adminPassword || 'disney888';
      const oldPass = String(body.oldPassword || '').trim();
      const newPass = String(body.newPassword || '').trim();

      if (!isAuthorizedAdmin(req, store) && oldPass !== expectedPassword) {
        sendJson(res, 401, { ok: false, error: '原密碼驗證失敗！無法修改密碼。' });
        return true;
      }

      if (!newPass || newPass.length < 4) {
        sendJson(res, 400, { ok: false, error: '新密碼長度不得少於 4 個字元！' });
        return true;
      }

      store.emailSettings.adminPassword = newPass;
      saveStore(store);
      sendJson(res, 200, { ok: true, message: '站長密碼修改成功！新密碼已立即生效。', token: newPass });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 5. 站長後台：讀取完整後台統計與設定
  if (pathname === '/api/admin/dashboard' && req.method === 'GET') {
    const store = loadStore();
    if (!isAuthorizedAdmin(req, store)) {
      sendJson(res, 401, { ok: false, error: '未授權訪問！請先輸入站長密碼登入。' });
      return true;
    }
    sendJson(res, 200, {
      ok: true,
      subscribers: store.subscribers,
      clickCounts: store.clickCounts,
      recentClicks: store.clicks.slice(0, 50),
      affiliateConfig: store.affiliateConfig,
      activePromo: store.activePromo,
      emailSettings: {
        hasResendKey: Boolean(store.emailSettings.resendApiKey && store.emailSettings.resendApiKey.trim().length > 0),
        maskedResendKey: store.emailSettings.resendApiKey
          ? `${store.emailSettings.resendApiKey.slice(0, 6)}...${store.emailSettings.resendApiKey.slice(-4)}`
          : '',
        resendApiKey: store.emailSettings.resendApiKey,
        fromEmail: store.emailSettings.fromEmail,
        fromName: store.emailSettings.fromName,
      },
      exchangeRateCache: store.exchangeRateCache,
      emailHistory: store.emailHistory,
    });
    return true;
  }

  // 6. 站長後台：儲存聯盟行銷連結與常駐折扣碼設定
  if (pathname === '/api/admin/affiliate' && req.method === 'POST') {
    try {
      const store = loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const body = await readJsonBody(req);
      store.affiliateConfig = {
        klookUrl: String(body.klookUrl ?? store.affiliateConfig.klookUrl).trim(),
        kkdayUrl: String(body.kkdayUrl ?? store.affiliateConfig.kkdayUrl).trim(),
        officialUrl: String(body.officialUrl ?? store.affiliateConfig.officialUrl).trim(),
        klookDefaultCode: String(body.klookDefaultCode ?? store.affiliateConfig.klookDefaultCode).trim(),
        klookDefaultDesc: String(body.klookDefaultDesc ?? store.affiliateConfig.klookDefaultDesc).trim(),
        kkdayDefaultBonus: String(body.kkdayDefaultBonus ?? store.affiliateConfig.kkdayDefaultBonus).trim(),
        lineOfficialUrl: String(body.lineOfficialUrl ?? store.affiliateConfig.lineOfficialUrl ?? '').trim(),
      };
      saveStore(store);
      sendJson(res, 200, { ok: true, affiliateConfig: store.affiliateConfig });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 7. 站長後台：儲存 Resend API Key 與寄件人設定
  if (pathname === '/api/admin/email-settings' && req.method === 'POST') {
    try {
      const store = loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const body = await readJsonBody(req);
      if (typeof body.resendApiKey === 'string') {
        store.emailSettings.resendApiKey = body.resendApiKey.trim();
      }
      if (typeof body.fromEmail === 'string' && body.fromEmail.trim()) {
        store.emailSettings.fromEmail = body.fromEmail.trim();
      }
      if (typeof body.fromName === 'string' && body.fromName.trim()) {
        store.emailSettings.fromName = body.fromName.trim();
      }
      saveStore(store);
      sendJson(res, 200, { ok: true });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 8. 站長後台：發布/關閉全站促銷特惠，並可選擇是否同時透過 Resend 群發通知信
  if (pathname === '/api/admin/promo' && req.method === 'POST') {
    try {
      const store = loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const body = await readJsonBody(req);

      if (!body.active) {
        store.activePromo = null;
        saveStore(store);
        sendJson(res, 200, { ok: true, activePromo: null });
        return true;
      }

      const newPromo: PromoConfig = {
        active: true,
        platform: body.platform === 'KKday' ? 'KKday' : 'Klook',
        title: String(body.title || 'Klook 突發降價！日本迪士尼限定快閃 85 折'),
        code: String(body.code || 'FLASH85DISNEY'),
        discountRate: Number(body.discountRate || 0.85),
        fixedDiscountTwd: Number(body.fixedDiscountTwd || 50),
        badge: String(body.badge || `${body.platform || 'Klook'} 限時特惠生效中`),
        updatedAt: new Date().toISOString(),
      };

      store.activePromo = newPromo;
      saveStore(store);

      // 若勾選「同時發送 Email 通知所有訂閱者」
      let emailBroadcastResult: { attempted: boolean; sentCount: number; error?: string } = {
        attempted: false,
        sentCount: 0,
      };

      if (body.sendEmailBroadcast) {
        emailBroadcastResult.attempted = true;
        const recipients = store.subscribers.map((s) => s.email).filter((e) => !e.endsWith('@example.com'));

        if (recipients.length === 0) {
          emailBroadcastResult.error = '目前尚無真實訂閱者信箱（請先在前台輸入您的真實信箱訂閱測試！）';
        } else if (!store.emailSettings.resendApiKey) {
          emailBroadcastResult.error = '尚未填入 Resend API Key，全站促銷已生效，但信件尚未寄出。';
        } else {
          const fromHeader = `${store.emailSettings.fromName} <${store.emailSettings.fromEmail}>`;
          const subject = `⚡ 降價通知：${newPromo.title} (優惠碼 ${newPromo.code})`;
          const html = buildPromoEmailHtml(store, newPromo, body.customEmailMessage);

          // 逐一或批次寄送給所有訂閱者
          let successCount = 0;
          let lastError = '';
          for (const recipientEmail of recipients) {
            const resMail = await sendResendEmail({
              apiKey: store.emailSettings.resendApiKey,
              from: fromHeader,
              to: [recipientEmail],
              subject,
              html,
            });
            if (resMail.ok) {
              successCount++;
            } else {
              lastError = resMail.error || '發送失敗';
            }
          }

          emailBroadcastResult.sentCount = successCount;
          if (lastError && successCount === 0) {
            emailBroadcastResult.error = lastError;
          }

          store.emailHistory.unshift({
            id: `mail-${Date.now()}`,
            subject,
            recipientCount: successCount,
            sentAt: new Date().toISOString(),
            status: successCount > 0 ? `成功寄出 ${successCount} 封` : `失敗: ${lastError}`,
          });
          saveStore(store);
        }
      }

      sendJson(res, 200, {
        ok: true,
        activePromo: store.activePromo,
        emailBroadcastResult,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 9. 站長後台：刪除單一訂閱者
  if (pathname === '/api/admin/subscribers/delete' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const store = loadStore();
    store.subscribers = store.subscribers.filter((s) => s.id !== body.id);
    saveStore(store);
    sendJson(res, 200, { ok: true, subscribers: store.subscribers });
    return true;
  }

  // 10. 站長後台：一鍵寄送「指定日期開放訂票通知信」給預約開賣提醒的訂閱者
  if (pathname === '/api/admin/send-open-alert' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const store = loadStore();

      if (!store.emailSettings.resendApiKey) {
        sendJson(res, 400, {
          ok: false,
          error: '尚未設定 Resend API Key！請先切到「🔑 Resend 寄信設定」分頁填入 API Key。',
        });
        return true;
      }

      // 可以指定單一 subscriberId，或發送給所有預約開賣通知的訂閱者
      const targetSubId = body.subscriberId ? String(body.subscriberId) : null;
      const targets = targetSubId
        ? store.subscribers.filter((s) => s.id === targetSubId)
        : store.subscribers.filter(
            (s) => (s.alertType === 'ticket_open' || Boolean(s.targetDate)) && !s.email.endsWith('@example.com')
          );

      if (targets.length === 0) {
        sendJson(res, 400, {
          ok: false,
          error: '目前沒有符合條件的「預約開賣提醒」真實信箱（請先在前台點選 1/4 以後的未開賣日期輸入信箱測試！）',
        });
        return true;
      }

      const fromHeader = `${store.emailSettings.fromName} <${store.emailSettings.fromEmail}>`;
      let sentCount = 0;
      let lastError = '';

      for (const sub of targets) {
        const dateLabel = sub.targetDate || sub.targetMonth || '近期熱門日';
        const parkLabel =
          sub.targetPark === 'land' ? '🏰 迪士尼陸地' : sub.targetPark === 'sea' ? '🌋 迪士尼海洋' : '🏰+🌋 陸地/海洋';
        const activeCharId = body.characterId || sub.characterId || 'mickey';
        const char = CHARACTERS_MAP[activeCharId] || CHARACTERS_MAP.mickey;
        const subject = `🎟️ ${char.shortName}祝賀開賣：您預約的【${dateLabel}】東京迪士尼門票今天開放預訂囉！`;
        const html = buildTicketOpenEmailHtml(
          store,
          dateLabel,
          parkLabel,
          body.customNote || '東京迪士尼門票每日名額有限，現在點下方按鈕透過 Klook / KKday 預訂還可直接套用站長專屬折扣碼！',
          activeCharId
        );

        const resMail = await sendResendEmail({
          apiKey: store.emailSettings.resendApiKey,
          from: fromHeader,
          to: [sub.email],
          subject,
          html,
        });

        if (resMail.ok) {
          sentCount++;
          sub.lastNotifiedAt = new Date().toISOString();
        } else {
          lastError = resMail.error || '發送失敗';
        }
      }

      store.emailHistory.unshift({
        id: `open-mail-${Date.now()}`,
        subject: `🎟️ 門票開賣通知 (${targets[0]?.targetDate || '批次通知'})`,
        recipientCount: sentCount,
        sentAt: new Date().toISOString(),
        status: sentCount > 0 ? `成功寄出 ${sentCount} 封` : `失敗: ${lastError}`,
      });
      saveStore(store);

      if (sentCount === 0 && lastError) {
        sendJson(res, 400, { ok: false, error: lastError });
        return true;
      }

      sendJson(res, 200, { ok: true, sentCount });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 11. 站長後台：預覽 5 大迪士尼角色的開賣通知 Email HTML
  if (pathname === '/api/admin/preview-open-email' && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const store = loadStore();
      const body = req.method === 'POST' ? await readJsonBody(req) : {};
      const targetDate = body.targetDate || urlObj.searchParams.get('date') || '2027-01-15';
      const parkLabel = body.parkLabel || '🏰 迪士尼陸地';
      const characterId = body.characterId || urlObj.searchParams.get('char') || 'mickey';
      const customNote = body.customNote || undefined;

      const html = buildTicketOpenEmailHtml(store, targetDate, parkLabel, customNote, characterId);
      
      if (urlObj.searchParams.get('raw') === '1') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
        return true;
      }

      sendJson(res, 200, { ok: true, html, characterId });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  sendJson(res, 404, { ok: false, error: '找不到此 API 路徑' });
  return true;
}
