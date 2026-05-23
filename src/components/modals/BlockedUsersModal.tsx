import { X, Shield, Unlock, UserX, Clock } from 'lucide-react'
import type { BlockedUser } from '../../types/requests'

interface BlockedUsersModalProps {
  isOpen: boolean
  onClose: () => void
  blockedUsers: BlockedUser[]
  onUnblock: (blockedUserId: string) => void
}

export const BlockedUsersModal = ({ 
  isOpen, 
  onClose, 
  blockedUsers, 
  onUnblock 
}: BlockedUsersModalProps) => {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Utilisateurs bloqués
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {blockedUsers.length} {blockedUsers.length > 1 ? 'bloqués' : 'bloqué'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                Aucun utilisateur bloqué
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 max-w-xs mx-auto">
                Les utilisateurs bloqués ne pourront plus vous contacter ni vous envoyer de demandes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {user.userName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {user.userName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Bloqué le {formatDate(user.blockedAt)}</span>
                    </div>
                    {user.reason && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                        Raison: {user.reason}
                      </p>
                    )}
                  </div>

                  {/* Unblock Button */}
                  <button
                    onClick={() => onUnblock(user.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-700 hover:text-green-700 dark:hover:text-green-400 transition-all flex-shrink-0"
                  >
                    <Unlock className="w-4 h-4" />
                    <span className="hidden sm:inline">Débloquer</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
            <UserX className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Les utilisateurs bloqués ne peuvent pas vous envoyer de demandes de contact ni vous contacter. 
              Vous pouvez les débloquer à tout moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
