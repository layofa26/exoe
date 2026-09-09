import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const ConfirmEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Jeton de validation manquant ou invalide.');
      return;
    }

    authApi.confirmChangeEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.detail || 'Votre nouvelle adresse email a été confirmée avec succès !');
      })
      .catch((err) => {
        setStatus('error');
        const errMsg = err.response?.data?.detail || err.response?.data?.error || 'Ce lien de confirmation est invalide ou a expiré (durée de validité : 1 heure).';
        setMessage(errMsg);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <h2 className="text-xl font-semibold">Vérification en cours...</h2>
            <p className="text-slate-400 text-sm">Veuillez patienter pendant la validation de votre nouvelle adresse email.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Email Confirmé !</h2>
            <p className="text-slate-300 text-sm">{message}</p>
            <button
              onClick={() => navigate('/pro/settings')}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              Retourner aux Paramètres
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Échec de confirmation</h2>
            <p className="text-red-300 text-sm bg-red-950/40 border border-red-900/50 p-3 rounded-lg w-full">{message}</p>
            <button
              onClick={() => navigate('/pro/settings')}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Retourner aux Paramètres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
