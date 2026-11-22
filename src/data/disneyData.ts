/**
 * 全球迪士尼門票、人潮預測與設施維修資料庫 (東京 Tokyo / 香港 Hong Kong / 上海 Shanghai / 美國 USA)
 */
import { DisneyParkId } from './parksConfig';

export interface MaintenanceItem {
  park: 'land' | 'sea' | 'both';
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  note?: string;
}

export interface DayData {
  date: string; // 'YYYY-MM-DD'
  month: number; // 1-12
  day: number;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  weekdayStr: string; // 週一, 週二, etc.
  parkId: DisneyParkId;
  currencySymbol: string;
  currencyCode: string;
  localPriceAdult: number;
  basePriceJpy: {
    adult: number;
    junior: number;
    child: number;
  };
  tier: 'cheap' | 'moderate' | 'expensive';
  tierLabel: string;
  tierBadge: string;
  crowdLevel: number; // 0-100
  crowdStatus: '舒適輕鬆' | '普通適中' | '人潮偏多' | '極度爆滿';
  crowdColor: string;
  waitTimeLand: {
    beautyAndBeast: number; // minutes or ride 1
    spaceMountain: number;
    splashMountain: number;
  };
  waitTimeSea: {
    frozenJourney: number; // minutes or ride 2
    soaring: number;
    towerOfTerror: number;
  };
  weather: {
    temp: string;
    condition: string;
    icon: string;
    rainProb: number;
    windSpeed: number; // m/s
    windAlert: string;
  };
  eventNote?: string;
  bookingStatus: 'available' | 'upcoming';
  saleOpenDate: string; // YYYY-MM-DD
  saleOpenLabel: string;
}

export const PARK_MAINTENANCE: Record<DisneyParkId, MaintenanceItem[]> = {
  tokyo: [
    { park: 'land', name: '巨雷山 (Big Thunder Mountain)', startDate: '2026-11-05', endDate: '2026-11-18', note: '年度定期軌道深度保養' },
    { park: 'land', name: '小飛象 (Dumbo The Flying Elephant)', startDate: '2026-11-20', endDate: '2026-11-27', note: '機械檢查與彩繪更新' },
    { park: 'land', name: '幽靈公館 (Haunted Mansion)', startDate: '2027-01-10', endDate: '2027-01-22', note: '假期版更換為一般常規版維修' },
    { park: 'sea', name: '地心探險之旅 (Journey to the Center)', startDate: '2026-11-10', endDate: '2026-11-24', note: '地底熔岩特效例行檢修' },
    { park: 'sea', name: '印第安納瓊斯冒險旅程 (Indiana Jones)', startDate: '2026-12-01', endDate: '2026-12-12', note: '吉普車系統感應線路檢驗' },
    { park: 'sea', name: '海底巡遊艇：尼莫＆好友的海洋世界', startDate: '2027-01-15', endDate: '2027-01-28', note: '投影設備更新' },
  ],
  hongkong: [
    { park: 'land', name: '灰熊山極速礦車 (Big Grizzly)', startDate: '2026-11-12', endDate: '2026-11-25', note: '雙向軌道煞車系統年檢' },
    { park: 'land', name: '森林河流之旅 (Jungle River Cruise)', startDate: '2026-12-03', endDate: '2026-12-14', note: '航道水質淨化與特效檢修' },
    { park: 'land', name: '星戰極速穿梭 (Hyperspace Mountain)', startDate: '2027-01-08', endDate: '2027-01-19', note: '室內聲光與發射系統保養' },
    { park: 'land', name: '魔雪奇幻之旅 (Frozen Ever After)', startDate: '2027-02-22', endDate: '2027-02-28', note: '動態偶例行微調與燈光維護' },
  ],
  shanghai: [
    { park: 'land', name: '雷鳴山漂流 (Roaring Rapids)', startDate: '2026-11-15', endDate: '2026-11-30', note: '冬季防凍排水與安全檢修' },
    { park: 'land', name: '創極速光輪 (TRON Lightcycle)', startDate: '2026-12-08', endDate: '2026-12-18', note: '光輪車電磁彈射系統深度保養' },
    { park: 'land', name: '七個小矮人礦山車 (Seven Dwarfs)', startDate: '2027-01-12', endDate: '2027-01-23', note: '擺動轉向機構潤滑檢測' },
    { park: 'land', name: '熱力追蹤 (Zootopia: Hot Pursuit)', startDate: '2027-02-18', endDate: '2027-02-24', note: '無軌磁感應導航常規校準' },
  ],
  usa: [
    { park: 'land', name: '星際大戰：抵抗組織崛起', startDate: '2026-11-10', endDate: '2026-11-20', note: '全沉浸無軌車載系統例行保養' },
    { park: 'both', name: '太空山 (Space Mountain)', startDate: '2027-01-15', endDate: '2027-01-30', note: '軌道結構定期安全檢查' },
  ],
  paris: [
    { park: 'land', name: '巨雷山 (Big Thunder Mountain)', startDate: '2026-11-12', endDate: '2026-11-22', note: '湖心礦山軌道冬季例行安全檢修' },
    { park: 'sea', name: '料理鼠王大冒險 (Ratatouille)', startDate: '2027-01-10', endDate: '2027-01-20', note: '4D 投影與無軌車體定期保養' },
  ],
};

export const MAINTENANCE_LIST = PARK_MAINTENANCE.tokyo;

// 輔助函式：產生指定年份、月份與樂園的日期資料
export function generateMonthData(year: number, month: number, parkId: DisneyParkId = 'tokyo'): DayData[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekdayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const list: DayData[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const weekday = dateObj.getDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const isWeekend = weekday === 0 || weekday === 6;
    const isFriday = weekday === 5;
    const isMonday = weekday === 1;

    // 節慶假期定義
    const isDecChristmas = month === 12 && (d === 24 || d === 25);
    const isYearEnd = (month === 12 && d >= 28) || (month === 1 && d <= 3);
    const isFebSpringFestival = month === 2 && (d >= 5 && d <= 15);
    const isHalloweenPeak = month === 10 && d >= 25;

    let tier: 'cheap' | 'moderate' | 'expensive' = 'cheap';
    let crowd = 35;
    let event = '';

    // 樂園當地幣別與價格計算
    let localPrice = 8900;
    let currencySymbol = '¥';
    let currencyCode = 'JPY';

    if (parkId === 'hongkong') {
      currencySymbol = 'HK$';
      currencyCode = 'HKD';
      if (isYearEnd || isDecChristmas || isFebSpringFestival) {
        tier = 'expensive';
        localPrice = 879; // 第 4 級別
        crowd = 92;
        event = isFebSpringFestival ? '🧨 香港春節迎春花開慶典' : '🎄 魔雪奇緣冬季飄雪聖誕狂歡';
      } else if (isWeekend || isFriday || month === 7 || month === 8) {
        tier = 'moderate';
        localPrice = 719; // 第 2/3 級別
        crowd = isWeekend ? 75 : 60;
        event = isWeekend ? '周末奇妙音樂嘉年華' : '暑期全家出遊日';
      } else {
        tier = 'cheap';
        localPrice = 639; // 第 1 級別 (平日特惠)
        crowd = 36;
        event = '平日超值暢遊魔雪奇緣';
      }
    } else if (parkId === 'shanghai') {
      currencySymbol = '¥';
      currencyCode = 'CNY';
      const isNationalDay = month === 10 && (d >= 1 && d <= 7); // 十一黃金週
      const isMayDay = month === 5 && (d >= 1 && d <= 5); // 五一連假
      if (isNationalDay || isMayDay || isFebSpringFestival || isYearEnd) {
        tier = 'expensive';
        localPrice = 799; // 特別高峰日
        crowd = 96;
        event = isNationalDay ? '🇨🇳 十一國慶黃金週客滿高峰' : isFebSpringFestival ? '🧨 新春金龍狂歡慶' : '🎍 跨年奇夢之光幻影盛典';
      } else if (isWeekend || month === 7 || month === 8) {
        tier = 'moderate';
        localPrice = 599; // 特別常規日 / 高峰日
        crowd = isWeekend ? 78 : 68;
        event = isWeekend ? '週末瘋狂動物城熱力暢遊' : '暑期家庭客流';
      } else {
        tier = 'cheap';
        localPrice = 475; // 常規日 (淡季平日)
        crowd = 34;
        event = '平日早鳥超值特惠日';
      }
    } else if (parkId === 'usa') {
      currencySymbol = '$';
      currencyCode = 'USD';
      if (isYearEnd || isDecChristmas || (month === 7 && d <= 6)) {
        tier = 'expensive';
        localPrice = 194;
        crowd = 95;
        event = '🇺🇸 美國國慶與跨年狂歡假期';
      } else if (isWeekend || isFriday) {
        tier = 'moderate';
        localPrice = 134;
        crowd = 70;
        event = '週末星際大戰抵抗軍日';
      } else {
        tier = 'cheap';
        localPrice = 104;
        crowd = 40;
        event = '平日超值 Tier 1 暢遊日';
      }
    } else if (parkId === 'paris') {
      currencySymbol = '€';
      currencyCode = 'EUR';
      if (isYearEnd || isDecChristmas || month === 7 || month === 8) {
        tier = 'expensive';
        localPrice = 105;
        crowd = 92;
        event = month === 7 || month === 8 ? '🇫🇷 歐洲盛夏假期煙火高峰' : '🎄 巴黎冬季雪花聖誕慶典';
      } else if (isWeekend || isFriday) {
        tier = 'moderate';
        localPrice = 79;
        crowd = 68;
        event = '週末粉紅城堡夢幻雙園日';
      } else {
        tier = 'cheap';
        localPrice = 56;
        crowd = 38;
        event = '平日歐元超值暢遊日';
      }
    } else {
      // 預設為 Tokyo
      currencySymbol = '¥';
      currencyCode = 'JPY';
      const isNovHoliday = month === 11 && (d === 3 || d === 23 || (d >= 21 && d <= 23));
      const isJanHoliday = month === 1 && (d >= 9 && d <= 11);
      const isMarSpringBreak = month === 3 && (d >= 19 || d === 20);
      const isAprEaster = month === 4 && (d <= 5 || d === 29);
      const isMayGoldenWeek = month === 5 && (d >= 1 && d <= 6);
      const isBonFestival = month === 8 && (d >= 10 && d <= 16);
      const isSummerVacation = (month === 7 && d >= 18) || (month === 8 && !isBonFestival);
      const isSilverWeek = month === 9 && (d >= 18 && d <= 23);

      if (isYearEnd || isDecChristmas || isMayGoldenWeek || isBonFestival) {
        localPrice = 12400;
        tier = 'expensive';
        crowd = Math.min(99, 92 + (d % 6) * 1.5);
        event = isMayGoldenWeek ? '🎏 日本黃金週超級高峰' : isBonFestival ? '🏮 日本盂蘭盆節高峰' : isYearEnd ? '🎍 跨年年始擁擠高峰' : '🎄 聖誕夢幻特展高峰';
      } else if (isFebSpringFestival || isMarSpringBreak || isHalloweenPeak) {
        localPrice = isWeekend ? 11900 : 10900;
        tier = 'expensive';
        crowd = isFebSpringFestival ? 89 : isHalloweenPeak ? 91 : 92;
        event = isFebSpringFestival ? '🧨 春節寒假海外旅客高峰' : isHalloweenPeak ? '🎃 萬聖節化妝舞會高峰' : '🌸 畢業春假狂歡季';
      } else if (isNovHoliday || isJanHoliday || isAprEaster || isSummerVacation || isSilverWeek) {
        localPrice = isWeekend ? 11400 : 10400;
        tier = 'expensive';
        crowd = isSummerVacation ? 86 : isSilverWeek ? 85 : 82;
        event = isSummerVacation ? '🏖️ 夏日水花祭典' : isSilverWeek ? '🎑 9月白銀週連假' : isAprEaster ? '🐰 櫻花滿開春季賞櫻熱潮' : '🎌 日本國定連續假期';
      } else if (isWeekend) {
        localPrice = weekday === 6 ? 10900 : 10400;
        tier = weekday === 6 ? 'expensive' : 'moderate';
        crowd = weekday === 6 ? 82 : 72;
        event = weekday === 6 ? '週六熱門客滿日' : '週日出遊日';
      } else if (isFriday || isMonday) {
        localPrice = 9900;
        tier = 'moderate';
        crowd = 55;
      } else {
        localPrice = d % 3 === 0 ? 9400 : 8900;
        tier = 'cheap';
        crowd = 28 + (d % 8);
      }
    }

    const adultPrice = localPrice;
    const juniorPrice = Math.round(localPrice * 0.82);
    const childPrice = Math.round(localPrice * 0.60);

    let tierLabel = '⚖️ 普通';
    let tierBadge = '次尖峰 / 週末';
    if (tier === 'cheap') {
      tierLabel = '💰 最便宜';
      tierBadge = '淡季超值日';
    } else if (tier === 'expensive') {
      tierLabel = '🚨 極貴/人超多';
      tierBadge = '旺季 / 週末高價';
    }

    let crowdStatus: '舒適輕鬆' | '普通適中' | '人潮偏多' | '極度爆滿' = '普通適中';
    let crowdColor = 'text-amber-700 bg-amber-50';
    if (crowd < 40) {
      crowdStatus = '舒適輕鬆';
      crowdColor = 'text-emerald-700 bg-emerald-50';
    } else if (crowd <= 65) {
      crowdStatus = '普通適中';
      crowdColor = 'text-sky-700 bg-sky-50';
    } else if (crowd <= 80) {
      crowdStatus = '人潮偏多';
      crowdColor = 'text-orange-700 bg-orange-50';
    } else {
      crowdStatus = '極度爆滿';
      crowdColor = 'text-rose-700 bg-rose-50';
    }

    // 等待時間模擬
    const waitFactor = crowd / 50;
    const waitBeauty = Math.round(Math.max(30, 75 * waitFactor));
    const waitSpace = Math.round(Math.max(20, 50 * waitFactor));
    const waitSplash = Math.round(Math.max(20, 45 * waitFactor));
    const waitFrozen = Math.round(Math.max(40, 110 * waitFactor));
    const waitSoaring = Math.round(Math.max(35, 85 * waitFactor));
    const waitTower = Math.round(Math.max(25, 60 * waitFactor));

    // 天氣
    const windSpeed = Number((2.5 + ((d * 7) % 65) / 10).toFixed(1));
    let windAlert = '正常微風，戶外活動正常';
    if (windSpeed > 8.0) {
      windAlert = '海灣強風警戒！夜間煙火秀有取消可能';
    } else if (windSpeed > 6.0) {
      windAlert = '風速稍強，請注意隨身物品安全';
    }

    const rainProb = (d * 13) % 40;
    const tempLow = 10 + (d % 5);
    const tempHigh = 18 + (d % 6);

    // 開賣預約規則
    // 香港開放提早 3 個月至半年；上海提早 60 天；東京提早 60 天 13:00
    const saleOpenObj = new Date(year, month - 3, d);
    const saleOpenY = saleOpenObj.getFullYear();
    const saleOpenM = saleOpenObj.getMonth() + 1;
    const saleOpenD = saleOpenObj.getDate();
    const saleOpenDate = `${saleOpenY}-${String(saleOpenM).padStart(2, '0')}-${String(saleOpenD).padStart(2, '0')}`;
    const saleOpenLabel = `${saleOpenM}/${saleOpenD} 開賣`;

    // 香港開放預約窗口更寬鬆（2027年3月前大多已可訂票）
    let bookingStatus: 'available' | 'upcoming' = 'available';
    if (parkId === 'tokyo') {
      bookingStatus = dateStr <= '2027-01-03' ? 'available' : 'upcoming';
    } else if (parkId === 'shanghai') {
      bookingStatus = dateStr <= '2027-01-15' ? 'available' : 'upcoming';
    } else if (parkId === 'hongkong') {
      bookingStatus = dateStr <= '2027-03-31' ? 'available' : 'upcoming';
    } else {
      bookingStatus = dateStr <= '2027-02-28' ? 'available' : 'upcoming';
    }

    list.push({
      date: dateStr,
      month,
      day: d,
      weekday,
      weekdayStr: weekdayNames[weekday],
      parkId,
      currencySymbol,
      currencyCode,
      localPriceAdult: localPrice,
      basePriceJpy: {
        adult: adultPrice,
        junior: juniorPrice,
        child: childPrice,
      },
      tier,
      tierLabel,
      tierBadge,
      crowdLevel: crowd,
      crowdStatus,
      crowdColor,
      waitTimeLand: {
        beautyAndBeast: waitBeauty,
        spaceMountain: waitSpace,
        splashMountain: waitSplash,
      },
      waitTimeSea: {
        frozenJourney: waitFrozen,
        soaring: waitSoaring,
        towerOfTerror: waitTower,
      },
      weather: {
        temp: `${tempLow}°C ~ ${tempHigh}°C`,
        condition: rainProb > 30 ? '陰短暫雨' : rainProb > 15 ? '多雲時晴' : '晴空萬里',
        icon: rainProb > 30 ? '🌧️' : rainProb > 15 ? '⛅' : '☀️',
        rainProb,
        windSpeed,
        windAlert,
      },
      eventNote: event,
      bookingStatus,
      saleOpenDate,
      saleOpenLabel,
    });
  }

  return list;
}
