import { Briefcase, MapPin, Clock, CheckCircle, Share2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { JobOffer } from '../../types/social/recruitment'

interface JobCardProps {
  job: JobOffer
  onApply?: () => void
  onShare?: () => void
}

export const JobCard = ({ job, onApply, onShare }: JobCardProps): JSX.Element => {
  const { resolvedTheme } = useTheme()

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'full-time': return resolvedTheme === 'dark' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
      case 'part-time': return resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
      case 'contract': return resolvedTheme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
      case 'internship': return resolvedTheme === 'dark' ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
      default: return resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'full-time': return 'Temps plein'
      case 'part-time': return 'Temps partiel'
      case 'contract': return 'Contrat'
      case 'internship': return 'Stage'
      default: return type
    }
  }

  return (
    <div className={`${resolvedTheme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl p-4 sm:p-6 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        {/* Icon */}
        <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0 ${resolvedTheme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Institution */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className={`font-semibold text-xs sm:text-sm md:text-base ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {job.institution.name}
            </span>
            {job.institution.verified && (
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            )}
            {job.isBoosted && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-social/20 text-social text-[10px] sm:text-xs font-medium rounded-full">
                Boosté
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-sm sm:text-base md:text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 sm:mb-2`}>
            {job.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              {job.location}
            </div>
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs md:text-sm ${resolvedTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              {job.postedAt}
            </div>
          </div>

          {/* Type Badge */}
          <div className="mb-2 sm:mb-3">
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getTypeColor(job.type)}`}>
              {getTypeLabel(job.type)}
            </span>
          </div>

          {/* Salary */}
          {job.salary && (
            <div className={`text-xs sm:text-sm font-medium ${resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-gray-700'} mb-2 sm:mb-3`}>
              {job.salary.currency} {job.salary.min?.toLocaleString()} - {job.salary.max?.toLocaleString()}
            </div>
          )}

          {/* Applications */}
          <div className={`text-[10px] sm:text-xs ${resolvedTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
            {job.applications} candidatures
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 pt-3 sm:pt-4 border-t ${resolvedTheme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
        <button
          onClick={onApply}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-social text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-medium hover:bg-social/90 transition-colors"
        >
          Postuler
        </button>
        <button
          onClick={onShare}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium ${
            resolvedTheme === 'dark'
              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition-colors`}
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Partager
        </button>
      </div>
    </div>
  )
}

export default JobCard
