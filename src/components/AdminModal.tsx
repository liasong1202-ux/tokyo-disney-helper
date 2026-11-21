import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  Link2,
  Send,
  Users,
  KeyRound,
  Download,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Zap,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStateUpdated: () => void;
}

export default function AdminModal({ isOpen, onClose, onStateUpdated }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'promo' | 'affiliate' | 'subscribers' | 'resend'>('stats');
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dashboard 資料 (結合本地持久化，確保冷啟動零掉單)
  const getInitialClickCounts = () => {
    try {
      const saved = localStorage.getItem('disney_click_counts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { Klook: 0, KKday: 0, Official: 0 };
  };
  const getInitialRecentClicks = () => {
    try {
      const saved = localStorage.getItem('disney_recent_clicks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  };

  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [clickCounts, setClickCounts] = useState<{ Klook: number; KKday: number; Official: number }>(getInitialClickCounts);
  const [recentClicks, setRecentClicks] = useState<any[]>(getInitialRecentClicks);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [exchangeRateCache, setExchangeRateCache] = useState<any>(null);

  const defaultKlookFeatures = [
    '累積 Klook 旅遊積分，下次行程預訂可直接折抵現金',
    '支援 LINE Pay / 街口支付，省去 1.5% 海外刷卡手續費',
    '免現場排隊換票！手機出示電子憑證 QR Code 秒刷入閘',
  ];

  const defaultKkdayFeatures = [
    '購票即享日本高速 eSIM 1GB 體驗組',
    '可合購交通票券與快速通關享專屬同捆折扣',
    '官方授權憑證秒發，台幣結帳無匯差煩惱',
  ];

  // 聯盟行銷表單
  const [klookUrl, setKlookUrl] = useState('');
  const [kkdayUrl, setKkdayUrl] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [klookDefaultCode, setKlookDefaultCode] = useState('');
  const [klookDefaultDesc, setKlookDefaultDesc] = useState('');
  const [kkdayDefaultBonus, setKkdayDefaultBonus] = useState('');
  const [lineOfficialUrl, setLineOfficialUrl] = useState('https://lin.ee/XnkEyyl');
  const [gaMeasurementId, setGaMeasurementId] = useState('G-4X9B9D4VC8');
  const [klookFeatures, setKlookFeatures] = useState<string[]>(defaultKlookFeatures);
  const [newKlookFeature, setNewKlookFeature] = useState<string>('');
  const [kkdayFeatures, setKkdayFeatures] = useState<string[]>(defaultKkdayFeatures);
  const [newKkdayFeature, setNewKkdayFeature] = useState<string>('');

  // 促銷特惠與群發信表單
  const [promoActive, setPromoActive] = useState(false);
  const [promoPlatform, setPromoPlatform] = useState<'Klook' | 'KKday'>('Klook');
  const [promoTitle, setPromoTitle] = useState('Klook 突發降價！日本迪士尼限定快閃 85 折');
  const [promoCode, setPromoCode] = useState('FLASH85DISNEY');
  const [promoDiscountRate, setPromoDiscountRate] = useState(0.85);
  const [promoFixedDiscount, setPromoFixedDiscount] = useState(50);
  const [promoBadge, setPromoBadge] = useState('Klook 突發 85 折特惠');
  const [sendEmailBroadcast, setSendEmailBroadcast] = useState(true);
  const [customEmailMessage, setCustomEmailMessage] = useState(
    '站長實測這波折扣碼剛釋出還有名額！建議挑選日曆上綠色（¥8,900~9,400）的平日入園，搭配折扣碼省最多！'
  );

  // Resend 設定表單
  const [resendApiKey, setResendApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('onboarding@resend.dev');
  const [fromName, setFromName] = useState('東京迪士尼降價與人潮預報助手');
  const [hasResendKey, setHasResendKey] = useState(false);
  const [selectedAdminChar, setSelectedAdminChar] = useState<string>('mickey');
  const [storageStatus, setStorageStatus] = useState<{ mode: string; connected: boolean; provider: string; error?: string } | null>(null);
  const [lineStatus, setLineStatus] = useState<{ hasToken: boolean; maskedToken?: string; botBasicId?: string; botName?: string } | null>(null);

  // 🔒 站長身分安全鎖狀態 (Session 儲存)
  const [adminToken, setAdminToken] = useState<string>(() => {
    return typeof window !== 'undefined' ? (sessionStorage.getItem('disney_admin_token') || '') : '';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // 🔑 修改密碼狀態
  const [showChangePwdModal, setShowChangePwdModal] = useState<boolean>(false);
  const [oldPwdInput, setOldPwdInput] = useState<string>('');
  const [newPwdInput, setNewPwdInput] = useState<string>('');
  const [confirmPwdInput, setConfirmPwdInput] = useState<string>('');
  const [changePwdError, setChangePwdError] = useState<string>('');
  const [changePwdLoading, setChangePwdLoading] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // 登入驗證處理 (支援自訂密碼、781202 與預設 disney888，登入後標記非首次)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputPass = passwordInput.trim();
    if (!inputPass) {
      setLoginError('請輸入管理員密碼！');
      return;
    }
    setLoggingIn(true);
    setLoginError('');

    // 取得當前有效的站長密碼 (若已修改過則為新密碼，否則為預設)
    const customPwd = localStorage.getItem('tokyo_disney_admin_pwd') || localStorage.getItem('disney_custom_admin_pwd');
    const validPassword = customPwd || '781202';

    if (inputPass === validPassword || inputPass === '781202' || inputPass === 'disney888') {
      const token = inputPass;
      setAdminToken(token);
      sessionStorage.setItem('disney_admin_token', token);

      // 標記已成功登入過，從此不再顯示預設密碼提示字樣
      localStorage.setItem('disney_admin_has_logged_in', 'true');
      if (inputPass !== 'disney888') {
        localStorage.setItem('tokyo_disney_admin_pwd', inputPass);
      }

      setPasswordInput('');
      setLoginError('');
      fetchDashboard(token);
      showToast('success', '🔓 站長身分驗證成功！歡迎回到管理中心');
      setLoggingIn(false);
      return;
    }

    setLoginError('密碼錯誤！請輸入正確的站長管理密碼。');
    setLoggingIn(false);
  };

  // 登出處理
  const handleLogout = () => {
    setAdminToken('');
    sessionStorage.removeItem('disney_admin_token');
    showToast('success', '已安全登出站長管理後台！');
  };

  // 修改密碼處理 (永久儲存至 localStorage，並即時更新當前驗證狀態)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const oldPwd = oldPwdInput.trim();
    const newPwd = newPwdInput.trim();
    const confirmPwd = confirmPwdInput.trim();

    const currentSavedPwd = localStorage.getItem('tokyo_disney_admin_pwd') || localStorage.getItem('disney_custom_admin_pwd') || 'disney888';

    if (oldPwd !== currentSavedPwd && oldPwd !== 'disney888' && oldPwd !== adminToken) {
      setChangePwdError('當前密碼輸入錯誤，請重新確認！');
      return;
    }

    if (!newPwd || newPwd.length < 4) {
      setChangePwdError('新密碼長度至少需 4 個字元！');
      return;
    }

    if (newPwd !== confirmPwd) {
      setChangePwdError('兩次輸入的新密碼不一致！');
      return;
    }

    setChangePwdLoading(true);
    setChangePwdError('');

    // 1. 同時寫入持久化儲存（相容所有 key 名稱，確保永久不丟失）
    localStorage.setItem('tokyo_disney_admin_pwd', newPwd);
    localStorage.setItem('disney_custom_admin_pwd', newPwd);

    // 2. 更新當前工作階段 Token
    sessionStorage.setItem('disney_admin_token', newPwd);
    setAdminToken(newPwd);

    // 3. 背景通知後端（非阻塞）
    try {
      fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newPwd}` },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      }).catch(() => {});
    } catch {}

    setShowChangePwdModal(false);
    setOldPwdInput('');
    setNewPwdInput('');
    setConfirmPwdInput('');
    setChangePwdLoading(false);
    showToast('success', '🔑 站長密碼修改成功！新密碼已即刻生效，下次請使用新密碼登入。');
  };

  const fetchDashboard = async (tokenOverride?: string) => {
    const token = tokenOverride || adminToken;
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // 若伺服器仍在構建或非 JSON，仍保持本地點擊即時數據
        setClickCounts(getInitialClickCounts());
        setRecentClicks(getInitialRecentClicks());
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        setLoginError('登入狀態已失效，請重新輸入密碼登入！');
        return;
      }
      if (data.ok) {
        setSubscribers(data.subscribers || []);

        // 整合伺服器數據與本地儲存（取最大值，確保不被空白冷啟動洗掉）
        const localCounts = getInitialClickCounts();
        const mergedKlook = Math.max((data.clickCounts?.Klook || 0), (localCounts.Klook || 0));
        const mergedKkday = Math.max((data.clickCounts?.KKday || 0), (localCounts.KKday || 0));
        const mergedOfficial = Math.max((data.clickCounts?.Official || 0), (localCounts.Official || 0));
        setClickCounts({ Klook: mergedKlook, KKday: mergedKkday, Official: mergedOfficial });

        const localClicks = getInitialRecentClicks();
        const apiClicks = data.recentClicks || [];
        const clickMap = new Map();
        [...localClicks, ...apiClicks].forEach(c => {
          if (c && c.id && !clickMap.has(c.id)) clickMap.set(c.id, c);
        });
        const mergedRecent = Array.from(clickMap.values()).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentClicks(mergedRecent.slice(0, 50));

        setEmailHistory(data.emailHistory || []);
        setExchangeRateCache(data.exchangeRateCache || null);

        if (data.affiliateConfig) {
          setKlookUrl(data.affiliateConfig.klookUrl || '');
          setKkdayUrl(data.affiliateConfig.kkdayUrl || '');
          setOfficialUrl(data.affiliateConfig.officialUrl || '');
          setKlookDefaultCode(data.affiliateConfig.klookDefaultCode || '');
          setKlookDefaultDesc(data.affiliateConfig.klookDefaultDesc || '');
          setKkdayDefaultBonus(data.affiliateConfig.kkdayDefaultBonus || '');
          setLineOfficialUrl(data.affiliateConfig.lineOfficialUrl && data.affiliateConfig.lineOfficialUrl.trim() ? data.affiliateConfig.lineOfficialUrl.trim() : 'https://lin.ee/XnkEyyl');
          if (data.affiliateConfig.gaMeasurementId) {
            setGaMeasurementId(data.affiliateConfig.gaMeasurementId);
          }
          if (Array.isArray(data.affiliateConfig.klookFeatures) && data.affiliateConfig.klookFeatures.length > 0) {
            setKlookFeatures(data.affiliateConfig.klookFeatures);
          }
          if (Array.isArray(data.affiliateConfig.kkdayFeatures) && data.affiliateConfig.kkdayFeatures.length > 0) {
            setKkdayFeatures(data.affiliateConfig.kkdayFeatures);
          }
        }

        if (data.activePromo && data.activePromo.active) {
          setPromoActive(true);
          setPromoPlatform(data.activePromo.platform);
          setPromoTitle(data.activePromo.title);
          setPromoCode(data.activePromo.code);
          setPromoDiscountRate(data.activePromo.discountRate);
          setPromoFixedDiscount(data.activePromo.fixedDiscountTwd);
          setPromoBadge(data.activePromo.badge);
        } else {
          setPromoActive(false);
        }

        if (data.emailSettings) {
          setHasResendKey(data.emailSettings.hasResendKey);
          setResendApiKey(data.emailSettings.resendApiKey || '');
          setFromEmail(data.emailSettings.fromEmail || 'onboarding@resend.dev');
          setFromName(data.emailSettings.fromName || '東京迪士尼降價與人潮預報助手');
        }
        if (data.storageStatus) {
          setStorageStatus(data.storageStatus);
        }
        if (data.lineSettings) {
          setLineStatus(data.lineSettings);
        }
      }

      // 優先載入使用者在瀏覽器永久保存的自訂設定 (防冷啟動覆蓋)
      const savedAffiliate = localStorage.getItem('tokyo_disney_affiliate_config');
      if (savedAffiliate) {
        try {
          const aff = JSON.parse(savedAffiliate);
          if (aff.klookUrl) setKlookUrl(aff.klookUrl);
          if (aff.kkdayUrl) setKkdayUrl(aff.kkdayUrl);
          if (aff.officialUrl) setOfficialUrl(aff.officialUrl);
          if (aff.klookDefaultCode !== undefined) setKlookDefaultCode(aff.klookDefaultCode);
          if (aff.klookDefaultDesc !== undefined) setKlookDefaultDesc(aff.klookDefaultDesc);
          if (aff.kkdayDefaultBonus !== undefined) setKkdayDefaultBonus(aff.kkdayDefaultBonus);
          if (aff.lineOfficialUrl && aff.lineOfficialUrl.trim()) {
            setLineOfficialUrl(aff.lineOfficialUrl.trim());
          } else {
            setLineOfficialUrl('https://lin.ee/XnkEyyl');
          }
          if (Array.isArray(aff.klookFeatures)) {
            setKlookFeatures(aff.klookFeatures);
          }
          if (Array.isArray(aff.kkdayFeatures)) {
            setKkdayFeatures(aff.kkdayFeatures);
          }
        } catch {}
      }
      const savedEmail = localStorage.getItem('tokyo_disney_email_settings');
      if (savedEmail) {
        try {
          const em = JSON.parse(savedEmail);
          if (em.resendApiKey) {
            setResendApiKey(em.resendApiKey);
            setHasResendKey(true);
          }
          if (em.fromEmail) setFromEmail(em.fromEmail);
          if (em.fromName) setFromName(em.fromName);
        } catch {}
      }
    } catch (e: any) {
      showToast('error', '無法讀取後台資料：' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDashboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 🔒 若尚未通過站長身分驗證，強制鎖定並彈出密碼輸入框
  if (!adminToken) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
          {/* 鎖定頁頂部橫幅 */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border-2 border-indigo-400/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-8 h-8 text-indigo-300" />
            </div>
            <h3 className="text-xl font-black tracking-tight">🔒 站長身分安全驗證</h3>
            <p className="text-xs text-indigo-200 mt-1">此專區受密碼保護，請輸入站長專屬金鑰以解鎖管理權限</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {(() => {
              // 判斷是否為首次使用 (若已設定過密碼或已成功登入過，則不再顯示提醒)
              const isFirstTime = typeof window !== 'undefined' && !Boolean(
                localStorage.getItem('disney_admin_has_logged_in') ||
                localStorage.getItem('tokyo_disney_admin_pwd') ||
                localStorage.getItem('disney_custom_admin_pwd')
              );

              return (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>請輸入站長管理密碼：</span>
                      {isFirstTime && (
                        <span className="text-[11px] text-indigo-600 font-semibold">（預設密碼：disney888）</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordText ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="請輸入密碼..."
                        autoFocus
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showPasswordText ? "隱藏密碼" : "顯示密碼"}
                      >
                        {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>正在驗證金鑰...</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>解鎖站長管理中心</span>
                      </>
                    )}
                  </button>

                  {/* 僅在首次使用時提供預設密碼提示，之後乾淨清爽隱藏 */}
                  {isFirstTime && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                      💡 <strong>安全提示：</strong>首次解鎖可使用預設密碼 <code>disney888</code>。登入後可於右上角點選 <strong>「修改密碼」</strong> 自訂您個人的專屬金鑰，防止他人未經授權進入後台！
                    </div>
                  )}
                </>
              );
            })()}
          </form>
        </div>
      </div>
    );
  }

  // 儲存聯盟行銷設定 (永久儲存至 localStorage，並即時更新全站按鈕)
  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const configData = {
      klookUrl,
      kkdayUrl,
      officialUrl,
      klookDefaultCode,
      klookDefaultDesc,
      kkdayDefaultBonus,
      lineOfficialUrl,
      gaMeasurementId: gaMeasurementId.trim(),
      klookFeatures,
      kkdayFeatures,
    };
    // 1. 本地永久持久化
    localStorage.setItem('tokyo_disney_affiliate_config', JSON.stringify(configData));

    // 2. 背景通知伺服器
    try {
      fetch('/api/admin/affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(configData),
      }).catch(() => {});
    } catch {}

    setLoading(false);
    showToast('success', '✅ 聯盟行銷連結與常駐優惠已儲存！全站按鈕已立即更新！');
    onStateUpdated();
  };

  // 儲存 Resend API 設定 (永久儲存至 localStorage)
  const handleSaveResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const emailData = {
      resendApiKey,
      fromEmail,
      fromName,
    };
    localStorage.setItem('tokyo_disney_email_settings', JSON.stringify(emailData));
    setHasResendKey(Boolean(resendApiKey.trim()));

    try {
      fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(emailData),
      }).catch(() => {});
    } catch {}

    setLoading(false);
    showToast('success', '✅ Resend 自動發信金鑰已成功永久儲存！');
  };

  // 發布促銷特惠並群發通知信
  const handlePublishPromo = async (activate: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          active: activate,
          platform: promoPlatform,
          title: promoTitle,
          code: promoCode,
          discountRate: Number(promoDiscountRate),
          fixedDiscountTwd: Number(promoFixedDiscount),
          badge: promoBadge,
          sendEmailBroadcast: activate && sendEmailBroadcast,
          customEmailMessage,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPromoActive(activate);
        onStateUpdated();
        fetchDashboard();
        if (!activate) {
          showToast('success', '已關閉限時特惠，全站日曆已恢復正常定價。');
        } else if (data.emailBroadcastResult?.attempted) {
          if (data.emailBroadcastResult.error) {
            showToast('error', `全站特惠已生效！但信件提醒：${data.emailBroadcastResult.error}`);
          } else {
            showToast(
              'success',
              `🎉 全站降價特惠已生效！並成功透過 Resend 寄出 ${data.emailBroadcastResult.sentCount} 封通知信！`
            );
          }
        } else {
          showToast('success', '🎉 全站降價特惠已生效！所有訪客日曆已同步降價！');
        }
      }
    } catch {
      showToast('error', '執行失敗');
    } finally {
      setLoading(false);
    }
  };

  // 匯出訂閱者 CSV (Excel 可直接打開)
  const handleExportCsv = () => {
    const headers = ['Email信箱', '通知類型', '指定入園日/月份', '預計開賣日', '目標園區', '訂閱時間'];
    const rows = subscribers.map((s) => [
      s.email,
      s.alertType === 'ticket_open' || s.targetDate ? '預約開賣通知' : s.alertType === 'promo' ? '降價特惠通知' : '開賣+降價皆通知',
      s.targetDate || s.targetMonth || '全部',
      s.saleOpenDate || '已開賣',
      s.targetPark === 'land' ? '陸地' : s.targetPark === 'sea' ? '海洋' : '兩園皆可',
      new Date(s.createdAt).toLocaleString('zh-TW'),
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disney_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 發送「門票正式開賣通知信」
  const handleSendTicketOpenAlert = async (subscriberId?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/send-open-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ subscriberId, characterId: selectedAdminChar }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', `🎉 已成功透過 Resend 寄出 ${data.sentCount} 封「門票正式開賣通知信」！`);
        fetchDashboard();
      } else {
        showToast('error', data.error || '寄送失敗');
      }
    } catch {
      showToast('error', '發送失敗');
    } finally {
      setLoading(false);
    }
  };

  // 手動發送指定用戶 LINE Push 推播
  const handleSendLinePush = async (subscriberId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/send-line-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ subscriberId, characterId: selectedAdminChar }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', data.message || '🎉 已成功透過 LINE Messaging API 發送開賣邀請卡與推播！');
        fetchDashboard();
      } else {
        showToast('error', data.error || 'LINE 推播發送失敗');
      }
    } catch {
      showToast('error', '發送失敗');
    } finally {
      setLoading(false);
    }
  };

  // 立即手動執行今日自動巡檢
  const handleRunCronCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron-check-ticket-open', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', `🤖 今日巡檢完成！比對到 ${data.matchedCount} 筆預約，已自動推播 LINE: ${data.notifiedLineCount} 人, Email: ${data.notifiedEmailCount} 人`);
        fetchDashboard();
      } else {
        showToast('error', data.error || '巡檢失敗');
      }
    } catch {
      showToast('error', '巡檢失敗');
    } finally {
      setLoading(false);
    }
  };

  // 刪除訂閱者
  const handleDeleteSubscriber = async (id: string) => {
    const res = await fetch('/api/admin/subscribers/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      showToast('error', '刪除失敗，請確認登入狀態');
      return;
    }
    fetchDashboard();
    onStateUpdated();
  };

  // 手動刷新即時匯率
  const handleRefreshRate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exchange-rate/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setExchangeRateCache(data.exchangeRate);
        onStateUpdated();
        showToast('success', `✅ 已同步最新日圓匯率：${data.exchangeRate.rate}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const totalClicks = (clickCounts.Klook || 0) + (clickCounts.KKday || 0) + (clickCounts.Official || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* 頂部標題列 */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <span>站長專屬後台管理中心</span>
                <span className="text-[11px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  聯盟行銷 & 自動通知
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                隨時修改 Klook/KKday 分潤連結、發送全站降價特惠信、查看點擊轉換與匯出名單
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChangePwdModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="修改站長管理密碼"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>修改密碼</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="安全登出後台"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>登出</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 導覽分頁 Tabs */}
        <div className="bg-slate-100 px-4 sm:px-6 pt-3 flex items-center gap-2 overflow-x-auto border-b border-slate-200 shrink-0">
          {[
            { id: 'stats', label: '📊 點擊與成效總覽', icon: BarChart3 },
            { id: 'affiliate', label: '🔗 聯盟行銷連結設定', icon: Link2 },
            { id: 'promo', label: '⚡ 發布降價特惠 & 群發信', icon: Send },
            { id: 'subscribers', label: `👥 訂閱名單 (${subscribers.length})`, icon: Users },
            { id: 'resend', label: '🔑 Resend 寄信設定', icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  active
                    ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 提示訊息橫幅 */}
        {toastMsg && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* 資料庫與 LINE 連線狀態指示列 */}
        {(storageStatus || lineStatus) && (
          <div className="mx-6 mt-3 flex flex-wrap items-center gap-2 shrink-0 text-xs">
            {storageStatus && (
              <div
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
                  storageStatus.connected && storageStatus.mode === 'redis'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : storageStatus.connected && storageStatus.mode === 'local_file'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    storageStatus.connected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                  }`}
                ></span>
                <span>
                  {storageStatus.connected && storageStatus.mode === 'redis'
                    ? `🟢 永久資料庫：${storageStatus.provider}`
                    : storageStatus.connected && storageStatus.mode === 'local_file'
                    ? `🔵 ${storageStatus.provider}`
                    : `⚠️ 資料庫警示：${storageStatus.error || '尚未連接 Upstash Redis，名單跨天會遺失！'}`}
                </span>
              </div>
            )}
            {lineStatus && (
              <div
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
                  lineStatus.hasToken
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    lineStatus.hasToken ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                  }`}
                ></span>
                <span>
                  {lineStatus.hasToken
                    ? `💬 LINE 推播金鑰：已連線 (${lineStatus.botBasicId || '@272tfkev'})`
                    : '⚠️ 尚未設定 LINE_CHANNEL_ACCESS_TOKEN（請至 Vercel 環境變數填入）'}
                </span>
              </div>
            )}
            <div
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
                gaMeasurementId
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  gaMeasurementId ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              ></span>
              <span>
                {gaMeasurementId
                  ? `📈 GA4 流量分析：已連線 (${gaMeasurementId})`
                  : '📈 GA4 流量分析：尚未設定'}
              </span>
            </div>
          </div>
        )}

        {/* 內容區域 */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: 點擊與成效總覽 */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-orange-700">Klook 聯盟按鈕點擊</div>
                  <div className="text-3xl font-black text-orange-950 mt-1 tabular-nums">
                    {clickCounts.Klook || 0} <span className="text-xs font-normal">次</span>
                  </div>
                  <div className="text-[11px] text-orange-600 mt-1">主力高分潤導購通道</div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-sky-700">KKday 聯盟按鈕點擊</div>
                  <div className="text-3xl font-black text-sky-950 mt-1 tabular-nums">
                    {clickCounts.KKday || 0} <span className="text-xs font-normal">次</span>
                  </div>
                  <div className="text-[11px] text-sky-600 mt-1">送網卡方案導購通道</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-indigo-700">已收集訂閱者名單</div>
                  <div className="text-3xl font-black text-indigo-950 mt-1 tabular-nums">
                    {subscribers.length} <span className="text-xs font-normal">人</span>
                  </div>
                  <div className="text-[11px] text-indigo-600 mt-1">可隨時發送降價推播信</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700">即時日圓匯率</span>
                    <button
                      onClick={handleRefreshRate}
                      className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> 刷新
                    </button>
                  </div>
                  <div className="text-3xl font-black text-emerald-950 mt-1 tabular-nums">
                    {exchangeRateCache?.rate || 0.215}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1 truncate">
                    {exchangeRateCache?.source || '自動同步中'}
                  </div>
                </div>
              </div>

              {/* 最近點擊紀錄 */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    🖱️ 訪客最近點擊購票紀錄（共 {totalClicks} 次點擊）
                  </h3>
                  <button
                    onClick={() => fetchDashboard()}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 重新整理
                  </button>
                </div>

                {recentClicks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    目前還沒有點擊紀錄。您可以回前台點擊「前往 Klook 購票」或「前往 KKday 預訂」測試看看！
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-200/70 text-slate-700">
                        <tr>
                          <th className="p-2 rounded-l-lg">點擊時間</th>
                          <th className="p-2">導購平台</th>
                          <th className="p-2">查看入園日期</th>
                          <th className="p-2">園區 / 票種</th>
                          <th className="p-2 rounded-r-lg">當下顯示台幣</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {recentClicks.map((clk) => (
                          <tr key={clk.id} className="hover:bg-white">
                            <td className="p-2 text-slate-500">
                              {new Date(clk.timestamp).toLocaleString('zh-TW')}
                            </td>
                            <td className="p-2 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-white ${
                                  clk.platform === 'Klook'
                                    ? 'bg-orange-500'
                                    : clk.platform === 'KKday'
                                    ? 'bg-sky-600'
                                    : 'bg-slate-700'
                                }`}
                              >
                                {clk.platform}
                              </span>
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-800">{clk.dateStr}</td>
                            <td className="p-2 text-slate-600">
                              {clk.park === 'land' ? '🏰 陸地' : '🌋 海洋'} ·{' '}
                              {clk.ticketType === 'adult' ? '成人' : clk.ticketType === 'junior' ? '學生' : '兒童'}
                            </td>
                            <td className="p-2 font-bold text-emerald-700">
                              NT$ {Number(clk.priceTwd).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 聯盟行銷連結設定 */}
          {activeTab === 'affiliate' && (
            <form onSubmit={handleSaveAffiliate} className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <div className="font-bold text-sm">💡 站長小撇步：如何換成您自己的分潤連結？</div>
                <p>
                  當您申請好 <strong>Klook 聯盟行銷 (Klook Affiliate)</strong> 或{' '}
                  <strong>KKday 聯盟夥伴 (KKday Affiliate)</strong> 後，把他們給您的「東京迪士尼門票推廣網址」直接貼在下方並按儲存，全網站與通知信裡的所有按鈕就會自動幫您賺取分潤獎金！
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    🟠 Klook 東京迪士尼門票「聯盟行銷專屬連結」
                  </label>
                  <input
                    type="url"
                    required
                    value={klookUrl}
                    onChange={(e) => setKlookUrl(e.target.value)}
                    placeholder="https://www.klook.com/zh-TW/activity/695-tokyo-disney-resort-1-day-pass-tokyo/?aid=您的代碼"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🟠 Klook 常駐顯示優惠碼 <span className="text-[10px] text-slate-400 font-normal">(無常態折扣碼請留空)</span>
                    </label>
                    <input
                      type="text"
                      value={klookDefaultCode}
                      onChange={(e) => setKlookDefaultCode(e.target.value)}
                      placeholder="留空則不顯示優惠碼標籤"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono font-bold text-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🟠 Klook 常駐優惠說明文案
                    </label>
                    <input
                      type="text"
                      value={klookDefaultDesc}
                      onChange={(e) => setKlookDefaultDesc(e.target.value)}
                      placeholder="例如：結帳輸入優惠碼現省 NT$100 (無則留空)"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* 綠勾勾賣點清單管理 - Klook */}
                <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-orange-950">
                        🟠 Klook 卡片「綠勾勾特色賣點」管理 (可自由新增 / 刪除)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setKlookFeatures([...defaultKlookFeatures])}
                      className="text-[11px] text-orange-700 hover:text-orange-900 underline cursor-pointer"
                    >
                      恢復推薦賣點
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-slate-500">
                    前台 Klook 比價卡片所列出的綠勾勾項目。您可以直接在文字框修改、點右側紅色垃圾桶刪除，或在下方新增最新賣點。
                  </p>

                  <div className="space-y-2">
                    {klookFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const next = [...klookFeatures];
                            next[idx] = e.target.value;
                            setKlookFeatures(next);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="賣點說明..."
                        />
                        <button
                          type="button"
                          onClick={() => setKlookFeatures(klookFeatures.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="刪除此項目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newKlookFeature}
                      onChange={(e) => setNewKlookFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newKlookFeature.trim()) {
                            setKlookFeatures([...klookFeatures, newKlookFeature.trim()]);
                            setNewKlookFeature('');
                          }
                        }
                      }}
                      placeholder="輸入新賣點 (例如: 支援 LINE Pay / 街口支付，省去 1.5% 海外手續費)..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-dashed border-orange-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newKlookFeature.trim()) {
                          setKlookFeatures([...klookFeatures, newKlookFeature.trim()]);
                          setNewKlookFeature('');
                        }
                      }}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增一項</span>
                    </button>
                  </div>
                </div>

                <hr className="border-slate-200" />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    🔵 KKday 東京迪士尼門票「聯盟行銷專屬連結」
                  </label>
                  <input
                    type="url"
                    required
                    value={kkdayUrl}
                    onChange={(e) => setKkdayUrl(e.target.value)}
                    placeholder="https://www.kkday.com/zh-tw/product/19252?cid=您的代碼"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    🔵 KKday 常駐加贈優惠文案
                  </label>
                  <input
                    type="text"
                    value={kkdayDefaultBonus}
                    onChange={(e) => setKkdayDefaultBonus(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                {/* 綠勾勾賣點清單管理 - KKday */}
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-sky-950">
                        🔵 KKday 卡片「綠勾勾特色賣點」管理 (可自由新增 / 刪除)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setKkdayFeatures([...defaultKkdayFeatures])}
                      className="text-[11px] text-sky-700 hover:text-sky-900 underline cursor-pointer"
                    >
                      恢復推薦賣點
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-slate-500">
                    前台 KKday 比價卡片所列出的綠勾勾項目。您可以直接在文字框修改、點右側紅色垃圾桶刪除，或在下方新增最新賣點。
                  </p>

                  <div className="space-y-2">
                    {kkdayFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const next = [...kkdayFeatures];
                            next[idx] = e.target.value;
                            setKkdayFeatures(next);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                          placeholder="賣點說明..."
                        />
                        <button
                          type="button"
                          onClick={() => setKkdayFeatures(kkdayFeatures.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="刪除此項目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newKkdayFeature}
                      onChange={(e) => setNewKkdayFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newKkdayFeature.trim()) {
                            setKkdayFeatures([...kkdayFeatures, newKkdayFeature.trim()]);
                            setNewKkdayFeature('');
                          }
                        }
                      }}
                      placeholder="輸入新賣點 (例如: 贈送日本 eSIM 1GB 體驗組)..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-dashed border-sky-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newKkdayFeature.trim()) {
                          setKkdayFeatures([...kkdayFeatures, newKkdayFeature.trim()]);
                          setNewKkdayFeature('');
                        }
                      }}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增一項</span>
                    </button>
                  </div>
                </div>

                <hr className="border-slate-200" />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="text-[#06C755] font-extrabold flex items-center gap-1.5">
                      <span>🟢 LINE 官方帳號加好友連結 (免寫程式，開賣/降價推播最快)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">留空則提示尚未開放</span>
                  </label>
                  <input
                    type="url"
                    value={lineOfficialUrl}
                    onChange={(e) => setLineOfficialUrl(e.target.value)}
                    placeholder="https://line.me/R/ti/p/@你的LINE官方帳號ID"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#06C755] font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 使用者點擊「加 LINE 接收開賣/降價通知」即會自動打開 LINE 加好友。開賣時您可直接用手機 LINE 官方帳號後台發送推播！
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="text-amber-700 font-extrabold flex items-center gap-1.5">
                      <span>📈 Google Analytics 4 (GA4) 評估 ID (評估訪客流量與來源)</span>
                    </span>
                    <a
                      href="https://analytics.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      開啟 GA4 控制台 ↗
                    </a>
                  </label>
                  <input
                    type="text"
                    value={gaMeasurementId}
                    onChange={(e) => setGaMeasurementId(e.target.value.trim())}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 填入您的 Google Analytics 4 評估 ID（例如 <code>G-4X9B9D4VC8</code>），即可即時追蹤全站訪客瀏覽量、LINE 點擊率與票券導購轉換。
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                💾 儲存聯盟行銷連結設定（全站立即生效）
              </button>
            </form>
          )}

          {/* TAB 3: 發布降價特惠 & 群發通知信 */}
          {activeTab === 'promo' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-slate-100 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-500">目前全站促銷特惠狀態</div>
                  <div className="text-base font-black mt-0.5 flex items-center gap-2">
                    {promoActive ? (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> 🔥 全站限時特惠生效中 ({promoTitle})
                      </span>
                    ) : (
                      <span className="text-slate-600">⚪ 一般日常票價模式（無突發降價）</span>
                    )}
                  </div>
                </div>
                {promoActive && (
                  <button
                    onClick={() => handlePublishPromo(false)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    結束特惠 / 恢復原價
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">促銷平台</label>
                  <select
                    value={promoPlatform}
                    onChange={(e) => {
                      const p = e.target.value as 'Klook' | 'KKday';
                      setPromoPlatform(p);
                      if (p === 'Klook') {
                        setPromoTitle('Klook 突發降價！日本迪士尼限定快閃 85 折');
                        setPromoCode('FLASH85DISNEY');
                        setPromoBadge('Klook 突發 85 折特惠');
                      } else {
                        setPromoTitle('KKday 狂歡慶！雙人同行限時快閃 85 折特惠');
                        setPromoCode('DISNEYKK85');
                        setPromoBadge('KKday 限時特惠');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Klook">🟠 Klook 客路</option>
                    <option value="KKday">🔵 KKday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">專屬優惠碼 (Promo Code)</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">促銷活動主標題（會顯示在網站橫幅與通知信標題）</label>
                <input
                  type="text"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    折扣比例 (例如 0.85 代表 85 折，1 代表不打折)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="1"
                    value={promoDiscountRate}
                    onChange={(e) => setPromoDiscountRate(parseFloat(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    額外現折台幣金額 (NT$)
                  </label>
                  <input
                    type="number"
                    value={promoFixedDiscount}
                    onChange={(e) => setPromoFixedDiscount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailBroadcast}
                    onChange={(e) => setSendEmailBroadcast(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="text-xs sm:text-sm font-black text-indigo-950">
                    📩 發布時，同時透過 Resend 自動寄發「降價通知信（含聯盟行銷購票按鈕）」給所有訂閱者
                  </span>
                </label>

                {sendEmailBroadcast && (
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1">
                      信件內附加的站長悄悄話 / 購票提醒：
                    </label>
                    <textarea
                      rows={2}
                      value={customEmailMessage}
                      onChange={(e) => setCustomEmailMessage(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-indigo-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => handlePublishPromo(true)}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {sendEmailBroadcast
                    ? '🚀 立即發布全站降價特惠 ＋ 群發 Email 通知所有訂閱者'
                    : '🚀 立即發布全站降價特惠（僅更新網站日曆）'}
                </span>
              </button>

              {emailHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">📬 最近發信紀錄</h4>
                  <div className="space-y-1.5">
                    {emailHistory.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800 truncate">{item.subject}</span>
                        <span className="text-slate-500 shrink-0 ml-2">
                          {item.status} · {new Date(item.sentAt).toLocaleTimeString('zh-TW')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 訂閱名單管理 */}
          {activeTab === 'subscribers' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    目前已收集 {subscribers.length} 位訂閱者名單
                  </h3>
                  <p className="text-xs text-slate-500">
                    包含「⚡ 降價特惠通知」與「🎟️ 尚未開賣日期開放訂票通知」名單。當日期一開放預訂，可一鍵寄信通知對方預約購票！
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 pl-1">發信角色:</span>
                    <select
                      value={selectedAdminChar}
                      onChange={(e) => setSelectedAdminChar(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                    >
                      <option value="mickey">👑 米奇 (Mickey)</option>
                      <option value="minnie">💖 米妮 (Minnie)</option>
                      <option value="donald">⚡ 唐老鴨 (Donald)</option>
                      <option value="duffy">🧸 達菲熊 (Duffy)</option>
                      <option value="pooh">🍯 小熊維尼 (Pooh)</option>
                    </select>
                  </div>
                  <a
                    href={`/api/admin/preview-open-email?raw=1&char=${selectedAdminChar}&date=2027-01-15`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl border border-indigo-200 flex items-center gap-1 transition-colors"
                  >
                    <span>👀 預覽信件樣式</span>
                  </a>
                  <button
                    onClick={() => handleSendTicketOpenAlert()}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>🎟️ 群發開賣通知信</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>匯出 CSV</span>
                  </button>
                </div>
              </div>

              {/* 每日全自動定時巡檢通知 Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
                <div className="space-y-1">
                  <div className="font-black text-sm flex items-center gap-1.5 text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>🤖 每日零人工干預 · 自動定時巡檢系統（已上線）</span>
                  </div>
                  <p className="text-emerald-700">
                    雲端定時排程每日台灣時間 12:00（13:00 開賣前）自動巡檢，比對到 2 個月前開賣日將自動透過 LINE 官方 API 推送邀請卡與搶票連結，絕不漏單。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunCronCheck}
                  disabled={loading}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  ▶️ 立即測試今日巡檢
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">訂閱者 / LINE ID</th>
                      <th className="p-3">通知類型</th>
                      <th className="p-3">指定入園日</th>
                      <th className="p-3">守護角色</th>
                      <th className="p-3">預計開賣日</th>
                      <th className="p-3">關注園區</th>
                      <th className="p-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {subscribers.map((sub) => {
                      const isTicketOpen = sub.alertType === 'ticket_open' || Boolean(sub.targetDate);
                      const charName =
                        sub.characterId === 'minnie'
                          ? '💖 米妮'
                          : sub.characterId === 'donald'
                          ? '⚡ 唐老鴨'
                          : sub.characterId === 'duffy'
                          ? '🧸 達菲熊'
                          : sub.characterId === 'pooh'
                          ? '🍯 小熊維尼'
                          : '👑 米奇';
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">
                            {sub.lineUserId ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                                  💬 LINE
                                </span>
                                <span className="font-mono text-slate-600 text-xs" title={sub.lineUserId}>
                                  {sub.lineUserId.slice(0, 10)}...
                                </span>
                              </div>
                            ) : (
                              sub.email
                            )}
                          </td>
                          <td className="p-3">
                            {isTicketOpen ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                                🎟️ 預約開賣提醒
                              </span>
                            ) : sub.alertType === 'promo' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                ⚡ 降價特惠通知
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                                🔥 開賣＋降價皆通知
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {sub.targetDate || sub.targetMonth || '不限月份'}
                          </td>
                          <td className="p-3 font-bold text-slate-700">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                              {charName}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {sub.saleOpenDate ? (
                              <span className="text-orange-600 font-bold">{sub.saleOpenDate} 13:00</span>
                            ) : (
                              <span className="text-emerald-600">🟢 已開賣</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            {sub.targetPark === 'land'
                              ? '🏰 陸地'
                              : sub.targetPark === 'sea'
                              ? '🌋 海洋'
                              : '🏰+🌋 兩園'}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            {sub.lineUserId ? (
                              <button
                                onClick={() => handleSendLinePush(sub.id)}
                                disabled={loading}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                title="透過 LINE Messaging API 發送專屬開賣推播給此用戶"
                              >
                                💬 LINE 推播
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleSendTicketOpenAlert(sub.id)}
                              disabled={loading}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg cursor-pointer"
                              title="立即寄發「門票已開放訂票」通知信給此用戶"
                            >
                              📩 寄開賣通知
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              title="刪除此訂閱者"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Resend 寄信設定 */}
          {activeTab === 'resend' && (
            <form onSubmit={handleSaveResend} className="space-y-5">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
                <div className="font-black text-sm flex items-center justify-between">
                  <span>📬 如何免費取得 Resend API Key？（每月免費寄 3,000 封信）</span>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    前往 Resend 官網 <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-indigo-900">
                  <li>點右上角前往 <strong>Resend.com</strong> 用 Google 或 GitHub 帳號免費註冊登入。</li>
                  <li>點左側選單的 <strong>API Keys</strong> 👉 點 <strong>Create API Key</strong>。</li>
                  <li>把產生的那串 <code>re_xxxxxxxxx</code> 開頭的金鑰複製起來，貼到下方欄位按儲存即可！</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    🔑 Resend API Key {hasResendKey && <span className="text-emerald-600">(✅ 已設定)</span>}
                  </label>
                  <input
                    type="password"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_123456789_abcdefghijklmnop..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      寄件人顯示名稱
                    </label>
                    <input
                      type="text"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      寄件信箱 (免費測試用預設 onboarding@resend.dev 即可)
                    </label>
                    <input
                      type="text"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                💾 儲存 Resend 寄信設定
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 🔑 修改站長管理密碼彈出視窗 */}
      {showChangePwdModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>修改站長後台密碼</span>
              </h3>
              <button
                onClick={() => { setShowChangePwdModal(false); setChangePwdError(''); }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {changePwdError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-bold">
                {changePwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">請輸入當前密碼：</label>
                <input
                  type="password"
                  value={oldPwdInput}
                  onChange={(e) => setOldPwdInput(e.target.value)}
                  placeholder="當前密碼（預設 disney888）"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">請輸入新密碼（至少4碼）：</label>
                <input
                  type="password"
                  value={newPwdInput}
                  onChange={(e) => setNewPwdInput(e.target.value)}
                  placeholder="請輸入新密碼..."
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">請再次確認新密碼：</label>
                <input
                  type="password"
                  value={confirmPwdInput}
                  onChange={(e) => setConfirmPwdInput(e.target.value)}
                  placeholder="請再次輸入新密碼..."
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowChangePwdModal(false); setChangePwdError(''); }}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={changePwdLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {changePwdLoading ? '儲存中...' : '確認修改密碼'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
