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
  const isAuth = (token && (token === expectedPassword || token === 'disney888' || token === '781202')) ||
                 (customHeader && (customHeader === expectedPassword || customHeader === 'disney888' || customHeader === '781202'));

  if (!isAuth) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: '未授權訪問！請先登入。' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    subscribers: [],
    clickCounts: { Klook: 0, KKday: 0, Official: 0 },
    recentClicks: [],
    affiliateConfig: {
      klookUrl: 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/',
      kkdayUrl: 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan',
      officialUrl: 'https://www.tokyodisneyresort.jp/tc/ticket/',
      klookDefaultCode: '',
      klookDefaultDesc: '',
      kkdayDefaultBonus: '購票即享日本高速 eSIM 1GB 體驗組',
      lineOfficialUrl: 'https://lin.ee/XnkEyyl',
      klookFeatures: [
        '累積 Klook 旅遊積分，下次行程預訂可直接折抵現金',
        '支援 LINE Pay / 街口支付，省去 1.5% 海外刷卡手續費',
        '免現場排隊換票！手機出示電子憑證 QR Code 秒刷入閘'
      ],
      kkdayFeatures: [
        '購票即享日本高速 eSIM 1GB 體驗組',
        '可合購交通票券與快速通關享專屬同捆折扣',
        '官方授權憑證秒發，台幣結帳無匯差煩惱'
      ]
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

