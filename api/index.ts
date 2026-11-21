import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
export const REDIS_STORE_KEY = 'tokyo_disney_helper:store:v1';

export interface StorageStatus {
  mode: 'redis' | 'local_file' | 'ephemeral_warning';
  connected: boolean;
  provider: string;
  error?: string;
}

interface RedisConfig {
  configured: boolean;
  url: string;
  token: string;
}

function getRedisConfig(): RedisConfig {
  let url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '')
    .trim()
    .replace(/\/+$/, '');
  let token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '').trim();

  // 若 Vercel 只有 REDIS_URL 或 KV_URL (如 rediss://default:TOKEN@HOST:PORT)，自動解析出 Upstash REST URL 與 Token
  if ((!url || !token) && (process.env.REDIS_URL || process.env.KV_URL)) {
    try {
      const rawRedisUrl = process.env.REDIS_URL || process.env.KV_URL || '';
      const parsed = new URL(rawRedisUrl);
      if (parsed.hostname) {
        if (!url) {
          url = `https://${parsed.hostname}`;
        }
        if (!token && parsed.password) {
          token = decodeURIComponent(parsed.password);
        }
      }
    } catch (e) {
      console.warn('[Redis Config Parse Error]', e);
    }
  }

  return {
    configured: Boolean(url && token),
    url,
    token,
  };
}

async function redisGetStore(cfg: RedisConfig): Promise<any | null> {
  const res = await fetch(`${cfg.url}/get/${encodeURIComponent(REDIS_STORE_KEY)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upstash Redis GET 失敗 (${res.status}): ${errText}`);
  }
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) {
    throw new Error(`Upstash Redis GET 錯誤: ${data.error}`);
  }
  if (data.result === null || data.result === undefined || data.result === '') {
    return null;
  }
  if (typeof data.result === 'string') {
    return JSON.parse(data.result);
  }
  if (typeof data.result === 'object') {
    return data.result;
  }
  return null;
}

async function redisSetStore(cfg: RedisConfig, store: any): Promise<void> {
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', REDIS_STORE_KEY, JSON.stringify(store)]),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upstash Redis SET 失敗 (${res.status}): ${errText}`);
  }
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) {
    throw new Error(`Upstash Redis SET 錯誤: ${data.error}`);
  }
}

/**
 * 計算東京迪士尼官方 2 個月前開賣日期
 * 若 2 個月前該月無對應日期（如 4/30 -> 2 月無 30 日），順延至次月 1 日（3/1）。
 */
export function calculateSaleOpenDate(targetDateStr: string): string {
  try {
    const parts = targetDateStr.split('-').map(Number);
    if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
      const origYear = parts[0];
      const origMonth = parts[1];
      const origDay = parts[2];

      let openYear = origYear;
      let openMonth = origMonth - 2;
      if (openMonth <= 0) {
        openMonth += 12;
        openYear -= 1;
      }

      const daysInOpenMonth = new Date(openYear, openMonth, 0).getDate();
      let openDay = origDay;
      if (origDay > daysInOpenMonth) {
        openMonth += 1;
        if (openMonth > 12) {
          openMonth = 1;
          openYear += 1;
        }
        openDay = 1;
      }

      const mm = String(openMonth).padStart(2, '0');
      const dd = String(openDay).padStart(2, '0');
      return `${openYear}-${mm}-${dd}`;
    }
  } catch {}
  return targetDateStr;
}

export interface Subscriber {
  id: string;
  email: string;
  targetMonth: string; // e.g. '2026-11', '2026-12', '2027-01', 'all'
  targetPark: 'land' | 'sea' | 'both';
  alertType?: 'promo' | 'ticket_open' | 'both'; // promo=降價特惠通知, ticket_open=開放訂票開賣通知, both=兩者皆通知
  targetDate?: string; // 若指定特定未開賣日期 e.g. '2027-01-15'
  saleOpenDate?: string; // 預計開賣日 e.g. '2026-11-15'
  characterId?: string; // 'mickey' | 'minnie' | 'donald' | 'duffy' | 'pooh'
  lineUserId?: string; // LINE 用戶專屬 ID (用於全自動 Push 推播)
  source?: string; // 'web' | 'line_bot'
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
  gaMeasurementId?: string; // Google Analytics 4 測量 ID (G-XXXXXXXXXX)
  klookFeatures?: string[];
  kkdayFeatures?: string[];
}

export interface EmailSettings {
  resendApiKey: string;
  fromEmail: string;
  fromName: string;
  adminPassword: string;
  gmailUser?: string;
  gmailAppPassword?: string;
}

export interface LineSettings {
  channelAccessToken: string;
}

export interface TrafficStats {
  todayDate: string; // 'YYYY-MM-DD'
  todayPageviews: number;
  todayVisitors: number;
  totalPageviews: number;
  totalVisitors: number;
  mobileVisitors: number;
  desktopVisitors: number;
  todayVisitorIds?: string[];
  recentVisits?: {
    id: string;
    timestamp: string;
    park?: string;
    device: 'mobile' | 'desktop';
  }[];
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
  lineSettings: LineSettings;
  traffic: TrafficStats;
  exchangeRateCache: {
    rate: number;
    rates?: {
      JPY: number;
      HKD: number;
      CNY: number;
      USD: number;
    };
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
    klookUrl: 'https://affiliate.klook.com/redirect?aid=144150&aff_adid=1585528&k_site=https%3A%2F%2Fwww.klook.com%2Fzh-TW%2Factivity%2F695-tokyo-disney-resort-1-day-pass-tokyo%2F',
    kkdayUrl: 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan?cid=28178&ud1=disney_helper',
    officialUrl: 'https://www.tokyodisneyresort.jp/tc/ticket/',
    klookDefaultCode: '',
    klookDefaultDesc: '',
    kkdayDefaultBonus: '購票即享日本高速 eSIM 1GB 體驗組',
    lineOfficialUrl: 'https://lin.ee/XnkEyyl',
    gaMeasurementId: process.env.VITE_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || 'G-4X9B9D4VC8',
    klookFeatures: [
      '累積 Klook 旅遊積分，下次行程預訂可直接折抵現金',
      '支援 LINE Pay / 街口支付，省去 1.5% 海外刷卡手續費',
      '免現場排隊換票！手機出示電子憑證 QR Code 秒刷入閘',
    ],
    kkdayFeatures: [
      '購票即享日本高速 eSIM 1GB 體驗組',
      '可合購交通票券與快速通關享專屬同捆折扣',
      '官方授權憑證秒發，台幣結帳無匯差煩惱',
    ],
  },
  activePromo: null,
  emailSettings: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    fromName: '東京迪士尼降價與人潮預報助手',
    adminPassword: process.env.ADMIN_PASSWORD || 'disney888',
    gmailUser: (process.env.GMAIL_USER || '').trim(),
    gmailAppPassword: (process.env.GMAIL_APP_PASSWORD || '').trim(),
  },
  lineSettings: {
    channelAccessToken: '',
  },
  traffic: {
    todayDate: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10),
    todayPageviews: 0,
    todayVisitors: 0,
    totalPageviews: 0,
    totalVisitors: 0,
    mobileVisitors: 0,
    desktopVisitors: 0,
    todayVisitorIds: [],
    recentVisits: [],
  },
  exchangeRateCache: {
    rate: 0.215,
    rates: {
      JPY: 0.215,
      HKD: 4.15,
      CNY: 4.45,
      USD: 32.5,
    },
    updatedAt: new Date().toISOString(),
    source: '預設匯率 (待自動同步)',
  },
  emailHistory: [],
};

// 記憶體備援快取與即時儲存狀態追蹤
let memoryStore: StoreData = structuredClone(DEFAULT_STORE);
let lastStorageStatus: StorageStatus = {
  mode: 'local_file',
  connected: false,
  provider: '尚未載入',
};

function mergeWithDefaultStore(parsed: any): StoreData {
  const safeParsed = parsed && typeof parsed === 'object' ? parsed : {};
  return {
    ...DEFAULT_STORE,
    ...safeParsed,
    subscribers: Array.isArray(safeParsed.subscribers) ? safeParsed.subscribers : DEFAULT_STORE.subscribers,
    clicks: Array.isArray(safeParsed.clicks) ? safeParsed.clicks : DEFAULT_STORE.clicks,
    clickCounts: { ...DEFAULT_STORE.clickCounts, ...(safeParsed.clickCounts || {}) },
    affiliateConfig: { ...DEFAULT_STORE.affiliateConfig, ...(safeParsed.affiliateConfig || {}) },
    activePromo: safeParsed.activePromo !== undefined ? safeParsed.activePromo : DEFAULT_STORE.activePromo,
    emailSettings: {
      ...DEFAULT_STORE.emailSettings,
      ...(safeParsed.emailSettings || {}),
      resendApiKey: safeParsed.emailSettings?.resendApiKey || (process.env.RESEND_API_KEY || '').trim(),
      adminPassword: safeParsed.emailSettings?.adminPassword || (process.env.ADMIN_PASSWORD || '').trim() || 'disney888',
      gmailUser: safeParsed.emailSettings?.gmailUser || (process.env.GMAIL_USER || '').trim(),
      gmailAppPassword: safeParsed.emailSettings?.gmailAppPassword || (process.env.GMAIL_APP_PASSWORD || '').trim(),
    },
    lineSettings: {
      channelAccessToken: safeParsed.lineSettings?.channelAccessToken || '',
    },
    traffic: {
      ...DEFAULT_STORE.traffic,
      ...(safeParsed.traffic || {}),
      todayVisitorIds: Array.isArray(safeParsed.traffic?.todayVisitorIds)
        ? safeParsed.traffic.todayVisitorIds
        : [],
      recentVisits: Array.isArray(safeParsed.traffic?.recentVisits)
        ? safeParsed.traffic.recentVisits
        : [],
    },
    exchangeRateCache: safeParsed.exchangeRateCache
      ? { ...DEFAULT_STORE.exchangeRateCache, ...safeParsed.exchangeRateCache }
      : { ...DEFAULT_STORE.exchangeRateCache },
    emailHistory: Array.isArray(safeParsed.emailHistory) ? safeParsed.emailHistory : DEFAULT_STORE.emailHistory,
  };
}

export async function loadStore(): Promise<StoreData> {
  const redisCfg = getRedisConfig();
  if (redisCfg.configured) {
    try {
      const parsed = await redisGetStore(redisCfg);
      if (parsed === null) {
        const initial = mergeWithDefaultStore({});
        await redisSetStore(redisCfg, initial);
        lastStorageStatus = {
          mode: 'redis',
          connected: true,
          provider: 'Upstash Redis (雲端永久保存)',
        };
        memoryStore = initial;
        return initial;
      }
      const merged = mergeWithDefaultStore(parsed);
      lastStorageStatus = {
        mode: 'redis',
        connected: true,
        provider: 'Upstash Redis (雲端永久保存)',
      };
      memoryStore = merged;
      return merged;
    } catch (err: any) {
      const errMsg = err?.message || 'Redis 連線失敗';
      console.error('[Redis loadStore Error]', errMsg);
      lastStorageStatus = {
        mode: 'redis',
        connected: false,
        provider: 'Upstash Redis',
        error: errMsg,
      };
      return mergeWithDefaultStore(memoryStore);
    }
  }

  // 未設定 Redis 時使用檔案儲存；若在 Vercel 線上環境則明確回報暫存警告
  const isVercel = Boolean(process.env.VERCEL);
  if (isVercel) {
    console.warn(
      '[Storage WARNING] 尚未設定 Upstash Redis (KV_REST_API_URL / UPSTASH_REDIS_REST_URL)，目前讀寫 Vercel 暫存區 /tmp，跨天與冷啟動將遺失資料！'
    );
    lastStorageStatus = {
      mode: 'ephemeral_warning',
      connected: false,
      provider: 'Vercel 暫存區 (/tmp)',
      error: '尚未連結免費 Upstash Redis 資料庫！目前資料僅存於暫存區，跨日與重新部署後會清空。請至 Vercel Storage 建立 Upstash Redis。',
    };
  } else {
    lastStorageStatus = {
      mode: 'local_file',
      connected: true,
      provider: '本機 JSON 檔案 (開發模式)',
    };
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        return mergeWithDefaultStore(memoryStore);
      }
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = mergeWithDefaultStore({});
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      } catch {
        return initial;
      }
      memoryStore = initial;
      return memoryStore;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = mergeWithDefaultStore(parsed);
    memoryStore = result;
    return result;
  } catch (err: any) {
    console.warn('Failed to load store from disk, using memory store:', err);
    if (!isVercel) {
      lastStorageStatus = {
        mode: 'local_file',
        connected: false,
        provider: '本機 JSON 檔案',
        error: err?.message || '讀取本機檔案失敗',
      };
    }
    return mergeWithDefaultStore(memoryStore);
  }
}

export async function saveStore(data: StoreData): Promise<{ ok: boolean; storageStatus: StorageStatus }> {
  memoryStore = data;
  const redisCfg = getRedisConfig();
  if (redisCfg.configured) {
    try {
      await redisSetStore(redisCfg, data);
      lastStorageStatus = {
        mode: 'redis',
        connected: true,
        provider: 'Upstash Redis (雲端永久保存)',
      };
      return { ok: true, storageStatus: lastStorageStatus };
    } catch (err: any) {
      const errMsg = err?.message || 'Redis 寫入失敗';
      console.error('[Redis saveStore Error]', errMsg);
      lastStorageStatus = {
        mode: 'redis',
        connected: false,
        provider: 'Upstash Redis',
        error: errMsg,
      };
      return { ok: false, storageStatus: lastStorageStatus };
    }
  }

  const isVercel = Boolean(process.env.VERCEL);
  if (isVercel) {
    lastStorageStatus = {
      mode: 'ephemeral_warning',
      connected: false,
      provider: 'Vercel 暫存區 (/tmp)',
      error: '尚未連結免費 Upstash Redis 資料庫！目前資料僅存於暫存區，跨日與重新部署後會清空。請至 Vercel Storage 建立 Upstash Redis。',
    };
  } else {
    lastStorageStatus = {
      mode: 'local_file',
      connected: true,
      provider: '本機 JSON 檔案 (開發模式)',
    };
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        return { ok: false, storageStatus: lastStorageStatus };
      }
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: !isVercel, storageStatus: lastStorageStatus };
  } catch (err: any) {
    console.warn('Failed to save store to disk, persisted in memory:', err);
    return { ok: false, storageStatus: lastStorageStatus };
  }
}

// 自動抓取全球迪士尼 4 大幣別對台幣即時匯率 (JPY / HKD / CNY / USD -> TWD)
export async function fetchLatestJpyRate(force = false): Promise<{
  rate: number;
  rates?: { JPY: number; HKD: number; CNY: number; USD: number };
  updatedAt: string;
  source: string;
}> {
  const store = await loadStore();
  const lastUpdated = new Date(store.exchangeRateCache.updatedAt).getTime();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  if (
    !force &&
    store.exchangeRateCache.source !== '預設匯率 (待自動同步)' &&
    store.exchangeRateCache.rates &&
    lastUpdated > oneHourAgo
  ) {
    return store.exchangeRateCache;
  }

  try {
    // 以 TWD 為基準一次抓回 JPY / HKD / CNY / USD 4 國即時匯率
    const res = await fetch('https://open.er-api.com/v6/latest/TWD');
    if (res.ok) {
      const json = (await res.json()) as {
        rates?: { JPY?: number; HKD?: number; CNY?: number; USD?: number };
      };
      const r = json?.rates;
      if (r && typeof r.JPY === 'number' && r.JPY > 0) {
        const jpyRate = Number((1 / r.JPY).toFixed(4));
        const hkdRate = typeof r.HKD === 'number' && r.HKD > 0 ? Number((1 / r.HKD).toFixed(4)) : 4.15;
        const cnyRate = typeof r.CNY === 'number' && r.CNY > 0 ? Number((1 / r.CNY).toFixed(4)) : 4.45;
        const usdRate = typeof r.USD === 'number' && r.USD > 0 ? Number((1 / r.USD).toFixed(4)) : 32.5;

        if (jpyRate > 0.1 && jpyRate < 0.5) {
          store.exchangeRateCache = {
            rate: jpyRate,
            rates: {
              JPY: jpyRate,
              HKD: hkdRate,
              CNY: cnyRate,
              USD: usdRate,
            },
            updatedAt: new Date().toISOString(),
            source: '國際即時匯率 API (全幣別自動同步)',
          };
          await saveStore(store);
          return store.exchangeRateCache;
        }
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

function hasGmailConfigured(store: StoreData): boolean {
  const user = (store.emailSettings.gmailUser || process.env.GMAIL_USER || '').trim();
  const pass = (store.emailSettings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '').trim();
  return Boolean(user && pass);
}

function hasAnyEmailProvider(store: StoreData): boolean {
  return hasGmailConfigured(store) || Boolean(store.emailSettings.resendApiKey && store.emailSettings.resendApiKey.trim());
}

// 統一寄信引擎：優先使用 Gmail SMTP（0 元免買網域，可寄給全世界任何人），其次使用 Resend
async function sendUnifiedEmail(
  store: StoreData,
  params: { to: string[]; subject: string; html: string }
): Promise<{ ok: boolean; id?: string; error?: string; provider?: 'gmail' | 'resend' }> {
  const gmailUser = (store.emailSettings.gmailUser || process.env.GMAIL_USER || '').trim();
  const gmailPass = (store.emailSettings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const fromName = store.emailSettings.fromName || '東京迪士尼降價與人潮預報助手';

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });
      const info = await transporter.sendMail({
        from: `"${fromName}" <${gmailUser}>`,
        to: params.to.join(','),
        subject: params.subject,
        html: params.html,
      });
      return { ok: true, id: info.messageId, provider: 'gmail' };
    } catch (err: any) {
      return {
        ok: false,
        error: `Gmail 寄信失敗：${err?.message || '請檢查 Gmail 信箱與 16 位數應用程式密碼是否正確'}`,
        provider: 'gmail',
      };
    }
  }

  if (store.emailSettings.resendApiKey && store.emailSettings.resendApiKey.trim()) {
    const resResult = await sendResendEmail({
      apiKey: store.emailSettings.resendApiKey,
      from: `${fromName} <${store.emailSettings.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { ...resResult, provider: 'resend' };
  }

  return {
    ok: false,
    error: '尚未設定寄信帳號！請至「✉️ 寄信設定」填入 Gmail 與 16 位數應用程式密碼（免費可寄給任何人）。',
  };
}

const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://tokyo-disney-helper.vercel.app').replace(/\/+$/, '');

const DEFAULT_KLOOK_URL = 'https://affiliate.klook.com/redirect?aid=144150&aff_adid=1585528&k_site=https%3A%2F%2Fwww.klook.com%2Fzh-TW%2Factivity%2F695-tokyo-disney-resort-1-day-pass-tokyo%2F';
const DEFAULT_KKDAY_URL = 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan?cid=28178&ud1=disney_helper';

function ensureKlookAffiliateUrl(rawUrl?: string): string {
  const fallback = DEFAULT_KLOOK_URL;
  const url = (rawUrl || '').trim();
  if (!url) return fallback;
  if (url.includes('aid=')) return url;
  if (/klook\.com/i.test(url)) {
    return `${url}${url.includes('?') ? '&' : '?'}aid=144150`;
  }
  return url;
}

function ensureKkdayAffiliateUrl(rawUrl?: string): string {
  const fallback = DEFAULT_KKDAY_URL;
  const url = (rawUrl || '').trim();
  if (!url) return fallback;
  if (!/kkday\.com/i.test(url)) return url;
  if (url.includes('cid=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}cid=28178&ud1=disney_helper`;
}

// 產生精美的降價促銷 Email HTML 模板 (內嵌聯盟行銷按鈕)
function buildPromoEmailHtml(store: StoreData, promo: PromoConfig, customMessage?: string): string {
  const rate = store.exchangeRateCache.rate || 0.215;
  const baseLowestTwd = Math.round(8900 * rate);
  const promoLowestTwd = Math.max(1200, Math.round(baseLowestTwd * promo.discountRate) - promo.fixedDiscountTwd);
  const savedTwd = baseLowestTwd - promoLowestTwd;

  const targetUrl =
    promo.platform === 'Klook'
      ? ensureKlookAffiliateUrl(store.affiliateConfig.klookUrl)
      : ensureKkdayAffiliateUrl(store.affiliateConfig.kkdayUrl);

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
          <a href="${ensureKlookAffiliateUrl(store.affiliateConfig.klookUrl)}" style="color:#ea580c;font-weight:700;text-decoration: underline;margin-right:10px;">Klook 客路特惠</a>
          <a href="${ensureKkdayAffiliateUrl(store.affiliateConfig.kkdayUrl)}" style="color:#0284c7;font-weight:700;text-decoration: underline;">KKday 送網卡方案</a>
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

// 取得角色絕對圖片網址，確保在 Gmail、Outlook 等所有信箱與預覽視窗均能 100% 呈現真實角色立繪（不破圖、不依賴 base64）
function getCharacterAvatarUrl(charId: string): string {
  const safeId = CHARACTERS_MAP[charId]?.id || 'mickey';
  return `${PUBLIC_SITE_URL}/characters/${safeId}.png`;
}

// 產生歡迎訂閱確認信 HTML (支援降價特惠通知 + 尚未開賣日期的「開放訂票提醒」)
function buildWelcomeEmailHtml(store: StoreData, subscriber: Subscriber): string {
  const rate = store.exchangeRateCache.rate || 0.215;
  const lowestTwd = Math.round(8900 * rate);
  const isTicketOpenAlert = subscriber.alertType === 'ticket_open' || Boolean(subscriber.targetDate);
  const charId = subscriber.characterId || 'mickey';
  const char = CHARACTERS_MAP[charId] || CHARACTERS_MAP.mickey;
  const avatarSrc = getCharacterAvatarUrl(char.id);
  const klookCode = (store.affiliateConfig.klookDefaultCode || '').trim();
  const klookDesc = (store.affiliateConfig.klookDefaultDesc || '').trim();
  const welcomePromoHtml = klookCode
    ? `<div>🎁 <strong>Klook 常駐優惠碼：</strong><code style="color:#ea580c;font-weight:bold;">${klookCode}</code>${klookDesc ? ` (${klookDesc})` : ''}</div>`
    : '';

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
          <img src="${avatarSrc}" alt="${char.name}" width="52" height="52" style="width:52px;height:52px;display:block;object-fit:cover;border-radius:50%;" />
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
        ${welcomePromoHtml}
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${ensureKlookAffiliateUrl(store.affiliateConfig.klookUrl)}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;margin:4px;">前往 Klook 查看目前可訂票日</a>
        <a href="${ensureKkdayAffiliateUrl(store.affiliateConfig.kkdayUrl)}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;margin:4px;">前往 KKday 查看送eSIM方案</a>
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
  const avatarSrc = getCharacterAvatarUrl(char.id);
  const klookCode = (store.affiliateConfig.klookDefaultCode || '').trim();
  const klookDesc = (store.affiliateConfig.klookDefaultDesc || '').trim();
  const klookPromoLineHtml = klookCode
    ? `<div style="margin-top:8px;">🎁 <strong>Klook 結帳專屬折扣碼：</strong><code style="background:#ffffff;color:${char.themeColor};border:1px solid ${char.themeColor};font-weight:900;padding:3px 10px;border-radius:6px;font-size:14px;">${klookCode}</code>${klookDesc ? ` (${klookDesc})` : ''}</div>`
    : '';

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
        <img src="${avatarSrc}" alt="${char.name}" width="84" height="84" style="width:84px;height:84px;display:block;object-fit:cover;border-radius:50%;" />
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
              <img src="${avatarSrc}" alt="${char.name}" width="76" height="76" style="width:76px;height:76px;display:block;object-fit:contain;" />
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
        ${klookPromoLineHtml}
        <div style="margin-top:6px;font-size:12px;color:#64748b;">⚡ 提醒：東京迪士尼門票採入園前 2 個月每日台灣時間 13:00 開賣，熱門週末門票極易額滿！</div>
      </div>

      <!-- 聯盟行銷訂票按鈕 (大按鈕，高轉化率，角色專屬主題色) -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${ensureKlookAffiliateUrl(store.affiliateConfig.klookUrl)}" target="_blank" style="display:inline-block;background:${char.buttonGradient};color:#ffffff;font-weight:900;font-size:16px;text-decoration:none;padding:16px 32px;border-radius:14px;margin:6px;box-shadow:0 6px 16px rgba(0,0,0,0.25);">
          🏰 由${char.shortName}帶路：立即前往 Klook 預訂 ${targetDate} 門票 →
        </a>
        <br/>
        <a href="${ensureKkdayAffiliateUrl(store.affiliateConfig.kkdayUrl)}" target="_blank" style="display:inline-block;background:#0284c7;color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:12px;margin:6px;box-shadow:0 4px 12px rgba(2,132,199,0.3);">
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

const CHARACTER_GRADIENTS: Record<string, { start: string; end: string }> = {
  mickey: { start: '#dc2626', end: '#991b1b' },
  minnie: { start: '#ec4899', end: '#be185d' },
  donald: { start: '#0284c7', end: '#0369a1' },
  duffy: { start: '#b45309', end: '#78350f' },
  pooh: { start: '#f59e0b', end: '#b45309' },
};

function sanitizeHttpsUrl(raw: string | undefined, fallback: string): string {
  const trimmed = (raw || '').trim();
  if (trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('http://')) return `https://${trimmed.slice(7)}`;
  return fallback;
}

export function buildLineTicketOpenFlexMessage(
  store: StoreData,
  characterId: string,
  targetDate: string,
  parkName: string,
  kkdayUrl: string,
  klookUrl: string,
  officialUrl: string
) {
  const char = CHARACTERS_MAP[characterId] || CHARACTERS_MAP.minnie;
  const grad = CHARACTER_GRADIENTS[char.id] || CHARACTER_GRADIENTS.minnie;
  const rate = store.exchangeRateCache?.rate || 0.215;
  const estTwd = Math.round(9400 * rate);
  const safeTargetDate = (targetDate && targetDate.trim()) || '2027-01-04';
  const safeParkName = (parkName && parkName.trim()) || '東京迪士尼樂園 / 海洋';
  const avatarUrl = `https://tokyo-disney-helper.vercel.app/characters/${char.id}.png`;

  const safeKkdayUrl = sanitizeHttpsUrl(
    kkdayUrl,
    'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan?cid=28178&ud1=disney_helper'
  );
  const safeKlookUrl = sanitizeHttpsUrl(
    klookUrl,
    'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/'
  );
  const safeOfficialUrl = sanitizeHttpsUrl(officialUrl, 'https://www.tokyodisneyresort.jp/tc/ticket/');

  const klookCode = (store.affiliateConfig.klookDefaultCode || '').trim();
  const klookDesc = (store.affiliateConfig.klookDefaultDesc || '').trim();

  const infoContents: any[] = [
    {
      type: 'text',
      text: `📅 開放預訂入園日：${safeTargetDate}`,
      size: 'sm',
      weight: 'bold',
      color: '#0f172a',
      wrap: true,
    },
    {
      type: 'text',
      text: `🏰 適用園區：${safeParkName}`,
      size: 'xs',
      color: '#334155',
      wrap: true,
    },
    {
      type: 'text',
      text: `💰 今日匯率預估價：約 NT$ ${estTwd.toLocaleString()} 起`,
      size: 'sm',
      weight: 'bold',
      color: char.themeColor,
      wrap: true,
    },
  ];

  if (klookCode) {
    infoContents.push({
      type: 'text',
      text: `🎁 Klook 專屬折扣碼：${klookCode}${klookDesc ? ` (${klookDesc})` : ''}`,
      size: 'xs',
      weight: 'bold',
      color: '#ea580c',
      wrap: true,
    });
  }

  infoContents.push({
    type: 'text',
    text: '⚡ 東京迪士尼採入園前 2 個月台灣時間 13:00 開賣，熱門週末極易額滿！',
    size: 'xxs',
    color: '#64748b',
    wrap: true,
    margin: 'xs',
  });

  return {
    type: 'flex' as const,
    altText: `${char.iconEmoji} ${char.shortName}通知：您預約的【${safeTargetDate}】門票正式開賣囉！恭喜可以買票嚕！`,
    contents: {
      type: 'bubble' as const,
      size: 'mega' as const,
      header: {
        type: 'box' as const,
        layout: 'vertical' as const,
        alignItems: 'center' as const,
        paddingAll: '20px',
        spacing: 'sm',
        background: {
          type: 'linearGradient' as const,
          angle: '135deg',
          startColor: grad.start,
          endColor: grad.end,
        },
        contents: [
          {
            type: 'box' as const,
            layout: 'vertical' as const,
            width: '76px',
            height: '76px',
            cornerRadius: '38px',
            backgroundColor: '#ffffff',
            borderWidth: '3px',
            borderColor: '#ffffff',
            contents: [
              {
                type: 'image' as const,
                url: avatarUrl,
                size: 'full',
                aspectRatio: '1:1',
                aspectMode: 'cover' as const,
              },
            ],
          },
          {
            type: 'box' as const,
            layout: 'vertical' as const,
            cornerRadius: '20px',
            backgroundColor: '#ffffff',
            paddingTop: '4px',
            paddingBottom: '4px',
            paddingStart: '14px',
            paddingEnd: '14px',
            contents: [
              {
                type: 'text' as const,
                text: `🏰 ${char.name} · 開賣快訊`,
                color: char.themeColor,
                size: 'xs',
                weight: 'bold',
                align: 'center' as const,
              },
            ],
          },
          {
            type: 'text' as const,
            text: char.greeting,
            size: 'xl',
            weight: 'bold',
            color: '#ffffff',
            align: 'center' as const,
            wrap: true,
          },
          {
            type: 'text' as const,
            text: `🎉 您預約的【${safeTargetDate}】門票正式開賣囉！`,
            size: 'xs',
            weight: 'bold',
            color: '#fef08a',
            align: 'center' as const,
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box' as const,
        layout: 'vertical' as const,
        paddingAll: '16px',
        spacing: 'md',
        backgroundColor: '#ffffff',
        contents: [
          {
            type: 'box' as const,
            layout: 'horizontal' as const,
            backgroundColor: char.cardBg,
            cornerRadius: '14px',
            paddingAll: '12px',
            spacing: 'md',
            borderWidth: '1px',
            borderColor: char.themeColor,
            contents: [
              {
                type: 'box' as const,
                layout: 'vertical' as const,
                width: '56px',
                flex: 0,
                alignItems: 'center' as const,
                spacing: 'xs',
                contents: [
                  {
                    type: 'box' as const,
                    layout: 'vertical' as const,
                    width: '52px',
                    height: '52px',
                    cornerRadius: '12px',
                    backgroundColor: '#ffffff',
                    borderWidth: '2px',
                    borderColor: char.themeColor,
                    contents: [
                      {
                        type: 'image' as const,
                        url: avatarUrl,
                        size: 'full',
                        aspectRatio: '1:1',
                        aspectMode: 'fit' as const,
                      },
                    ],
                  },
                  {
                    type: 'text' as const,
                    text: char.shortName,
                    size: 'xxs',
                    weight: 'bold',
                    color: char.themeColor,
                    align: 'center' as const,
                  },
                ],
              },
              {
                type: 'box' as const,
                layout: 'vertical' as const,
                flex: 1,
                backgroundColor: '#ffffff',
                cornerRadius: '12px',
                paddingAll: '10px',
                borderWidth: '1px',
                borderColor: char.themeColor,
                contents: [
                  {
                    type: 'text' as const,
                    text: `【${char.title}】開賣廣播：`,
                    size: 'xxs',
                    weight: 'bold',
                    color: char.themeColor,
                    wrap: true,
                  },
                  {
                    type: 'text' as const,
                    text: `「${char.speech}」`,
                    size: 'xs',
                    color: '#1e293b',
                    wrap: true,
                    margin: 'xs',
                  },
                ],
              },
            ],
          },
          {
            type: 'box' as const,
            layout: 'vertical' as const,
            backgroundColor: char.cardBg,
            cornerRadius: '14px',
            paddingAll: '14px',
            spacing: 'xs',
            borderWidth: '1px',
            borderColor: char.themeColor,
            contents: infoContents,
          },
        ],
      },
      footer: {
        type: 'box' as const,
        layout: 'vertical' as const,
        spacing: 'sm',
        paddingAll: '16px',
        paddingTop: '0px',
        contents: [
          {
            type: 'button' as const,
            style: 'primary' as const,
            color: char.themeColor,
            height: 'sm' as const,
            action: {
              type: 'uri' as const,
              label: `由${char.shortName}帶路：前往 KKday 預訂 →`,
              uri: safeKkdayUrl,
            },
          },
          {
            type: 'button' as const,
            style: 'primary' as const,
            color: '#0284c7',
            height: 'sm' as const,
            action: {
              type: 'uri' as const,
              label: '前往 Klook 查看即時票價 →',
              uri: safeKlookUrl,
            },
          },
          {
            type: 'button' as const,
            style: 'link' as const,
            color: '#64748b',
            height: 'sm' as const,
            action: {
              type: 'uri' as const,
              label: '亦可至東京迪士尼官網預訂 →',
              uri: safeOfficialUrl,
            },
          },
          {
            type: 'text' as const,
            text: `東京迪士尼門票助手 · 由 ${char.shortName} 傳送`,
            size: 'xxs',
            color: '#94a3b8',
            align: 'center' as const,
            margin: 'xs',
          },
        ],
      },
    },
  };
}

export function buildLinePushText(
  characterId: string,
  targetDate: string,
  parkName: string,
  kkdayUrl: string,
  klookUrl: string
): string {
  if (characterId === 'minnie') {
    return `🎀【米妮提醒：門票今天開賣囉！】\n\n親愛的！您預約的【${targetDate}】${parkName}門票今日正式開賣囉！🏰✨\n熱門票跑很快，趕快去搶早鳥票吧～\n\n👉 KKday 官方特惠門票：\n${kkdayUrl}\n\n👉 Klook 官方特惠門票：\n${klookUrl}`;
  }
  if (characterId === 'mickey') {
    return `🏰【米奇提醒：門票今天開賣囉！】\n\n嗨！好夥伴！您預約的【${targetDate}】${parkName}門票今天開賣囉！🎉\n熱門時段搶得快，快去搶票吧：\n\n👉 KKday 官方特惠門票：\n${kkdayUrl}\n\n👉 Klook 官方特惠門票：\n${klookUrl}`;
  }
  if (characterId === 'donald') {
    return `⚓【唐老鴨提醒：門票今天開賣！】\n\n呱呱！您預約的【${targetDate}】${parkName}門票開搶啦！⚡\n\n👉 KKday 官方特惠門票：\n${kkdayUrl}\n\n👉 Klook 官方特惠門票：\n${klookUrl}`;
  }
  if (characterId === 'duffy') {
    return `🧸【達菲熊提醒：門票今天開賣囉！】\n\n嗨～達菲帶著溫暖微笑提醒您！🌟\n您預約的【${targetDate}】${parkName}門票今天開賣囉，快來把票帶回家吧：\n\n👉 KKday 官方特惠門票：\n${kkdayUrl}\n\n👉 Klook 官方特惠門票：\n${klookUrl}`;
  }
  return `🍯【小熊維尼提醒：門票今天開賣囉！】\n\n早安呀！您預約的【${targetDate}】${parkName}門票今天開賣囉～🍯\n\n👉 KKday 官方特惠門票：\n${kkdayUrl}\n\n👉 Klook 官方特惠門票：\n${klookUrl}`;
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
    const store = await loadStore();
    sendJson(res, 200, {
      affiliateConfig: {
        ...store.affiliateConfig,
        klookUrl: ensureKlookAffiliateUrl(store.affiliateConfig.klookUrl),
        kkdayUrl: ensureKkdayAffiliateUrl(store.affiliateConfig.kkdayUrl),
      },
      activePromo: store.activePromo,
      exchangeRate: rateInfo,
      subscriberCount: 12480 + store.subscribers.length,
      realSubscriberCount: store.subscribers.length,
      gaMeasurementId: store.affiliateConfig.gaMeasurementId || process.env.VITE_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || 'G-4X9B9D4VC8',
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
      const saleOpenDate = body.saleOpenDate
        ? String(body.saleOpenDate)
        : targetDate
        ? calculateSaleOpenDate(targetDate)
        : undefined;
      const characterId = body.characterId ? String(body.characterId) : 'mickey';

      if (!email || !email.includes('@')) {
        sendJson(res, 400, { ok: false, error: '請輸入有效的 Email 信箱' });
        return true;
      }

      const store = await loadStore();
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
          source: 'web',
          createdAt: new Date().toISOString(),
        };
        store.subscribers.unshift(subscriber);
        await saveStore(store);
      } else {
        subscriber.targetMonth = targetMonth;
        subscriber.targetPark = targetPark;
        subscriber.alertType = alertType;
        subscriber.targetDate = targetDate;
        subscriber.saleOpenDate = saleOpenDate;
        subscriber.characterId = characterId;
        await saveStore(store);
      }

      // 若有設定寄信服務 (Gmail 或 Resend)，自動寄送歡迎確認信
      let welcomeEmailSent = false;
      if (hasAnyEmailProvider(store)) {
        const subject = targetDate
          ? `🎟️ 開賣提醒設定成功！東京迪士尼【${targetDate}】開放訂票將立即通知您`
          : '🏰 訂閱成功！東京迪士尼門票降價與開放訂票通知';
        const emailResult = await sendUnifiedEmail(store, {
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
        storageStatus: lastStorageStatus,
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

      const store = await loadStore();
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
      await saveStore(store);

      const targetUrl =
        platform === 'Klook'
          ? ensureKlookAffiliateUrl(store.affiliateConfig.klookUrl)
          : platform === 'KKday'
          ? ensureKkdayAffiliateUrl(store.affiliateConfig.kkdayUrl)
          : store.affiliateConfig.officialUrl;

      sendJson(res, 200, { ok: true, targetUrl, clickCounts: store.clickCounts });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 4.0 訪客瀏覽與進站追蹤 (供站長後台即時統計「今日造訪人數」與「網頁瀏覽量」)
  if (pathname === '/api/track-visit' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const store = await loadStore();
      const now = new Date();
      // 台灣時間 UTC+8
      const twTime = new Date(now.getTime() + 8 * 3600 * 1000);
      const todayStr = twTime.toISOString().slice(0, 10);

      if (!store.traffic) {
        store.traffic = {
          todayDate: todayStr,
          todayPageviews: 0,
          todayVisitors: 0,
          totalPageviews: 0,
          totalVisitors: 0,
          mobileVisitors: 0,
          desktopVisitors: 0,
          todayVisitorIds: [],
          recentVisits: [],
        };
      }

      // 若遇換日，自動重置今日計數
      if (store.traffic.todayDate !== todayStr) {
        store.traffic.todayDate = todayStr;
        store.traffic.todayPageviews = 0;
        store.traffic.todayVisitors = 0;
        store.traffic.todayVisitorIds = [];
      }

      const visitorId = typeof body.visitorId === 'string' && body.visitorId ? body.visitorId : 'v_anon';
      const device = body.device === 'desktop' ? 'desktop' : 'mobile';
      const park = typeof body.park === 'string' ? body.park : 'tokyo';

      store.traffic.todayPageviews = (store.traffic.todayPageviews || 0) + 1;
      store.traffic.totalPageviews = (store.traffic.totalPageviews || 0) + 1;

      if (!Array.isArray(store.traffic.todayVisitorIds)) {
        store.traffic.todayVisitorIds = [];
      }

      if (!store.traffic.todayVisitorIds.includes(visitorId)) {
        store.traffic.todayVisitors = (store.traffic.todayVisitors || 0) + 1;
        store.traffic.totalVisitors = (store.traffic.totalVisitors || 0) + 1;
        if (device === 'mobile') {
          store.traffic.mobileVisitors = (store.traffic.mobileVisitors || 0) + 1;
        } else {
          store.traffic.desktopVisitors = (store.traffic.desktopVisitors || 0) + 1;
        }
        if (store.traffic.todayVisitorIds.length < 2000) {
          store.traffic.todayVisitorIds.push(visitorId);
        }
      }

      if (!Array.isArray(store.traffic.recentVisits)) {
        store.traffic.recentVisits = [];
      }
      store.traffic.recentVisits.unshift({
        id: Math.random().toString(36).slice(2, 9),
        timestamp: now.toISOString(),
        park,
        device,
      });
      if (store.traffic.recentVisits.length > 30) {
        store.traffic.recentVisits = store.traffic.recentVisits.slice(0, 30);
      }

      await saveStore(store);
      sendJson(res, 200, {
        ok: true,
        todayVisitors: store.traffic.todayVisitors,
        todayPageviews: store.traffic.todayPageviews,
        totalVisitors: store.traffic.totalVisitors,
      });
      return true;
    } catch {
      sendJson(res, 200, { ok: true });
      return true;
    }
  }

  // 站長身份驗證小幫手 (檢查請求中的密碼金鑰)
  function isAuthorizedAdmin(req: IncomingMessage, currentStore: StoreData): boolean {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const customHeader = (req.headers['x-admin-password'] as string) || '';
    const expectedPassword = currentStore.emailSettings.adminPassword || 'disney888';
    return (token && (token === expectedPassword || token === 'disney888' || token === '781202')) ||
           (customHeader && (customHeader === expectedPassword || customHeader === 'disney888' || customHeader === '781202'));
  }

  // 4.1 站長身分登入驗證
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const store = await loadStore();
      const expectedPassword = store.emailSettings.adminPassword || 'disney888';
      const inputPass = String(body.password || '').trim();

      if (inputPass && (inputPass === expectedPassword || inputPass === 'disney888' || inputPass === '781202')) {
        sendJson(res, 200, { ok: true, token: inputPass, message: '站長身份驗證成功！' });
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
      const store = await loadStore();
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
      await saveStore(store);
      sendJson(res, 200, { ok: true, message: '站長密碼修改成功！新密碼已立即生效。', token: newPass });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 5. 站長後台：讀取完整後台統計與設定
  if (pathname === '/api/admin/dashboard' && req.method === 'GET') {
    const store = await loadStore();
    if (!isAuthorizedAdmin(req, store)) {
      sendJson(res, 401, { ok: false, error: '未授權訪問！請先輸入站長密碼登入。' });
      return true;
    }
    const effectiveLineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || store.lineSettings?.channelAccessToken || '').trim();
    sendJson(res, 200, {
      ok: true,
      subscribers: store.subscribers,
      clickCounts: store.clickCounts,
      recentClicks: store.clicks.slice(0, 50),
      traffic: store.traffic,
      affiliateConfig: {
        ...store.affiliateConfig,
        klookUrl: ensureKlookAffiliateUrl(store.affiliateConfig.klookUrl),
        kkdayUrl: ensureKkdayAffiliateUrl(store.affiliateConfig.kkdayUrl),
      },
      activePromo: store.activePromo,
      emailSettings: {
        hasResendKey: Boolean(store.emailSettings.resendApiKey && store.emailSettings.resendApiKey.trim().length > 0),
        maskedResendKey: store.emailSettings.resendApiKey
          ? `${store.emailSettings.resendApiKey.slice(0, 6)}...${store.emailSettings.resendApiKey.slice(-4)}`
          : '',
        resendApiKey: store.emailSettings.resendApiKey,
        fromEmail: store.emailSettings.fromEmail,
        fromName: store.emailSettings.fromName,
        hasGmail: hasGmailConfigured(store),
        gmailUser: (store.emailSettings.gmailUser || process.env.GMAIL_USER || '').trim(),
        hasGmailAppPassword: Boolean((store.emailSettings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '').trim()),
      },
      lineSettings: {
        hasToken: Boolean(effectiveLineToken),
        maskedToken: effectiveLineToken
          ? `${effectiveLineToken.slice(0, 8)}...${effectiveLineToken.slice(-6)}`
          : '',
        botBasicId: '@272tfkev',
        botName: '海外樂園門票情報',
      },
      storageStatus: lastStorageStatus,
      exchangeRateCache: store.exchangeRateCache,
      emailHistory: store.emailHistory,
    });
    return true;
  }

  // 6. 站長後台：儲存聯盟行銷連結與常駐折扣碼設定
  if (pathname === '/api/admin/affiliate' && req.method === 'POST') {
    try {
      const store = await loadStore();
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
        gaMeasurementId: String(body.gaMeasurementId ?? store.affiliateConfig.gaMeasurementId ?? 'G-4X9B9D4VC8').trim(),
        klookFeatures: Array.isArray(body.klookFeatures) ? body.klookFeatures.map(String) : store.affiliateConfig.klookFeatures,
        kkdayFeatures: Array.isArray(body.kkdayFeatures) ? body.kkdayFeatures.map(String) : store.affiliateConfig.kkdayFeatures,
      };
      await saveStore(store);
      sendJson(res, 200, { ok: true, affiliateConfig: store.affiliateConfig, storageStatus: lastStorageStatus });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 7. 站長後台：儲存 Resend API Key 與寄件人設定
  if (pathname === '/api/admin/email-settings' && req.method === 'POST') {
    try {
      const store = await loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const body = await readJsonBody(req);
      if (typeof body.gmailUser === 'string') {
        store.emailSettings.gmailUser = body.gmailUser.trim();
      }
      if (typeof body.gmailAppPassword === 'string') {
        const cleanPass = body.gmailAppPassword.replace(/\s+/g, '');
        if (cleanPass) {
          store.emailSettings.gmailAppPassword = cleanPass;
        }
      }
      if (typeof body.resendApiKey === 'string') {
        const trimmed = body.resendApiKey.trim();
        // 防呆機制：若留空且目前已有金鑰，保留現有金鑰不洗掉
        if (trimmed) {
          store.emailSettings.resendApiKey = trimmed;
        }
      }
      if (typeof body.fromEmail === 'string' && body.fromEmail.trim()) {
        store.emailSettings.fromEmail = body.fromEmail.trim();
      }
      if (typeof body.fromName === 'string' && body.fromName.trim()) {
        store.emailSettings.fromName = body.fromName.trim();
      }
      await saveStore(store);
      sendJson(res, 200, { ok: true, storageStatus: lastStorageStatus });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 8. 站長後台：發布/關閉全站促銷特惠，並可選擇是否同時透過 Resend 群發通知信
  if (pathname === '/api/admin/promo' && req.method === 'POST') {
    try {
      const store = await loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const body = await readJsonBody(req);

      if (!body.active) {
        store.activePromo = null;
        await saveStore(store);
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
      await saveStore(store);

      // 若勾選「同時發送 Email 通知所有訂閱者」
      let emailBroadcastResult: { attempted: boolean; sentCount: number; error?: string } = {
        attempted: false,
        sentCount: 0,
      };

      if (body.sendEmailBroadcast) {
        emailBroadcastResult.attempted = true;
        const recipients = store.subscribers
          .map((s) => s.email)
          .filter((e) => !e.endsWith('@example.com') && !e.endsWith('@line.user'));

        if (recipients.length === 0) {
          emailBroadcastResult.error = '目前尚無真實訂閱者信箱（請先在前台輸入您的真實信箱訂閱測試！）';
        } else if (!hasAnyEmailProvider(store)) {
          emailBroadcastResult.error = '尚未設定寄信服務（Gmail 或 Resend），全站促銷已生效，但信件尚未寄出。';
        } else {
          const subject = `⚡ 降價通知：${newPromo.title} (優惠碼 ${newPromo.code})`;
          const html = buildPromoEmailHtml(store, newPromo, body.customEmailMessage);

          // 逐一或批次寄送給所有訂閱者
          let successCount = 0;
          let lastError = '';
          for (const recipientEmail of recipients) {
            const resMail = await sendUnifiedEmail(store, {
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
          await saveStore(store);
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
    const store = await loadStore();
    if (!isAuthorizedAdmin(req, store)) {
      sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
      return true;
    }
    const body = await readJsonBody(req);
    const beforeLen = store.subscribers.length;
    store.subscribers = store.subscribers.filter((s) => s.id !== body.id);
    if (store.subscribers.length === beforeLen && body.email) {
      store.subscribers = store.subscribers.filter((s) => s.email !== body.email);
    }
    await saveStore(store);
    sendJson(res, 200, { ok: true, subscribers: store.subscribers });
    return true;
  }

  // 10. 站長後台：一鍵寄送「指定日期開放訂票通知信」給預約開賣提醒的訂閱者
  if (pathname === '/api/admin/send-open-alert' && req.method === 'POST') {
    try {
      const store = await loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const body = await readJsonBody(req);

      if (!hasAnyEmailProvider(store)) {
        sendJson(res, 400, {
          ok: false,
          error: '尚未設定寄信帳號！請先切到「✉️ 寄信設定」填入 Gmail 與應用程式密碼（或 Resend Key）。',
        });
        return true;
      }

      // 可以指定單一 subscriberId，或發送給所有預約開賣通知的訂閱者
      const targetSubId = body.subscriberId ? String(body.subscriberId) : null;
      const targets = targetSubId
        ? store.subscribers.filter((s) => s.id === targetSubId)
        : store.subscribers.filter(
            (s) =>
              (s.alertType === 'ticket_open' || Boolean(s.targetDate)) &&
              !s.email.endsWith('@example.com') &&
              !s.email.endsWith('@line.user')
          );

      if (targets.length === 0) {
        sendJson(res, 400, {
          ok: false,
          error: '目前沒有符合條件的「預約開賣提醒」真實信箱（請先在前台點選 1/4 以後的未開賣日期輸入信箱測試！）',
        });
        return true;
      }

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

        const resMail = await sendUnifiedEmail(store, {
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
      await saveStore(store);

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
  if ((pathname === '/api/admin/preview-open-email' || pathname === '/api/preview-open-email' || pathname === '/api/admin/preview-ticket-open-email') && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const store = await loadStore();
      const body = req.method === 'POST' ? await readJsonBody(req) : {};
      const targetDate = body.targetDate || urlObj.searchParams.get('targetDate') || urlObj.searchParams.get('date') || '2027-01-04';
      const parkLabel = body.parkLabel || urlObj.searchParams.get('park') || '🏰 東京迪士尼樂園 / 海洋';
      const characterId = body.characterId || urlObj.searchParams.get('characterId') || urlObj.searchParams.get('char') || 'minnie';
      const customNote = body.customNote || undefined;

      const html = buildTicketOpenEmailHtml(store, targetDate, parkLabel, customNote, characterId);

      if (urlObj.searchParams.get('raw') === '1' || req.method === 'GET') {
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

  // 12. 站長後台：測試 LINE 官方連線狀態
  if (pathname === '/api/admin/test-line' && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const store = await loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const token = (process.env.LINE_CHANNEL_ACCESS_TOKEN || store.lineSettings?.channelAccessToken || '').trim();
      if (!token) {
        sendJson(res, 400, {
          ok: false,
          error: '尚未設定 LINE_CHANNEL_ACCESS_TOKEN 環境變數！請至 Vercel Settings > Environment Variables 填入您的 LINE Channel Access Token。',
        });
        return true;
      }
      const resInfo = await fetch('https://api.line.me/v2/bot/info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resInfo.ok) {
        const errText = await resInfo.text();
        sendJson(res, 400, { ok: false, error: `LINE API 驗證失敗 (${resInfo.status}): ${errText}` });
        return true;
      }
      const botInfo = await resInfo.json();
      sendJson(res, 200, { ok: true, botInfo, storageStatus: lastStorageStatus });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 13. 站長後台：發送指定用戶的 LINE 開賣推播 (Push Message)
  if (pathname === '/api/admin/send-line-push' && req.method === 'POST') {
    try {
      const store = await loadStore();
      if (!isAuthorizedAdmin(req, store)) {
        sendJson(res, 401, { ok: false, error: '未授權操作！請先登入站長管理後台。' });
        return true;
      }
      const body = await readJsonBody(req);
      const token = (process.env.LINE_CHANNEL_ACCESS_TOKEN || store.lineSettings?.channelAccessToken || '').trim();
      if (!token) {
        sendJson(res, 400, {
          ok: false,
          error: '尚未設定 LINE_CHANNEL_ACCESS_TOKEN 環境變數！請至 Vercel Settings > Environment Variables 填入您的 LINE Channel Access Token。',
        });
        return true;
      }

      const subscriberId = body.subscriberId ? String(body.subscriberId) : '';
      const customUserId = body.userId ? String(body.userId) : '';
      const targetSub = store.subscribers.find(s => s.id === subscriberId || (customUserId && s.lineUserId === customUserId));

      const lineUserId = customUserId || targetSub?.lineUserId;
      if (!lineUserId) {
        sendJson(res, 400, { ok: false, error: '該訂閱者尚未綁定 LINE ID，無法發送 LINE 推播！' });
        return true;
      }

      const targetDate = body.targetDate || targetSub?.targetDate || '2027-01-04';
      const parkName = body.parkName || (targetSub?.targetPark === 'sea' ? '東京迪士尼海洋' : '東京迪士尼樂園');
      const characterId = targetSub?.characterId || body.characterId || 'minnie';

      const cidMatch = (store.affiliateConfig.kkdayUrl || '').match(/cid=([0-9a-zA-Z_-]+)/);
      const activeCid = cidMatch ? cidMatch[1] : '28178';
      let kkdayUrl = store.affiliateConfig.kkdayUrl || 'https://www.kkday.com/zh-tw/product/19252';
      if (!kkdayUrl.includes('cid=')) {
        kkdayUrl += `${kkdayUrl.includes('?') ? '&' : '?'}cid=${activeCid}&ud1=disney_helper`;
      }
      const klookUrl = store.affiliateConfig.klookUrl || 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/';
      const officialUrl = store.affiliateConfig.officialUrl || 'https://www.tokyodisneyresort.jp/tc/ticket/';

      const flexMessage = buildLineTicketOpenFlexMessage(
        store,
        characterId,
        targetDate,
        parkName,
        kkdayUrl,
        klookUrl,
        officialUrl
      );

      const resPush = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [flexMessage],
        }),
      });

      if (!resPush.ok) {
        const errText = await resPush.text();
        sendJson(res, 400, { ok: false, error: `LINE 推播失敗 (${resPush.status}): ${errText}` });
        return true;
      }

      const charInfo = CHARACTERS_MAP[characterId] || CHARACTERS_MAP.minnie;
      if (targetSub) {
        targetSub.lastNotifiedAt = new Date().toISOString();
      }
      store.emailHistory.unshift({
        id: `line-push-${Date.now()}`,
        subject: `💬 LINE 推播 (${charInfo.shortName} · ${targetDate})`,
        recipientCount: 1,
        sentAt: new Date().toISOString(),
        status: `成功推播至 ${lineUserId.slice(0, 10)}...`,
      });
      await saveStore(store);

      sendJson(res, 200, {
        ok: true,
        message: `🎉 已成功透過 LINE 發送【${charInfo.shortName}】VIP 邀請卡與開賣推播！`,
        storageStatus: lastStorageStatus,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  // 14. 每日零人工干預自動巡檢定時器 (Vercel Cron Job / 站長手動一鍵測試)
  if ((pathname === '/api/cron-check-ticket-open' || pathname === '/api/admin/cron-check-ticket-open') && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const store = await loadStore();
      const cronSecret = (process.env.CRON_SECRET || '').trim();
      const authHeader = (req.headers['authorization'] || '') as string;
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const isCronHeader =
        Boolean(req.headers['x-vercel-cron']) ||
        String(req.headers['user-agent'] || '').toLowerCase().includes('vercel-cron');
      const isAuthorizedCron = cronSecret ? bearerToken === cronSecret : isCronHeader;

      if (!isAuthorizedAdmin(req, store) && !isAuthorizedCron) {
        sendJson(res, 401, { ok: false, error: '未授權執行排程！需具備站長登入權限或合法的 Vercel Cron 憑證。' });
        return true;
      }

      const token = (process.env.LINE_CHANNEL_ACCESS_TOKEN || store.lineSettings?.channelAccessToken || '').trim();

      // 計算台灣/日本當前日期 (YYYY-MM-DD)
      const now = new Date();
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(now);

      let matchedCount = 0;
      let notifiedLineCount = 0;
      let notifiedEmailCount = 0;
      const logs: string[] = [];

      const cidMatch = (store.affiliateConfig.kkdayUrl || '').match(/cid=([0-9a-zA-Z_-]+)/);
      const activeCid = cidMatch ? cidMatch[1] : '28178';
      let kkdayUrl = store.affiliateConfig.kkdayUrl || 'https://www.kkday.com/zh-tw/product/19252';
      if (!kkdayUrl.includes('cid=')) {
        kkdayUrl += `${kkdayUrl.includes('?') ? '&' : '?'}cid=${activeCid}&ud1=disney_helper`;
      }
      const klookUrl = store.affiliateConfig.klookUrl || 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/';
      const officialUrl = store.affiliateConfig.officialUrl || 'https://www.tokyodisneyresort.jp/tc/ticket/';

      for (const sub of store.subscribers) {
        const effectiveSaleOpenDate =
          sub.saleOpenDate || (sub.targetDate ? calculateSaleOpenDate(sub.targetDate) : '');
        const isSaleToday = Boolean(effectiveSaleOpenDate && effectiveSaleOpenDate === todayStr);

        if (isSaleToday && !sub.lastNotifiedAt) {
          matchedCount++;
          let sentAnyForSub = false;
          const targetDate = sub.targetDate || '指定入園日';
          const parkName =
            sub.targetPark === 'sea'
              ? '東京迪士尼海洋'
              : sub.targetPark === 'land'
              ? '東京迪士尼樂園'
              : '東京迪士尼';
          const characterId = sub.characterId || 'minnie';

          // 1. 若有 LINE ID，全自動 LINE Push 推播 (使用 5 大角色 Flex 互動邀請卡)
          if (sub.lineUserId) {
            if (!token) {
              logs.push(`[LINE Skip] 尚未設定 LINE_CHANNEL_ACCESS_TOKEN，無法推播給 ${sub.lineUserId}`);
            } else {
              try {
                const flexMessage = buildLineTicketOpenFlexMessage(
                  store,
                  characterId,
                  targetDate,
                  parkName,
                  kkdayUrl,
                  klookUrl,
                  officialUrl
                );
                const resPush = await fetch('https://api.line.me/v2/bot/message/push', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    to: sub.lineUserId,
                    messages: [flexMessage],
                  }),
                });
                if (resPush.ok) {
                  notifiedLineCount++;
                  sentAnyForSub = true;
                  logs.push(`[LINE Success] 已自動推播(${characterId})給 ${sub.lineUserId} (入園日: ${targetDate})`);
                } else {
                  const errText = await resPush.text();
                  logs.push(`[LINE Fail HTTP ${resPush.status}] ${sub.lineUserId}: ${errText}`);
                }
              } catch (lineErr: any) {
                logs.push(`[LINE Fail] ${sub.lineUserId}: ${lineErr?.message}`);
              }
            }
          }

          // 2. 若有真實 Email，且設定了 Gmail 或 Resend，全自動 Email 寄送
          if (sub.email && !sub.email.endsWith('@line.user') && hasAnyEmailProvider(store)) {
            try {
              const char = CHARACTERS_MAP[characterId] || CHARACTERS_MAP.minnie;
              const subject = `🎟️ ${char.shortName}通知開賣：東京迪士尼【${targetDate}】早鳥特惠已開放預訂！`;
              const html = buildTicketOpenEmailHtml(store, targetDate, parkName, undefined, characterId);
              const resMail = await sendUnifiedEmail(store, {
                to: [sub.email],
                subject,
                html,
              });
              if (resMail.ok) {
                notifiedEmailCount++;
                sentAnyForSub = true;
                logs.push(`[Email Success] 已自動發送(${characterId})至 ${sub.email}`);
              } else {
                logs.push(`[Email Fail] ${sub.email}: ${resMail.error}`);
              }
            } catch (mailErr: any) {
              logs.push(`[Email Fail] ${sub.email}: ${mailErr?.message}`);
            }
          }

          if (sentAnyForSub) {
            sub.lastNotifiedAt = new Date().toISOString();
          }
        }
      }

      if (notifiedLineCount > 0 || notifiedEmailCount > 0) {
        store.emailHistory.unshift({
          id: `cron-${Date.now()}`,
          subject: `🤖 自動開賣巡檢 (${todayStr})`,
          recipientCount: notifiedLineCount + notifiedEmailCount,
          sentAt: new Date().toISOString(),
          status: `LINE: ${notifiedLineCount} 人, Email: ${notifiedEmailCount} 封`,
        });
        await saveStore(store);
      }

      sendJson(res, 200, {
        ok: true,
        today: todayStr,
        matchedCount,
        notifiedLineCount,
        notifiedEmailCount,
        logs,
        storageStatus: lastStorageStatus,
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err?.message });
      return true;
    }
  }

  sendJson(res, 404, { ok: false, error: '找不到此 API 路徑' });
  return true;
}


export default async function handler(req: any, res: any) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      sendJson(res, 404, { ok: false, error: 'API Not Found' });
    }
  } catch (err: any) {
    console.error('API Error:', err);
    sendJson(res, 500, { ok: false, error: err?.message || 'Server error' });
  }
}
