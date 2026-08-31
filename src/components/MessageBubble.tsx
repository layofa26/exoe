import React, { useState, useRef } from 'react'
import {
  Check, CheckCheck, Star, Reply, Copy, Edit2,
  Trash2, Forward, Flag, MoreVertical
} from 'lucide-react'

export interface MessageBubbleData {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderUsername?: string
  createdAt: string
  read: boolean
  isImportant?: boolean
  isEdited?: boolean
  replyToId?: string
  replyPreview?: { senderName: string; content: string }
}

interface MessageBubbleProps {
  message: MessageBubbleData
  isMine: boolean
  theme: 'dark' | 'light'
  isSelected?: boolean
  isSelectionMode?: boolean
  searchQuery?: string
  onReply: (msg: MessageBubbleData) => void
  onCopy: (content: string) => void
  onEdit?: (msg: MessageBubbleData) => void
  onDeleteForMe: (id: string) => void
  onDeleteForAll: (id: string) => void
  onToggleImportant: (id: string) => void
  onForward: (msg: MessageBubbleData) => void
  onReport: (id: string) => void
  onSelect?: (id: string) => void
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-400/80 text-yellow-900 rounded px-0.5">{part}</mark>
      : part
  )
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatFullDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return ''
  }
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  theme,
  isSelected = false,
  isSelectionMode = false,
  searchQuery = '',
  onReply,
  onCopy,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
  onToggleImportant,
  onForward,
  onReport,
  onSelect,
}) => {
  const isDark = theme === 'dark'
  const [showMenu, setShowMenu] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showImageModal, setShowImageModal] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect image in message content
  const imageMatch = message.content.match(/^\[image:(.*?)\]$/) || (message.content.startsWith('data:image/') ? [null, message.content] : null)
  const imageUrl = imageMatch ? imageMatch[1] : null

  // Detect document: [document:FileName|FileSize|DataUrl]
  const docMatch = message.content.match(/^\[document:(.*?)\|(.*?)\|(.*?)\]$/)

  // Detect Pro Proposal: [pro_proposal:Title|Amount|Duration|Acompte|Description] or [pro_proposal:Title|Amount|Duration|Description]
  const proposalMatch = message.content.match(/^\[pro_proposal:(.*?)\|(.*?)\|(.*?)\|(.*?)(?:\|(.*?))?\]$/)

  // Detect Event Card: [event_card:Title|Date|Time|Location|ParticipantsCount|IsLive|EventId]
  const eventMatch = message.content.match(/^\[event_card:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)(?:\|(.*?))?\]$/)

  // Detect System Notification: [system_notif:Message]
  const sysNotifMatch = message.content.match(/^\[system_notif:(.*?)\]$/)

  // Long text threshold
  const isLong = message.content.length > 240 && !imageUrl && !docMatch && !proposalMatch && !eventMatch && !sysNotifMatch
  const displayContent = isLong && !isExpanded ? message.content.slice(0, 240) + '...' : message.content

  // Long-press for mobile context menu
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500)
  }
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const menuItems = [
    { icon: Reply, label: 'Répondre', action: () => { onReply(message); setShowMenu(false) } },
    { icon: Copy, label: 'Copier', action: () => { onCopy(message.content); setShowMenu(false) } },
    ...(isMine ? [{ icon: Edit2, label: 'Modifier', action: () => { onEdit?.(message); setShowMenu(false) } }] : []),
    { icon: Star, label: message.isImportant ? 'Retirer ⭐' : 'Marquer ⭐', action: () => { onToggleImportant(message.id); setShowMenu(false) } },
    { icon: Forward, label: 'Transférer', action: () => { onForward(message); setShowMenu(false) } },
    ...(isMine ? [
      { icon: Trash2, label: 'Supprimer pour moi', action: () => { onDeleteForMe(message.id); setShowMenu(false) }, danger: true },
      { icon: Trash2, label: 'Supprimer pour tous', action: () => { onDeleteForAll(message.id); setShowMenu(false) }, danger: true },
    ] : [
      { icon: Flag, label: 'Signaler', action: () => { onReport(message.id); setShowMenu(false) }, danger: true },
    ]),
  ]

  return (
    <div
      className={`group flex items-end gap-2 px-2 sm:px-4 py-1 transition-colors duration-150
        ${isMine ? 'flex-row-reverse' : 'flex-row'}
        ${isSelected ? (isDark ? 'bg-violet-900/30' : 'bg-violet-50') : 'hover:bg-black/5'}
      `}
      onClick={() => isSelectionMode && onSelect?.(message.id)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ animationDuration: '120ms' }}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          ${isSelected ? 'bg-violet-600 border-violet-600' : (isDark ? 'border-slate-500' : 'border-slate-300')}`}>
          {isSelected && <Check size={11} className="text-white" />}
        </div>
      )}

      {/* Avatar (for received messages) */}
      {!isMine && (
        <div className="flex-shrink-0 mb-1">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              ${isDark ? 'bg-gradient-to-br from-emerald-700 to-teal-900 text-white' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'}`}>
              {(message.senderUsername || message.senderName || 'U').replace(/^@/, '').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Bubble + actions */}
      <div className={`relative flex flex-col max-w-[85%] sm:max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>

        {/* Reply preview */}
        {message.replyPreview && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-4 border-violet-500 text-xs max-w-full
            ${isDark ? 'bg-slate-800/70 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            <span className="font-semibold text-violet-400 block">{message.replyPreview.senderName}</span>
            <span className="truncate block" style={{ maxWidth: 220 }}>{message.replyPreview.content}</span>
          </div>
        )}

        {/* ── 1. Image Bubble ── */}
        {imageUrl ? (
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 max-w-xs sm:max-w-sm">
            <img
              src={imageUrl}
              alt="Image partagée"
              className="w-full h-auto max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setShowImageModal(imageUrl)}
            />
            <div className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
              <span>{formatTime(message.createdAt)}</span>
              {isMine && (message.read ? <CheckCheck size={11} className="text-cyan-300" /> : <Check size={11} className="text-white/80" />)}
            </div>
          </div>
        ) : docMatch ? (
          /* ── 2. Document / File Card ── */
          <div className={`p-3.5 rounded-2xl border shadow-lg w-full max-w-xs sm:max-w-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                📄
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate">{docMatch[1]}</p>
                <p className="text-[10px] text-slate-400">{docMatch[2]} · Document</p>
              </div>
              <a
                href={docMatch[3]}
                download={docMatch[1]}
                className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex-shrink-0 transition-colors"
              >
                Ouvrir
              </a>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-right">
              {formatTime(message.createdAt)}
            </div>
          </div>
        ) : proposalMatch ? (
          /* ── 3. Enhanced Professional Proposal / Quote Card ── */
          <div className={`p-4 rounded-2xl border shadow-2xl w-full max-w-sm sm:max-w-md ${isDark ? 'bg-slate-900/95 border-emerald-500/40 text-white' : 'bg-white border-emerald-500/40 text-slate-900'}`}>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                💼 PROPOSITION & DEVIS PRO
              </span>
              <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
            </div>

            <h4 className="font-bold text-sm sm:text-base leading-snug mb-2 text-emerald-400">
              {proposalMatch[1]}
            </h4>

            {/* Price badge */}
            <div className="flex items-baseline justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 my-2">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Montant convenu</span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">{proposalMatch[2]}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Délai estimé</span>
                <span className="text-xs font-bold text-slate-200">{proposalMatch[3]}</span>
              </div>
            </div>

            {/* Terms & Description */}
            <p className="text-xs leading-relaxed text-slate-300 my-2.5 p-2.5 rounded-xl bg-black/10 border border-white/5">
              {proposalMatch[5] || proposalMatch[4]}
            </p>

            {proposalMatch[5] && (
              <p className="text-[11px] text-slate-400 mb-3">
                <span className="font-semibold text-slate-300">Conditions de paiement:</span> {proposalMatch[4]}
              </p>
            )}

            {!isMine && (
              <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => onReply({ ...message, content: `✅ J'accepte votre proposition de ${proposalMatch[2]} pour "${proposalMatch[1]}". Marché conclu !` })}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-105 text-white shadow-md transition-all"
                >
                  Accepter & Valider
                </button>
                <button
                  onClick={() => onReply({ ...message, content: `❌ Je souhaite ajuster certains points du devis "${proposalMatch[1]}"` })}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Négocier
                </button>
              </div>
            )}
          </div>
        ) : eventMatch ? (
          /* ── 4. Event Card in Chat (Items 37-40) ── */
          <div className={`p-4 rounded-2xl border shadow-xl w-full max-w-sm ${isDark ? 'bg-zinc-900 border-purple-500/40 text-white' : 'bg-white border-purple-500/40 text-zinc-900'}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 ${
                eventMatch[6] === 'true' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {eventMatch[6] === 'true' ? '🔴 EN DIRECT' : '📅 ÉVÉNEMENT'}
              </span>
              <span className="text-[10px] text-zinc-400">{formatTime(message.createdAt)}</span>
            </div>

            <h4 className="font-bold text-sm sm:text-base leading-snug mb-2 text-white">
              {eventMatch[1]}
            </h4>

            <div className="space-y-1.5 text-xs text-zinc-300 my-2.5 p-3 rounded-xl bg-black/20 border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-semibold">📅 Date:</span>
                <span>{eventMatch[2]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-semibold">🕒 Heure:</span>
                <span>{eventMatch[3]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-semibold">📍 Lieu:</span>
                <span>{eventMatch[4]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-semibold">👥 Participants:</span>
                <span>{eventMatch[5]} inscrits</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
              {eventMatch[6] === 'true' ? (
                <a
                  href={`/pro/events/${eventMatch[7] || 'evt_1'}/live`}
                  className="flex-1 py-2 text-center rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all animate-pulse"
                >
                  ▶ Rejoindre maintenant
                </a>
              ) : (
                <button
                  onClick={() => onReply({ ...message, content: `🔔 Rappel activé pour l'événement "${eventMatch[1]}"` })}
                  className="flex-1 py-2 text-center rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all"
                >
                  🔔 Rappelle-moi
                </button>
              )}
            </div>
          </div>
        ) : sysNotifMatch ? (
          /* ── 5. System Notification in Chat (Item 40) ── */
          <div className="w-full text-center my-1.5">
            <span className="inline-block px-3 py-1 rounded-full bg-zinc-800/90 text-zinc-300 text-[11px] font-medium border border-zinc-700/60 shadow-sm">
              ℹ️ {sysNotifMatch[1]}
            </span>
          </div>
        ) : (
          /* ── 3. Standard Text Bubble (with Voir Plus / Voir Moins) ── */
          <div
            className={`relative px-4 py-2.5 shadow-md
              ${isMine
                ? 'rounded-2xl rounded-br-sm bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                : isDark
                  ? 'rounded-2xl rounded-bl-sm bg-slate-800 border border-slate-700 text-slate-100'
                  : 'rounded-2xl rounded-bl-sm bg-white border border-slate-200 text-slate-800 shadow-md'
              }
            `}
            onMouseEnter={() => !isSelectionMode && setShowMenu(false)}
          >
            {/* Content */}
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {highlightText(displayContent, searchQuery)}
            </p>

            {/* Expand / Collapse Button */}
            {isLong && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(v => !v) }}
                className={`text-xs font-bold mt-1 underline hover:no-underline block ${isMine ? 'text-white' : 'text-emerald-400'}`}
              >
                {isExpanded ? 'Voir moins' : 'Voir plus'}
              </button>
            )}

            {/* Metadata row */}
            <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {message.isImportant && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
              {message.isEdited && (
                <span className={`text-[10px] ${isMine ? 'text-emerald-200' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                  modifié
                </span>
              )}
              <span
                className={`text-[10px] cursor-default select-none ${isMine ? 'text-emerald-200' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}
                title={formatFullDate(message.createdAt)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {formatTime(message.createdAt)}
              </span>
              {isMine && (
                message.read
                  ? <CheckCheck size={12} className="text-cyan-200" />
                  : <Check size={12} className="text-emerald-200" />
              )}
            </div>

            {/* Full date tooltip */}
            {showTooltip && (
              <div className={`absolute bottom-full mb-1 ${isMine ? 'right-0' : 'left-0'} z-50
                px-2 py-1 rounded-lg text-[11px] whitespace-nowrap shadow-lg pointer-events-none
                ${isDark ? 'bg-slate-900 text-slate-300 border border-slate-700' : 'bg-white text-slate-600 border border-slate-200 shadow-md'}`}>
                {formatFullDate(message.createdAt)}
              </div>
            )}
          </div>
        )}

        {/* Hover action bar (desktop) */}
        {!isSelectionMode && (
          <div className={`absolute top-0 ${isMine ? 'right-full mr-1' : 'left-full ml-1'}
            hidden group-hover:flex items-center gap-0.5 z-10`}>
            <button
              onClick={() => onReply(message)}
              className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-slate-700 hover:bg-emerald-700 text-slate-300' : 'bg-white hover:bg-emerald-50 text-slate-500 shadow-sm border border-slate-200'}`}
              title="Répondre"
            >
              <Reply size={13} />
            </button>
            <button
              onClick={() => setShowMenu(v => !v)}
              className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-slate-700 hover:bg-emerald-700 text-slate-300' : 'bg-white hover:bg-emerald-50 text-slate-500 shadow-sm border border-slate-200'}`}
              title="Plus d'actions"
            >
              <MoreVertical size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImageModal(null)}>
          <img src={showImageModal} alt="Plein écran" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Context Menu Dropdown */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            ref={menuRef}
            className={`absolute z-50 w-52 rounded-xl shadow-2xl border overflow-hidden
              ${isMine ? 'right-0' : 'left-0'} top-full mt-1
              ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                  ${'danger' in item && item.danger
                    ? isDark
                      ? 'text-red-400 hover:bg-red-900/20'
                      : 'text-red-500 hover:bg-red-50'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <item.icon size={15} className="flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
