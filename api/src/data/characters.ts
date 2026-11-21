export interface DisneyCharacter {
  id: string;
  name: string;
  shortName: string;
  title: string;
  tag: string;
  greeting: string;
  speech: string;
  avatarUrl: string;
  // 角色專屬配色系統
  themeColor: string;
  secondaryColor: string;
  accentColor: string;
  // Tailwind 樣式系統
  cardBg: string;
  cardBorder: string;
  cardRing: string;
  speechBg: string;
  buttonGradient: string;
  buttonText: string;
  badgeBg: string;
  activeTabStyle: string;
  // Email 專屬 HTML 樣式
  emailBgGradient: string;
  emailCardBg: string;
  emailBorder: string;
  emailButtonBg: string;
}

export const DISNEY_CHARACTERS: DisneyCharacter[] = [
  {
    id: 'mickey',
    name: '米奇 (Mickey)',
    shortName: '米奇',
    title: '歡慶隊長 · 奇妙夢想守護者',
    tag: '經典元氣',
    greeting: '🎉 恭喜可以買票嚕！',
    speech: '米奇來報喜囉！夢想成真的時刻到了，您關注的東京迪士尼門票今天正式開放預訂囉！準備好迎接最棒的魔法一天了嗎？快把票帶回家吧！',
    avatarUrl: '/characters/mickey.png?v=clean2',
    themeColor: '#dc2626',
    secondaryColor: '#1e293b',
    accentColor: '#facc15',
    cardBg: 'bg-gradient-to-br from-red-50 via-rose-50/70 to-amber-50/50',
    cardBorder: 'border-red-300 hover:border-red-500',
    cardRing: 'ring-4 ring-red-400/30 border-red-500 shadow-lg shadow-red-100',
    speechBg: 'bg-red-50/90 border-red-200 text-red-950',
    buttonGradient: 'from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-md shadow-red-200',
    buttonText: 'text-white',
    badgeBg: 'bg-red-100 text-red-800 border border-red-200',
    activeTabStyle: 'bg-red-600 text-white',
    emailBgGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    emailCardBg: '#fef2f2',
    emailBorder: '#dc2626',
    emailButtonBg: 'linear-gradient(90deg, #dc2626, #b91c1c)',
  },
  {
    id: 'minnie',
    name: '米妮 (Minnie)',
    shortName: '米妮',
    title: '甜美大使 · 浪漫旅程領航員',
    tag: '浪漫溫柔',
    greeting: '💖 恭喜可以買票嚕！',
    speech: '哈囉親愛的！米妮帶著滿滿愛心來提醒您～最期待的夢幻迪士尼之旅即將啟程，今天正式開賣囉！快牽著最重要的人一起出發吧！',
    avatarUrl: '/characters/minnie.png?v=clean3',
    themeColor: '#ec4899',
    secondaryColor: '#be185d',
    accentColor: '#fce7f3',
    cardBg: 'bg-gradient-to-br from-pink-50 via-rose-50/70 to-pink-100/50',
    cardBorder: 'border-pink-300 hover:border-pink-500',
    cardRing: 'ring-4 ring-pink-400/30 border-pink-500 shadow-lg shadow-pink-100',
    speechBg: 'bg-pink-50/90 border-pink-200 text-pink-950',
    buttonGradient: 'from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white shadow-md shadow-pink-200',
    buttonText: 'text-white',
    badgeBg: 'bg-pink-100 text-pink-800 border border-pink-200',
    activeTabStyle: 'bg-pink-500 text-white',
    emailBgGradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    emailCardBg: '#fdf2f8',
    emailBorder: '#ec4899',
    emailButtonBg: 'linear-gradient(90deg, #ec4899, #db2777)',
  },
  {
    id: 'donald',
    name: '唐老鴨 (Donald)',
    shortName: '唐老鴨',
    title: '衝鋒隊長 · 超熱血開賣大使',
    tag: '超速熱血',
    greeting: '⚡ 嘎嘎！恭喜可以買票嚕！',
    speech: '嘎嘎嘎！開賣啦開賣啦！唐老鴨第一秒就衝來通知你了～快點點進去預訂購票！熱門日期的門票要趕快卡位，衝啊！',
    avatarUrl: '/characters/donald.png?v=clean2',
    themeColor: '#0284c7',
    secondaryColor: '#f59e0b',
    accentColor: '#ef4444',
    cardBg: 'bg-gradient-to-br from-sky-50 via-blue-50/70 to-amber-50/50',
    cardBorder: 'border-sky-300 hover:border-sky-500',
    cardRing: 'ring-4 ring-sky-400/30 border-sky-500 shadow-lg shadow-sky-100',
    speechBg: 'bg-sky-50/90 border-sky-200 text-sky-950',
    buttonGradient: 'from-sky-600 via-blue-600 to-amber-500 hover:from-sky-500 hover:to-amber-400 text-white shadow-md shadow-sky-200',
    buttonText: 'text-white',
    badgeBg: 'bg-sky-100 text-sky-800 border border-sky-200',
    activeTabStyle: 'bg-sky-600 text-white',
    emailBgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    emailCardBg: '#f0f9ff',
    emailBorder: '#0284c7',
    emailButtonBg: 'linear-gradient(90deg, #0284c7, #0369a1)',
  },
  {
    id: 'duffy',
    name: '達菲熊 (Duffy)',
    shortName: '達菲熊',
    title: '海洋萌主 · 溫暖療癒大使',
    tag: '暖心療癒',
    greeting: '🧸 暖暖問候！恭喜可以買票嚕！',
    speech: '暖暖的問候～我是達菲！今天東京迪士尼門票悄悄開賣囉。達菲跟雪莉玫已經在海洋園區準備好最溫暖的擁抱，好期待見到你喔～',
    avatarUrl: '/characters/duffy.png?v=clean2',
    themeColor: '#b45309',
    secondaryColor: '#0284c7',
    accentColor: '#fef3c7',
    cardBg: 'bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-sky-50/50',
    cardBorder: 'border-amber-300 hover:border-amber-500',
    cardRing: 'ring-4 ring-amber-500/30 border-amber-600 shadow-lg shadow-amber-100',
    speechBg: 'bg-amber-50/90 border-amber-200 text-amber-950',
    buttonGradient: 'from-amber-700 via-amber-600 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-200',
    buttonText: 'text-white',
    badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
    activeTabStyle: 'bg-amber-700 text-white',
    emailBgGradient: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    emailCardBg: '#fefce8',
    emailBorder: '#b45309',
    emailButtonBg: 'linear-gradient(90deg, #b45309, #92400e)',
  },
  {
    id: 'pooh',
    name: '小熊維尼 (Winnie the Pooh)',
    shortName: '小熊維尼',
    title: '甜蜜幸運星 · 百畝森林好朋友',
    tag: '甜蜜好運',
    greeting: '🍯 恭喜可以買票嚕！甜滋滋～',
    speech: '嗡嗡嗡～就像在樹洞裡找到滿滿一大罐蜂蜜一樣開心！今天開賣囉，慢慢挑選你最想搭的蜜蜂罐旋轉冒險，享受甜滋滋的一天吧～',
    avatarUrl: '/characters/pooh.png?v=clean2',
    themeColor: '#d97706',
    secondaryColor: '#dc2626',
    accentColor: '#fef08a',
    cardBg: 'bg-gradient-to-br from-yellow-50 via-amber-50/80 to-orange-50/50',
    cardBorder: 'border-yellow-400 hover:border-amber-500',
    cardRing: 'ring-4 ring-yellow-400/40 border-amber-500 shadow-lg shadow-yellow-100',
    speechBg: 'bg-yellow-50/90 border-yellow-200 text-yellow-950',
    buttonGradient: 'from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-200',
    buttonText: 'text-slate-950 font-black',
    badgeBg: 'bg-yellow-100 text-yellow-900 border border-yellow-300',
    activeTabStyle: 'bg-amber-500 text-slate-950',
    emailBgGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    emailCardBg: '#fefce8',
    emailBorder: '#f59e0b',
    emailButtonBg: 'linear-gradient(90deg, #f59e0b, #d97706)',
  },
];

export function getCharacterById(id?: string): DisneyCharacter {
  const found = DISNEY_CHARACTERS.find((c) => c.id === id);
  return found || DISNEY_CHARACTERS[0];
}
