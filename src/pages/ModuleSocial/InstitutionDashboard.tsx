import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../../hooks/useToast'
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  FileText,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react'

export const InstitutionDashboard = (): JSX.Element => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const [institutionData, setInstitutionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des données de l'institution
    // À remplacer par appel API réel
    setTimeout(() => {
      setInstitutionData({
        name: localStorage.getItem('exile_institution_name') || 'Votre Institution',
        status: 'PENDING_VERIFICATION',
        plan: 'VERIFIED',
        createdAt: new Date().toISOString(),
      })
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500',
          title: 'En attente de vérification',
          description: 'Votre institution est en cours de vérification par notre équipe. Cela peut prendre 1-3 jours ouvrables.'
        }
      case 'VERIFIED':
        return {
          icon: CheckCircle,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500',
          title: 'Vérifiée',
          description: 'Votre institution a été vérifiée avec succès. Vous pouvez maintenant utiliser toutes les fonctionnalités.'
        }
      case 'REJECTED':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500',
          title: 'Rejetée',
          description: 'Votre demande a été rejetée. Veuillez vérifier vos informations et soumettre à nouveau.'
        }
      case 'SUSPENDED':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500',
          title: 'Suspendue',
          description: 'Votre institution a été suspendue temporairement. Contactez le support pour plus d\'informations.'
        }
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500',
          title: 'Statut inconnu',
          description: 'Statut de votre institution inconnu.'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-social mx-auto mb-4"></div>
          <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(institutionData?.status || 'PENDING_VERIFICATION')
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
            Tableau de bord de l'institution
          </h1>
          <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
            Gérez votre institution et suivez son statut de vérification
          </p>
        </div>

        {/* Status Card */}
        <div className={`p-6 rounded-xl border-2 ${statusInfo.bgColor} ${statusInfo.borderColor} mb-6`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${statusInfo.bgColor}`}>
              <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                {statusInfo.title}
              </h2>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'} mb-4`}>
                {statusInfo.description}
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700'
              }`}>
                <Building2 className="w-3 h-3" />
                {institutionData?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Users className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
              <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Abonnés</span>
            </div>
            <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>0</p>
          </div>

          <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <FileText className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
              <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Alertes</span>
            </div>
            <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>0</p>
          </div>

          <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
              <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Événements</span>
            </div>
            <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>0</p>
          </div>

          <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
              <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>Recrutements</span>
            </div>
            <p className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>0</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/social/institution')}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              resolvedTheme === 'dark'
                ? 'bg-zinc-800 border-zinc-700 hover:border-social'
                : 'bg-white border-gray-200 hover:border-social'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Building2 className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
              <ArrowRight className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </div>
            <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
              Voir le profil complet
            </h3>
            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              Accédez à toutes les fonctionnalités de votre institution
            </p>
          </button>

          <button
            disabled={institutionData?.status !== 'VERIFIED'}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              institutionData?.status !== 'VERIFIED'
                ? resolvedTheme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 opacity-50 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                : resolvedTheme === 'dark'
                ? 'bg-zinc-800 border-zinc-700 hover:border-social'
                : 'bg-white border-gray-200 hover:border-social'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
              <ArrowRight className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`} />
            </div>
            <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
              Créer une alerte
            </h3>
            <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              {institutionData?.status !== 'VERIFIED'
                ? 'Disponible après vérification'
                : 'Publiez une alerte pour votre communauté'
              }
            </p>
          </button>
        </div>

        {/* Info Card */}
        <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
          <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
            <strong>Plan actuel:</strong> {institutionData?.plan === 'VERIFIED' ? 'Verified (Gratuit)' : institutionData?.plan}
          </p>
          <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'} mt-1`}>
            <strong>Créée le:</strong> {new Date(institutionData?.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default InstitutionDashboard
