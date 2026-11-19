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
      timestamp: new Date().toISOString()
    }));
  }

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

        console.log(`[LINE Webhook] 收到預約登記: User=${userId}, TargetDate=${targetDate}, Park=${parkName}`);
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
