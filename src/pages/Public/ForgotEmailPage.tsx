import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Phone, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotEmailPage() {
  const { resolvedTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username && !phone) {
      setError('Veuillez entrer un nom d\'utilisateur ou un numéro de téléphone');
      return;
    }

    setLoading(true);

    try {
      // Backend removed - forgot email disabled
      setError('Backend service not available');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

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
            Email oublié
          </h1>
          <p className={`text-sm sm:text-base ${
            resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            Entrez votre nom d'utilisateur ou numéro de téléphone pour récupérer votre email
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
              Si un compte existe avec ces informations, vous recevrez un email avec votre adresse.
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
            {/* Username Field */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              } mb-1.5 sm:mb-2`}>
                Nom d'utilisateur
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="votre_nom_utilisateur"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className={`absolute inset-0 flex items-center ${
                resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-300'
              }`}>
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className={`px-2 bg-white dark:bg-zinc-800 ${
                  resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  OU
                </span>
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium ${
                resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              } mb-1.5 sm:mb-2`}>
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
                }`} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base ${
                    resolvedTheme === 'dark'
                      ? 'bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="+509 XXXX XXXX"
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
              {loading ? 'Recherche en cours...' : 'Récupérer mon email'}
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
