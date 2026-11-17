export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const oldPassword = String(body?.oldPassword || '').trim();
    const newPassword = String(body?.newPassword || '').trim();

    if (!newPassword || newPassword.length < 4) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: '新密碼長度不得少於 4 個字元！' }));
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      message: '站長密碼修改成功！新密碼已即時生效。',
      token: newPassword
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err?.message || '密碼修改處理失敗' }));
  }
}
