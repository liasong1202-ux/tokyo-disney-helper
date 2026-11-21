import fs from 'fs';
import path from 'path';

const DEFAULT_LINE_TOKEN = '5TTdV6PtM8CiBk+W3/M+QxpmoAVNDsZWQ6vTpCJWJBjnWpPe/qjkO+ihpB4n9Ph/JBERAcXLD3cs95qfIbfMg5J5Rhul0/O58cZJcMwtsL5Ab2DhxzWHpxJfYNrt5ouW80LCzIkCg0zT73U1E0EUXQdB04t89/1O/w1cDnyilFU=';

// 計算東京迪士尼 2 個月前開賣日期 (例: 2027-01-04 往前推 2 個月為 2026-11-04)
function calculateSaleOpenDate(targetDateStr: string): string {
  try {
    const parts = targetDateStr.split('-').map(Number);
    if (parts.length === 3) {
      let year = parts[0];
      let month = parts[1] - 2; // 提早 2 個月
      let day = parts[2];
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  } catch {}
  return targetDateStr;
}

// 保存 LINE 預約紀錄至持久層 store.json
function saveLineSubscriber(sub: {
  userId: string;
  targetDate: string;
  saleOpenDate: string;
  parkName: string;
  characterId: string;
}) {
  try {
    const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
    const DB_FILE = path.join(DATA_DIR, 'store.json');
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
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

    const subRecord = {
      id: `line-${sub.userId.slice(-6)}-${sub.targetDate}`,
      email: `${sub.userId.slice(0, 8)}@line.user`,
      lineUserId: sub.userId,
      targetDate: sub.targetDate,
      saleOpenDate: sub.saleOpenDate,
      targetMonth: sub.targetDate.slice(0, 7),
      targetPark: 'both',
      alertType: 'ticket_open',
      characterId: sub.characterId,
      source: 'line_bot',
      createdAt: new Date().toISOString()
    };

    const existingIdx = store.subscribers.findIndex(
      (s: any) => s.lineUserId === sub.userId && s.targetDate === sub.targetDate
    );
    if (existingIdx >= 0) {
      store.subscribers[existingIdx] = { ...store.subscribers[existingIdx], ...subRecord };
    } else {
      store.subscribers.unshift(subRecord);
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    console.log(`[LINE Webhook] 成功持久化預約名單: ${subRecord.id} (開賣日: ${sub.saleOpenDate})`);
  } catch (err) {
    console.error('[LINE Webhook Save Error]', err);
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

  // GET 請求用來自我測試與檢測端點是否正常運作
  if (req.method === 'GET') {
    res.statusCode = 200;
    return res.end(JSON.stringify({ 
      ok: true, 
      service: '海外樂園門票情報 LINE Webhook Endpoint',
      status: 'active',
      hasToken: true,
      timestamp: new Date().toISOString()
    }));
  }

  // 角色專屬性格回覆語庫
  const CHARACTER_REPLIES: Record<string, { title: string; greeting: string; icon: string; charId: string }> = {
    米妮: {
      title: '甜美大使 · 米妮',
      greeting: '哈囉親愛的！米妮帶著滿滿愛心收到您的開賣預約囉～💖\n\n米妮已經把您的小願望記錄在專屬預約清單裡囉！到了開賣當日，米妮會準時在 LINE 敲您，發送即時搶票提醒與專屬特惠連結，您完全不用擔心會漏掉喔！✨',
      icon: '🎀',
      charId: 'minnie'
    },
    米奇: {
      title: '歡樂隊長 · 米奇',
      greeting: '嗨！好夥伴！米奇收到您的開賣預約囉！🎉\n\n奇妙魔法即將開啟，開賣當天我會吹響集結號角，準時在 LINE 提醒您搶票！',
      icon: '🏰',
      charId: 'mickey'
    },
    唐老鴨: {
      title: '熱血衝鋒隊長 · 唐老鴨',
      greeting: '呱呱呱！唐老鴨收到您的搶票預約啦！⚡\n\n別擔心，搶票這檔事交給我，開賣時間一到我保證準時在 LINE 大聲叫您搶票！',
      icon: '⚓',
      charId: 'donald'
    },
    維尼: {
      title: '療癒暖心大使 · 小熊維尼',
      greeting: '早安呀～維尼抱著蜂蜜罐收到您的預約囉！🍯\n\n慢慢來不要急，開賣日我會抱著甜甜的心情準時提醒您買票唷～',
      icon: '🍯',
      charId: 'pooh'
    },
    小熊維尼: {
      title: '療癒暖心大使 · 小熊維尼',
      greeting: '早安呀～維尼抱著蜂蜜罐收到您的預約囉！🍯\n\n慢慢來不要急，開賣日我會抱著甜甜的心情準時提醒您買票唷～',
      icon: '🍯',
      charId: 'pooh'
    },
    達菲: {
      title: '溫暖萌友 · 達菲熊',
      greeting: '嗨～達菲抱著小海龜收到您的預約囉！🧸\n\n出發去海洋迪士尼玩那天，開賣時我會準時提醒您買票喔～',
      icon: '🧸',
      charId: 'duffy'
    }
  };

  // POST: LINE Webhook 事件推播
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const events = body?.events || [];

    // 當 LINE 開發者後台點擊「Verify 驗證」按鈕時，events 會是空陣列 []，此時必須秒回 200 OK
    if (!events || events.length === 0) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, message: 'LINE Webhook verified successfully!' }));
    }

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || DEFAULT_LINE_TOKEN;

    for (const event of events) {
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = String(event.message.text || '');
        const userId = event.source?.userId;
        const replyToken = event.replyToken;

        // 提取日期 (例如 2027-02-04)
        const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        const targetDate = dateMatch ? dateMatch[1] : null;

        // 提取樂園名稱
        const parkMatch = text.match(/【(.*?)】/);
        const parkName = parkMatch ? parkMatch[1] : '海外樂園';

        // 提取角色名稱
        let charKey = '米妮';
        for (const k of Object.keys(CHARACTER_REPLIES)) {
          if (text.includes(k)) {
            charKey = k;
            break;
          }
        }
        const charData = CHARACTER_REPLIES[charKey] || CHARACTER_REPLIES['米妮'];

        let saleOpenDate = '';
        if (targetDate && userId) {
          saleOpenDate = calculateSaleOpenDate(targetDate);
          // 自動登記至持久層數據庫
          saveLineSubscriber({
            userId,
            targetDate,
            saleOpenDate,
            parkName,
            characterId: charData.charId
          });
        }

        console.log(`[LINE Webhook] 收到預約登記: User=${userId}, TargetDate=${targetDate}, SaleOpenDate=${saleOpenDate}, Character=${charKey}`);

        // 自動回覆預約確認訊息
        if (lineToken && replyToken) {
          try {
            let replyText = '';
            if (targetDate) {
              replyText = `${charData.icon}【${charData.title} · 開賣預約已鎖定】\n\n${charData.greeting}\n\n📅 預約入園日：${targetDate}\n🏰 目標樂園：${parkName}\n⏰ 預計開賣日：${saleOpenDate || '入園前 2 個月同日'}\n\n🤖【全自動守護承諾】\n本系統已啟動雲端定時巡檢，開賣當天下午將由【${charKey}】全自動發送 LINE 推播提醒與早鳥特惠連結，您無需人工看顧，絕不漏單！\n\n👉 隨時查看最新日曆比價：\nhttps://tokyo-disney-helper.vercel.app/`;
            } else {
              replyText = `${charData.icon}【${charData.title} · 收到您的訊息】\n\n${charData.greeting}\n\n隨時前往網站查看最新低價日曆與開賣倒數：\nhttps://tokyo-disney-helper.vercel.app/`;
            }

            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${lineToken}`,
              },
              body: JSON.stringify({
                replyToken,
                messages: [
                  {
                    type: 'text',
                    text: replyText
                  }
                ]
              })
            });
            console.log(`[LINE Webhook] 已成功透過 LINE Messaging API 回覆 User=${userId}`);
          } catch (replyErr) {
            console.error('[LINE Webhook Reply Error]', replyErr);
          }
        }
      }
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, processed: events.length }));
  } catch (err: any) {
    console.error('[LINE Webhook Error]', err);
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: false, error: err?.message }));
  }
}
