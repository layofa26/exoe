import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password })
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 sm:py-12 px-3 sm:px-4 relative overflow-hidden ${
      resolvedTheme === 'dark' 
        ? 'bg-slate-900' 
        : 'bg-gray-50'
    }`}>
      {/* Animated Background with Color Mixing - Same as Login */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 animate-gradient-x" style={{
          background: `linear-gradient(45deg, 
            ${resolvedTheme === 'dark' ? '#1e3a8a' : '#3b82f6'}, 
            ${resolvedTheme === 'dark' ? '#7c3aed' : '#8b5cf6'}, 
            ${resolvedTheme === 'dark' ? '#059669' : '#10b981'}, 
            ${resolvedTheme === 'dark' ? '#dc2626' : '#ef4444'}
          )`,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        }} />
        
        {/* Simple geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/10 rounded-lg animate-spin" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-white/10 animate-pulse" />
        <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        
        {/* Simple lines */}
        <div className="absolute top-1/3 left-0 w-full h-px bg-white/10" />
        <div className="absolute top-2/3 left-0 w-full h-px bg-white/10" />
        <div className="absolute top-0 left-1/3 h-full w-px bg-white/10" />
        <div className="absolute top-0 right-1/3 h-full w-px bg-white/10" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className={`rounded-2xl shadow-2xl p-4 sm:p-8 backdrop-blur-sm ${
          resolvedTheme === 'dark' 
            ? 'bg-slate-800/80 border border-slate-700' 
            : 'bg-white/80 border border-gray-200'
        }`}>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${
            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
          } mb-2`}>
            Mot de passe oublié
          </h1>
          <p className={`text-sm sm:text-base ${
            resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            Entrez votre email pour réinitialiser votre mot de passe
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className={`text-xl font-semibold ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            } mb-2`}>
              Email envoyé
            </h2>
            <p className={`text-sm ${
              resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            } mb-6`}>
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              } mb-1.5 sm:mb-2`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                resolvedTheme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'
              }`}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-colors"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>

            {/* Back to Login */}
            <div className="text-center pt-4">
              <Link
                to="/login"
                className={`inline-flex items-center gap-2 text-xs sm:text-sm ${
                  resolvedTheme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
