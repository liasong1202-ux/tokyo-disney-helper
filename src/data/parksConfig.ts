/**
 * 全球迪士尼樂園資料庫配置 (東京 Tokyo / 香港 Hong Kong / 上海 Shanghai / 歐美 USA)
 */

export type DisneyParkId = 'tokyo' | 'hongkong' | 'shanghai' | 'usa';

export interface ParkTierInfo {
  tier: 'cheap' | 'moderate' | 'expensive';
  label: string;
  badge: string;
  localPrice: number;
  description: string;
}

export interface ParkRideInfo {
  name: string;
  zone: string;
  avgWait: string;
  fastPass: string;
  note: string;
}

export interface ParkConfig {
  id: DisneyParkId;
  name: string;
  shortName: string;
  englishName: string;
  country: string;
  flag: string;
  currencyCode: 'JPY' | 'HKD' | 'CNY' | 'USD';
  currencySymbol: string;
  currencyName: string;
  defaultRate: number; // 換算台幣基準
  ratePrefix: string;
  tagline: string;
  highlightsBadge: string;
  newZoneName: string;
  subParks: string[];
  subParkRides?: Record<number, ParkRideInfo[]>; // 依分園/焦點園區切換之 TOP 5 設施清單
  bookingWindow: string; // 開賣時間規則說明
  bookingRulesSummary: string;
  features: string[];
  tiers: ParkTierInfo[];
  topRides: ParkRideInfo[];
  klookUrl: string;
  kkdayUrl: string;
  officialUrl: string;
  klookPromoCode: string;
  klookPromoDesc: string;
  kkdayBonus: string;
  accentColor: string;
  gradient: string;
}

export const DISNEY_PARKS: Record<DisneyParkId, ParkConfig> = {
  tokyo: {
    id: 'tokyo',
    name: '東京迪士尼度假區',
    shortName: '東京',
    englishName: 'Tokyo Disney Resort',
    country: '日本 (Japan)',
    flag: '🇯🇵',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    currencyName: '日圓',
    defaultRate: 0.2058,
    ratePrefix: 'JP 1 JPY',
    tagline: '雙園夢幻奇蹟 · 全新「夢幻泉鄉」盛大迎賓',
    highlightsBadge: '🌊 夢幻泉鄉 Fantasy Springs 熱賣中',
    newZoneName: '東京迪士尼海洋 · 夢幻泉鄉 (Fantasy Springs)',
    subParks: ['🏰 東京迪士尼樂園 (Land)', '🌋 東京迪士尼海洋 (Sea)'],
    bookingWindow: '入園前 2 個月 (60天) 台灣 13:00 每日準時開賣',
    bookingRulesSummary: '採指定入園日預約制，現場已無實體售票窗口。熱門週末與跨年萬聖門票極易於開賣首日售罄。',
    features: [
      '365天全年無休，淡季平日享全年月最低票價',
      '全新第 8 大主題園區「夢幻泉鄉」需領取 Standby Pass 或 DPA 入園',
      '支援台幣扣款與 LINE Pay / 街口支付，秒發電子 QR Code',
    ],
    tiers: [
      { tier: 'cheap', label: '💰 最便宜', badge: 'Tier 1 / 2 省錢日', localPrice: 8900, description: '淡季平日（週二至週四），票價全月最低' },
      { tier: 'moderate', label: '⚖️ 普通適中', badge: 'Tier 2 / 3 一般日', localPrice: 9900, description: '週五、週一或次尖峰週末' },
      { tier: 'expensive', label: '🚨 極貴/連假', badge: 'Tier 4 超級高峰', localPrice: 10900, description: '週六熱門日、日本國定假日與年末年始' },
    ],
    topRides: [
      { name: '美女與野獸「城堡奇緣」', zone: '陸地 · 夢幻樂園', avgWait: '80~120分', fastPass: 'DPA 支援', note: '超經典旋轉茶杯與沉浸式電影動畫' },
      { name: '冰雪奇緣「魔雪奇幻之旅」', zone: '海洋 · 夢幻泉鄉', avgWait: '90~150分', fastPass: 'DPA / SP', note: '2024全新爆款，安娜艾莎動態偶震撼' },
      { name: '翱翔：夢幻奇航', zone: '海洋 · 地中海港灣', avgWait: '70~110分', fastPass: 'DPA 支援', note: '五感飛行體驗，長輩小孩皆熱愛' },
      { name: '驚魂古塔', zone: '海洋 · 美國海濱', avgWait: '60~90分', fastPass: 'DPA 支援', note: '微刺激自由落體跳樓機' },
      { name: '巨雷山', zone: '陸地 · 西部樂園', avgWait: '50~80分', fastPass: '40週年免費PP', note: '老少咸宜荒野採礦列車' },
    ],
    subParkRides: {
      0: [
        { name: '美女與野獸「城堡奇緣」', zone: '陸地 · 夢幻樂園', avgWait: '80~120分', fastPass: 'DPA 支援', note: '超經典旋轉茶杯與沉浸式電影動畫，經典必衝' },
        { name: '太空山 (Space Mountain)', zone: '陸地 · 明日世界', avgWait: '60~90分', fastPass: '40週年免費PP', note: '2027全新升級前必搭經典高速室內雲霄飛車' },
        { name: '巨雷山 (Big Thunder Mountain)', zone: '陸地 · 西部樂園', avgWait: '50~80分', fastPass: '40週年免費PP', note: '荒野採礦狂飆列車，老少咸宜' },
        { name: '飛濺山 (Splash Mountain)', zone: '陸地 · 動物天地', avgWait: '60~95分', fastPass: '40週年免費PP', note: '穿越百畝森林最後大落差俯衝瀑布' },
        { name: '幽靈公館 (Haunted Mansion)', zone: '陸地 · 夢幻樂園', avgWait: '35~60分', fastPass: '40週年免費PP', note: '萬聖聖誕傑克變裝特別版最搶手' },
      ],
      1: [
        { name: '冰雪奇緣「魔雪奇幻之旅」', zone: '海洋 · 夢幻泉鄉', avgWait: '90~150分', fastPass: 'DPA / SP', note: '2024全新爆款，安娜艾莎動態偶震撼' },
        { name: '翱翔：夢幻奇航 (Soaring)', zone: '海洋 · 地中海港灣', avgWait: '70~110分', fastPass: 'DPA 支援', note: '五感飛行體驗，長輩小孩皆熱愛' },
        { name: '驚魂古塔 (Tower of Terror)', zone: '海洋 · 美國海濱', avgWait: '60~90分', fastPass: 'DPA 支援', note: '微刺激自由落體跳樓機' },
        { name: '地心探險之旅', zone: '海洋 · 神秘島', avgWait: '50~80分', fastPass: 'DPA 支援', note: '地心蒸汽採礦車急速衝出火山口' },
        { name: '印第安納瓊斯冒險旅程', zone: '海洋 · 失落河三角洲', avgWait: '45~75分', fastPass: '40週年免費PP', note: '水晶骷髏頭魔宮急速吉普車狂飆' },
      ],
    },
    klookUrl: 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/',
    kkdayUrl: 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-ticket',
    officialUrl: 'https://www.tokyodisneyresort.jp/tc/ticket/',
    klookPromoCode: '',
    klookPromoDesc: '',
    kkdayBonus: '送日本 3GB 上網 eSIM 體驗序號',
    accentColor: '#4f46e5',
    gradient: 'from-indigo-900 via-indigo-800 to-blue-900',
  },
  hongkong: {
    id: 'hongkong',
    name: '香港迪士尼樂園',
    shortName: '香港',
    englishName: 'Hong Kong Disneyland',
    country: '香港 (Hong Kong)',
    flag: '🇭🇰',
    currencyCode: 'HKD',
    currencySymbol: 'HK$',
    currencyName: '港幣',
    defaultRate: 4.152,
    ratePrefix: 'HK 1 HKD',
    tagline: '全球首座《冰雪奇緣》魔雪奇緣世界 · 飛行 1.5 小時即達',
    highlightsBadge: '❄️ 全球首座「魔雪奇緣世界」強勢引爆',
    newZoneName: '魔雪奇緣世界 (World of Frozen)',
    subParks: ['🏰 全園通玩 (經典園區+城堡)', '❄️ 魔雪奇緣焦點 (World of Frozen)'],
    bookingWindow: '提前 3 個月至半年開放預約 · 必搶「提早入園證」',
    bookingRulesSummary: '採第 1 至第 4 級別梯次票價制。因《冰雪奇緣》園區極熱門，強烈推薦加購「提早 1 小時入園證」免排隊暢玩！',
    features: [
      '台北/高雄直飛香港僅 80 分鐘，免時差、說走就走的夢幻週末假期',
      '全球最大《冰雪奇緣》主題園區「魔雪奇緣世界」，一比一還原艾倫戴爾王國',
      '奇妙夢想城堡全新夜間匯演「迪士尼星夢光影之旅」，震撼雷射水幕煙火',
    ],
    tiers: [
      { tier: 'cheap', label: '💰 最便宜', badge: '第 1 級別 (平日)', localPrice: 639, description: '淡季週一至週四，票價最實惠（約 NT$ 2,650）' },
      { tier: 'moderate', label: '⚖️ 普通適中', badge: '第 2/3 級別 (週末)', localPrice: 719, description: '一般週末、部分週五與中度人潮日（約 NT$ 2,980~3,310）' },
      { tier: 'expensive', label: '🚨 極貴/假期', badge: '第 4 級別 (連假高峰)', localPrice: 879, description: '農曆春節、復活節、萬聖與耶誕跨年高峰日（約 NT$ 3,650）' },
    ],
    topRides: [
      { name: '魔雪奇幻之旅 (Frozen Ever After)', zone: '魔雪奇緣世界', avgWait: '60~100分', fastPass: '提早入園 / 尊享卡', note: '搭乘木船穿越冰雪皇宮，全場大合唱 Let It Go' },
      { name: '雪嶺滑雪橇 (Wandering Oaken)', zone: '魔雪奇緣世界', avgWait: '50~90分', fastPass: '尊享卡 支援', note: '穿梭艾倫戴爾森林雪山的合家歡過山車' },
      { name: '灰熊山極速礦車', zone: '灰熊山谷', avgWait: '30~60分', fastPass: '尊享卡 支援', note: '超驚喜倒退俯衝雙軌礦車，必玩刺激首選' },
      { name: '迷離大宅 (Mystic Manor)', zone: '迷離莊園', avgWait: '25~50分', fastPass: '無軌移動車', note: '香港獨家原創奇幻冒險，音樂由 Danny Elfman 操刀' },
      { name: '星戰極速穿梭', zone: '明日世界', avgWait: '30~60分', fastPass: '室內雲霄飛車', note: '黑暗太空星戰激戰，超音速疾馳' },
    ],
    subParkRides: {
      0: [
        { name: '魔雪奇幻之旅 (Frozen Ever After)', zone: '魔雪奇緣世界', avgWait: '60~100分', fastPass: '提早入園 / 尊享卡', note: '搭乘木船穿越冰雪皇宮，全場大合唱 Let It Go' },
        { name: '雪嶺滑雪橇 (Wandering Oaken)', zone: '魔雪奇緣世界', avgWait: '50~90分', fastPass: '尊享卡 支援', note: '穿梭艾倫戴爾森林雪山的合家歡過山車' },
        { name: '灰熊山極速礦車', zone: '灰熊山谷', avgWait: '30~60分', fastPass: '尊享卡 支援', note: '超驚喜倒退俯衝雙軌礦車，必玩刺激首選' },
        { name: '迷離大宅 (Mystic Manor)', zone: '迷離莊園', avgWait: '25~50分', fastPass: '無軌移動車', note: '香港獨家原創奇幻冒險，音樂由 Danny Elfman 操刀' },
        { name: '星戰極速穿梭', zone: '明日世界', avgWait: '30~60分', fastPass: '室內雲霄飛車', note: '黑暗太空星戰激戰，超音速疾馳' },
      ],
      1: [
        { name: '魔雪奇幻之旅 (Frozen Ever After)', zone: '魔雪奇緣世界', avgWait: '60~100分', fastPass: '提早入園 / 尊享卡', note: '艾莎魔法城堡、精緻人偶眨眼對話，壓軸水流俯衝' },
        { name: '雪嶺滑雪橇 (Wandering Oaken)', zone: '魔雪奇緣世界', avgWait: '50~90分', fastPass: '提早入園 / 尊享卡', note: '奧肯商人精心設計雪橇，登頂眺望艾倫戴爾全景' },
        { name: '森林小天地 (Playhouse in the Woods)', zone: '魔雪奇緣世界', avgWait: '20~35分', fastPass: '預約等候卡', note: '安娜艾莎近距離互動劇場，沉浸式四季魔法' },
        { name: '阿德爾港畔拍照與小鎮漫步', zone: '魔雪奇緣世界', avgWait: '免排隊', fastPass: '街景體驗', note: '一比一還原冰雪小鎮，享用極光提拉米蘇與北歐甜點' },
        { name: '友誼噴泉與鐘樓光影匯演', zone: '魔雪奇緣世界', avgWait: '免排隊', fastPass: '定時演出', note: '艾莎用冰雪魔法點亮鐘樓，夜間如夢似幻' },
      ],
    },
    klookUrl: 'https://www.klook.com/zh-TW/activity/39-hong-kong-disneyland-resort-ticket-hong-kong/',
    kkdayUrl: 'https://www.kkday.com/zh-tw/product/18070',
    officialUrl: 'https://www.hongkongdisneyland.com/zh-hk/',
    klookPromoCode: 'HKDISNEYTW',
    klookPromoDesc: '滿 NT$ 3,000 現折 NT$ 200 折扣碼',
    kkdayBonus: '送港澳 3GB 高速 eSIM 或港鐵一日券折扣',
    accentColor: '#0284c7',
    gradient: 'from-sky-900 via-blue-900 to-indigo-950',
  },
  shanghai: {
    id: 'shanghai',
    name: '上海迪士尼度假區',
    shortName: '上海',
    englishName: 'Shanghai Disney Resort',
    country: '中國大陸 (Shanghai)',
    flag: '🇨🇳',
    currencyCode: 'CNY',
    currencySymbol: '¥',
    currencyName: '人民幣',
    defaultRate: 4.455,
    ratePrefix: 'CN 1 CNY',
    tagline: '全球最大奇幻童話城堡 · 全新「瘋狂動物城」狂歡狂飆',
    highlightsBadge: '🦊 全球首座「瘋狂動物城」震撼熱賣中',
    newZoneName: '瘋狂動物城 (Zootopia)',
    subParks: ['🏰 全園通玩 (奇幻城堡/創極速光輪)', '🦊 瘋狂動物城焦點 (Zootopia)'],
    bookingWindow: '提前 30~60 天開放預約 · 採台胞證實名制',
    bookingRulesSummary: '採四級票價制（常規/特別常規/高峰/特別高峰）。需以台胞證實名購票。平台常有提前 10 天早鳥票現折促銷！',
    features: [
      '全球最大、最高、最具互動性的「奇幻童話城堡」，夜間奇夢之光幻影秀氣勢磅礡',
      '全球首創《動物方城市》瘋狂動物城：熱力追蹤無軌乘騎系統，化身警員追捕壞蛋',
      '科技感封頂的「創極速光輪 (TRON)」光輪摩托車，感受未來世界音速俯衝',
    ],
    tiers: [
      { tier: 'cheap', label: '💰 最便宜', badge: '常規日 (淡季平日)', localPrice: 475, description: '非假期的週二至週四，票價最低（約 NT$ 2,110）' },
      { tier: 'moderate', label: '⚖️ 普通適中', badge: '特別常規日/高峰日', localPrice: 599, description: '週五週日、暑期非尖峰日（約 NT$ 2,660~3,200）' },
      { tier: 'expensive', label: '🚨 極貴/高峰', badge: '特別高峰日 (黃金週)', localPrice: 799, description: '十一國慶連假、春節春假超級客滿日（約 NT$ 3,555）' },
    ],
    topRides: [
      { name: '瘋狂動物城：熱力追蹤', zone: '瘋狂動物城', avgWait: '70~120分', fastPass: '尊享卡 DPA', note: '2024最新全球獨家無軌乘騎，茱蒂與尼克親自帶隊' },
      { name: '創極速光輪 (TRON Lightcycle)', zone: '明日世界', avgWait: '50~90分', fastPass: '尊享卡 DPA', note: '全球迪士尼最快過山車，趴姿光輪摩托聲光超絕' },
      { name: '加勒比海盜：沉落寶藏之戰', zone: '寶藏灣', avgWait: '40~70分', fastPass: '水上漂流', note: '超巨型沉浸式 IMAX 球幕與船體旋轉，公認全球第一' },
      { name: '七個小矮人礦山車', zone: '夢幻世界', avgWait: '60~95分', fastPass: '尊享卡 DPA', note: '木搖擺礦車穿梭寶石山洞，排隊人氣王' },
      { name: '雷鳴山漂流', zone: '探險島', avgWait: '50~85分', fastPass: '水上激流', note: '深入黑暗山洞偶遇巨獸，需自備雨衣' },
    ],
    subParkRides: {
      0: [
        { name: '瘋狂動物城：熱力追蹤', zone: '瘋狂動物城', avgWait: '70~120分', fastPass: '尊享卡 DPA', note: '2024最新無軌警車大破案，茱蒂尼克同車狂飆' },
        { name: '創極速光輪 (TRON)', zone: '明日世界', avgWait: '50~90分', fastPass: '尊享卡 DPA', note: '全球最快趴姿光輪摩托，未來感聲光爆棚' },
        { name: '加勒比海盜：沉落寶藏之戰', zone: '寶藏灣', avgWait: '40~70分', fastPass: '水上巨幕', note: '超巨型沉浸式巨幕與船體旋轉，公認全球最佳' },
        { name: '七個小矮人礦山車', zone: '夢幻世界', avgWait: '60~95分', fastPass: '尊享卡 DPA', note: '搖擺木礦車穿梭寶石山洞，排隊人氣第一' },
        { name: '飛躍地平線 (Soaring)', zone: '探險島', avgWait: '60~100分', fastPass: '尊享卡 DPA', note: '超震撼 4K 巨幕五感翱翔，俯瞰全球世界奇觀' },
      ],
      1: [
        { name: '瘋狂動物城：熱力追蹤', zone: '瘋狂動物城', avgWait: '70~120分', fastPass: '尊享卡 DPA', note: '全球首創無軌乘騎警車，親歷追捕壞蛋綿羊' },
        { name: '警局大堂遇見豹警官', zone: '瘋狂動物城', avgWait: '排隊互動', fastPass: '拍照打卡', note: '豹警官手拿甜甜圈生動眨眼打招呼，神級還原' },
        { name: '大象甜品店「爪爪棒冰」', zone: '瘋狂動物城', avgWait: '15~30分', fastPass: '美食打卡', note: '經典紅莓山楂爪爪冰棒超逼真，人手一支' },
        { name: '露露精品店市民服飾打卡', zone: '瘋狂動物城', avgWait: '免排隊', fastPass: '主題街區', note: '北極熊保鏢與露露大小姐日常生活櫥窗與商鋪' },
        { name: '動物城天際線與公寓窗口互動', zone: '瘋狂動物城', avgWait: '免排隊', fastPass: '彩蛋互動', note: '長頸鹿、倉鼠市民定時探頭對話，街景彩蛋滿滿' },
      ],
    },
    klookUrl: 'https://www.klook.com/zh-TW/activity/2128-shanghai-disneyland-resort-ticket-shanghai/',
    kkdayUrl: 'https://www.kkday.com/zh-tw/product/7076',
    officialUrl: 'https://www.shanghaidisneyresort.com/',
    klookPromoCode: 'SHDISNEYTW',
    klookPromoDesc: '早鳥預訂滿額現折 NT$ 150',
    kkdayBonus: '送上海地鐵一日票乘車折扣',
    accentColor: '#b45309',
    gradient: 'from-amber-950 via-slate-900 to-indigo-950',
  },
  usa: {
    id: 'usa',
    name: '美國加州與奧蘭多迪士尼',
    shortName: '美國',
    englishName: 'Disneyland California & Disney World',
    country: '美國 (USA)',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyName: '美元',
    defaultRate: 32.5,
    ratePrefix: 'US 1 USD',
    tagline: '迪士尼世界夢想發源地 · 星際大戰與阿凡達世界',
    highlightsBadge: '🚀 加州星際大戰 + 奧蘭多阿凡達',
    newZoneName: '星際大戰：銀河邊緣 (Star Wars: Galaxy\'s Edge)',
    subParks: ['🏰 加州迪士尼樂園 (Disneyland)', '🎡 加州冒險樂園 (California Adventure)', '🌐 奧蘭多四大園區 (Disney World)'],
    bookingWindow: '提前 120 天開放預約 · 需 Park Pass 預約',
    bookingRulesSummary: '採多日票（Multi-Day Ticket）與 1-Day Tier 1~6 票價制。購買門票後需至官網綁定日期預約（Park Pass Reservation）。',
    features: [
      '全球第一座加州迪士尼樂園（華特迪士尼唯一親自走過的原創樂園）',
      '奧蘭多迪士尼世界包含 4 大主題樂園 + 2 大水上樂園，面積等同舊金山市區',
      '阿凡達飛行體驗（Flight of Passage）與星戰抵抗組織崛起（Rise of the Resistance）',
    ],
    tiers: [
      { tier: 'cheap', label: '💰 最便宜', badge: 'Tier 1 (淡季平日)', localPrice: 104, description: '加州非高峰平日一日票（約 NT$ 3,380）' },
      { tier: 'moderate', label: '⚖️ 普通適中', badge: 'Tier 2~4 (一般日)', localPrice: 134, description: '一般週末與常規日（約 NT$ 4,350）' },
      { tier: 'expensive', label: '🚨 極貴/連假', badge: 'Tier 5~6 (超級旺季)', localPrice: 194, description: '耶誕感恩跨年長假（約 NT$ 6,300）' },
    ],
    topRides: [
      { name: '星際大戰：抵抗組織崛起', zone: '星際大戰：銀河邊緣', avgWait: '90~180分', fastPass: 'Lightning Lane', note: '全球規模最大乘騎，身歷其境被第一軍團俘虜逃脫' },
      { name: '阿凡達：飛行之旅 (Avatar)', zone: '動物王國 · 潘朵拉', avgWait: '100~160分', fastPass: 'Lightning Lane', note: '騎乘斑溪獸俯衝潘朵拉懸浮山，神作級評分' },
      { name: '星際異攻隊：重返宇宙', zone: '未來世界 Epcot', avgWait: '80~140分', fastPass: '倒退發射過山車', note: '隨洗腦金曲 360 度太空旋轉過山車' },
      { name: '汽車總動員「水車鎮賽車」', zone: '加州冒險樂園', avgWait: '70~110分', fastPass: '熱門賽車', note: '穿梭 66 號公路峽谷，雙車極速並行狂飆競速' },
    ],
    subParkRides: {
      0: [
        { name: '星際大戰：抵抗組織崛起', zone: '星戰：銀河邊緣', avgWait: '90~150分', fastPass: 'Lightning Lane', note: '身歷其境被第一軍團滅星艦俘虜，史詩級震撼逃脫' },
        { name: '千年鷹號：走私者航程', zone: '星戰：銀河邊緣', avgWait: '60~90分', fastPass: 'Lightning Lane', note: '親自擔任駕駛員開千年鷹穿梭超空間走私貨物' },
        { name: '太空山 (Space Mountain)', zone: '明日世界', avgWait: '50~80分', fastPass: 'Lightning Lane', note: '黑暗太空中急速穿梭，原汁原味經典過山車' },
        { name: '印第安納瓊斯冒險：禁忌之眼', zone: '冒險世界', avgWait: '55~85分', fastPass: 'Lightning Lane', note: '暴走越野吉普車闖入受詛咒神廟，驚險刺激' },
        { name: '馬特洪峰雪橇 (Matterhorn)', zone: '夢幻樂園', avgWait: '45~75分', fastPass: '單人通道', note: '華特迪士尼親自監製，雙軌雪橇大戰雪怪' },
      ],
      1: [
        { name: '汽車總動員「水車鎮賽車」', zone: '水車鎮', avgWait: '70~110分', fastPass: 'Lightning Lane', note: '穿梭 66 號公路紅岩峽谷，雙車極速並行狂飆' },
        { name: '復仇者聯盟：蛛絲發射大冒險', zone: '復仇者校園', avgWait: '60~95分', fastPass: 'Lightning Lane', note: '手勢感應噴射蜘蛛絲捕捉失控小蜘蛛機器人' },
        { name: '星際異攻隊：逃出魔窟', zone: '好萊塢樂園', avgWait: '60~100分', fastPass: 'Lightning Lane', note: '狂暴自由落體跳樓機結合洗腦經典搖滾樂' },
        { name: '超人特攻隊超速過山車', zone: '皮克斯碼頭', avgWait: '40~70分', fastPass: 'Lightning Lane', note: '加州最長彈射彈跳雲霄飛車，音速追逐小傑' },
        { name: '皮克斯摩天輪 (搖晃車廂)', zone: '皮克斯碼頭', avgWait: '30~55分', fastPass: '經典地標', note: '極高刺激度的軌道滑動搖晃車廂，俯瞰加州海岸' },
      ],
      2: [
        { name: '阿凡達：飛行之旅 (Avatar)', zone: '動物王國 · 潘朵拉', avgWait: '100~160分', fastPass: 'Lightning Lane', note: '騎乘斑溪獸俯衝潘朵拉懸浮山，公認迪士尼神作' },
        { name: '星際異攻隊：重返宇宙', zone: '未來世界 Epcot', avgWait: '80~140分', fastPass: '虛擬隊列/LL', note: '倒退高速發射 360 度旋轉室內過山車，音樂嗨翻全場' },
        { name: '星際大戰：抵抗組織崛起', zone: '好萊塢影城', avgWait: '90~150分', fastPass: 'Lightning Lane', note: '四合一無軌乘騎、巨型 AT-AT 機甲走廊超逼真' },
        { name: '七個小矮人礦山車', zone: '神奇王國', avgWait: '70~110分', fastPass: 'Lightning Lane', note: '全家大小最愛搖擺採礦車，穿越璀璨寶石礦坑' },
        { name: '創極速光輪 TRON Lightcycle', zone: '神奇王國', avgWait: '60~100分', fastPass: '虛擬隊列/LL', note: '美東最新落成趴姿光輪摩托，音速破風狂飆' },
      ],
    },
    klookUrl: 'https://www.klook.com/zh-TW/activity/3969-disneyland-resort-california/',
    kkdayUrl: 'https://www.kkday.com/zh-tw/product/19923',
    officialUrl: 'https://disneyland.disney.go.com/',
    klookPromoCode: 'USADISNEYTW',
    klookPromoDesc: '美加旅遊滿萬折千折扣碼',
    kkdayBonus: '送美國 T-Mobile 無限上網卡折抵',
    accentColor: '#dc2626',
    gradient: 'from-blue-950 via-slate-900 to-red-950',
  },
};

export const PARKS_LIST: ParkConfig[] = [
  DISNEY_PARKS.tokyo,
  DISNEY_PARKS.hongkong,
  DISNEY_PARKS.shanghai,
  DISNEY_PARKS.usa,
];

