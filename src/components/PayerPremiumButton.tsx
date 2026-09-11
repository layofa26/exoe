import React, { useState } from 'react';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface PayerPremiumButtonProps {
  onSuccess?: () => void;
  className?: string;
  montant?: number;
}

export const PayerPremiumButton: React.FC<PayerPremiumButtonProps> = ({ 
  className = '',
  montant = 20.00
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    // 1. Check accessToken (standard Exile auth key)
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) return accessToken;

    // 2. Check access_token / token fallbacks
    const fallback = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (fallback) return fallback;

    // 3. Check document.cookie
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return null;
  };

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setErrorMessage('Ou dwe konekte pou w ka abòne. Tanpri rekonekte.');
        setLoading(false);
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
        const errDetail = data?.error || data?.message || data?.detail || (response.status === 401 ? 'Sesyon ou ekspire oswa ou pa konekte. Tanpri rekonekte.' : 'URL peman an pa disponib.');
        setErrorMessage(detailStr ? `${errDetail} (${detailStr})` : errDetail);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erè pandan inisyasyon peman an sou PGecom.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 shadow-md ${
          loading
            ? 'bg-amber-400 cursor-not-allowed opacity-80'
            : 'bg-[#FF6B00] hover:bg-[#e05e00] active:scale-[0.99] hover:shadow-lg'
        } ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Koneksyon ak PGecom...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Peye $20 / Mwa (Premium)</span>
          </>
        )}
      </button>

      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>MonCash, Natcash ak Kat Sekirize</span>
      </div>

      {errorMessage && (
        <p className="text-xs text-red-500 mt-1 text-center font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default PayerPremiumButton;
