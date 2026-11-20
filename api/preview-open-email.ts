export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const charParam = url.searchParams.get('characterId') || url.searchParams.get('char') || 'minnie';
  const targetDate = url.searchParams.get('targetDate') || url.searchParams.get('date') || '2027-01-04';
  const parkLabel = url.searchParams.get('park') || '🏰 東京迪士尼樂園 / 海洋';

  // 角色資料庫
  const CHARACTERS: Record<string, any> = {
    minnie: {
      id: 'minnie',
      name: '米妮 (Minnie Mouse)',
      shortName: '米妮',
      title: '甜美大使 · 浪漫旅程領航員',
      greeting: '💖 恭喜可以買票嚕！',
      speech: '哈囉親愛的！米妮帶著滿滿愛心來提醒您～最期待的夢幻迪士尼之旅即將啟程，今天正式開賣囉！快牽著最重要的人一起出發吧！',
      themeColor: '#ec4899',
      secondaryColor: '#be185d',
      bgGradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      cardBg: '#fdf2f8',
      buttonGradient: 'linear-gradient(90deg, #ec4899, #db2777)',
      avatarUrl: 'https://tokyo-disney-helper.vercel.app/characters/minnie.png',
      badge: '浪漫首選',
      heart: '💖'
    },
    mickey: {
      id: 'mickey',
      name: '米奇 (Mickey Mouse)',
      shortName: '米奇',
      title: '歡樂隊長 · 冒險大作戰領隊',
      greeting: '🎉 恭喜可以買票嚕！',
      speech: '米奇來通報好消息囉！夥伴們請注意，您預約的迪士尼門票在今天正式開賣啦！快快點擊下方專屬連結搶票，最棒的樂園時光正等著您！',
      themeColor: '#dc2626',
      secondaryColor: '#991b1b',
      bgGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      cardBg: '#fef2f2',
      buttonGradient: 'linear-gradient(90deg, #dc2626, #b91c1c)',
      avatarUrl: 'https://tokyo-disney-helper.vercel.app/characters/mickey.png',
      badge: '經典必選',
      heart: '✨'
    },
    donald: {
      id: 'donald',
      name: '唐老鴨 (Donald Duck)',
      shortName: '唐老鴨',
      title: '活力衝鋒大使 · 門票先鋒',
      greeting: '⚡ 呱呱！準時開搶啦！',
      speech: '呱呱呱！衝啊夥伴們！唐老鴨第一秒就來敲門提醒你啦！熱門假日的門票跑得比我還快，快點手刀前往預訂，衝第一波！',
      themeColor: '#0284c7',
      secondaryColor: '#0369a1',
      bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      cardBg: '#f0f9ff',
      buttonGradient: 'linear-gradient(90deg, #0284c7, #0369a1)',
      avatarUrl: 'https://tokyo-disney-helper.vercel.app/characters/donald.png',
      badge: '熱血衝刺',
      heart: '⚡'
    },
    pooh: {
      id: 'pooh',
      name: '小熊維尼 (Winnie the Pooh)',
      shortName: '小熊維尼',
      title: '暖心甜蜜領隊 · 漫遊好朋友',
      greeting: '🍯 哇～今天能買票囉！',
      speech: '早安呀～我的好朋友！就像找到一整罐甜甜蜂蜜一樣開心，門票開賣囉！不用著急，吃口蜂蜜，牽好手手，準備前往最歡樂的森林吧～',
      themeColor: '#d97706',
      secondaryColor: '#b45309',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      cardBg: '#fefce8',
      buttonGradient: 'linear-gradient(90deg, #f59e0b, #d97706)',
      avatarUrl: 'https://tokyo-disney-helper.vercel.app/characters/pooh.png',
      badge: '溫暖療癒',
      heart: '🍯'
    },
    duffy: {
      id: 'duffy',
      name: '達菲熊 (Duffy)',
      shortName: '達菲熊',
      title: '航海萌友 · 溫馨陪伴領航員',
      greeting: '⚓ 航海夥伴，今天開賣嚕！',
      speech: '你好呀！我是達菲～今天東京迪士尼門票熱騰騰開賣囉！米奇跟我已經在海港準備好最棒的暖心擁抱，好期待見到你喔！',
      themeColor: '#b45309',
      secondaryColor: '#78350f',
      bgGradient: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
      cardBg: '#fefce8',
      buttonGradient: 'linear-gradient(90deg, #b45309, #92400e)',
      avatarUrl: 'https://tokyo-disney-helper.vercel.app/characters/duffy.png',
      badge: '海洋萌友',
      heart: '⚓'
    }
  };

  const char = CHARACTERS[charParam] || CHARACTERS['minnie'];

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${char.shortName}祝賀：東京迪士尼【${targetDate}】門票今天正式開賣囉！</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans TC',sans-serif;color:#1e293b;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;border:3px solid ${char.themeColor};box-shadow:0 16px 40px rgba(0,0,0,0.12);">
    
    <!-- 頂部：角色專屬主視覺 Banner -->
    <div style="background:${char.bgGradient};padding:36px 20px 28px;text-align:center;color:#ffffff;position:relative;">
      <!-- 角色圓形立體頭像 -->
      <div style="width:96px;height:96px;border-radius:50%;overflow:hidden;border:4px solid #ffffff;box-shadow:0 8px 24px rgba(0,0,0,0.25);margin:0 auto 14px;background:#ffffff;display:flex;align-items:center;justify-content:center;">
        <img src="${char.avatarUrl}" alt="${char.name}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='https://tokyo-disney-helper.vercel.app/characters/minnie.png';" />
      </div>

      <div style="display:inline-block;background:#ffffff;color:${char.themeColor};font-weight:900;font-size:12px;padding:4px 16px;border-radius:999px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);letter-spacing:0.5px;">
        🏰 ${char.name} · 開賣第一秒通知
      </div>
      
      <h1 style="margin:4px 0 0;font-size:25px;font-weight:900;line-height:1.3;text-shadow:0 2px 4px rgba(0,0,0,0.2);">
        ${char.greeting}
      </h1>
      <p style="margin:8px 0 0;font-size:14px;color:#fef08a;font-weight:800;letter-spacing:0.3px;">
        🎉 您預約的【${targetDate}】東京迪士尼門票正式開賣囉！
      </p>
    </div>

    <!-- 角色親切問候對話卡片 -->
    <div style="background:${char.cardBg};border-bottom:2px dashed ${char.themeColor};padding:22px 20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:72px;vertical-align:top;text-align:center;">
            <div style="width:68px;height:68px;border-radius:18px;overflow:hidden;border:2.5px solid ${char.themeColor};box-shadow:0 4px 10px rgba(0,0,0,0.1);background:#ffffff;margin:0 auto;">
              <img src="${char.avatarUrl}" alt="${char.name}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='https://tokyo-disney-helper.vercel.app/characters/minnie.png';" />
            </div>
            <div style="font-size:12px;font-weight:900;color:${char.themeColor};margin-top:6px;">${char.shortName}</div>
          </td>
          <td style="vertical-align:top;padding-left:16px;">
            <div style="background:#ffffff;border:2px solid ${char.themeColor};border-radius:18px;padding:14px 18px;box-shadow:0 3px 8px rgba(0,0,0,0.04);position:relative;">
              <div style="font-size:12px;color:${char.themeColor};font-weight:900;margin-bottom:4px;">
                【${char.title}】開賣私房話：
              </div>
              <div style="font-size:14px;color:#1e293b;line-height:1.65;font-weight:600;">
                「${char.speech}」
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 門票預訂資訊與導購專區 -->
    <div style="padding:26px 20px;font-size:14px;line-height:1.7;">
      
      <!-- 預約詳情方塊 -->
      <div style="background:${char.cardBg};border:2px solid ${char.themeColor};border-radius:18px;padding:18px;margin-bottom:24px;">
        <div style="font-size:15px;margin-bottom:6px;">
          📅 <strong>開放訂票入園日：</strong><span style="color:#0f172a;font-weight:900;font-size:17px;">${targetDate}</span>
        </div>
        <div style="font-size:13px;color:#475569;margin-bottom:10px;">
          🏰 <strong>預約目標樂園：</strong>${parkLabel}
        </div>
        <div style="font-size:13px;color:#475569;margin-bottom:8px;">
          💰 <strong>今日日圓匯率預估：</strong>約 <strong style="color:${char.themeColor};font-size:18px;">NT$ 1,839</strong> 起
        </div>
        <div style="font-size:12px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:8px;margin-top:8px;">
          ⚡ <strong>貼心搶票小撇步：</strong>迪士尼門票採入園前 60 天每日台灣時間 13:00 開賣，熱門週末極易秒殺，建議提早 3 分鐘點擊下方按鈕登入準備！
        </div>
      </div>

      <!-- 核心 CTA 聯盟行銷導購按鈕 (大按鈕，高轉化率) -->
      <div style="text-align:center;margin:28px 0 20px;">
        <a href="https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/?aid=YOUR_KLOOK_AID" target="_blank" rel="noopener noreferrer" style="display:block;background:${char.buttonGradient};color:#ffffff;font-weight:900;font-size:16px;text-decoration:none;padding:16px 24px;border-radius:16px;box-shadow:0 8px 20px rgba(236,72,153,0.3);letter-spacing:0.3px;margin-bottom:12px;">
          🎀 由${char.shortName}帶路：立即前往 Klook 搶購門票 →
        </a>

        <a href="https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-ticket" target="_blank" rel="noopener noreferrer" style="display:block;background:#0284c7;color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 20px;border-radius:14px;box-shadow:0 4px 12px rgba(2,132,199,0.25);margin-bottom:10px;">
          🔵 備用管道：前往 KKday 預訂 (享加贈方案) →
        </a>

        <div style="font-size:12px;color:#94a3b8;margin-top:10px;">
          支援 LINE Pay / 街口支付 / 信用卡，手機出示 QR Code 憑證秒刷入閘
        </div>
      </div>

      <div style="border-top:1px solid #f1f5f9;padding-top:18px;margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">
        東京與全球海外迪士尼門票情報站 · 祝您擁有最夢幻的樂園之旅 ✨
      </div>
    </div>
  </div>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}

