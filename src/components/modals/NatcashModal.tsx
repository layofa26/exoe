import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, Smartphone, Copy, Check, Clock, 
  AlertCircle, Loader2, ArrowRight, CheckCircle2, ArrowRightLeft 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL } from '../../config/api';

interface NatcashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  montantHtg?: number;
  montantUsd?: number;
}

export const NatcashModal: React.FC<NatcashModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  montantHtg = 2895,
  montantUsd = 20
}) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // State
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Configuration (Placeholder konfigirab pa env oswa default)
  const natcashNumber = import.meta.env.VITE_NATCASH_MERCHANT_NUMBER || '+509 3X XX XX XX';
  const recipientName = 'EXILE PLATEFORME';

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getAuthToken = (): string | null => {
    return (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = senderPhone.trim();
    const cleanTxnId = transactionId.trim().toUpperCase();

    if (!cleanPhone) {
      setError(t('natcash.errors.phoneRequired', 'Tanpri mete nimewo telefòn ou itilize pou voye transfè a.'));
      return;
    }

    if (!cleanTxnId) {
      setError(t('natcash.errors.txnRequired', 'Tanpri mete ID Tranzaksyon Natcash la (kòd nan SMS konfimasyon an).'));
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        setError(t('natcash.errors.loginRequired', 'Ou dwe konekte pou w ka soumèt peman sa a.'));
        setLoading(false);
        return;
      }

      const apiBase = API_BASE_URL || 'https://exile-backend-9q6o.onrender.com/api/v1';

      const response = await fetch(`${apiBase}/abonnement/abonnements/soumettre_natcash/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_phone: cleanPhone,
          transaction_id: cleanTxnId,
          screenshot: screenshotUrl.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || t('natcash.errors.generic', 'Erè pandan anrejistreman peman an. Tanpri verifye kòd la.'));
      } else {
        setIsSubmitted(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || t('natcash.errors.network', 'Erè koneksyon. Tanpri verifye entènèt ou.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {t('natcash.title', 'Peman Manyèl Natcash')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t('natcash.subtitle', 'Transfè dirèk bay EXILE PLATEFORME')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        {isSubmitted ? (
          /* Écran de Succès */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {t('natcash.success.title', 'Peman Anrejistre avèk Siksè !')}
              </h4>
              <p className="text-xs text-gray-600 dark:text-zinc-300 max-w-sm mx-auto">
                {t('natcash.success.message', 'Nou byen resevwa tranzaksyon Natcash ou a. Ekip EXILE PLATEFORME ap valide l epi aktive kont Premium ou a nan yon delè 4 èdtan maksimòm.')}
              </p>
            </div>

            {/* Badge de délai 4h */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <Clock className="w-4 h-4" />
              <span>{t('natcash.delayBadge', 'Delè validasyon : 4H de tan maksimòm')}</span>
            </div>

            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                {t('common.ok', "D'accord")}
              </button>
            </div>
          </div>
        ) : (
          /* Formulaire de Soumission */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Box Taux de Change (Style PGecom - simple & responsif) */}
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
              isDark ? 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300' : 'bg-blue-50/70 border-blue-200/80 text-blue-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-gray-800 dark:text-zinc-100 block text-xs">
                    {t('natcash.exchangeRateTitle', 'Taux de change')}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                    {t('natcash.rateCalculation', 'Taux officiel : 1 USD = 144.75 HTG')}
                  </span>
                </div>
              </div>
              <div className="flex items-center sm:justify-end">
                <span className="px-3 py-1 rounded-lg font-bold font-mono text-xs bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-zinc-700 shadow-xs">
                  ${montantUsd}.00 USD = {montantHtg.toLocaleString()} HTG
                </span>
              </div>
            </div>

            {/* Box d'Instructions Natcash */}
            <div className={`p-4 rounded-xl border space-y-2.5 text-xs ${
              isDark ? 'bg-zinc-800/60 border-zinc-700/80' : 'bg-orange-50/70 border-orange-200/80 text-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500 dark:text-zinc-400">
                  {t('natcash.recipientLabel', 'Non Benefisyè :')}
                </span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                  {recipientName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500 dark:text-zinc-400">
                  {t('natcash.numberLabel', 'Nimewo Natcash :')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-sm tracking-wider">
                    {natcashNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(natcashNumber, 'number')}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title={t('common.copy', 'Kopye')}
                  >
                    {copiedField === 'number' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500 dark:text-zinc-400">
                  {t('natcash.amountLabel', 'Montan egzak :')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                    {montantHtg.toLocaleString()} HTG (${montantUsd}.00 USD)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(montantHtg), 'amount')}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title={t('common.copy', 'Kopye')}
                  >
                    {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Instructions de composition */}
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-700 text-[11px] text-gray-600 dark:text-zinc-300">
                <p>
                  👉 {t('natcash.stepGuide', 'Konpoze *202# oswa itilize aplikasyon Natcash pou voye montan an bay nimewo anlè a.')}
                </p>
              </div>

              {/* Delè 4H de tan */}
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px] pt-1">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t('natcash.validationDelay', 'Delè validasyon : 4 èdtan de tan maksimòm.')}</span>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Champs du formulaire */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-zinc-300">
                  {t('natcash.senderPhoneLabel', 'Nimewo telefòn ki voye lajan an *')}
                </label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+509 42XX-XXXX"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    isDark 
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-orange-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-zinc-300">
                  {t('natcash.transactionIdLabel', 'ID Tranzaksyon Natcash (kòd nan SMS la) *')}
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Egzanp: TXN-9283746 oswa 8374920"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider transition-colors ${
                    isDark 
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-orange-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                  }`}
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                disabled={loading || !senderPhone.trim() || !transactionId.trim()}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('common.loading', 'Anrejistreman...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('natcash.submitBtn', 'Konfime Peman Mwen')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NatcashModal;
