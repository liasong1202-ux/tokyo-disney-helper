import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar,
  Sparkles,
  TrendingDown,
  Wind,
  Wrench,
  ShoppingCart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  DollarSign,
  AlertTriangle,
  Users,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  Clock,
  Compass,
  Flame,
  ArrowRight,
  Bell,
  Mail,
  Zap,
  RotateCcw,
  Settings,
  X
} from 'lucide-react';
import { generateMonthData, MAINTENANCE_LIST, DayData, PARK_MAINTENANCE } from './data/disneyData';
import { DISNEY_CHARACTERS, getCharacterById, DisneyCharacter } from './data/characters';
import { DISNEY_PARKS, PARKS_LIST, DisneyParkId, ParkConfig } from './data/parksConfig';
import AdminModal from './components/AdminModal';

const FAQ_LIST = [
  {
    q: '香港迪士尼、上海迪士尼與東京迪士尼有何不同？哪一座最推薦？',
    a: '三座迪士尼各有絕對王牌！①【東京迪士尼】適合追求極致服務細節、熱愛海洋園區與全新「夢幻泉鄉」的遊客；②【香港迪士尼】台北高雄飛香港僅 80 分鐘、免時差，擁有全球唯一的「魔雪奇緣世界」，最適合週末快閃與帶小小孩出遊；③【上海迪士尼】擁有全球最大城堡與科技感封頂的「創極速光輪」及「瘋狂動物城」，佔地極大適合喜愛震撼刺激的旅客。',
    tip: '在本站頂部點擊切換樂園按鈕，可即時查看香港（港幣）、上海（人民幣）與東京的最新低價日曆與開賣通知！',
  },
  {
    q: '去香港迪士尼加購「提早入園證 (Early Entry Pass)」值得嗎？',
    a: '極度推薦！香港迪士尼的「魔雪奇緣世界」目前是排隊人氣王，開園後熱門設施常需排隊 90 分鐘以上。購買提早入園證可於正式開園前 1 小時率先入閘，在人潮最少的情況下暢玩《魔雪奇幻之旅》與《雪嶺滑雪橇》，還能在空曠的艾倫戴爾王國拍出絕美無人空景！',
    tip: 'Klook 與 KKday 經常釋出含門票 + 提早入園證的專屬優惠套票，可利用本站比價卡片一鍵直達購買。',
  },
  {
    q: '上海迪士尼門票預約需要注意什麼？台胞證實名制如何填寫？',
    a: '上海迪士尼全面實施嚴格實名制，台灣旅客購票時需填寫正確的「台胞證」證件號碼與繁簡姓名，入園當天必須攜帶台胞證正本刷證驗票入閘。此外，提前 10 天以上預訂通常享有官方「早鳥優惠現折」！',
    tip: '入園後請務必第一時間綁定上海迪士尼官方 App，搶先預約或購買熱門項目《熱力追蹤》的尊享卡 (DPA)。',
  },
  {
    q: '東京迪士尼門票什麼時候開賣？',
    a: '東京迪士尼官方門票於入園日的前 2 個月（約 60 天前）台灣時間每日 13:00（日本時間 14:00）準時開放預訂！例如預計 2027 年 1 月 15 日入園，官方將於 2026 年 11 月 15 日下午 13:00 開賣。熱門週末、萬聖節與跨年期間門票極常在開賣首日秒殺。',
    tip: '不用自己設鬧鐘苦等！利用本站「開賣第一秒通知」功能，選好迪士尼守護角色並留下信箱，開賣當天 13:00 專屬角色會帶著「恭喜可以買票嚕！」圖文祝賀信與訂票連結第一秒通知您。',
  },
  {
    q: '東京迪士尼有「休園日」嗎？過年或淡季平日會休息嗎？',
    a: '東京迪士尼樂園 (Land) 與海洋 (Sea) 官方採取【365 天全年無休（年中無休）】！無論是平日、週末、日本新年過年、甚至除夕跨年均照常開園營業。過去 40 多年來，只有遇到極端重大天災（如 311 地震、強烈颱風直擊）或疫情特殊時期才曾短暫臨時休園。',
    tip: '重要提醒：全園雖然天天開門，但要注意：①「個別熱門設施會輪流安排 1~3 週停運保養」（本站日曆每日皆有完整維修清單）；②「一年有少數幾天特定週五因企業贊助包場（貸切營業），一般遊客會提早於 18:30 閉園」。',
  },
  {
    q: '東京迪士尼門票哪一天買最便宜？',
    a: '東京迪士尼採用浮動票價制（Tier 1 ~ Tier 4）。通常淡季平日（週二至週四）票價最低為 8,900 日圓（約新台幣 1,910 元）；週五與一般週末為 9,400 ~ 10,400 日圓；日本黃金週、萬聖聖誕及連續假期最高可達 10,900 至 12,400 日圓。',
    tip: '在本站日曆上，只要認明標示為「綠色（便宜省錢日）」的日期，就能以全月最低票價入園，兩人同行現省上千元台幣！',
  },
  {
    q: '東京迪士尼門票推薦在哪裡買最划算？',
    a: '強烈推薦透過官方授權平台 Klook 或 KKday 購買。除了票價完全透明並可直接用台幣結帳、免收 1.5% 海外信用卡交易手續費外，還能疊加使用專屬折扣碼（如 Klook【DISNEYTW88】滿額現折，或 KKday 贈送日本上網 eSIM 專案），訂單完成後秒出電子憑證 QR Code，入園手機直接掃碼即可入場！',
    tip: '若在迪士尼官網購買，需走日本伺服器刷日幣並多負擔海外交易手續費，且介面在熱門時段容易壅塞當機。',
  },
  {
    q: '陸地 (Land) 與海洋 (Sea) 該如何挑選？新園區「夢幻泉鄉」要買哪種票？',
    a: '第一次去東京迪士尼、帶著長輩或小小孩、喜愛經典灰姑娘城堡與米奇遊行的遊客，首推「東京迪士尼樂園 (Tokyo Disneyland)」；如果喜愛精緻浪漫異國造景、微刺激遊樂設施，或者衝著 2024 全新開幕的「夢幻泉鄉 (Fantasy Springs)」，則必須購買「東京迪士尼海洋 (Tokyo DisneySea)」門票！',
    tip: '注意：想要玩夢幻泉鄉裡的冰雪奇緣、長髮公主、彼得潘設施，入園第一件事必須立即打開官方 App 領取免費「預約等候卡 (Standby Pass)」或購買「DPA 快速通關」。',
  },
  {
    q: '遇到颱風或海風強陣風設施會停運嗎？如何看強風預警？',
    a: '東京迪士尼位於千葉縣舞濱海濱，海風非常強勁。當瞬間風速達到 10m/s 以上（約 5 級強風）時，夜間城堡煙火秀與日間大遊行可能被迫取消；若風速達 13~15m/s 以上，戶外高空軌道設施（如飛濺山、巨雷山、艾蜜兒雲霄飛車）可能啟動安全機制暫停運轉。',
    tip: '本站日曆每個日期皆整合千葉浦安氣象預測，標記即時海風風速與預警圖標，若看到橘黃色「強風注意」建議將重心排在室內設施與劇場。',
  },
  {
    q: '什麼是「開賣第一秒通知」？可以挑選哪 5 位迪士尼角色來通知我？',
    a: '東京迪士尼僅開放 60 天內的預訂。當您在日曆上點選未來尚未開賣的日期時，系統提供專屬預約服務，並可自由選擇 5 位經典迪士尼角色：米奇（歡慶隊長）、米妮（甜美大使）、唐老鴨（超熱血衝鋒）、達菲熊（溫暖海洋萌主）、小熊維尼（甜蜜幸運星）。開賣當天，專屬角色會送上圖文並茂的「恭喜可以買票嚕！」賀信，提醒您搶先卡位！',
    tip: '此服務完全免費，您也可以加入 LINE 官方帳號接收推播。',
  },
];

interface PromoState {
  active: boolean;
  platform: 'Klook' | 'KKday';
  title: string;
  code: string;
  discountRate: number; // e.g. 0.85 for 85折
  fixedDiscountTwd: number; // e.g. 100
  badge: string;
}

interface AffiliateConfig {
  klookUrl: string;
  kkdayUrl: string;
  officialUrl: string;
  klookDefaultCode: string;
  klookDefaultDesc: string;
  kkdayDefaultBonus: string;
  lineOfficialUrl?: string;
}

export default function App() {
  // 當前選取的月份 (支援 URL 參數如 ?year=2027&month=2 或 ?date=2027-02-14 預載)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const d = p.get('date');
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return parseInt(d.slice(0, 4), 10);
      }
      const y = parseInt(p.get('year') || '', 10);
      if (y >= 2026 && y <= 2027) return y;
    }
    return 2026;
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const d = p.get('date');
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return parseInt(d.slice(5, 7), 10);
      }
      const m = parseInt(p.get('month') || '', 10);
      if (m >= 1 && m <= 12) return m;
    }
    return 11;
  });

  // 全球迪士尼樂園切換：'tokyo' | 'hongkong' | 'shanghai' | 'usa'
  const [selectedParkId, setSelectedParkId] = useState<DisneyParkId>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const park = p.get('park');
      if (park === 'hongkong' || park === 'shanghai' || park === 'usa' || park === 'tokyo') {
        return park as DisneyParkId;
      }
    }
    return 'tokyo';
  });

  const currentPark = DISNEY_PARKS[selectedParkId] || DISNEY_PARKS.tokyo;
  // 動態同步瀏覽器分頁標題，對齊【方案1+方案4】
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const parkNames: Record<DisneyParkId, string> = {
      tokyo: '東京迪士尼門票情報',
      hongkong: '香港迪士尼門票情報',
      shanghai: '上海迪士尼門票情報',
      usa: '加州迪士尼門票情報',
    };
    const parkTitle = parkNames[selectedParkId] || '海外樂園門票情報';
    document.title = `${parkTitle} - 即時低價日曆・開賣提醒・人潮預報【海外樂園情報站】`;
  }, [selectedParkId]);


  // 分園/焦點分區選擇 (各國分園皆可點選切換：東京陸地/海洋；香港全園/魔雪奇緣；上海全園/動物城；美國雙園/奧蘭多)
  const [selectedSubParkIndex, setSelectedSubParkIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const sp = p.get('subpark');
      if (sp !== null && !isNaN(Number(sp))) {
        return Number(sp);
      }
    }
    return 0;
  });

  // 樂園選擇 (Land vs Sea - 適用於東京等雙園體系)
  const [selectedPark, setSelectedPark] = useState<'land' | 'sea'>('land');

  const handleParkSwitch = (parkId: DisneyParkId) => {
    setSelectedParkId(parkId);
    setSelectedSubParkIndex(0);
    if (parkId === 'tokyo') {
      setSelectedPark('land');
    }
  };

  // 票種 (成人、中人/學生、兒童)
  const [ticketType, setTicketType] = useState<'adult' | 'junior' | 'child'>('adult');

  // 匯率設定 (日圓預設 0.2058，啟動後自動向後端同步最新國際即時匯率)
  const [exchangeRate, setExchangeRate] = useState<number>(0.2058);
  const [exchangeRateSource, setExchangeRateSource] = useState<string>('國際即時匯率 (自動同步)');

  const activeRate = selectedParkId === 'tokyo' ? exchangeRate : currentPark.defaultRate;

  // 後端聯盟行銷連結與常駐優惠設定 (優先讀取站長自訂之持久化網址，永不重置)
  const [affiliateConfig, setAffiliateConfig] = useState<AffiliateConfig>(() => {
    const defaults: AffiliateConfig = {
      klookUrl: 'https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/?aid=YOUR_KLOOK_AID&utm_campaign=ticket_calendar',
      kkdayUrl: 'https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan?cid=YOUR_KKDAY_CID&ud1=price_calendar',
      officialUrl: 'https://www.tokyodisneyresort.jp/tc/ticket/',
      klookDefaultCode: 'DISNEYTW88',
      klookDefaultDesc: '結帳輸入優惠碼現省 NT$100',
      kkdayDefaultBonus: '購票即享日本高速 eSIM 1GB 體驗組',
      lineOfficialUrl: 'https://lin.ee/XnkEyyl',
    };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tokyo_disney_affiliate_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...defaults,
            ...parsed,
            lineOfficialUrl: parsed.lineOfficialUrl && parsed.lineOfficialUrl.trim() ? parsed.lineOfficialUrl.trim() : defaults.lineOfficialUrl,
          };
        } catch {}
      }
    }
    return defaults;
  });

  // 篩選標籤
  const [filterMode, setFilterMode] = useState<'all' | 'cheap' | 'moderate' | 'expensive' | 'lowCrowd'>('all');

  // 人數試算
  const [groupAdults, setGroupAdults] = useState<number>(2);
  const [groupChildren, setGroupChildren] = useState<number>(1);

  // 訂閱通知信箱與彈出視窗
  const [emailInput, setEmailInput] = useState<string>('');
  const [subTargetMonth, setSubTargetMonth] = useState<string>('2026-11');
  const [subTargetPark, setSubTargetPark] = useState<'land' | 'sea' | 'both'>('both');
  const [subAlertType, setSubAlertType] = useState<'promo' | 'ticket_open' | 'both'>('both');
  const [openAlertEmail, setOpenAlertEmail] = useState<string>('');
  const [reservedOpenDateInfo, setReservedOpenDateInfo] = useState<{ date: string; saleOpenDate: string } | null>(null);
  const [submittingSub, setSubmittingSub] = useState<boolean>(false);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState<boolean>(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(12481);
  const [showSubscribeModal, setShowSubscribeModal] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // 5 位迪士尼開賣通知守護大使 (支援 URL 參數如 ?char=pooh 或 ?char=donald 預載)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('char');
      if (c && DISNEY_CHARACTERS.some(item => item.id === c)) return c;
    }
    return 'mickey';
  });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // 站長後台 Modal (支援 ?admin=1 直接開啟)
  const [showAdminModal, setShowAdminModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('admin') === '1';
    }
    return false;
  });

  // 促銷狀態 (優先讀取站長設定的持久化促銷，永遠記住最新狀態)
  const [promoState, setPromoState] = useState<PromoState | null>(() => {
    if (typeof window !== 'undefined') {
      const savedPromo = localStorage.getItem('tokyo_disney_promo_state');
      if (savedPromo) {
        try {
          const parsed = JSON.parse(savedPromo);
          if (parsed && parsed.active) return parsed;
        } catch {}
      }
    }
    return null;
  });
  const [showPushToast, setShowPushToast] = useState<boolean>(false);
  const [isPriceFlashing, setIsPriceFlashing] = useState<boolean>(false);

  // 單檔 HTML 匯出 Modal
  const [showHtmlExportModal, setShowHtmlExportModal] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // 從後端讀取最新聯盟連結、全站促銷狀態與即時日圓匯率
  const fetchPublicState = useCallback(async () => {
    try {
      const res = await fetch('/api/public-state');
      if (!res.ok) return;
      const data = await res.json();
      if (data.affiliateConfig) {
        let localAff = {};
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('tokyo_disney_affiliate_config');
          if (raw) {
            try { localAff = JSON.parse(raw); } catch {}
          }
        }
        setAffiliateConfig(prev => {
          const merged = { ...prev, ...data.affiliateConfig, ...localAff };
          if (!merged.lineOfficialUrl || !merged.lineOfficialUrl.trim()) {
            merged.lineOfficialUrl = 'https://lin.ee/XnkEyyl';
          }
          return merged;
        });
      }
      if (data.exchangeRate && typeof data.exchangeRate.rate === 'number') {
        setExchangeRate(data.exchangeRate.rate);
        setExchangeRateSource(data.exchangeRate.source || '國際即時匯率');
      }
      if (typeof data.subscriberCount === 'number') {
        setSubscriberCount(data.subscriberCount);
      }
      if (typeof window !== 'undefined') {
        const localPromoRaw = localStorage.getItem('tokyo_disney_promo_state');
        if (localPromoRaw) {
          try {
            const lp = JSON.parse(localPromoRaw);
            if (lp) {
              setPromoState(lp.active ? lp : null);
              if (lp.active) setShowPushToast(true);
            }
          } catch {}
        } else if (data.activePromo && data.activePromo.active) {
          setPromoState(data.activePromo);
          setShowPushToast(true);
        } else {
          setPromoState(null);
        }
      } else if (data.activePromo && data.activePromo.active) {
        setPromoState(data.activePromo);
        setShowPushToast(true);
      } else {
        setPromoState(null);
      }
    } catch {
      // ignore offline
    }
  }, []);

  useEffect(() => {
    fetchPublicState();
  }, [fetchPublicState]);

  // 當月資料 (依當前年份、月份與選定樂園動態生成)
  const monthDays = useMemo(() => {
    return generateMonthData(selectedYear, selectedMonth, selectedParkId);
  }, [selectedYear, selectedMonth, selectedParkId]);

  // 選取的日期 (支援 URL 參數預載，如 ?date=2027-02-14)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const d = p.get('date');
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    }
    return '2026-11-10';
  });

  // 當前選取日的詳細資料
  const currentDayData = useMemo(() => {
    const found = monthDays.find(d => d.date === selectedDateStr);
    if (found) return found;
    return monthDays[0];
  }, [monthDays, selectedDateStr]);

  // 取得指定票種的當地原幣價格
  const getDayTicketPrice = (day: DayData, type: 'adult' | 'junior' | 'child') => {
    if (type === 'junior') return Math.round(day.localPriceAdult * 0.82);
    if (type === 'child') return Math.round(day.localPriceAdult * 0.60);
    return day.localPriceAdult;
  };

  // 換算基礎台幣 (支援日圓 JPY、港幣 HKD、人民幣 CNY、美金 USD)
  const toBaseTwd = (localPrice: number) => {
    return Math.round(localPrice * activeRate);
  };

  // 計算是否套用突發促銷特惠
  const calculatePrice = (localPrice: number) => {
    const baseTwd = toBaseTwd(localPrice);
    if (!promoState || !promoState.active) {
      return { baseTwd, finalTwd: baseTwd, hasPromo: false };
    }
    const finalTwd = Math.round(baseTwd * promoState.discountRate) - promoState.fixedDiscountTwd;
    return {
      baseTwd,
      finalTwd: Math.max(100, finalTwd),
      hasPromo: true,
      savedTwd: baseTwd - Math.max(100, finalTwd)
    };
  };

  // 當日維修設施名單 (依樂園動態切換)
  const currentParkMaintenance = PARK_MAINTENANCE[selectedParkId] || PARK_MAINTENANCE.tokyo;
  const dayMaintenanceList = useMemo(() => {
    if (!currentDayData) return [];
    return currentParkMaintenance.filter(item => {
      const matchPark = item.park === 'both' || item.park === selectedPark;
      const inRange = currentDayData.date >= item.startDate && currentDayData.date <= item.endDate;
      return matchPark && inRange;
    });
  }, [currentDayData, selectedPark, selectedParkId, currentParkMaintenance]);

  // 當月最便宜與最貴價格統計
  const priceStats = useMemo(() => {
    let minTwd = Infinity;
    let maxTwd = -Infinity;
    let cheapestDay: DayData | null = null;
    let expensiveDay: DayData | null = null;

    for (const day of monthDays) {
      const priceVal = getDayTicketPrice(day, ticketType);
      const { finalTwd } = calculatePrice(priceVal);
      if (finalTwd < minTwd) {
        minTwd = finalTwd;
        cheapestDay = day;
      }
      if (finalTwd > maxTwd) {
        maxTwd = finalTwd;
        expensiveDay = day;
      }
    }

    const diffPerTicket = maxTwd - minTwd;
    const groupSavings = (groupAdults * diffPerTicket) + (groupChildren * Math.round(diffPerTicket * 0.6));

    return {
      minTwd,
      maxTwd,
      cheapestDay,
      expensiveDay,
      diffPerTicket,
      groupSavings,
    };
  }, [monthDays, ticketType, exchangeRate, groupAdults, groupChildren, promoState]);

  // 日曆第一天之前的空白格數
  const firstDayWeekday = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, 1).getDay();
  }, [selectedYear, selectedMonth]);

  // 月份切換 (支援 2026 年 11 月 ~ 2027 年 12 月全年度提前預約)
  const handlePrevMonth = () => {
    if (selectedYear === 2026 && selectedMonth === 11) return;
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedYear === 2027 && selectedMonth === 12) return;
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // 訂閱通知送出處理 (真實寫入後端並觸發 Resend 歡迎信)
  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      alert('請輸入有效的電子信箱（Email）');
      return;
    }
    setSubmittingSub(true);
    setReservedOpenDateInfo(null);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          targetMonth: subTargetMonth,
          targetPark: subTargetPark,
          alertType: subAlertType,
          characterId: selectedCharacterId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWelcomeEmailSent(Boolean(data.welcomeEmailSent));
        if (typeof data.subscriberCount === 'number') {
          setSubscriberCount(data.subscriberCount);
        }
      }
    } catch {
      // fallback
    } finally {
      setSubmittingSub(false);
      setIsSubscribed(true);
      setShowSubscribeModal(true);
    }
  };

  // 針對「尚未開放訂票的日期」預約開賣第一秒通知
  const handleTicketOpenAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDayData) return;
    const mail = openAlertEmail.trim() || emailInput.trim();
    if (!mail || !mail.includes('@')) {
      alert('請輸入有效的電子信箱（Email）以接收開賣通知');
      return;
    }
    setSubmittingSub(true);
    setEmailInput(mail);
    setReservedOpenDateInfo({
      date: currentDayData.date,
      saleOpenDate: currentDayData.saleOpenDate,
    });
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mail,
          targetMonth: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
          targetPark: selectedPark,
          alertType: 'ticket_open',
          targetDate: currentDayData.date,
          saleOpenDate: currentDayData.saleOpenDate,
          characterId: selectedCharacterId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWelcomeEmailSent(Boolean(data.welcomeEmailSent));
        if (typeof data.subscriberCount === 'number') {
          setSubscriberCount(data.subscriberCount);
        }
      }
    } catch {
      // fallback
    } finally {
      setSubmittingSub(false);
      setIsSubscribed(true);
      setShowSubscribeModal(true);
    }
  };

  // 聯盟行銷按鈕點擊追蹤與導購跳轉
  const handleAffiliateClick = (platform: 'Klook' | 'KKday' | 'Official') => {
    const priceTwd = currentDayData
      ? calculatePrice(currentDayData.basePriceJpy[ticketType]).finalTwd
      : 1900;

    // 非同步記錄後端點擊數據
    fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        dateStr: selectedDateStr,
        park: selectedPark,
        ticketType,
        priceTwd,
      }),
    }).catch(() => {});

    const targetUrl =
      platform === 'Klook'
        ? (selectedParkId === 'tokyo' ? affiliateConfig.klookUrl : currentPark.klookUrl)
        : platform === 'KKday'
        ? (selectedParkId === 'tokyo' ? affiliateConfig.kkdayUrl : currentPark.kkdayUrl)
        : (selectedParkId === 'tokyo' ? affiliateConfig.officialUrl : currentPark.officialUrl);

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // 模擬平台突發促銷特惠觸發
  const handleSimulatePromo = () => {
    if (promoState && promoState.active) {
      // 若已啟用，可切換到另一個方案或恢復
      if (promoState.platform === 'Klook') {
        setPromoState({
          active: true,
          platform: 'KKday',
          title: 'KKday 狂歡慶！雙人同行限時快閃 8 折特惠',
          code: 'DISNEYKK80',
          discountRate: 0.80,
          fixedDiscountTwd: 0,
          badge: 'KKday 8折限時特惠'
        });
      } else {
        // 重設
        setPromoState(null);
        setShowPushToast(false);
        return;
      }
    } else {
      // 啟用 Klook 85折方案
      setPromoState({
        active: true,
        platform: 'Klook',
        title: 'Klook 突發降價！日本迪士尼限定快閃 85 折',
        code: 'FLASH85DISNEY',
        discountRate: 0.85,
        fixedDiscountTwd: 50,
        badge: 'Klook 突發 85 折特惠'
      });
    }

    // 觸發綠光閃爍與推播浮動通知
    setIsPriceFlashing(true);
    setShowPushToast(true);
    setTimeout(() => {
      setIsPriceFlashing(false);
    }, 2800);
  };

  // 產生純單一檔案 HTML 程式碼 (隨時可下載與複製)
  const singleFileHtmlCode = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>東京迪士尼門票降價與人潮預報助手 - 台幣低價日曆</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
    @keyframes greenFlash {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      50% { transform: scale(1.03); box-shadow: 0 0 20px 8px rgba(16, 185, 129, 0.8); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .animate-green-flash {
      animation: greenFlash 1.4s ease-in-out infinite;
    }
    @keyframes bellRing {
      0%, 100% { transform: rotate(0); }
      20%, 60% { transform: rotate(14deg); }
      40%, 80% { transform: rotate(-14deg); }
    }
    .bell-shake {
      animation: bellRing 1.8s infinite;
      transform-origin: top center;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen pb-16">

  <!-- 模擬即時推播橫幅 Toast (預設隱藏) -->
  <div id="push-toast" class="hidden fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-emerald-400 flex items-start gap-3.5 transition-all">
    <div class="p-2 bg-emerald-500 text-white rounded-xl text-xl shrink-0">🔔</div>
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-emerald-400">⚡ 平台突發降價推播通知！</span>
        <button onclick="document.getElementById('push-toast').classList.add('hidden')" class="text-slate-400 hover:text-white text-xs">✕</button>
      </div>
      <p id="push-toast-text" class="text-sm font-bold text-white mt-1">
        Klook 剛剛突發釋出「迪士尼 85 折」專屬折扣碼！日曆所有票價已自動調降！
      </p>
      <div class="mt-2 text-xs text-slate-300">
        專屬代碼：<code class="bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded">FLASH85DISNEY</code> (已為您自動套用)
      </div>
    </div>
  </div>

  <!-- 頂部導航 -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🏰</span>
        <div>
          <h1 class="text-lg md:text-xl font-black text-slate-900">東京迪士尼門票降價與人潮預報助手</h1>
          <p class="text-xs text-slate-500 font-medium">哪一天便宜一目了然！(日圓浮動票價自動換算台幣)</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <!-- 測試按鈕：模擬突發降價 -->
        <button id="simulate-promo-btn" onclick="toggleSimulatedPromo()" class="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer">
          <span>⚙️ 模擬平台突發降價</span>
        </button>
        <div class="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold">
          <span>日圓匯率：0.215</span>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">

    <!-- 🔔 核心功能 1：【平台促銷特惠・立馬通知我】訂閱核心卡片 -->
    <section class="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-2xl p-5 md:p-6 shadow-xl border-2 border-indigo-500/50 relative overflow-hidden">
      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
            <span class="text-base bell-shake">🔔</span>
            <span>限時特惠監測器 · 搶先鎖定降價快訊</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-black tracking-tight">
            促銷降價與特惠，立馬通知我！
          </h2>
          <p class="text-xs md:text-sm text-indigo-100 leading-relaxed">
            迪士尼門票平日價差最高達 <strong>NT$ 752</strong>！當 Klook、KKday 突發釋出 <strong>快閃 85 折、台幣直接現折 $150、或滿額折扣</strong> 時，系統秒發推播與 Email 通知您！
          </p>
        </div>

        <!-- 訂閱輸入表單 -->
        <form onsubmit="handleSubscribe(event)" class="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-2.5 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
          <input
            id="email-field"
            type="email"
            required
            placeholder="請輸入您的 Email (如 user@gmail.com)"
            class="px-4 py-3 text-sm text-slate-900 bg-white rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-[260px] font-medium"
          />
          <button
            type="submit"
            class="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
          >
            <span class="text-base">🔔</span>
            <span>開啟降價通知 / 立馬通知我</span>
          </button>
        </form>
      </div>
    </section>

    <!-- 促銷狀態通知橫條 (當模擬特惠啟動時顯示) -->
    <div id="promo-banner" class="hidden bg-emerald-500 text-white rounded-xl p-3.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
      <div class="flex items-center gap-2">
        <span class="text-lg">🎉</span>
        <span>【限時快閃特惠中】Klook 迪士尼全面 85 折已自動套用！日曆台幣價格已即時調降！</span>
      </div>
      <button onclick="toggleSimulatedPromo()" class="bg-white text-emerald-800 px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-50 cursor-pointer">
        恢復原價
      </button>
    </div>

    <!-- 低價日曆區域 -->
    <section class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>📊 迪士尼台幣票價低價日曆 (2026年11月)</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">點擊任何日期格子，下方動態跳出該日期的詳細比價與人潮預報</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded border border-emerald-300">
            <span>💰 最便宜</span> (8,900~9,400円)
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 rounded border border-amber-300">
            <span>⚖️ 普通</span> (9,900~10,400円)
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-900 rounded border border-rose-300">
            <span>🚨 極貴/人超多</span> (10,900~12,400円)
          </span>
        </div>
      </div>

      <!-- 星期表頭 -->
      <div class="grid grid-cols-7 gap-2 text-center font-bold text-xs sm:text-sm">
        <div class="py-2 bg-rose-50 text-rose-700 rounded-lg">週日</div>
        <div class="py-2 bg-slate-100 text-slate-700 rounded-lg">週一</div>
        <div class="py-2 bg-slate-100 text-slate-700 rounded-lg">週二</div>
        <div class="py-2 bg-slate-100 text-slate-700 rounded-lg">週三</div>
        <div class="py-2 bg-slate-100 text-slate-700 rounded-lg">週四</div>
        <div class="py-2 bg-slate-100 text-slate-700 rounded-lg">週五</div>
        <div class="py-2 bg-blue-50 text-blue-700 rounded-lg">週六</div>
      </div>

      <!-- 日曆網格由 JS 自動填充 -->
      <div id="calendar-grid" class="grid grid-cols-7 gap-2"></div>
    </section>

    <!-- 🖱️ 核心功能 2：日曆點擊連動詳細比價區 -->
    <section id="detail-section" class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div class="text-xs font-bold text-indigo-600 tracking-wider">已選取日期情報連動</div>
          <h3 id="detail-date-title" class="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
            11月10日 (週二)
          </h3>
        </div>
        <div id="detail-badge-container">
          <span id="detail-tier-badge" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
            💰 最便宜 · 淡季超值平日
          </span>
        </div>
      </div>

      <!-- 三大平台比價卡片 (日本官網、Klook、KKday) -->
      <div>
        <h4 class="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span>🛒 三大購票管道即時比價 (台幣換算)</span>
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Klook 客路 -->
          <div class="border-2 border-orange-400 bg-orange-50/40 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-lg font-black text-orange-600">Klook 客路 (推薦)</span>
                <span id="klook-promo-badge" class="text-[11px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded">現折百元碼</span>
              </div>
              <div class="mt-4">
                <div class="text-xs text-slate-500 font-medium">特惠折抵價 (台幣)</div>
                <div class="text-3xl font-black text-slate-900 tabular-nums">
                  NT$ <span id="klook-price">1,814</span>
                </div>
                <p class="text-xs text-slate-400 mt-1 line-through">
                  官網換算約 NT$ <span id="klook-original-price">1,914</span>
                </p>
              </div>
              <ul class="text-xs text-slate-600 space-y-1.5 mt-4">
                <li>✅ 結帳輸入優惠碼【<strong id="klook-code-text" class="text-orange-600">DISNEYTW88</strong>】現享加碼折抵</li>
                <li>✅ 以台幣直接結帳，免收 1.5% 海外刷卡手續費</li>
                <li>✅ 憑證即時出票，手機 QR Code 直接掃碼入園</li>
              </ul>
            </div>
            <a href="https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/?aid=affiliate_disney_tw" target="_blank" rel="noopener noreferrer" class="mt-5 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
              <span>🛒</span>
              <span>前往 Klook 搶購 (領百元折價)</span>
            </a>
          </div>

          <!-- KKday -->
          <div class="border border-sky-300 bg-sky-50/40 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-lg font-black text-sky-700">KKday</span>
                <span class="text-[11px] bg-sky-600 text-white font-bold px-2 py-0.5 rounded">送 eSIM 優惠</span>
              </div>
              <div class="mt-4">
                <div class="text-xs text-slate-500 font-medium">即時促銷價 (台幣)</div>
                <div class="text-3xl font-black text-slate-900 tabular-nums">
                  NT$ <span id="kkday-price">1,885</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">台幣扣款無匯差手續費</p>
              </div>
              <ul class="text-xs text-slate-600 space-y-1.5 mt-4">
                <li>✅ 限時加贈日本高速上網 eSIM 1GB 體驗組</li>
                <li>✅ 官方授權憑證，免排隊買票現場秒入閘</li>
                <li>✅ 可合購東京地鐵 24 小時 Pass 享超值套裝</li>
              </ul>
            </div>
            <a href="https://www.kkday.com/zh-tw/product/19252-tokyo-disneyland-tokyo-disneysea-tickets-japan?cid=affiliate_disney_tw" target="_blank" rel="noopener noreferrer" class="mt-5 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
              <span>🛒</span>
              <span>前往 KKday 預訂 (送eSIM優惠)</span>
            </a>
          </div>

          <!-- 日本迪士尼官方網站 -->
          <div class="border border-slate-300 bg-slate-50/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-lg font-black text-slate-800">日本迪士尼官網</span>
                <span class="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">原幣定價</span>
              </div>
              <div class="mt-4">
                <div class="text-xs text-slate-500 font-medium">官方標準定價 (日圓)</div>
                <div class="text-3xl font-black text-slate-900 tabular-nums">
                  ¥ <span id="official-price-jpy">8,900</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  換算台幣約 NT$ <span id="official-price-twd">1,914</span> (+1.5%海外刷卡手續費約 $29)
                </p>
              </div>
              <ul class="text-xs text-slate-600 space-y-1.5 mt-4">
                <li>ℹ️ 日圓結帳，信用卡帳單會額外收取 1.5% 海外交易費</li>
                <li>ℹ️ 需先註冊 Tokyo Disney 官方帳號</li>
                <li>ℹ️ 入園後直接綁定 App 抽取預約等候卡與 DPA</li>
              </ul>
            </div>
            <a href="https://www.tokyodisneyresort.jp/tc/ticket/" target="_blank" rel="noopener noreferrer" class="mt-5 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all">
              <span>開啟官網購票頁面</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 人潮預測進度條 🚦 與設施維修/強風預警 🌬️ -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-200">
        
        <!-- 人潮進度條 🚦 -->
        <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <span>🚦 當日即時人潮預報進度條</span>
            </span>
            <span id="crowd-status-badge" class="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
              舒適輕鬆 (指數 26/100)
            </span>
          </div>

          <div class="space-y-1">
            <div class="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-0.5">
              <div id="crowd-progress-bar" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: 26%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>🟢 舒適 (0~39)</span>
              <span>🟡 普通 (40~65)</span>
              <span>🟠 偏多 (66~80)</span>
              <span>🔴 爆滿 (81~100)</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div class="font-bold text-slate-800">⏱️ 熱門設施預估排隊時間：</div>
            <div class="grid grid-cols-3 gap-2 text-center pt-1">
              <div class="bg-slate-50 p-1.5 rounded">美女與野獸: <strong id="wait-ride-1" class="text-indigo-600 font-bold">~45分</strong></div>
              <div class="bg-slate-50 p-1.5 rounded">太空山: <strong id="wait-ride-2" class="text-slate-800 font-bold">~30分</strong></div>
              <div class="bg-slate-50 p-1.5 rounded">飛濺山: <strong id="wait-ride-3" class="text-slate-800 font-bold">~30分</strong></div>
            </div>
            <p id="crowd-tip" class="text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded mt-2">
              🎯 <strong>通關攻略：</strong>今日人潮偏少，排隊極順暢，不需額外購買 DPA 快速通關也能輕鬆刷完熱門大作！
            </p>
          </div>
        </div>

        <!-- 設施維修與強風預警 🌬️ -->
        <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <span>🌬️ 設施維修與海灣強風預警</span>
            </span>
          </div>

          <div class="space-y-2.5 text-xs">
            <div class="bg-white p-3 rounded-xl border border-slate-200">
              <div class="font-bold text-slate-800 flex items-center justify-between">
                <span>🌬️ 戶外遊行海風指數預測：</span>
                <span id="wind-speed" class="text-indigo-600 font-bold">預估風速 3.2 m/s</span>
              </div>
              <p id="wind-desc" class="text-slate-600 mt-1">
                正常微風，夜間城堡光雕投影秀 Reach for the Stars 與高空煙火預計正常舉行。
              </p>
            </div>

            <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
              <div class="font-bold flex items-center gap-1.5">
                <span>🛠️ 當日休止保養設施：</span>
              </div>
              <p id="maintenance-info" class="text-amber-800 mt-1 leading-relaxed">
                巨雷山 (Big Thunder Mountain) 定期軌道深度保養 (11/5 ~ 11/18 休止)
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  </main>

  <!-- 🎉 精美迪士尼風格訂閱成功彈出視窗 (Modal Pop-up) -->
  <div id="subscribe-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center relative overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="w-20 h-20 bg-gradient-to-tr from-amber-400 to-indigo-600 text-white rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg ring-8 ring-amber-100">
        🏰
      </div>
      <h3 class="text-2xl font-black text-slate-900 mt-5">
        🎉 訂閱成功！
      </h3>
      <div class="text-xs font-bold text-indigo-600 mt-1">
        降價雷達已啟動：<span id="modal-user-email" class="text-slate-800"></span>
      </div>
      <p class="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80">
        Klook / KKday 只要一出現<strong>獨家折扣碼、快閃 9 折或限時降價折扣</strong>，系統將會<strong>立馬發送推播與 Email 通知您</strong>，讓您卡位最低價！
      </p>
      <button
        onclick="document.getElementById('subscribe-modal').classList.add('hidden')"
        class="mt-6 w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
      >
        太棒了，返回查看低價日曆
      </button>
    </div>
  </div>

  <footer class="mt-8 text-center text-xs text-slate-400">
    <p>東京迪士尼門票降價與人潮預報助手 · 非官方純比價與旅行攻略參考工具</p>
  </footer>

  <!-- 互動邏輯 JavaScript -->
  <script>
    const RATE = 0.215;
    let isPromoActive = false;

    const DAYS_DATA = [
      { day: 1, weekday: 0, weekdayStr: '週日', jpy: 10400, tier: 'moderate', label: '⚖️ 普通', crowd: 70, wind: 3.8, maint: '巨雷山保養準備中' },
      { day: 2, weekday: 1, weekdayStr: '週一', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 56, wind: 4.1, maint: '正常運作' },
      { day: 3, weekday: 2, weekdayStr: '週二', jpy: 11400, tier: 'expensive', label: '🚨 極貴/人超多', crowd: 92, wind: 5.2, maint: '正常運作', note: '文化之日連假' },
      { day: 4, weekday: 3, weekdayStr: '週三', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 28, wind: 3.0, maint: '正常運作' },
      { day: 5, weekday: 4, weekdayStr: '週四', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 26, wind: 2.8, maint: '巨雷山保養開始 (11/5~11/18)' },
      { day: 6, weekday: 5, weekdayStr: '週五', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 55, wind: 4.5, maint: '巨雷山休止維修中' },
      { day: 7, weekday: 6, weekdayStr: '週六', jpy: 10900, tier: 'expensive', label: '🚨 極貴/人超多', crowd: 85, wind: 6.2, maint: '巨雷山休止維修中' },
      { day: 8, weekday: 0, weekdayStr: '週日', jpy: 10400, tier: 'moderate', label: '⚖️ 普通', crowd: 72, wind: 4.8, maint: '巨雷山休止維修中' },
      { day: 9, weekday: 1, weekdayStr: '週一', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 54, wind: 3.5, maint: '巨雷山休止維修中' },
      { day: 10, weekday: 2, weekdayStr: '週二', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 25, wind: 3.2, maint: '巨雷山休止維修中' },
      { day: 11, weekday: 3, weekdayStr: '週三', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 24, wind: 2.9, maint: '巨雷山休止維修中' },
      { day: 12, weekday: 4, weekdayStr: '週四', jpy: 9400, tier: 'cheap', label: '💰 最便宜', crowd: 35, wind: 4.0, maint: '巨雷山休止維修中' },
      { day: 13, weekday: 5, weekdayStr: '週五', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 58, wind: 4.6, maint: '巨雷山休止維修中' },
      { day: 14, weekday: 6, weekdayStr: '週六', jpy: 10900, tier: 'expensive', label: '🚨 極貴/人超多', crowd: 88, wind: 5.8, maint: '巨雷山休止維修中' },
      { day: 15, weekday: 0, weekdayStr: '週日', jpy: 10400, tier: 'moderate', label: '⚖️ 普通', crowd: 70, wind: 4.3, maint: '巨雷山休止維修中' },
      { day: 16, weekday: 1, weekdayStr: '週一', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 52, wind: 3.8, maint: '巨雷山休止維修中' },
      { day: 17, weekday: 2, weekdayStr: '週二', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 26, wind: 3.1, maint: '巨雷山休止維修中' },
      { day: 18, weekday: 3, weekdayStr: '週三', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 25, wind: 3.4, maint: '巨雷山保養最後一日' },
      { day: 19, weekday: 4, weekdayStr: '週四', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 28, wind: 3.0, maint: '小飛象準備檢修' },
      { day: 20, weekday: 5, weekdayStr: '週五', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 60, wind: 5.1, maint: '小飛象休止保養 (11/20~11/27)' },
      { day: 21, weekday: 6, weekdayStr: '週六', jpy: 10900, tier: 'expensive', label: '🚨 極貴/人超多', crowd: 86, wind: 6.5, maint: '小飛象休止保養' },
      { day: 22, weekday: 0, weekdayStr: '週日', jpy: 12400, tier: 'expensive', label: '🚨 極貴/人超多', crowd: 95, wind: 7.2, maint: '小飛象休止保養', note: '連假前夕' },
      { day: 23, weekday: 1, weekdayStr: '週一', jpy: 12400, tier: 'expensive', label: '🚨 極貴/人超多', crowd: 98, wind: 8.4, maint: '小飛象休止保養', note: '勤勞感謝日連假' },
      { day: 24, weekday: 2, weekdayStr: '週二', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 27, wind: 3.6, maint: '小飛象休止保養' },
      { day: 25, weekday: 3, weekdayStr: '週三', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 25, wind: 3.2, maint: '小飛象休止保養' },
      { day: 26, weekday: 4, weekdayStr: '週四', jpy: 8900, tier: 'cheap', label: '💰 最便宜', crowd: 29, wind: 2.8, maint: '小飛象休止保養' },
      { day: 27, weekday: 5, weekdayStr: '週五', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 58, wind: 4.7, maint: '小飛象保養最後一天' },
      { day: 28, weekday: 6, weekdayStr: '週六', jpy: 10900, tier: 'expensive', label: '🚨 極貴/人超多', crowd: 88, wind: 5.9, maint: '全設施正常運作' },
      { day: 29, weekday: 0, weekdayStr: '週日', jpy: 10400, tier: 'moderate', label: '⚖️ 普通', crowd: 72, wind: 4.4, maint: '全設施正常運作' },
      { day: 30, weekday: 1, weekdayStr: '週一', jpy: 9900, tier: 'moderate', label: '⚖️ 普通', crowd: 54, wind: 3.9, maint: '全設施正常運作' }
    ];

    let selectedDayItem = DAYS_DATA[9];
    const calendarGrid = document.getElementById('calendar-grid');

    // 處理訂閱提交
    function handleSubscribe(e) {
      e.preventDefault();
      const email = document.getElementById('email-field').value;
      if (!email || !email.includes('@')) {
        alert('請輸入正確的電子郵件信箱');
        return;
      }
      document.getElementById('modal-user-email').innerText = email;
      document.getElementById('subscribe-modal').classList.remove('hidden');
    }

    // 模擬平台突發促銷觸發
    function toggleSimulatedPromo() {
      isPromoActive = !isPromoActive;
      const promoBanner = document.getElementById('promo-banner');
      const pushToast = document.getElementById('push-toast');

      if (isPromoActive) {
        promoBanner.classList.remove('hidden');
        pushToast.classList.remove('hidden');
        document.getElementById('simulate-promo-btn').innerText = '🔄 重設/恢復原價';
      } else {
        promoBanner.classList.add('hidden');
        pushToast.classList.add('hidden');
        document.getElementById('simulate-promo-btn').innerText = '⚙️ 模擬平台突發降價';
      }

      renderCalendar(true);
      updateDetails(selectedDayItem);
    }

    function renderCalendar(isFlashing = false) {
      calendarGrid.innerHTML = '';

      DAYS_DATA.forEach((item) => {
        const baseTwd = Math.round(item.jpy * RATE);
        const finalTwd = isPromoActive ? Math.round(baseTwd * 0.85) : baseTwd;
        const cell = document.createElement('div');

        let bgClass = 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-950';
        let badgeColor = 'bg-emerald-600 text-white';
        let priceColor = 'text-emerald-950';

        if (item.tier === 'moderate') {
          bgClass = 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-950';
          badgeColor = 'bg-amber-600 text-white';
          priceColor = 'text-amber-950';
        } else if (item.tier === 'expensive') {
          bgClass = 'bg-rose-50 hover:bg-rose-100/80 border-rose-300 text-rose-950';
          badgeColor = 'bg-rose-600 text-white';
          priceColor = 'text-rose-950';
        }

        const isSelected = selectedDayItem.day === item.day;
        const flashClass = isFlashing && isPromoActive ? 'animate-green-flash' : '';

        cell.className = \`cursor-pointer border-2 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition-all min-h-[92px] sm:min-h-[105px] \${bgClass} \${flashClass} \${
          isSelected ? 'ring-4 ring-indigo-600 ring-offset-2 shadow-lg z-10 scale-[1.02]' : 'hover:shadow-sm'
        }\`;

        cell.innerHTML = \`
          <div class="flex items-start justify-between gap-1">
            <div class="flex flex-col">
              <span class="text-xs font-black tracking-tight">11/\${item.day} <span class="text-[11px] font-semibold text-slate-600">\${item.weekdayStr}</span></span>
              \${item.note ? \`<span class="text-[9px] text-rose-600 font-bold leading-none mt-0.5 truncate max-w-[65px]">\${item.note}</span>\` : ''}
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded \${badgeColor} whitespace-nowrap leading-none">\${item.label}</span>
          </div>

          <div class="mt-2 text-right">
            <div class="text-[10px] text-slate-500 font-medium">預估台幣\${isPromoActive ? ' <span class="text-emerald-600 font-bold">(85折特惠)</span>' : ''}</div>
            \${isPromoActive ? \`<div class="text-[10px] text-slate-400 line-through tabular-nums">$\${baseTwd.toLocaleString()}</div>\` : ''}
            <div class="text-base sm:text-lg font-black tabular-nums tracking-tight \${priceColor}">$\${finalTwd.toLocaleString()}</div>
          </div>

          <div class="mt-1 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500">
            <span class="tabular-nums">¥\${item.jpy.toLocaleString()}</span>
            <span class="font-medium">\${item.crowd < 40 ? '🟢 舒適' : item.crowd <= 70 ? '🟡 普通' : '🔴 爆滿'}</span>
          </div>
        \`;

        cell.onclick = () => {
          selectedDayItem = item;
          renderCalendar(false);
          updateDetails(item);
        };

        calendarGrid.appendChild(cell);
      });
    }

    function updateDetails(item) {
      const baseTwd = Math.round(item.jpy * RATE);
      const finalTwd = isPromoActive ? Math.round(baseTwd * 0.85) : baseTwd;

      document.getElementById('detail-date-title').innerText = \`11月\${item.day}日 (\${item.weekdayStr})\${item.note ? ' · ' + item.note : ''}\`;

      const badge = document.getElementById('detail-tier-badge');
      if (item.tier === 'cheap') {
        badge.className = 'text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300';
        badge.innerText = '💰 最便宜 · 淡季超值平日 (省荷包首選)';
      } else if (item.tier === 'moderate') {
        badge.className = 'text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300';
        badge.innerText = '⚖️ 普通 · 一般週末/次尖峰';
      } else {
        badge.className = 'text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300';
        badge.innerText = '🚨 極貴/人超多 · 旺季或日本國定連假';
      }

      document.getElementById('official-price-jpy').innerText = item.jpy.toLocaleString();
      document.getElementById('official-price-twd').innerText = baseTwd.toLocaleString();
      document.getElementById('klook-original-price').innerText = baseTwd.toLocaleString();
      
      const klookPrice = isPromoActive ? Math.max(1200, finalTwd - 50) : Math.max(1500, baseTwd - 100);
      document.getElementById('klook-price').innerText = klookPrice.toLocaleString();
      document.getElementById('kkday-price').innerText = Math.max(1400, (isPromoActive ? finalTwd : baseTwd) - 29).toLocaleString();

      if (isPromoActive) {
        document.getElementById('klook-promo-badge').innerText = '🔥 85折快閃優惠中';
        document.getElementById('klook-code-text').innerText = 'FLASH85DISNEY';
      } else {
        document.getElementById('klook-promo-badge').innerText = '現折百元碼';
        document.getElementById('klook-code-text').innerText = 'DISNEYTW88';
      }

      // 人潮進度條
      const crowdBar = document.getElementById('crowd-progress-bar');
      const crowdBadge = document.getElementById('crowd-status-badge');
      const crowdTip = document.getElementById('crowd-tip');
      crowdBar.style.width = item.crowd + '%';

      const waitFactor = item.crowd / 50;
      document.getElementById('wait-ride-1').innerText = \`~\${Math.round(Math.max(35, 75 * waitFactor))} 分\`;
      document.getElementById('wait-ride-2').innerText = \`~\${Math.round(Math.max(25, 50 * waitFactor))} 分\`;
      document.getElementById('wait-ride-3').innerText = \`~\${Math.round(Math.max(25, 45 * waitFactor))} 分\`;

      if (item.crowd < 40) {
        crowdBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-300';
        crowdBadge.className = 'text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800';
        crowdBadge.innerText = \`🟢 舒適輕鬆 (指數 \${item.crowd}/100)\`;
        crowdTip.innerHTML = '🎯 <strong>通關攻略：</strong>今日人潮偏少，排隊極順暢，不需額外花錢購買 DPA 快速通關也能輕鬆玩完全區大作！';
      } else if (item.crowd <= 70) {
        crowdBar.className = 'h-full bg-amber-500 rounded-full transition-all duration-300';
        crowdBadge.className = 'text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800';
        crowdBadge.innerText = \`🟡 普通適中 (指數 \${item.crowd}/100)\`;
        crowdTip.innerHTML = '🎯 <strong>通關攻略：</strong>建議開園前 40 分鐘抵達現場排隊入閘，入園第一時間抽取官方免費 Priority Pass。';
      } else {
        crowdBar.className = 'h-full bg-rose-600 rounded-full transition-all duration-300';
        crowdBadge.className = 'text-xs font-bold px-2.5 py-1 rounded bg-rose-100 text-rose-800';
        crowdBadge.innerText = \`🚨 極度爆滿 (指數 \${item.crowd}/100)\`;
        crowdTip.innerHTML = '🎯 <strong>通關攻略：</strong>人潮管制警告！熱門項目排隊預估破 120 分鐘，入園務必立刻搶購美女與野獸 / 夢幻泉鄉 DPA 尊享卡。';
      }

      document.getElementById('wind-speed').innerText = \`預估風速 \${item.wind} m/s\`;
      document.getElementById('maintenance-info').innerText = item.maint;
    }

    renderCalendar(false);
    updateDetails(selectedDayItem);
  </script>
</body>
</html>`;
  }, []);

  // 複製 HTML 程式碼
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(singleFileHtmlCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  // 下載 HTML 檔案
  const handleDownloadHtml = () => {
    const blob = new Blob([singleFileHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'disney_price_tracker.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 w-full max-w-full overflow-x-hidden">
      {/* 模擬即時推播橫幅 Toast (當突發促銷觸發時跳出) */}
      {showPushToast && promoState && promoState.active && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-emerald-400 flex items-start gap-3.5 animate-in slide-in-from-bottom duration-300">
          <div className="p-2.5 bg-emerald-500 text-white rounded-xl text-xl shrink-0 shadow-sm animate-bounce">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ 平台突發降價推播通知！</span>
              </span>
              <button
                onClick={() => setShowPushToast(false)}
                className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-sm font-black text-white mt-1 leading-snug">
              {promoState.title}！日曆所有台幣價格已肉眼可見自動大幅調降！
            </p>
            <div className="mt-2 text-xs text-slate-300 flex items-center gap-2">
              <span>專屬優惠碼：</span>
              <code className="bg-emerald-950 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-800">
                {promoState.code}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* 頂部導航列 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Zone 1: 品牌標題與全球樂園快速切換器 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl" role="img" aria-label="castle">🏰</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                    {selectedParkId === 'tokyo' ? '東京迪士尼門票情報' :
                     selectedParkId === 'hongkong' ? '香港迪士尼門票情報' :
                     selectedParkId === 'shanghai' ? '上海迪士尼門票情報' :
                     '加州迪士尼門票情報'}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.5 rounded-md font-bold">
                    海外樂園門票情報
                  </span>
                </div>
              </div>
            </div>

            {/* 🌐 全球迪士尼分園快速切換器 (Park Switcher) - 手機上橫向滾動支援 */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto max-w-full scrollbar-none py-1">
              {PARKS_LIST.map((park) => {
                const isActive = park.id === selectedParkId;
                return (
                  <button
                    key={park.id}
                    type="button"
                    onClick={() => handleParkSwitch(park.id)}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs scale-102'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/80'
                    }`}
                  >
                    <span>{park.flag}</span>
                    <span>{park.shortName}</span>
                    {park.id === 'hongkong' && (
                      <span className="hidden md:inline-block text-[9px] bg-sky-400 text-slate-950 px-1 rounded font-bold leading-none">
                        冰雪
                      </span>
                    )}
                    {park.id === 'shanghai' && (
                      <span className="hidden md:inline-block text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-bold leading-none">
                        動物城
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone 2: 導航 */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-600">
            <a href="#subscribe" className="hover:text-indigo-600 transition-colors whitespace-nowrap">降價通知</a>
            <a href="#calendar" className="hover:text-indigo-600 transition-colors whitespace-nowrap">低價日曆</a>
            <a href="#compare" className="hover:text-indigo-600 transition-colors whitespace-nowrap">三平台比價</a>
            <a href="#rides" className="hover:text-indigo-600 transition-colors whitespace-nowrap">熱門設施</a>
            <a href="#crowd" className="hover:text-indigo-600 transition-colors whitespace-nowrap">人潮預報</a>
          </nav>

          {/* Zone 3: 正式商用頂部快捷導航（即時匯率 + 開賣通知 + LINE 推播） */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none py-0.5 md:py-0 w-full md:w-auto justify-start md:justify-end">
            {/* 動態多幣別即時匯率牌告膠囊 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{currentPark.flag} {currentPark.ratePrefix} ≈ NT$ {activeRate.toFixed(selectedParkId === 'tokyo' ? 4 : 2)}</span>
            </div>

            {/* LINE 官方通知推播 */}
            <a
              href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-black text-white bg-[#06C755] hover:bg-[#05b34c] transition-all rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
            >
              <span>💬</span>
              <span>LINE 諮詢</span>
            </a>

            {/* 直達開賣預約 */}
            <a
              href="#subscribe"
              className="px-3 py-1.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>開賣提醒</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-6 w-full max-w-full overflow-hidden">

        {/* 🔔 核心功能 1：【平台促銷降價・立馬通知我】訂閱核心卡片 */}
        <section id="subscribe" className={`bg-gradient-to-r ${currentPark.gradient} text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-indigo-500/40 relative overflow-hidden transition-all duration-300`}>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                </span>
                <span className="animate-pulse">{currentPark.flag} {currentPark.highlightsBadge}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                【{currentPark.name}】特惠降價 或 開放訂票，<span className="text-amber-300 underline decoration-amber-400/60 underline-offset-4">立馬通知我！</span>
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-2xl">
                {currentPark.tagline}！{currentPark.bookingRulesSummary} 淡旺季價差高達 <strong className="text-emerald-400">NT$ {priceStats.diffPerTicket.toLocaleString()}</strong>！無論您想去的日期<strong>尚未開放訂票（預約開賣第一秒提醒）</strong>，或是等待 Klook / KKday <strong>釋出快閃特惠折扣碼</strong>，系統都將第一時間寄信通知您！
              </p>
            </div>

            {/* 訂閱輸入表單 (已串接真實後端與 Resend 自動寄信) */}
            <div className="lg:col-span-5">
              <form onSubmit={handleSubscribeSubmit} className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 space-y-2.5">
                <div>
                  <select
                    value={subAlertType}
                    onChange={(e) => setSubAlertType(e.target.value as 'promo' | 'ticket_open' | 'both')}
                    className="w-full px-3 py-2 text-xs font-extrabold text-indigo-950 bg-amber-300 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="both">🔥 「開賣第一秒」＋「降價特惠」都通知我</option>
                    <option value="ticket_open">🎟️ 我想去的日期還沒開賣，開放訂票時立馬通知我</option>
                    <option value="promo">⚡ 只在 Klook / KKday 釋出快閃折扣碼時通知我</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={subTargetMonth}
                    onChange={(e) => setSubTargetMonth(e.target.value)}
                    className="px-2.5 py-2 text-xs font-bold text-slate-800 bg-white/95 rounded-xl focus:outline-none"
                  >
                    <option value="2026-11">📅 2026年 11月 (熱賣中)</option>
                    <option value="2026-12">🎄 2026年 12月 (熱賣中)</option>
                    <option value="2027-01">🎍 2027年 01月 (含開賣預約)</option>
                    <option value="2027-02">🧨 2027年 02月 (春節寒假·開賣預約)</option>
                    <option value="2027-03">🌸 2027年 03月 (櫻花春假·開賣預約)</option>
                    <option value="2027-04">🐰 2027年 04月 (復活賞櫻·開賣預約)</option>
                    <option value="2027-05">🎏 2027年 05月 (日本黃金週·開賣預約)</option>
                    <option value="2027-06">☀️ 2027年 06月 (初夏特惠·開賣預約)</option>
                    <option value="2027-07">🏖️ 2027年 07月 (暑假祭典·開賣預約)</option>
                    <option value="2027-08">🏮 2027年 08月 (盛夏盂蘭盆·開賣預約)</option>
                    <option value="2027-09">🎑 2027年 09月 (白銀週秋季·開賣預約)</option>
                    <option value="2027-10">🎃 2027年 10月 (萬聖變裝·開賣預約)</option>
                    <option value="2027-11">🍁 2027年 11月 (秋楓特惠·開賣預約)</option>
                    <option value="2027-12">❄️ 2027年 12月 (聖誕跨年·開賣預約)</option>
                    <option value="all">🗓️ 不限月份皆通知</option>
                  </select>
                  <select
                    value={subTargetPark}
                    onChange={(e) => setSubTargetPark(e.target.value as 'land' | 'sea' | 'both')}
                    className="px-2.5 py-2 text-xs font-bold text-slate-800 bg-white/95 rounded-xl focus:outline-none"
                  >
                    <option value="both">🏰+🌋 兩園皆關注</option>
                    <option value="land">🏰 只看迪士尼陸地</option>
                    <option value="sea">🌋 只看迪士尼海洋</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="請輸入您的 Email (如 user@gmail.com)"
                      className="w-full pl-10 pr-3 py-3 text-xs sm:text-sm text-slate-900 bg-white rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingSub}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 group disabled:opacity-60"
                >
                  <Bell className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
                  <span>{submittingSub ? '正在為您建立通知設定...' : '免費開啟降價與開賣通知 →'}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-indigo-200 px-1">
                  <span>🔒 絕無垃圾郵件 · 隨時可一鍵取消</span>
                  <span>⚡ 已有 {subscriberCount.toLocaleString()} 位遊客訂閱</span>
                </div>

                <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-indigo-100 font-bold">📲 習慣用 LINE？</span>
                  <a
                    href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                    target="_blank"
                    rel="noopener noreferrer"
                    
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    <span>💬 加入 LINE 官方帳號通知</span>
                  </a>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 促銷特惠生效橫條 (當突發促銷被觸發時亮起) */}
        {promoState && promoState.active && (
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-emerald-300 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white text-emerald-700 rounded-xl font-bold shadow-xs">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                  <span className="bg-emerald-800 text-white text-[10px] px-2 py-0.5 rounded font-black">限時快閃特惠中</span>
                  <span>{promoState.badge}</span>
                </div>
                <div className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  {promoState.title}！日曆所有台幣價格已全數同步降價，格子閃爍綠光！
                </div>
              </div>
            </div>
            <button
              onClick={() => { setPromoState(null); setShowPushToast(false); }}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              恢復正常票價
            </button>
          </div>
        )}

        {/* 工具列 (Toolbar)：票種年齡 + 匯率設定 + 直達排隊攻略捷徑 */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          {/* 票種切換 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">票種年齡:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setTicketType('adult')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  ticketType === 'adult'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                成人 (18歲+)
              </button>
              <button
                onClick={() => setTicketType('junior')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  ticketType === 'junior'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                學生 (12~17歲)
              </button>
              <button
                onClick={() => setTicketType('child')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  ticketType === 'child'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                兒童 (4~11歲)
              </button>
            </div>
          </div>

          {/* 當前分園狀態 & 直達分園設施排隊攻略捷徑 */}
          <div className="flex items-center gap-2">
            <a
              href="#rides"
              className="group px-3.5 py-1.5 text-xs font-extrabold bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-xl border border-indigo-200/90 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="點擊直接滑動至下方分園設施排隊攻略專區"
            >
              <span>🎢 目前分園：<strong>{currentPark.subParks[selectedSubParkIndex] || currentPark.shortName}</strong></span>
              <span className="text-indigo-500 group-hover:translate-y-0.5 transition-transform">↓ 點此切換設施</span>
            </a>
          </div>

          {/* 即時匯率設定 (自動同步即時匯率) */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap" title={exchangeRateSource}>
              🟢 當前幣別匯率:
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 tabular-nums">
              <span>{currentPark.flag} {currentPark.ratePrefix} ≈ NT$ {activeRate.toFixed(selectedParkId === 'tokyo' ? 4 : 2)}</span>
            </div>
          </div>
        </section>

        {/* 📊 核心區域：台幣低價日曆一覽表 (Grid View) */}
        <section id="calendar" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
          {/* 日曆頂部工具列：月份切換 + 篩選器 + 圖例 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            {/* 月份選取器 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={handlePrevMonth}
                  disabled={selectedYear === 2026 && selectedMonth === 11}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="上一月"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <select
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number);
                    setSelectedYear(y);
                    setSelectedMonth(m);
                  }}
                  className="px-2 py-1 font-extrabold text-base sm:text-lg text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer tabular-nums"
                  title="點擊直接挑選月份"
                >
                  <option value="2026-11">2026年 11月 (熱賣中)</option>
                  <option value="2026-12">2026年 12月 (熱賣中)</option>
                  <option value="2027-1">2027年 1月 (含開賣預約)</option>
                  <option value="2027-2">2027年 2月 (春節連假)</option>
                  <option value="2027-3">2027年 3月 (櫻花春假)</option>
                  <option value="2027-4">2027年 4月 (復活賞櫻)</option>
                  <option value="2027-5">2027年 5月 (黃金週)</option>
                  <option value="2027-6">2027年 6月 (初夏特惠)</option>
                  <option value="2027-7">2027年 7月 (暑假祭典)</option>
                  <option value="2027-8">2027年 8月 (盛夏盂蘭盆)</option>
                  <option value="2027-9">2027年 9月 (秋季白銀週)</option>
                  <option value="2027-10">2027年 10月 (萬聖變裝)</option>
                  <option value="2027-11">2027年 11月 (秋楓特惠)</option>
                  <option value="2027-12">2027年 12月 (聖誕跨年)</option>
                </select>

                <button
                  onClick={handleNextMonth}
                  disabled={selectedYear === 2027 && selectedMonth === 12}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="下一月"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* 快速月份捷徑 (可橫向捲動，支援 2026/11 ~ 2027/12 全年預約) */}
              <div className="flex items-center gap-1.5 text-xs overflow-x-auto max-w-full md:max-w-xl pb-1">
                {[
                  { y: 2026, m: 11, label: '26/11月 秋楓' },
                  { y: 2026, m: 12, label: '26/12月 聖誕' },
                  { y: 2027, m: 1, label: '27/1月 寒假' },
                  { y: 2027, m: 2, label: '27/2月 春節' },
                  { y: 2027, m: 3, label: '27/3月 櫻花' },
                  { y: 2027, m: 4, label: '27/4月 復活節' },
                  { y: 2027, m: 5, label: '27/5月 黃金週' },
                  { y: 2027, m: 6, label: '27/6月 初夏' },
                  { y: 2027, m: 7, label: '27/7月 暑假祭' },
                  { y: 2027, m: 8, label: '27/8月 盂蘭盆' },
                  { y: 2027, m: 9, label: '27/9月 白銀週' },
                  { y: 2027, m: 10, label: '27/10月 萬聖' },
                  { y: 2027, m: 11, label: '27/11月 秋特惠' },
                  { y: 2027, m: 12, label: '27/12月 跨年' }
                ].map(item => (
                  <button
                    key={`${item.y}-${item.m}`}
                    onClick={() => { setSelectedYear(item.y); setSelectedMonth(item.m); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 text-xs ${
                      selectedYear === item.y && selectedMonth === item.m
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 顏色等級圖例 */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/90 text-emerald-900 rounded-md border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>💰 最便宜 ({currentPark.tiers[0].badge})</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/90 text-amber-900 rounded-md border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>⚖️ 普通 ({currentPark.tiers[1].badge})</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100/90 text-rose-900 rounded-md border border-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>🚨 高峰/連假 ({currentPark.tiers[2].badge})</span>
              </div>
            </div>
          </div>

          {/* 日曆網格容器：手機版提供流暢左右橫向滾動，桌機版滿版自適應 */}
          <div className="space-y-1">
            <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-500 font-medium px-1 mb-1">
              <span>👉 左右滑動日曆可查看一週 7 天完整票價</span>
              <span className="text-indigo-600 font-bold">左右滑動 ↔</span>
            </div>
            <div className="overflow-x-auto pb-3 -mx-2 px-2 sm:mx-0 sm:px-0">
              <div className="min-w-[580px] sm:min-w-full space-y-2">
                {/* 星期表頭 */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center font-bold text-xs sm:text-sm">
                  <div className="py-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">週日 (Sun)</div>
                  <div className="py-2.5 bg-slate-100 text-slate-700 rounded-lg">週一 (Mon)</div>
                  <div className="py-2.5 bg-slate-100 text-slate-700 rounded-lg">週二 (Tue)</div>
                  <div className="py-2.5 bg-slate-100 text-slate-700 rounded-lg">週三 (Wed)</div>
                  <div className="py-2.5 bg-slate-100 text-slate-700 rounded-lg">週四 (Thu)</div>
                  <div className="py-2.5 bg-slate-100 text-slate-700 rounded-lg">週五 (Fri)</div>
                  <div className="py-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">週六 (Sat)</div>
                </div>

                {/* 日曆網格 (Grid View) */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {/* 月初前的空白格子 */}
            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[85px] sm:min-h-[110px] rounded-xl bg-slate-50/50 border border-dashed border-slate-200/60 opacity-40"
              />
            ))}

            {/* 每一個日期的格子 */}
            {monthDays.map((day) => {
              const ticketPriceVal = getDayTicketPrice(day, ticketType);
              const { baseTwd, finalTwd, hasPromo } = calculatePrice(ticketPriceVal);
              const isSelected = selectedDateStr === day.date;

              let cardBg = 'bg-emerald-50 hover:bg-emerald-100/90 border-emerald-300 text-emerald-950';
              let badgeColor = 'bg-emerald-600 text-white';
              let priceColor = 'text-emerald-950';

              if (day.tier === 'moderate') {
                cardBg = 'bg-amber-50 hover:bg-amber-100/90 border-amber-300 text-amber-950';
                badgeColor = 'bg-amber-600 text-white';
                priceColor = 'text-amber-950';
              } else if (day.tier === 'expensive') {
                cardBg = 'bg-rose-50 hover:bg-rose-100/90 border-rose-300 text-rose-950';
                badgeColor = 'bg-rose-600 text-white';
                priceColor = 'text-rose-950';
              }

              // 閃爍綠光效果 (當促銷觸發時)
              const flashStyle = isPriceFlashing
                ? 'ring-4 ring-emerald-400 bg-emerald-100 shadow-xl scale-[1.02] transition-transform duration-300'
                : '';

              return (
                <div
                  key={day.date}
                  onClick={() => {
                    setSelectedDateStr(day.date);
                    if (day.bookingStatus === 'upcoming') {
                      setTimeout(() => {
                        const target = document.getElementById('booking-reminder-card');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          target.classList.add('ring-4', 'ring-rose-400', 'scale-[1.01]');
                          setTimeout(() => {
                            target.classList.remove('ring-4', 'ring-rose-400', 'scale-[1.01]');
                          }, 1200);
                        }
                      }, 60);
                    }
                  }}
                  className={`relative cursor-pointer rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 flex flex-col justify-between transition-all duration-200 min-h-[92px] sm:min-h-[118px] group ${cardBg} ${flashStyle} ${
                    isSelected
                      ? 'ring-4 ring-indigo-600 ring-offset-2 shadow-lg z-10 scale-[1.02]'
                      : 'hover:shadow-md'
                  }`}
                >
                  {/* 第一視覺元素：日期與星期 */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                        {day.month}/{day.day} <span className="text-[11px] font-semibold text-slate-600">{day.weekdayStr}</span>
                      </span>
                      {day.bookingStatus === 'upcoming' ? (
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded mt-1 inline-block w-fit leading-none">
                          ⏳ {day.saleOpenLabel}
                        </span>
                      ) : day.eventNote ? (
                        <span className="text-[10px] text-rose-600 font-bold truncate max-w-[70px] sm:max-w-[90px] leading-none mt-0.5">
                          {day.eventNote}
                        </span>
                      ) : null}
                    </div>

                    {/* 第三視覺元素：價格等級標籤 */}
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap leading-none ${badgeColor}`}
                    >
                      {day.tierLabel}
                    </span>
                  </div>

                  {/* 第二視覺元素：台幣預估價格 (含突發促銷對比) */}
                  <div className="mt-2 text-right">
                    <div className="text-[10px] text-slate-500 font-medium">
                      {day.bookingStatus === 'upcoming' ? (
                        <span className="text-indigo-700 font-bold">預估開賣台幣</span>
                      ) : (
                        <>預估台幣 {hasPromo && <span className="text-emerald-700 font-bold">(限時特惠)</span>}</>
                      )}
                    </div>
                    {hasPromo && (
                      <div className="text-[11px] text-slate-400 line-through tabular-nums leading-none">
                        ${baseTwd.toLocaleString()}
                      </div>
                    )}
                    <div className={`text-base sm:text-xl font-extrabold tabular-nums tracking-tight ${priceColor}`}>
                      ${finalTwd.toLocaleString()}
                    </div>
                  </div>

                  {/* 底部微型人潮指示 */}
                  <div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="tabular-nums font-bold">{day.currencySymbol}{ticketPriceVal.toLocaleString()}</span>
                    {day.bookingStatus === 'upcoming' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shadow-2xs group-hover:bg-rose-100 group-hover:scale-105 transition-all">
                        🔔 預約開賣
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            day.crowdLevel < 40 ? 'bg-emerald-500' : day.crowdLevel <= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span className="hidden sm:inline">{day.crowdStatus}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🖱️ 核心功能 2：日曆點擊連動詳細比價區 */}
        {currentDayData && (
          <section id="compare" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
            {/* 連動選取日期標題橫幅 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
              <div>
                <div className="text-xs font-bold text-indigo-600 tracking-wider">
                  已選取日期情報連動（{currentPark.name} · {currentPark.subParks[selectedSubParkIndex] || currentPark.subParks[0]}）
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 flex items-center flex-wrap gap-2.5">
                  <span>{currentDayData.month}月{currentDayData.day}日 ({currentDayData.weekdayStr})</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      currentDayData.tier === 'cheap'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : currentDayData.tier === 'moderate'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {currentDayData.tierLabel} · {currentDayData.tierBadge}
                  </span>
                  {currentDayData.bookingStatus === 'upcoming' ? (
                    <span className="text-xs font-black px-3 py-1 rounded-md bg-indigo-600 text-white shadow-xs">
                      ⏳ 尚未開放訂票（{currentPark.bookingWindow}）
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-600 text-white">
                      🟢 目前已開放預訂
                    </span>
                  )}
                </h3>
              </div>

              {/* 天氣與營運時間資訊 */}
              <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{currentDayData.weather.icon}</span>
                  <div>
                    <div className="font-bold text-slate-900">{currentDayData.weather.temp}</div>
                    <div>{currentDayData.weather.condition} · 降雨機率 {currentDayData.weather.rainProb}%</div>
                  </div>
                </div>
                <div className="border-l border-slate-300 pl-3">
                  <div className="font-bold text-slate-900">開園時間: 09:00 - 21:00</div>
                  <div>夜間高空煙火: 20:30 (預定)</div>
                </div>
              </div>
            </div>

            {/* 🎟️ 若選取的日期「尚未開放訂票」，顯示專屬【開賣第一秒通知我】預約卡片 (根據選取角色動態變換專屬配色) */}
            {currentDayData.bookingStatus === 'upcoming' && (() => {
              const activeChar = getCharacterById(selectedCharacterId);
              return (
                <div id="booking-reminder-card" className={`${activeChar.cardBg} border-2 ${activeChar.cardBorder} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300 scroll-mt-20`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>⏰ 尚未到開放訂票時間（入園前 2 個月開賣）</span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900">
                        想訂 <span className="text-indigo-700">{currentDayData.month}月{currentDayData.day}日</span> 的門票嗎？預計於 <span className="underline font-black text-rose-600">{currentDayData.saleOpenDate} 台灣時間 13:00</span> 開放預訂！
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        不用自己設鬧鐘苦等！挑選您喜歡的<strong>迪士尼專屬守護角色</strong>，在下方填入 Email，當 Klook / KKday 與官網<strong>一開放預訂</strong>，該角色將第一秒以<strong>專屬配色圖文祝賀信</strong>與訂票連結通知您！
                      </p>
                    </div>

                    {/* LINE 按鈕已移至下方整合通知中心 */}
                  </div>

                  {/* 👑 5 大迪士尼開賣通知角色選擇區 (使用參考圖高畫質立繪與角色專屬配色) */}
                  <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>挑選開賣通知守護角色（點選切換專屬主題配色與祝賀）：</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        5 位經典夥伴已就緒
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {DISNEY_CHARACTERS.map((char) => {
                        const isSelected = selectedCharacterId === char.id;
                        return (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => setSelectedCharacterId(char.id)}
                            className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between group relative overflow-hidden ${
                              isSelected
                                ? `${char.cardRing} ${char.cardBg}`
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            {/* 角色經典立繪 (來自參考圖) */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1 drop-shadow-sm group-hover:scale-108 transition-transform duration-200">
                              <img
                                src={char.avatarUrl}
                                alt={char.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="text-xs font-black text-slate-900 mt-1">{char.shortName}</div>
                            <div className="text-[10px] text-slate-500 font-medium line-clamp-1">{char.tag}</div>
                            {isSelected ? (
                              <span className={`mt-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs ${char.activeTabStyle}`}>
                                ✓ 守護中
                              </span>
                            ) : (
                              <span className="mt-2 text-[10px] text-slate-400 font-semibold group-hover:text-slate-600">
                                點擊選擇
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* 當前選定角色的專屬配色圖文祝賀台詞卡片 */}
                    <div className={`p-4 ${activeChar.speechBg} rounded-2xl border-2 ${activeChar.cardBorder} flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all duration-300 shadow-xs`}>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center drop-shadow-md">
                        <img
                          src={activeChar.avatarUrl}
                          alt={activeChar.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="text-xs sm:text-sm leading-relaxed flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <span className="font-black text-slate-900 text-sm">【{activeChar.title}】專屬通知：</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeChar.badgeBg}`}>
                            {activeChar.tag}
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-800 text-xs sm:text-sm">
                          「<span style={{ color: activeChar.themeColor }}>{activeChar.greeting}</span> {activeChar.speech}」
                        </div>
                      </div>
                    </div>

                    {/* 整合式雙通道通知中心 (LINE 與 Email 二擇一，直覺不混淆) */}
                    <div className="pt-3 border-t-2 border-slate-200/80 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-rose-500 animate-bounce" />
                          <span>選擇開賣通知方式（{currentDayData.month}月{currentDayData.day}日 開賣第一秒準時推播）：</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">任選一種即可完成預約</span>
                      </div>

                      {/* 方式一：LINE 一鍵預約 (免打字直通) */}
                      <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center text-white text-xl font-bold shadow-xs shrink-0">
                            💬
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                              <span>【方式一】用 LINE 一鍵預約開賣</span>
                              <span className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">免打字·秒速登記</span>
                            </div>
                            <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                              點擊自動開啟 LINE 並帶入「{currentDayData.dateStr}」預約訊息，發送即可！
                            </div>
                          </div>
                        </div>

                        <a
                          href={affiliateConfig.lineOfficialUrl || 'https://lin.ee/XnkEyyl'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(`您好！我想預約 ${currentDayData.dateStr}【${currentPark.name}】開賣通知與早鳥特惠 🏰✨`);
                            }
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                        >
                          <span>💬 點此加入 LINE 預約</span>
                        </a>
                      </div>

                      {/* 分隔線 OR */}
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="shrink mx-3 text-xs font-black text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                          或者使用 Email 接收信件
                        </span>
                        <div className="flex-grow border-t border-slate-300"></div>
                      </div>

                      {/* 方式二：Email 專屬圖文信 */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                          <span>【方式二】由【{activeChar.shortName}】發送專屬 Email 開賣通知：</span>
                          <span className="text-[10px] text-slate-500 font-normal">（零垃圾信，開賣當天當刻寄達）</span>
                        </div>
                        <form onSubmit={handleTicketOpenAlertSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="email"
                            required
                            value={openAlertEmail}
                            onChange={(e) => setOpenAlertEmail(e.target.value)}
                            placeholder={`請輸入接收開賣通知的 Email，將由【${activeChar.shortName}】開賣當刻發信通知...`}
                            className="px-4 py-3 text-xs sm:text-sm bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 font-medium flex-1 shadow-2xs"
                            style={{ outlineColor: activeChar.themeColor }}
                          />
                          <button
                            type="submit"
                            disabled={submittingSub}
                            className={`px-6 py-3 bg-gradient-to-r ${activeChar.buttonGradient} ${activeChar.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-all active:scale-95 disabled:opacity-60`}
                          >
                            <Bell className="w-4 h-4" />
                            <span>由【{activeChar.shortName}】預約 Email 通知</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 三大購票管道即時比價卡片 (日本官網、Klook、KKday) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  <span>三大通路票價與專案折扣詳細比價 (台幣換算)</span>
                </h4>
                <span className="text-xs text-slate-500">以 {ticketType === 'adult' ? '成人票' : ticketType === 'junior' ? '學生票' : '兒童票'} 換算</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Klook 客路 */}
                <div className="border-2 border-orange-400 bg-gradient-to-b from-orange-50/50 to-white rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl">
                    {promoState && promoState.platform === 'Klook' ? '🔥 快閃特惠生效中' : '推薦折扣首選'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-orange-600 tracking-tight">Klook 客路</span>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-slate-500 font-medium">特惠折抵價 (台幣)</div>
                      <div className="text-3xl font-black text-slate-900 tabular-nums">
                        NT$ {calculatePrice(getDayTicketPrice(currentDayData, ticketType)).finalTwd.toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-through">
                        官網定價 NT$ {toBaseTwd(getDayTicketPrice(currentDayData, ticketType)).toLocaleString()} ({currentPark.currencySymbol} {getDayTicketPrice(currentDayData, ticketType).toLocaleString()})
                      </p>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-orange-100 pt-3">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          {promoState && promoState.platform === 'Klook' ? (
                            <span className="text-emerald-700 font-bold">
                              已套用快閃碼【<code className="text-orange-600">{promoState.code}</code>】現享 {Math.round(promoState.discountRate * 100)} 折！
                            </span>
                          ) : (
                            <span>
                              {currentPark.klookPromoDesc}【<strong className="text-orange-600">{currentPark.klookPromoCode}</strong>】
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>以新台幣直接扣款，<strong>免外幣交易手續費 1.5%</strong></span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>免現場排隊換票！手機出示電子憑證 QR Code 秒刷入閘</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAffiliateClick('Klook')}
                    className="mt-6 w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>前往 Klook 購票 (享【{currentPark.shortName}】專屬特惠)</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>

                {/* 2. KKday */}
                <div className="border border-sky-300 bg-gradient-to-b from-sky-50/50 to-white rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-sky-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl">
                    加贈方案
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-sky-700 tracking-tight">KKday</span>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-slate-500 font-medium">即時促銷價 (台幣)</div>
                      <div className="text-3xl font-black text-slate-900 tabular-nums">
                        NT$ {(calculatePrice(getDayTicketPrice(currentDayData, ticketType)).finalTwd - (selectedParkId === 'tokyo' ? 30 : 0)).toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        官方定價 NT$ {toBaseTwd(getDayTicketPrice(currentDayData, ticketType)).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-sky-100 pt-3">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{currentPark.kkdayBonus}</strong></span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>可合購交通票券與快速通關享專屬同捆折扣</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>官方授權憑證秒發，台幣結帳無匯差煩惱</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAffiliateClick('KKday')}
                    className="mt-6 w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>前往 KKday 預訂 (享【{currentPark.shortName}】專屬方案)</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>

                {/* 3. 官方網站 */}
                <div className="border border-slate-300 bg-slate-50/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-800 tracking-tight">{currentPark.shortName}迪士尼官方網站</span>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-slate-500 font-medium">官方標準定價 ({currentPark.currencyName})</div>
                      <div className="text-3xl font-black text-slate-900 tabular-nums">
                        {currentPark.currencySymbol} {getDayTicketPrice(currentDayData, ticketType).toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        約 NT$ {toBaseTwd(getDayTicketPrice(currentDayData, ticketType)).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
                      <div className="flex items-start gap-1.5">
                        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>原幣刷卡結帳，需加計銀行 1.5% 海外交易手續費</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>需先註冊 {currentPark.englishName} 官方會員帳號</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>直接同步至官方 App 進行快速通關或預約等候</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAffiliateClick('Official')}
                    className="mt-6 w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>開啟【{currentPark.shortName}迪士尼】官方購票</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              </div>
            </div>

            {/* 人潮進度條 🚦 與設施維修/強風預警 🌬️ */}
            <div id="crowd" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3">
              {/* 人潮進度條 */}
              <div className="lg:col-span-6 bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="text-xl">🚦</span>
                    <span className="text-base">當日人潮預報進度條</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${currentDayData.crowdColor}`}>
                    {currentDayData.crowdStatus} (指數: {currentDayData.crowdLevel}/100)
                  </span>
                </div>

                {/* 進度條 */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentDayData.crowdLevel < 40
                          ? 'bg-emerald-500'
                          : currentDayData.crowdLevel <= 65
                          ? 'bg-sky-500'
                          : currentDayData.crowdLevel <= 80
                          ? 'bg-orange-500'
                          : 'bg-rose-600'
                      }`}
                      style={{ width: `${currentDayData.crowdLevel}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>🟢 舒適自在 (0~39)</span>
                    <span>🟡 適中好逛 (40~65)</span>
                    <span>🟠 人潮偏多 (66~80)</span>
                    <span>🔴 極度爆滿 (81~100)</span>
                  </div>
                </div>

                {/* 預估排隊時間表 */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>當日主力遊樂設施預估排隊時間：</span>
                  </div>
                  {selectedParkId === 'tokyo' ? (
                    selectedPark === 'land' ? (
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-500">美女與野獸</div>
                          <div className="text-base font-extrabold text-indigo-700 tabular-nums">
                            ~{currentDayData.waitTimeLand.beautyAndBeast} 分
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-500">太空山</div>
                          <div className="text-base font-extrabold text-slate-800 tabular-nums">
                            ~{currentDayData.waitTimeLand.spaceMountain} 分
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-500">飛濺山</div>
                          <div className="text-base font-extrabold text-slate-800 tabular-nums">
                            ~{currentDayData.waitTimeLand.splashMountain} 分
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-500">夢幻泉鄉·冰雪</div>
                          <div className="text-base font-extrabold text-indigo-700 tabular-nums">
                            ~{currentDayData.waitTimeSea.frozenJourney} 分
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-500">翱翔：夢幻奇航</div>
                          <div className="text-base font-extrabold text-slate-800 tabular-nums">
                            ~{currentDayData.waitTimeSea.soaring} 分
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-500">驚魂古塔</div>
                          <div className="text-base font-extrabold text-slate-800 tabular-nums">
                            ~{currentDayData.waitTimeSea.towerOfTerror} 分
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      {selectedParkId === 'hongkong' && selectedSubParkIndex === 1 ? (
                        <>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="魔雪奇幻之旅">魔雪奇幻之旅</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~60~100 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="雪嶺滑雪橇">雪嶺滑雪橇</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~50~90 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="森林小天地慶典">森林小天地</div>
                            <div className="text-base font-extrabold text-slate-800 tabular-nums">~20~35 分</div>
                          </div>
                        </>
                      ) : selectedParkId === 'shanghai' && selectedSubParkIndex === 1 ? (
                        <>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="瘋狂動物城：熱力追蹤">熱力追蹤</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~70~120 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="爪爪棒冰與大象甜品">爪爪棒冰甜品</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~15~30 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="動物城警局互動">警局巡邏互動</div>
                            <div className="text-base font-extrabold text-slate-800 tabular-nums">~25~45 分</div>
                          </div>
                        </>
                      ) : selectedParkId === 'usa' && selectedSubParkIndex === 1 ? (
                        <>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="水車鎮賽車">水車鎮賽車</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~70~110 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="蛛絲發射冒險">蜘蛛人冒險</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~60~90 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="飆速雲霄飛車">皮克斯過山車</div>
                            <div className="text-base font-extrabold text-slate-800 tabular-nums">~50~80 分</div>
                          </div>
                        </>
                      ) : selectedParkId === 'usa' && selectedSubParkIndex === 2 ? (
                        <>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="阿凡達：飛行之旅">阿凡達飛行</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~100~160 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="星際異攻隊">重返宇宙過山車</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">~80~140 分</div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title="七個小矮人礦車">小矮人礦車</div>
                            <div className="text-base font-extrabold text-slate-800 tabular-nums">~70~110 分</div>
                          </div>
                        </>
                      ) : (
                        currentPark.topRides.slice(0, 3).map((r, i) => (
                          <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-slate-500 truncate" title={r.name}>{r.name}</div>
                            <div className="text-base font-extrabold text-indigo-700 tabular-nums">
                              {r.avgWait}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 快速通關建議 */}
                <div className="text-xs text-slate-600 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 flex items-start gap-2">
                  <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-indigo-900">入園通關建議：</strong>
                    {selectedParkId === 'tokyo' ? (
                      currentDayData.crowdLevel < 40
                        ? '今日人潮少，可先直衝熱門項目，免額外課金購買 DPA 也能玩得非常盡興！'
                        : currentDayData.crowdLevel <= 70
                        ? '建議開園前 40 分鐘抵達現場排隊入閘，一入園立即抽免費 Priority Pass 即可省下大把時間。'
                        : '極度擁擠警戒！強烈建議入園第一分鐘立刻課金購買【美女與野獸 / 夢幻泉鄉】DPA 尊享卡，否則下午排隊動輒 120 分鐘以上。'
                    ) : (
                      `造訪【${currentPark.name}】建議優先下載官方 App 綁定門票。開園第一時間衝刺「${currentPark.topRides[0].name}」或加購快速尊享通關，避開中午後的大排長龍！`
                    )}
                  </div>
                </div>
              </div>

              {/* 設施維修與強風預警 */}
              <div id="wind-maintenance" className="lg:col-span-6 bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="text-xl">🌬️</span>
                    <span className="text-base">海灣強風與休止設施維修預警</span>
                  </div>
                </div>

                {/* 強風預警評估卡 */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-sky-600" />
                      <span>戶外遊行海風指數預測：</span>
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      預估風速 {currentDayData.weather.windSpeed} m/s
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg text-xs font-medium border ${
                    currentDayData.weather.windSpeed > 8.0
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : currentDayData.weather.windSpeed > 5.5
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {currentDayData.weather.windAlert}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    * 迪士尼樂園座落於東京灣岸，當海風風速超過 8.0 m/s 時，夜間水上表演、高空花車巡遊與煙火（Sky Full of Colors）將可能臨時變更或取消。
                  </p>
                </div>

                {/* 當日設施保養停運清單 */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>當日園區休止保養設施清單：</span>
                  </div>

                  {dayMaintenanceList.length > 0 ? (
                    <div className="space-y-2">
                      {dayMaintenanceList.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-0.5"
                        >
                          <div className="font-bold text-amber-900 flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono">
                              {item.startDate} ~ {item.endDate}
                            </span>
                          </div>
                          {item.note && <p className="text-amber-800 text-[11px]">{item.note}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>今日無重大熱門遊樂設施排定休止，所有主力設施皆預計正常運作！</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 🌟 核心功能 3：當前樂園【王牌熱門設施與排隊攻略】 */}
        <section id="rides" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentPark.flag} {currentPark.name} · 王牌熱門設施情報</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>🌟 【{currentPark.shortName}迪士尼】必玩熱門設施與排隊攻略</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                精選 {currentPark.name} 最受歡迎 TOP 5 遊樂設施，包含平均排隊時長、尊享卡 (DPA) / 快速通關支援與內行人體驗技巧！
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                {currentPark.newZoneName}
              </span>
            </div>
          </div>

          {/* 🎪 分園 / 焦點主題園區切換 Tab（點選即時刷新下方 TOP 5 設施卡片） */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border-2 border-indigo-100 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-800 whitespace-nowrap flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>請選擇園區 / 焦點分區：</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {currentPark.subParks.map((subParkName, idx) => {
                    const isActive = selectedSubParkIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedSubParkIndex(idx);
                          if (selectedParkId === 'tokyo') {
                            setSelectedPark(idx === 0 ? 'land' : 'sea');
                          }
                        }}
                        className={`px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-2 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 scale-[1.02]'
                            : 'bg-white text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        <span>{subParkName}</span>
                        {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 即時反饋指示燈橫幅 */}
              <div className="text-xs text-indigo-900 bg-indigo-100/70 border border-indigo-200 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 self-start md:self-auto">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>目前展示：</span>
                <strong className="text-indigo-800 underline decoration-indigo-400 decoration-2">
                  {currentPark.subParks[selectedSubParkIndex] || currentPark.shortName}
                </strong>
                <span>主力設施已在下方即時更新 ↓</span>
              </div>
            </div>
          </div>

          {/* TOP 5 設施大卡片列表 (動態隨選中的分園/焦點園區瞬間切換) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(((currentPark.subParkRides && currentPark.subParkRides[selectedSubParkIndex]) || currentPark.topRides)).map((ride, idx) => (
              <div
                key={`${selectedSubParkIndex}-${idx}-${ride.name}`}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                      TOP {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {ride.zone}
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 mt-2 tracking-tight">
                    {ride.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {ride.note}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>平均等候: <strong className="text-slate-900 font-extrabold">{ride.avgWait}</strong></span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/60">
                    {ride.fastPass}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ❓ GEO & SEO 結構化對齊：常見問題 FAQ Accordion 區塊 */}
        <section id="faq" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>東京迪士尼官方攻略 · 購票常識 Q&A</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                常見問題 FAQ・門票開賣與避開人潮省錢指南
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                專為台灣旅客整理 2026-2027 東京迪士尼購票預約最常遇到的核心問題，解答即時比價、開賣時間與新園區規劃。
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
              <span>🛡️ Schema.org FAQ 結構化認證</span>
            </div>
          </div>

          <div className="space-y-3">
            {FAQ_LIST.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-indigo-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 bg-slate-50/60 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      Q{idx + 1}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{faq.q}</h3>
                  </div>
                  <div className="text-slate-400 font-black text-xl shrink-0">
                    {openFaqIndex === idx ? '−' : '+'}
                  </div>
                </button>
                {openFaqIndex === idx && (
                  <div className="p-4 sm:p-6 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                    <p>{faq.a}</p>
                    {faq.tip && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                        <span className="text-amber-600 font-bold shrink-0">💡 站長小秘訣：</span>
                        <span>{faq.tip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 🏢 專業正式頁尾 (Footer) */}
        <footer className="mt-14 border-t border-slate-200/90 pt-8 pb-10 text-xs text-slate-500 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏰</span>
              <span className="font-extrabold text-sm text-slate-800">東京迪士尼門票降價與人潮預報助手</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 flex-wrap justify-center">
              <a href="#subscribe" className="hover:text-indigo-600 transition-colors">開賣提醒</a>
              <a href="#calendar" className="hover:text-indigo-600 transition-colors">台幣低價日曆</a>
              <a href="#compare" className="hover:text-indigo-600 transition-colors">三大平台比價</a>
              <a href="#faq" className="hover:text-indigo-600 transition-colors">常見問題 FAQ</a>
              {/* 🔒 站長隱藏式後台登入入口 */}
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                title="站長管理中心"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>站長管理</span>
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>
              免責聲明：本站為獨立旅遊情報與浮動票價比價工具，非東京迪士尼度假區 (Tokyo Disney Resort) 官方網站。門票由官方授權經銷通路 (Klook / KKday) 正式提供。
            </p>
            <p className="shrink-0">© 2026-2027 Tokyo Disney Ticket Assistant. All rights reserved.</p>
          </div>
        </footer>
      </main>

      {/* 🎉 精美迪士尼風格訂閱成功彈出視窗 (Modal Pop-up，依所選角色專屬配色動態渲染) */}
      {showSubscribeModal && (() => {
        const char = getCharacterById(selectedCharacterId);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in duration-200"
              style={{ border: `4px solid ${char.themeColor}` }}
            >
              {/* 頂部裝飾條 (角色專屬色彩) */}
              <div
                className="absolute top-0 left-0 right-0 h-3"
                style={{ background: `linear-gradient(90deg, ${char.themeColor}, ${char.secondaryColor})` }}
              />

              {/* 角色大立繪展示 (原汁原味參考圖立繪) */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto flex items-center justify-center drop-shadow-md mb-2">
                <img
                  src={char.avatarUrl}
                  alt={char.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {reservedOpenDateInfo ? '🎉 開賣提醒預約成功！' : '🎉 訂閱成功！已存入系統名單'}
              </h3>
              <div className="text-xs font-bold text-slate-500 mt-1">
                已成功鎖定您的信箱：<span className="text-slate-900 font-extrabold">{emailInput}</span>
              </div>

              {/* 角色專屬恭喜買票小卡 */}
              <div className={`mt-3 p-3.5 ${char.speechBg} border-2 ${char.cardBorder} rounded-2xl flex items-center gap-3 text-left`}>
                <div className="text-2xl shrink-0">✨</div>
                <div>
                  <div className="text-xs font-black" style={{ color: char.themeColor }}>
                    【{char.title}】{char.greeting}
                  </div>
                  <div className="text-[11px] text-slate-700 leading-tight mt-0.5 font-medium">
                    「恭喜您預約成功！開賣當天由我親自送上圖文祝賀信與專屬訂票連結通知您預約購票喔！」
                  </div>
                </div>
              </div>

              {reservedOpenDateInfo && (
                <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold">
                  📅 預約入園日：<span className="text-indigo-700 font-black">{reservedOpenDateInfo.date}</span>
                  <br />
                  ⏰ 預計開賣時間：<span style={{ color: char.themeColor }} className="font-black">{reservedOpenDateInfo.saleOpenDate} 台灣時間 13:00</span>
                </div>
              )}
              {welcomeEmailSent && (
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  ✅ 已同步寄出確認信至您的信箱！
                </div>
              )}
              <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {reservedOpenDateInfo ? (
                  <>
                    當 <strong>{reservedOpenDateInfo.date}</strong> 的門票一開放預訂（或 Klook / KKday 釋出早鳥折扣碼），系統將<strong>第一時間發送 Email 訂票連結給您</strong>！
                  </>
                ) : (
                  <>
                    只要您關注的日期<strong>開放訂票</strong>，或 Klook / KKday 出現<strong>獨家折扣碼、限時快閃特惠</strong>，系統將會<strong>立馬發送 Email 通知您</strong>！
                  </>
                )}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleAffiliateClick('Klook')}
                  className={`w-full py-3 px-4 bg-gradient-to-r ${char.buttonGradient} ${char.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>先去 Klook 領取常駐優惠碼【{affiliateConfig.klookDefaultCode}】</span>
                </button>
                <button
                  onClick={() => setShowSubscribeModal(false)}
                  className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                >
                  返回查看低價日曆
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🛠️ 站長專屬後台管理中心 Modal */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onStateUpdated={fetchPublicState}
      />

      {/* 單一檔案 HTML 匯出 Modal */}
      {showHtmlExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">單一檔案 HTML 完整程式碼（Single-file App）</h3>
              </div>
              <button
                onClick={() => setShowHtmlExportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕ 關閉
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              這段代碼整合了 <strong>HTML、Tailwind CSS CDN 以及 Vanilla JavaScript</strong>，所有內容都在同一個檔案內。
              完全不需要設定任何開發環境或編譯工具，儲存為 <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">disney.html</code> 即可直接在任何電腦瀏覽器中點開執行！
            </p>

            <div className="relative">
              <textarea
                readOnly
                value={singleFileHtmlCode}
                rows={12}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3.5 rounded-xl focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                💡 點擊「複製代碼」或「直接下載檔案」隨開隨用
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyHtml}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copySuccess ? '✅ 已複製到剪貼簿！' : '複製完整代碼'}</span>
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>直接下載 .html 檔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
