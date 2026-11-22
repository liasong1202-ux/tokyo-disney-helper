import fs from 'fs';
import path from 'path';

export const REDIS_STORE_KEY = 'tokyo_disney_helper:store:v1';

export interface RedisConfig {
  configured: boolean;
  url: string;
  token: string;
}

export function getRedisConfig(): RedisConfig {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '').trim();
  return {
    configured: Boolean(url && token),
    url,
    token,
  };
}

export async function redisGetStore(cfg: RedisConfig): Promise<any | null> {
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

export async function redisSetStore(cfg: RedisConfig, store: any): Promise<void> {
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
 * 官方規則：入園日 2 個月前同日 14:00 (台灣 13:00)；若該月無對應日期（如 4/30 往回 2 月無 2/30、8/31 無 6/31），順延至次月 1 日。
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

export interface SaveLineSubscriberResult {
  ok: boolean;
  storage: 'redis' | 'local_file' | 'ephemeral_tmp';
  error?: string;
}

// 保存 LINE 預約紀錄至永久資料庫 Upstash Redis（若未設定則退回本機檔案並明確告警）
async function saveLineSubscriber(sub: {
  userId: string;
  targetDate: string;
  saleOpenDate: string;
  parkName: string;
  characterId: string;
}): Promise<SaveLineSubscriberResult> {
  const targetPark: 'land' | 'sea' | 'both' = sub.parkName.includes('海洋')
    ? 'sea'
    : sub.parkName.includes('陸地')
    ? 'land'
    : 'both';

  const subRecord = {
    id: `line-${sub.userId.slice(-6)}-${sub.targetDate}`,
    email: `${sub.userId.slice(0, 8)}@line.user`,
    lineUserId: sub.userId,
    targetDate: sub.targetDate,
    saleOpenDate: sub.saleOpenDate,
    targetMonth: sub.targetDate.slice(0, 7),
    targetPark,
    alertType: 'ticket_open',
    characterId: sub.characterId,
    source: 'line_bot',
    createdAt: new Date().toISOString(),
  };

  const redisCfg = getRedisConfig();
  if (redisCfg.configured) {
    try {
      let store = await redisGetStore(redisCfg);
      if (!store || typeof store !== 'object') {
        store = { subscribers: [] };
      }
      if (!Array.isArray(store.subscribers)) {
        store.subscribers = [];
      }

      const existingIdx = store.subscribers.findIndex(
        (s: any) => s.lineUserId === sub.userId && s.targetDate === sub.targetDate
      );
      if (existingIdx >= 0) {
        store.subscribers[existingIdx] = {
          ...store.subscribers[existingIdx],
          ...subRecord,
          createdAt: store.subscribers[existingIdx].createdAt || subRecord.createdAt,
        };
      } else {
        store.subscribers.unshift(subRecord);
      }

      await redisSetStore(redisCfg, store);
      console.log(`[LINE Webhook] 已寫入 Upstash Redis 永久名單: ${subRecord.id} (開賣日: ${sub.saleOpenDate})`);
      return { ok: true, storage: 'redis' };
    } catch (err: any) {
      const msg = err?.message || 'Redis 寫入失敗';
      console.error('[LINE Webhook Redis Error]', msg);
      return { ok: false, storage: 'redis', error: msg };
    }
  }

  // 未設定 Redis 時，在 Vercel 上屬於暫存區，務必明確告警
  const storageMode: 'local_file' | 'ephemeral_tmp' = process.env.VERCEL ? 'ephemeral_tmp' : 'local_file';
  if (process.env.VERCEL) {
    console.warn(
      '[LINE Webhook WARNING] 未設定 UPSTASH_REDIS_REST_URL / KV_REST_API_URL，目前只能寫入 Vercel 暫存區 /tmp，跨函式與冷啟動後將會遺失！'
    );
  }

  try {
    const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
    const DB_FILE = path.join(DATA_DIR, 'store.json');
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let store: any = { subscribers: [] };
    if (fs.existsSync(DB_FILE)) {
      try {
        store = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch {}
    }
    if (!Array.isArray(store.subscribers)) {
      store.subscribers = [];
    }

    const existingIdx = store.subscribers.findIndex(
      (s: any) => s.lineUserId === sub.userId && s.targetDate === sub.targetDate
    );
    if (existingIdx >= 0) {
      store.subscribers[existingIdx] = {
        ...store.subscribers[existingIdx],
        ...subRecord,
        createdAt: store.subscribers[existingIdx].createdAt || subRecord.createdAt,
      };
    } else {
      store.subscribers.unshift(subRecord);
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    console.log(`[LINE Webhook] 寫入本機/暫存檔案 (${storageMode}): ${subRecord.id} (開賣日: ${sub.saleOpenDate})`);
    return {
      ok: true,
      storage: storageMode,
      error: process.env.VERCEL ? '未連接永久雲端資料庫 Redis，目前僅寫入 Vercel 暫存區，跨天會遺失！' : undefined,
    };
  } catch (err: any) {
    console.error('[LINE Webhook Local Save Error]', err);
    return { ok: false, storage: storageMode, error: err?.message || '存檔失敗' };
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Line-Signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();
  const redisCfg = getRedisConfig();
  const storageMode = redisCfg.configured ? 'redis' : process.env.VERCEL ? 'ephemeral_warning' : 'local_file';

  // GET 請求用來自我測試與檢測端點是否正常運作
  if (req.method === 'GET') {
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        ok: true,
        service: '海外樂園門票情報 LINE Webhook Endpoint',
        status: 'active',
        hasToken: Boolean(lineToken),
        storageMode,
        timestamp: new Date().toISOString(),
      })
    );
  }

  // 角色專屬性格回覆語庫 (順序注意：先比對較長名稱如「小熊維尼」，再比對「維尼」「達菲」等)
  const CHARACTER_REPLIES: Array<{ key: string; title: string; icon: string; charId: string }> = [
    { key: '米妮', title: '甜美大使 · 米妮', icon: '🎀', charId: 'minnie' },
    { key: '米奇', title: '歡樂隊長 · 米奇', icon: '🏰', charId: 'mickey' },
    { key: '唐老鴨', title: '熱血衝鋒隊長 · 唐老鴨', icon: '⚓', charId: 'donald' },
    { key: '小熊維尼', title: '療癒暖心大使 · 小熊維尼', icon: '🍯', charId: 'pooh' },
    { key: '維尼', title: '療癒暖心大使 · 小熊維尼', icon: '🍯', charId: 'pooh' },
    { key: '達菲', title: '溫暖萌友 · 達菲熊', icon: '🧸', charId: 'duffy' },
  ];

  // POST: LINE Webhook 事件推播
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const events = body?.events || [];

    // 當 LINE 開發者後台點擊「Verify 驗證」按鈕時，events 會是空陣列 []，此時必須秒回 200 OK
    if (!events || events.length === 0) {
      res.statusCode = 200;
      return res.end(
        JSON.stringify({
          ok: true,
          message: 'LINE Webhook verified successfully!',
          hasToken: Boolean(lineToken),
          storageMode,
        })
      );
    }

    if (!lineToken) {
      console.error('[LINE Webhook ERROR] Missing LINE_CHANNEL_ACCESS_TOKEN environment variable!');
    }

    const storageResults: SaveLineSubscriberResult[] = [];
    const DISCLAIMER_TEXT = `本帳號為「自動情報監測推播機器人」，僅提供各大售票平台（Klook / KKday / 官網）即時票價、開賣資訊與限時優惠情報整理。

📌【預約推播說明】
1. 官方門票通常於入園日「前 2 個月（台灣時間每日 13:00）」開放預訂。
2. 預計開賣日當天，系統會在此自動推播各大平台的【即時開賣購票連結】與當前可用的優惠資訊供您參考搶購。

⚠️【免責與服務聲明】
• 本帳號為「電腦系統自動發報」，無配置人工客服，恕無法回覆任何私人留言或諮詢。
• 本站非售票旅行社或樂園官方，所有門票價格、庫存、訂單、退改票及園區規範，請直接以各大購票平台及樂園官方公告為準，票務問題請洽購票平台官方客服。

預祝您順利購得門票，享受愉快的樂園之旅！🎈`;

    for (const event of events) {
      if (event.type === 'follow') {
        const replyToken = event.replyToken;
        if (lineToken && replyToken) {
          try {
            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${lineToken}`,
              },
              body: JSON.stringify({
                replyToken,
                messages: [
                  {
                    type: 'text',
                    text: '🎀【米妮歡迎您加入！】✨\n\n哈囉！歡迎來到迪士尼門票情報小幫手～\n只要在網站選好想去的入園日期，開賣當天米妮就會準時敲您發送搶票連結喔！🏰✨\n👉 https://tokyo-disney-helper.vercel.app/',
                  },
                  {
                    type: 'text',
                    text: DISCLAIMER_TEXT,
                  },
                ],
              }),
            });
          } catch (followErr) {
            console.error('[LINE Follow Reply Error]', followErr);
          }
        }
        continue;
      }

      if (event.type === 'message' && event.message?.type === 'text') {
        const text = String(event.message.text || '');
        const userId = event.source?.userId;
        const replyToken = event.replyToken;

        // 提取日期 (例如 2027-02-04)
        const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        const targetDate = dateMatch ? dateMatch[1] : null;

        // 提取角色名稱
        let matchedChar = CHARACTER_REPLIES[0]; // 預設米妮
        for (const item of CHARACTER_REPLIES) {
          if (text.includes(item.key)) {
            matchedChar = item;
            break;
          }
        }
        const charDisplayName = matchedChar.key === '維尼' ? '小熊維尼' : matchedChar.key === '達菲' ? '達菲熊' : matchedChar.key;

        // 提取樂園名稱
        let parkName = '東京迪士尼';
        if (text.includes('香港')) parkName = '香港迪士尼';
        else if (text.includes('上海')) parkName = '上海迪士尼';
        else if (text.includes('加州') || text.includes('美國')) parkName = '加州迪士尼';
        else if (text.includes('海洋')) parkName = '東京迪士尼海洋';
        else if (text.includes('陸地')) parkName = '東京迪士尼樂園';

        let saleOpenDate = '';
        let saveResult: SaveLineSubscriberResult | null = null;
        if (targetDate && userId) {
          saleOpenDate = calculateSaleOpenDate(targetDate);
          saveResult = await saveLineSubscriber({
            userId,
            targetDate,
            saleOpenDate,
            parkName,
            characterId: matchedChar.charId,
          });
          storageResults.push(saveResult);
        }

        console.log(
          `[LINE Webhook] 收到預約: User=${userId}, TargetDate=${targetDate}, SaleOpenDate=${saleOpenDate}, Character=${charDisplayName} (${matchedChar.charId}), Storage=${saveResult?.storage || 'none'}`
        );

        // 自動回覆預約確認訊息 (精簡俐落版)
        if (lineToken && replyToken) {
          try {
            let replyText = '';
            if (targetDate) {
              replyText = `${matchedChar.icon}【${charDisplayName}開賣預約已登記】✨\n\n哈囉！${charDisplayName}已經幫您記在小本本囉～\n📅 入園日期：${targetDate}\n🏰 目標樂園：${parkName}\n⏰ 預計開賣：${saleOpenDate || '入園前 2 個月'} 13:00\n\n開賣當天${charDisplayName}會準時敲您發送早鳥特惠連結，不用擔心漏掉喔！🏰✨`;
            } else {
              replyText = `${matchedChar.icon}【${charDisplayName}收到您的訊息】\n\n哈囉！歡迎加入～隨時在網站查看最新即時低價日曆與開賣倒數唷！✨\nhttps://tokyo-disney-helper.vercel.app/`;
            }

            const replyRes = await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${lineToken}`,
              },
              body: JSON.stringify({
                replyToken,
                messages: targetDate
                  ? [
                      {
                        type: 'text',
                        text: replyText,
                      },
                      {
                        type: 'text',
                        text: DISCLAIMER_TEXT,
                      },
                    ]
                  : [
                      {
                        type: 'text',
                        text: replyText,
                      },
                    ],
              }),
            });
            if (!replyRes.ok) {
              const errText = await replyRes.text();
              console.error(`[LINE Webhook Reply HTTP ${replyRes.status}]`, errText);
            } else {
              console.log(`[LINE Webhook] 已成功透過 LINE Messaging API 回覆 User=${userId}`);
            }
          } catch (replyErr) {
            console.error('[LINE Webhook Reply Error]', replyErr);
          }
        }
      }
    }

    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        ok: true,
        processed: events.length,
        hasToken: Boolean(lineToken),
        storageMode,
        storageResults,
      })
    );
  } catch (err: any) {
    console.error('[LINE Webhook Error]', err);
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: false, error: err?.message }));
  }
}
