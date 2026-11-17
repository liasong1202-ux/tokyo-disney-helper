export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: '請輸入有效的 Email 信箱' }));
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      welcomeEmailSent: false,
      subscriberCount: 12484
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || '訂閱失敗' }));
  }
}

