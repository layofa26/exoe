import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ChevronRight, Shield, Lock, Eye, Users, Globe, Building2, UserX,
  Mail, Smartphone, Briefcase, MapPin, Clock, Play, TrendingUp, Calendar
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

type PrivacyLevel = 'PUBLIC' | 'SUBSCRIBERS' | 'CONTACTS' | 'INSTITUTIONS' | 'PRIVATE';

interface PrivacySettings {
  avatarVisibility: PrivacyLevel;
  fullNameVisibility: PrivacyLevel;
  bioVisibility: PrivacyLevel;
  professionVisibility: PrivacyLevel;
  specialtyVisibility: PrivacyLevel;
  cityVisibility: PrivacyLevel;
  countryVisibility: PrivacyLevel;
  emailVisibility: PrivacyLevel;
  phoneVisibility: PrivacyLevel;
  websitesVisibility: PrivacyLevel;
  skillsVisibility: PrivacyLevel;
  certificationsVisibility: PrivacyLevel;
  eventsVisibility: PrivacyLevel;
  videosVisibility: PrivacyLevel;
  languagesVisibility: PrivacyLevel;
  availabilityVisibility: PrivacyLevel;
  activityVisibility: PrivacyLevel;
}

const PrivacySettings = () => {
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PrivacySettings>({
    avatarVisibility: 'PUBLIC',
    fullNameVisibility: 'PUBLIC',
    bioVisibility: 'PUBLIC',
    professionVisibility: 'PUBLIC',
    specialtyVisibility: 'PUBLIC',
    cityVisibility: 'PUBLIC',
    countryVisibility: 'PUBLIC',
    emailVisibility: 'CONTACTS',
    phoneVisibility: 'CONTACTS',
    websitesVisibility: 'PUBLIC',
    skillsVisibility: 'PUBLIC',
    certificationsVisibility: 'PUBLIC',
    eventsVisibility: 'PUBLIC',
    videosVisibility: 'PUBLIC',
    languagesVisibility: 'PUBLIC',
    availabilityVisibility: 'CONTACTS',
    activityVisibility: 'SUBSCRIBERS'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...(data.privacy_settings || {}) }))
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('accessToken')
      if (!token) {
        setMessage({ type: 'error', text: 'Token non trouvé' });
        return
      }

      const response = await fetch(`${API_BASE_URL}/profil/profils/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privacy_settings: settings })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Paramètres de confidentialité mis à jour' });
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const PrivacyOption = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon,
    options 
  }: { 
    label: string; 
    value: PrivacyLevel; 
    onChange: (value: PrivacyLevel) => void;
    icon: any;
    options?: PrivacyLevel[];
  }) => {
    const defaultOptions = options || ['PUBLIC', 'SUBSCRIBERS', 'CONTACTS', 'INSTITUTIONS', 'PRIVATE'];
    
    const getOptionLabel = (level: PrivacyLevel) => {
      switch (level) {
        case 'PUBLIC': return 'Public';
        case 'SUBSCRIBERS': return 'Abonnés';
        case 'CONTACTS': return 'Contacts';
        case 'INSTITUTIONS': return 'Institutions';
        case 'PRIVATE': return 'Privé';
        default: return level;
      }
    };

    const getOptionIcon = (level: PrivacyLevel) => {
      switch (level) {
        case 'PUBLIC': return Globe;
        case 'SUBSCRIBERS': return Users;
        case 'CONTACTS': return UserX;
        case 'INSTITUTIONS': return Building2;
        case 'PRIVATE': return Lock;
        default: return Eye;
      }
    };

    return (
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border rounded-xl p-4 mb-3`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-zinc-700' : 'bg-gray-100'}`}>
            <Icon className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`} />
          </div>
          <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {label}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {defaultOptions.map((option) => {
            const OptionIcon = getOptionIcon(option);
            const isSelected = value === option;
            return (
              <button
                key={option}
                onClick={() => onChange(option)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? resolvedTheme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : resolvedTheme === 'dark'
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <OptionIcon className="w-4 h-4" />
                {getOptionLabel(option)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`w-8 h-8 border-4 ${resolvedTheme === 'dark' ? 'border-zinc-500 border-t-blue-500' : 'border-gray-400 border-t-blue-600'} rounded-full animate-spin`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-gray-200'} border-b fixed top-0 left-0 right-0 z-50 backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'} transition-colors`}
          >
            <ChevronRight className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <div className="flex items-center gap-2">
            <Shield className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Confidentialité du profil
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 mt-16">
        {/* Info Banner */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 mb-6`}>
          <div className="flex items-start gap-3">
            <Eye className={`w-5 h-5 mt-0.5 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-800'} mb-1`}>
                Contrôlez votre visibilité
              </p>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-blue-200/70' : 'text-blue-700/70'}`}>
                Choisissez qui peut voir chaque élément de votre profil. Les administrateurs conservent un accès total.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Informations de profil
          </h2>
          
          <PrivacyOption
            label="Photo de profil"
            value={settings.avatarVisibility}
            onChange={(v) => setSettings({ ...settings, avatarVisibility: v })}
            icon={Eye}
            options={['PUBLIC', 'SUBSCRIBERS', 'CONTACTS', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Nom complet"
            value={settings.fullNameVisibility}
            onChange={(v) => setSettings({ ...settings, fullNameVisibility: v })}
            icon={UserX}
            options={['PUBLIC', 'SUBSCRIBERS', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Biographie"
            value={settings.bioVisibility}
            onChange={(v) => setSettings({ ...settings, bioVisibility: v })}
            icon={Lock}
            options={['PUBLIC', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Métier"
            value={settings.professionVisibility}
            onChange={(v) => setSettings({ ...settings, professionVisibility: v })}
            icon={Briefcase}
            options={['PUBLIC', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Spécialité"
            value={settings.specialtyVisibility}
            onChange={(v) => setSettings({ ...settings, specialtyVisibility: v })}
            icon={Shield}
            options={['PUBLIC', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Ville"
            value={settings.cityVisibility}
            onChange={(v) => setSettings({ ...settings, cityVisibility: v })}
            icon={MapPin}
            options={['PUBLIC', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Pays"
            value={settings.countryVisibility}
            onChange={(v) => setSettings({ ...settings, countryVisibility: v })}
            icon={Globe}
            options={['PUBLIC', 'PRIVATE']}
          />
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Informations de contact
          </h2>
          
          <PrivacyOption
            label="Email"
            value={settings.emailVisibility}
            onChange={(v) => setSettings({ ...settings, emailVisibility: v })}
            icon={Mail}
            options={['PUBLIC', 'CONTACTS', 'INSTITUTIONS', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Téléphone"
            value={settings.phoneVisibility}
            onChange={(v) => setSettings({ ...settings, phoneVisibility: v })}
            icon={Smartphone}
            options={['PUBLIC', 'CONTACTS', 'INSTITUTIONS', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Sites web"
            value={settings.websitesVisibility}
            onChange={(v) => setSettings({ ...settings, websitesVisibility: v })}
            icon={Globe}
            options={['PUBLIC', 'PRIVATE']}
          />
        </div>

        {/* Professional Information */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Informations professionnelles
          </h2>
          
          <PrivacyOption
            label="Compétences"
            value={settings.skillsVisibility}
            onChange={(v) => setSettings({ ...settings, skillsVisibility: v })}
            icon={Shield}
            options={['PUBLIC', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Certifications"
            value={settings.certificationsVisibility}
            onChange={(v) => setSettings({ ...settings, certificationsVisibility: v })}
            icon={Shield}
            options={['PUBLIC', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Langues"
            value={settings.languagesVisibility}
            onChange={(v) => setSettings({ ...settings, languagesVisibility: v })}
            icon={Globe}
            options={['PUBLIC', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Disponibilité"
            value={settings.availabilityVisibility}
            onChange={(v) => setSettings({ ...settings, availabilityVisibility: v })}
            icon={Clock}
            options={['PUBLIC', 'CONTACTS', 'PRIVATE']}
          />
        </div>

        {/* Content */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Contenu
          </h2>
          
          <PrivacyOption
            label="Vidéos"
            value={settings.videosVisibility}
            onChange={(v) => setSettings({ ...settings, videosVisibility: v })}
            icon={Play}
            options={['PUBLIC', 'SUBSCRIBERS', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Événements"
            value={settings.eventsVisibility}
            onChange={(v) => setSettings({ ...settings, eventsVisibility: v })}
            icon={Calendar}
            options={['PUBLIC', 'SUBSCRIBERS', 'PRIVATE']}
          />
          
          <PrivacyOption
            label="Activité récente"
            value={settings.activityVisibility}
            onChange={(v) => setSettings({ ...settings, activityVisibility: v })}
            icon={TrendingUp}
            options={['PUBLIC', 'SUBSCRIBERS', 'PRIVATE']}
          />
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent">
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center ${
              message.type === 'success' 
                ? resolvedTheme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                : resolvedTheme === 'dark' ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
              saving
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
