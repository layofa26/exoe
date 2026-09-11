import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Shield,
  ArrowLeft,
  Loader2,
  KeyRound
} from 'lucide-react'

type LoginMode = 'email' | 'forgot-password' | 'reset-sent' | 'recover-email'

// Rate limiting: Max 5 tentatives par minute
const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW = 60 * 1000 // 1 minute

const getAttempts = (): number => {
  const attempts = localStorage.getItem('login_attempts')
  const timestamp = localStorage.getItem('login_attempts_timestamp')
  
  if (!attempts || !timestamp) return 0
  
  const now = Date.now()
  const timestampNum = parseInt(timestamp)
  
  // Reset si la fenêtre est passée
  if (now - timestampNum > ATTEMPT_WINDOW) {
    localStorage.removeItem('login_attempts')
    localStorage.removeItem('login_attempts_timestamp')
    return 0
  }
  
  return parseInt(attempts)
}

const incrementAttempts = (): number => {
  const currentAttempts = getAttempts()
  const newAttempts = currentAttempts + 1
  
  localStorage.setItem('login_attempts', newAttempts.toString())
  localStorage.setItem('login_attempts_timestamp', Date.now().toString())
  
  return newAttempts
}

const resetAttempts = (): void => {
  localStorage.removeItem('login_attempts')
  localStorage.removeItem('login_attempts_timestamp')
}

const isRateLimited = (): boolean => {
  return getAttempts() >= MAX_ATTEMPTS
}

const getRemainingTime = (): number => {
  const timestamp = localStorage.getItem('login_attempts_timestamp')
  if (!timestamp) return 0
  
  const now = Date.now()
  const timestampNum = parseInt(timestamp)
  const elapsed = now - timestampNum
  const remaining = ATTEMPT_WINDOW - elapsed
  
  return Math.max(0, Math.ceil(remaining / 1000))
}

export const Login = (): JSX.Element => {
  const { t } = useTranslation()
  const { login, verify2FA, resend2FAOtp } = useAuth()
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Double Authentification (2FA) Complète
  const [is2FAStep, setIs2FAStep] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState<{
    sessionTemp: string
    method: 'totp' | 'email'
    emailMasked?: string
  } | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [verifying2FA, setVerifying2FA] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === 'username' ? e.target.value.trim() : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      setError("Veuillez renseigner votre nom d'utilisateur et mot de passe.")
      return
    }

    if (isRateLimited()) {
      setError(`Trop de tentatives. Réessayez dans ${getRemainingTime()} secondes.`)
      return
    }
    
    setLoading(true)
    setError('')
    incrementAttempts()
    
    const result = await login(formData.username, formData.password)
    
    if (result.requires2FA && result.sessionTemp) {
      setTwoFactorData({
        sessionTemp: result.sessionTemp,
        method: result.twoFactorMethod || 'totp',
        emailMasked: result.emailMasked
      })
      setIs2FAStep(true)
      setError('')
      setOtpCode('')
      resetAttempts()
    } else if (!result.success) {
      setError(result.error || 'Identifiants incorrects. Vérifiez votre nom d\'utilisateur ou mot de passe.')
    } else {
      resetAttempts()
    }
    
    setLoading(false)
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twoFactorData?.sessionTemp) return
    if (otpCode.length < 6) {
      setError('Veuillez renseigner le code à 6 chiffres.')
      return
    }

    setVerifying2FA(true)
    setError('')
    const res = await verify2FA(twoFactorData.sessionTemp, otpCode)
    if (!res.success) {
      setError(res.error || 'Code incorrect ou expiré.')
    }
    setVerifying2FA(false)
  }

  const handleResendOtp = async () => {
    if (!twoFactorData?.sessionTemp) return
    setResendingOtp(true)
    setError('')
    setResendSuccessMsg(null)
    const res = await resend2FAOtp(twoFactorData.sessionTemp)
    if (res.success) {
      setResendSuccessMsg(res.message || 'Nouveau code envoyé par email !')
      setTimeout(() => setResendSuccessMsg(null), 4000)
    } else {
      setError(res.error || "Erreur lors de l'envoi du code.")
    }
    setResendingOtp(false)
  }

  const render2FAStep = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
          {t('auth.twoFactorTitle', 'Double Authentification')}
        </h1>
        <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
          {twoFactorData?.method === 'email'
            ? `Entrez le code à 6 chiffres envoyé à ${twoFactorData.emailMasked || 'votre adresse email'}.`
            : "Entrez le code à 6 chiffres généré par votre application d'authentification (Google Authenticator / Authy)."}
        </p>
      </div>

      {error && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 ${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg flex items-center space-x-2`}>
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
          <span className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{error}</span>
        </div>
      )}

      {resendSuccessMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
          <span>{resendSuccessMsg}</span>
        </div>
      )}

      <form onSubmit={handleVerify2FA} className="space-y-4 sm:space-y-6">
        <div>
          <label className={`block text-xs sm:text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-2 text-center`}>
            {t('auth.twoFactorPlaceholder', 'Code à 6 chiffres')}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setOtpCode(val)
                setError('')
              }}
              placeholder="••••••"
              className={`w-full py-3.5 px-4 text-center tracking-[0.4em] font-mono text-2xl font-bold rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-300'
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={verifying2FA || otpCode.length !== 6}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {verifying2FA ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Vérification...</span>
            </>
          ) : (
            <span>{t('auth.twoFactorVerify', 'Valider la connexion')}</span>
          )}
        </button>

        {twoFactorData?.method === 'email' && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendingOtp}
              className="text-xs text-blue-500 hover:underline font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {resendingOtp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Renvoyer un nouveau code</span>
            </button>
          </div>
        )}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              setIs2FAStep(false)
              setTwoFactorData(null)
              setOtpCode('')
              setError('')
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl-flip" />
            <span>{t('auth.twoFactorBackToLogin', 'Retour à la connexion')}</span>
          </button>
        </div>
      </form>
    </>
  )

  const renderLoginForm = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <h1 className={`text-xl sm:text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
          Connexion à EXILE
        </h1>
        <p className={`text-sm sm:text-base ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
          Connectez-vous avec votre username, email ou téléphone
        </p>
      </div>

      {error && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 ${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg flex items-center space-x-2`}>
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
          <span className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
        <div>
          <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
            Identifiant (Username, Email ou Téléphone) *
          </label>
          <div className="relative">
            <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5`} />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              placeholder="@NomPrenom, email@exemple.com ou +33..."
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-1.5 sm:mb-2`}>
            Mot de passe *
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-400'} w-4 h-4 sm:w-5 sm:h-5`} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base ${
                resolvedTheme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 ${resolvedTheme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-center">
        <Link
          to="/forgot-password"
          className="text-xs sm:text-sm text-primary hover:underline block w-full"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <div className={`mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t ${resolvedTheme === 'dark' ? 'border-zinc-800' : 'border-gray-100'}`}>
        <p className={`text-xs sm:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </>
  )

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 sm:py-12 px-3 sm:px-4 relative overflow-hidden ${
      resolvedTheme === 'dark' 
        ? 'bg-slate-900' 
        : 'bg-gray-50'
    }`}>
      {/* Animated Background with Color Mixing and Simple Images */}
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
          {is2FAStep ? render2FAStep() : renderLoginForm()}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </div>
  )
}

export default Login
