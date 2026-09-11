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

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const apiBase = API_BASE_URL || 'https://exile-backend.onrender.com';

      const response = await fetch(`${apiBase}/abonnement/abonnements/initier_paiement/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ montant: montant })
      });

      const data = await response.json();

      if (response.ok && data && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setErrorMessage(data?.message || data?.error || 'URL peman an pa disponib. Tanpri reeseye.');
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
