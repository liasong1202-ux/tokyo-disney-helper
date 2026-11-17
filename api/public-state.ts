export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.statusCode = 200;
  res.end(JSON.stringify({
    affiliateConfig: {
      klookUrl: 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/',
      kkdayUrl: 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan',
      officialUrl: 'https://www.tokyodisneyresort.jp/tc/ticket/',
      klookDefaultCode: 'DISNEYTW88',
      klookDefaultDesc: '結帳輸入優惠碼現省 NT$100',
      kkdayDefaultBonus: '購票即享日本高速 eSIM 1GB 體驗組'
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
