import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowRight, Lock } from 'lucide-react';

interface VaultBasicGateProps {
  onSuccess: () => void;
  onForbidden: () => void;
}

// Empreinte chiffrée d'authentification de niveau 1 (Gatekeeper)
const GATE_USER = 'adm-root';
const GATE_PASS = 'x-exile-9f3k2m';

export const VaultBasicGate: React.FC<VaultBasicGateProps> = ({ onSuccess, onForbidden }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === GATE_USER && password === GATE_PASS) {
      onSuccess();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError(true);
      if (nextAttempts >= 3) {
        onForbidden(); // Rann wout la 404 imedyatman
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-200">System Gateway Authentication</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Authorization Level 1 Required</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-medium">
            Accès refusé ({3 - attempts} tentative(s) restante(s))
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Gateway Identity
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Identity"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 font-mono"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Gateway Passkey
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Verify Credentials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-slate-800/80 text-center text-[10px] text-slate-600 font-mono">
          Gateway Passkey: <span className="text-slate-500">adm-root / x-exile-9f3k2m</span>
        </div>
      </div>
    </div>
  );
};
