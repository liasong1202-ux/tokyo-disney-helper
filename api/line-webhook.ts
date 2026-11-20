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
      hasToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
      timestamp: new Date().toISOString()
    }));
  }

  // 角色專屬性格回覆語庫
  const CHARACTER_REPLIES: Record<string, { title: string; greeting: string; icon: string }> = {
    米妮: {
      title: '甜美大使 · 米妮',
      greeting: '哈囉親愛的！米妮帶著滿滿愛心收到您的開賣預約囉～💖\n\n米妮已經把您的小願望寫在粉紅日記本裡囉！當天開賣第一秒，米妮會準時給您發送即時搶票提醒與優惠購票連結～✨',
      icon: '🎀'
    },
    米奇: {
      title: '歡樂隊長 · 米奇',
      greeting: '嗨！好夥伴！米奇收到您的開賣預約囉！🎉\n\n奇妙魔法即將開啟，開賣日我會吹響集結號角，第一秒提醒您搶票！',
      icon: '🏰'
    },
    唐老鴨: {
      title: '熱血衝鋒隊長 · 唐老鴨',
      greeting: '呱呱呱！唐老鴨收到您的搶票預約啦！⚡\n\n別擔心，搶票這檔事交給我，開賣時間一到我保證大聲叫您搶票！',
      icon: '⚓'
    },
    維尼: {
      title: '療癒暖心大使 · 小熊維尼',
      greeting: '早安呀～維尼抱著蜂蜜罐收到您的預約囉！🍯\n\n慢慢來不要急，開賣日我會抱著甜甜的心情提醒您買票唷～',
      icon: '🍯'
    },
    小熊維尼: {
      title: '療癒暖心大使 · 小熊維尼',
      greeting: '早安呀～維尼抱著蜂蜜罐收到您的預約囉！🍯\n\n慢慢來不要急，開賣日我會抱著甜甜的心情提醒您買票唷～',
      icon: '🍯'
    },
    奇奇蒂蒂: {
      title: '頑皮探險雙人組 · 奇奇蒂蒂',
      greeting: '吱吱吱！奇奇和蒂蒂把您的預約藏在橡實裡保管好囉！🌰\n\n開賣那天我們會一起蹦蹦跳跳敲窗戶通知您！',
      icon: '🌰'
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

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

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
        let charKey = '米奇';
        for (const k of Object.keys(CHARACTER_REPLIES)) {
          if (text.includes(k)) {
            charKey = k;
            break;
          }
        }
        const charData = CHARACTER_REPLIES[charKey] || CHARACTER_REPLIES['米妮'];

        console.log(`[LINE Webhook] 收到預約登記: User=${userId}, TargetDate=${targetDate}, Park=${parkName}, Character=${charKey}`);

        // 若配置了 LINE Channel Access Token，且有 replyToken，則調用 LINE Messaging API 自動秒回
        if (lineToken && replyToken) {
          try {
            let replyText = '';
            if (targetDate) {
              replyText = `${charData.icon}【${charData.title} · 開賣預約成功】\n\n${charData.greeting}\n\n📅 預約入園日：${targetDate}\n🏰 目標樂園：${parkName}\n\n專屬守護大使已為您鎖定提醒，開賣前準時為您推播特惠與搶票連結！\n\n👉 查看即時票價與情報：\nhttps://tokyo-disney-helper.vercel.app/`;
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
    // LINE 要求無論如何盡量回傳 200 避免 LINE 伺服器判定端點壞掉而自動停用 Webhook
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: false, error: err?.message }));
  }
}
