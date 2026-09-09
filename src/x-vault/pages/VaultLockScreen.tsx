import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertTriangle, Key, Clock } from 'lucide-react';
import { useVaultAuth } from '../context/VaultAuthContext';

const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minit blokaj
const LOCKOUT_KEY = 'vault_blocked_until';
const ATTEMPTS_KEY = 'vault_attempts';

export const VaultLockScreen: React.FC = () => {
  const { loginWithPin, pinError, isLoading } = useVaultAuth();
  const [pin, setPin] = useState('');
  const [showHelper, setShowHelper] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    return parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
  });
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    const lockUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const now = Date.now();
    return lockUntil > now ? Math.ceil((lockUntil - now) / 1000) : 0;
  });

  // 4. Rate Limiting Countdown ki siviv refresh
  useEffect(() => {
    const checkLockout = () => {
      const lockUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
      const now = Date.now();
      if (lockUntil > now) {
        setLockoutRemaining(Math.ceil((lockUntil - now) / 1000));
      } else {
        setLockoutRemaining(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isLoading || lockoutRemaining > 0) return;

    // Tcheke si moun nan pa bloke anvan li soumèt
    const currentLock = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    if (currentLock > Date.now()) {
      setLockoutRemaining(Math.ceil((currentLock - Date.now()) / 1000));
      return;
    }

    const success = await loginWithPin(pin);
    if (!success) {
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      localStorage.setItem(ATTEMPTS_KEY, nextFails.toString());

      if (nextFails >= MAX_PIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        localStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
        localStorage.removeItem(ATTEMPTS_KEY);
        setLockoutRemaining(30 * 60);
      }
    } else {
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      setFailedAttempts(0);
    }
  };


  const handleKeypadPress = (num: string) => {
    if (lockoutRemaining > 0) return;
    if (pin.length < 12) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (lockoutRemaining > 0) return;
    setPin(prev => prev.slice(0, -1));
  };

  const formatTimeRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">X-VAULT</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Zone Réservée Haute Sécurité</p>
        </div>

        {/* Rate limit lockout warning */}
        {lockoutRemaining > 0 ? (
          <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm">
              <Clock className="w-5 h-5 animate-spin" />
              <span>IP & Session Temporairement Bloquées</span>
            </div>
            <p className="text-xs text-rose-300">
              Trop de tentatives erronées (3/3). Réessayez dans :
            </p>
            <div className="text-2xl font-black font-mono text-white">
              {formatTimeRemaining(lockoutRemaining)}
            </div>
          </div>
        ) : (
          <>
            {pinError && (
              <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-rose-400 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
                <span className="font-bold text-rose-300 whitespace-nowrap ml-2">
                  {failedAttempts}/3 essais
                </span>
              </div>
            )}
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Entrez le code d'accès Vault
            </label>
            <div className="relative">
              <input
                type="password"
                disabled={lockoutRemaining > 0}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl py-3.5 px-4 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress(digit)}
                className="h-12 bg-slate-800/60 hover:bg-slate-800 active:bg-slate-700 rounded-xl text-lg font-semibold text-slate-200 border border-slate-700/50 transition-all flex items-center justify-center shadow-sm disabled:opacity-40"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={lockoutRemaining > 0}
              onClick={handleBackspace}
              className="h-12 bg-slate-800/40 hover:bg-slate-800 active:bg-slate-700 rounded-xl text-xs font-semibold text-slate-400 border border-slate-700/50 transition-all flex items-center justify-center disabled:opacity-40"
            >
              Effacer
            </button>
            <button
              type="button"
              disabled={lockoutRemaining > 0}
              onClick={() => handleKeypadPress('0')}
              className="h-12 bg-slate-800/60 hover:bg-slate-800 active:bg-slate-700 rounded-xl text-lg font-semibold text-slate-200 border border-slate-700/50 transition-all flex items-center justify-center shadow-sm disabled:opacity-40"
            >
              0
            </button>
            <button
              type="submit"
              disabled={lockoutRemaining > 0}
              className="h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center shadow-lg shadow-blue-600/30 disabled:opacity-40"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={lockoutRemaining > 0}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{lockoutRemaining > 0 ? 'Verrouillé' : 'Déverrouiller le panneau'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setShowHelper(!showHelper)}
            className="text-xs text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Code PIN initial</span>
          </button>
          {showHelper && (
            <p className="mt-2 text-xs text-blue-400 font-mono bg-blue-950/40 p-2 rounded-lg border border-blue-900/50">
              PIN par défaut : <strong className="text-white">9834</strong>
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-600">
        Système de Gestion Confidentielle EXILE • Protocole Chiffré X-VAULT
      </div>
    </div>
  );
};
