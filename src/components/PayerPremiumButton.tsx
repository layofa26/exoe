import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Loader2, CreditCard, ShieldCheck, Smartphone, 
  ArrowRight, X, Clock, Sparkles, CheckCircle2 
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import NatcashModal from './modals/NatcashModal';

interface PayerPremiumButtonProps {
  onSuccess?: () => void;
  className?: string;
  montant?: number;
}

export const PayerPremiumButton: React.FC<PayerPremiumButtonProps> = ({ 
  className = '',
  montant = 20.00,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [loadingPgecom, setLoadingPgecom] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showChoiceModal, setShowChoiceModal] = useState<boolean>(false);
  const [showNatcashModal, setShowNatcashModal] = useState<boolean>(false);

  const getAuthToken = (): string | null => {
    return (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      null
    );
  };

  const handlePgecomPayment = async () => {
    setLoadingPgecom(true);
    setErrorMessage(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setErrorMessage(t('payment.loginRequired', 'Ou dwe konekte pou w ka abòne. Tanpri rekonekte.'));
        setLoadingPgecom(false);
        return;
      }

      const apiBase = API_BASE_URL || 'https://exile-backend-9q6o.onrender.com/api/v1';

      const response = await fetch(`${apiBase}/abonnement/abonnements/initier_paiement/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ montant: montant })
      });

      let data: any = null;
      const textResponse = await response.text();
      try {
        data = JSON.parse(textResponse);
      } catch (jsonErr) {
        data = { error: textResponse.slice(0, 300) };
      }

      if (response.ok && data && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        const detailStr = typeof data?.details === 'object' ? JSON.stringify(data?.details) : (data?.details || '');
        const errDetail = data?.error || data?.message || data?.detail || (response.status === 401 ? t('payment.sessionExpired', 'Sesyon ou ekspire. Tanpri rekonekte.') : t('payment.urlUnavailable', 'URL peman an pa disponib.'));
        setErrorMessage(detailStr ? `${errDetail} (${detailStr})` : errDetail);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('payment.pgecomError', 'Erè pandan inisyasyon peman an sou PGecom.'));
    } finally {
      setLoadingPgecom(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          onClick={() => setShowChoiceModal(true)}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 shadow-md bg-[#FF6B00] hover:bg-[#e05e00] active:scale-[0.99] hover:shadow-lg cursor-pointer ${className}`}
        >
          <CreditCard className="w-5 h-5" />
          <span>{t('payment.subscribeBtn', 'Peye $20 / Mwa (Premium)')}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{t('payment.methodsNotice', 'Natcash (Manyèl), MonCash ak Kat Sekirize')}</span>
        </div>

        {errorMessage && (
          <p className="text-xs text-red-500 mt-1 text-center font-medium">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Modal Chwa Metòd Peman (Natcash Manyèl vs PGecom) */}
      {showChoiceModal && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-base">
                  {t('payment.chooseMethodTitle', 'Chwazi Mwayen Peman')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {t('payment.chooseMethodSubtitle', 'Abònman EXILE PRO - $20.00 USD / Mwa')}
                </p>
              </div>
              <button
                onClick={() => setShowChoiceModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opsyon yo */}
            <div className="p-5 space-y-3">
              {/* Opsyon 1 : Natcash Manyèl (EXILE PLATEFORME) */}
              <div 
                onClick={() => {
                  setShowChoiceModal(false);
                  setShowNatcashModal(true);
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 hover:scale-[1.01] ${
                  isDark 
                    ? 'border-orange-500/40 bg-orange-500/5 hover:border-orange-500 hover:bg-orange-500/10' 
                    : 'border-orange-400 bg-orange-50/50 hover:border-orange-500 hover:bg-orange-50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400">
                      {t('payment.natcashOptionTitle', 'Natcash (Transfè Manyèl)')}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-600 dark:text-orange-300">
                      {t('payment.popularHaiti', 'Ayiti')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-zinc-300 mt-0.5">
                    {t('payment.natcashOptionDesc', 'Voye bay EXILE PLATEFORME • Validasyon an 4h maksimòm')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3" />
                    <span>{t('payment.delayBadge', 'Delè validasyon : 4H de tan')}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-orange-500 flex-shrink-0" />
              </div>

              {/* Opsyon 2 : Kat Kredi / MonCash (PGecom Otomatik) */}
              <div 
                onClick={() => {
                  setShowChoiceModal(false);
                  handlePgecomPayment();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 hover:scale-[1.01] ${
                  isDark 
                    ? 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-500 hover:bg-zinc-800' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">
                    {t('payment.pgecomOptionTitle', 'Kat Kredi / MonCash / PG Pay')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {t('payment.pgecomOptionDesc', 'Passerelle PGecom • Peman an liy otomatik')}
                  </p>
                </div>
                {loadingPgecom ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 text-center">
              <button
                type="button"
                onClick={() => setShowChoiceModal(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                {t('common.cancel', 'Annuler')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Peman Natcash Manyèl */}
      <NatcashModal
        isOpen={showNatcashModal}
        onClose={() => setShowNatcashModal(false)}
        onSuccess={() => {
          if (onSuccess) onSuccess();
        }}
        montantHtg={2895}
        montantUsd={montant}
      />
    </>
  );
};

export default PayerPremiumButton;
