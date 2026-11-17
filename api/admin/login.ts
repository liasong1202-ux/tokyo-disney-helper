export default async function handler(req: any, res: any) {
  // 設置 CORS 與 JSON Headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    // 若在原生 Node 串流模式且未被預先解析
    if (!body || typeof body !== 'object') {
      body = await new Promise((resolve) => {
        let raw = '';
        req.on('data', (chunk: any) => { raw += chunk.toString(); });
        req.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch { resolve({}); }
        });
        req.on('error', () => resolve({}));
      });
    }

    const inputPassword = String(body?.password || '').trim();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'disney888';

    // 支援初始密碼 disney888、環境變數密碼與站長設定之密碼
    if (inputPassword && (inputPassword === expectedPassword || inputPassword === 'disney888' || inputPassword === '781202')) {
      res.statusCode = 200;
      res.end(JSON.stringify({
        ok: true,
        token: inputPassword,
        message: '站長身份驗證成功！'
      }));
    } else {
      res.statusCode = 401;
      res.end(JSON.stringify({
        ok: false,
        error: '密碼錯誤！請輸入正確的站長管理密碼。'
      }));
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      ok: false,
      error: err?.message || '登入伺服器處理失敗'
    }));
  }
}

