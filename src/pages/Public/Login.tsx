import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowLeft,
  Smartphone,
  CheckCircle,
  KeyRound
} from 'lucide-react'

type LoginMode = 'email' | 'forgot-password' | 'reset-sent' | 'recover-email'

export const Login = (): JSX.Element => {
  const { login } = useAuth()
  const [mode, setMode] = useState<LoginMode>('email')
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    recoveryEmail: '',
    recoveryPhone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData.identifier, formData.password)
    
    if (!result.success) {
      setError(result.error || 'Identifiant ou mot de passe incorrect')
    }
    
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSuccess('Un lien de réinitialisation a été envoyé à votre email/téléphone.')
    setMode('reset-sent')
    setLoading(false)
  }

  const handleRecoverEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (!formData.recoveryPhone) {
      setError('Veuillez entrer votre numéro de téléphone')
      setLoading(false)
      return
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSuccess('Si ce numéro est associé à un compte, vous recevrez un SMS avec votre email.')
    setLoading(false)
  }

  const renderLoginForm = () => (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Connexion à EXILE
        </h1>
        <p className="text-gray-600">
          Accédez à votre compte avec email ou téléphone
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ou téléphone *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="votre@email.com ou +509..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <button
          onClick={() => setMode('forgot-password')}
          className="text-sm text-primary hover:underline block w-full"
        >
          Mot de passe oublié ?
        </button>
        <button
          onClick={() => setMode('recover-email')}
          className="text-sm text-gray-500 hover:text-primary hover:underline block w-full"
        >
          Email de connexion oublié ?
        </button>
      </div>

      <div className="mt-8 text-center pt-6 border-t border-gray-100">
        <p className="text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </>
  )

  const renderForgotPassword = () => (
    <>
      <button
        onClick={() => setMode('email')}
        className="flex items-center text-gray-500 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Retour
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mot de passe oublié
        </h1>
        <p className="text-gray-600">
          Entrez votre email ou téléphone pour réinitialiser votre mot de passe
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      <form onSubmit={handleForgotPassword} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ou téléphone *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="votre@email.com ou +509..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </form>
    </>
  )

  const renderResetSent = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Lien envoyé !
        </h1>
        <p className="text-gray-600">
          Vérifiez votre email ou SMS pour réinitialiser votre mot de passe.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700">
          Le lien expire dans 24 heures. Si vous ne le trouvez pas, vérifiez vos spams.
        </p>
      </div>

      <button
        onClick={() => setMode('email')}
        className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
      >
        Retour à la connexion
      </button>
    </>
  )

  const renderRecoverEmail = () => (
    <>
      <button
        onClick={() => setMode('email')}
        className="flex items-center text-gray-500 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Retour
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Récupérer mon email
        </h1>
        <p className="text-gray-600">
          Entrez votre numéro de téléphone associé au compte
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      <form onSubmit={handleRecoverEmail} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de téléphone *
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              name="recoveryPhone"
              value={formData.recoveryPhone}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+509 34 56 78 90"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Récupérer mon email'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Vous recevrez un SMS avec votre email si ce numéro est associé à un compte.
        </p>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-4 sm:p-8">
          {mode === 'email' && renderLoginForm()}
          {mode === 'forgot-password' && renderForgotPassword()}
          {mode === 'reset-sent' && renderResetSent()}
          {mode === 'recover-email' && renderRecoverEmail()}
        </div>
      </div>
    </div>
  )
}

export default Login
