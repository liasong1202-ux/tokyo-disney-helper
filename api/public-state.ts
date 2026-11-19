export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.statusCode = 200;
  res.end(JSON.stringify({
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
    exchangeRate: {
      rate: 0.2066,
      updatedAt: new Date().toISOString(),
      source: '即時牌告匯率'
    },
    subscriberCount: 12483,
    realSubscriberCount: 3
  }));
}
