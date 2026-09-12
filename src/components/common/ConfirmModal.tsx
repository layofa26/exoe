import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  onConfirm: () => void
  onCancel?: () => void
  isAlert?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  onConfirm,
  onCancel,
  isAlert = false
}) => {
  const { resolvedTheme } = useTheme()

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-red-500 animate-pulse" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500/15 border-red-500/30'
      case 'warning':
        return 'bg-amber-500/15 border-amber-500/30'
      case 'success':
        return 'bg-emerald-500/15 border-emerald-500/30'
      default:
        return 'bg-blue-500/15 border-blue-500/30'
    }
  }

  const getConfirmBtnColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
    }
  }

  return (
    <div className="fixed inset-0 z-[200000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={"w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 " +
          (resolvedTheme === 'dark' ? 'bg-[#12161f] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900')
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className={"w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0 " + getIconBg()}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {title || (isAlert ? 'Information' : 'Confirmation requise')}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">EXILE Professional</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className={"p-1.5 rounded-xl transition-colors " +
                (resolvedTheme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500')
              }
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className={"text-sm leading-relaxed " + (resolvedTheme === 'dark' ? 'text-zinc-300' : 'text-slate-600')}>
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          {!isAlert && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={"px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors " +
                (resolvedTheme === 'dark' ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')
              }
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={"px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 " + getConfirmBtnColor()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
