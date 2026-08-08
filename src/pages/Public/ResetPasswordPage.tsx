import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { resolvedTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Token de réinitialisation manquant');
    }
  }, [token]);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    return { score, label: labels[score] };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setError('Token de réinitialisation manquant');
      return;
    }

    setLoading(true);

    try {
      // Backend removed - reset password disabled
      setError('Backend service not available');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 ${
        resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'
      }`}>
        <div className={`w-full max-w-md ${
          resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'
        } rounded-2xl shadow-xl p-6 sm:p-8 text-center`}>
          <h1 className={`text-2xl font-bold ${
            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
          } mb-4`}>
            Lien invalide
          </h1>
          <p className={`text-sm ${
            resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          } mb-6`}>
            Le lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 ${
      resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'
    }`}>
      <div className={`w-full max-w-md ${
        resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'
      } rounded-2xl shadow-xl p-6 sm:p-8`}>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${
            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
          } mb-2`}>
            Réinitialiser le mot de passe
          </h1>
          <p className={`text-sm sm:text-base ${
            resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            Entrez votre nouveau mot de passe
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
              Mot de passe réinitialisé
            </h2>
            <p className={`text-sm ${
              resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            } mb-6`}>
              Votre mot de passe a été réinitialisé avec succès.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Se connecter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Password Field */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              } mb-1.5 sm:mb-2`}>
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full pl-10 pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? 'bg-red-500'
                              : passwordStrength.score <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : resolvedTheme === 'dark'
                            ? 'bg-zinc-700'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                  }`}>
                    Force : {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              } mb-1.5 sm:mb-2`}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pl-10 pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
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
  );
}
