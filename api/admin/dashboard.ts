export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const customHeader = (req.headers['x-admin-password'] as string) || '';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'disney888';

  if ((!token || token !== expectedPassword) && (!customHeader || customHeader !== expectedPassword)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: '未授權訪問！請先登入。' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    subscribers: [
      {
        id: 'sub-1',
        email: 'disney_vip@example.com',
        targetMonth: '2026-11',
        targetPark: 'both',
        alertType: 'both',
        characterId: 'mickey',
        createdAt: new Date().toISOString()
      }
    ],
    clickCounts: { Klook: 48, KKday: 32, Official: 15 },
    recentClicks: [],
    affiliateConfig: {
      klookUrl: 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/',
      kkdayUrl: 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan',
      officialUrl: 'https://www.tokyodisneyresort.jp/tc/ticket/',
      klookDefaultCode: 'DISNEYTW88',
      klookDefaultDesc: '結帳輸入優惠碼現省 NT$100',
      kkdayDefaultBonus: '購票即享日本高速 eSIM 1GB 體驗組'
    },
    activePromo: null,
    emailSettings: {
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
      maskedResendKey: process.env.RESEND_API_KEY ? 're_***' : '',
      resendApiKey: process.env.RESEND_API_KEY || '',
      fromEmail: 'onboarding@resend.dev',
      fromName: '東京迪士尼降價與人潮預報助手'
    },
    exchangeRateCache: {
      rate: 0.2066,
      updatedAt: new Date().toISOString(),
      source: '即時牌告匯率'
    },
    emailHistory: []
  }));
}
