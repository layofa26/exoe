import React, { useState, useRef, useEffect } from 'react'
import {
  Check, CheckCheck, Star, Reply, Copy, Edit2,
  Trash2, Forward, Flag, ChevronDown, Smile
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
  reactions?: Record<string, string[]> // emoji -> userIds
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
  onJumpToMessage?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
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

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

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
  onJumpToMessage,
  onReact,
}) => {
  const isDark = theme === 'dark'
  const [showMenu, setShowMenu] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showImageModal, setShowImageModal] = useState<string | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const reactionRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Touch swipe-to-reply state
  const touchStartX = useRef<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)

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

  // Swipe-to-reply on touch devices (WhatsApp mobile behavior)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(true)
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    if (diff > 10) {
      // Clear long-press if swiping
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      // Limit swipe distance max 70px
      setSwipeOffset(Math.min(diff * 0.7, 70))
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (swipeOffset > 45) {
      onReply(message)
    }
    setSwipeOffset(0)
    touchStartX.current = null
  }

  const handleQuickReaction = (emoji: string) => {
    setSelectedEmoji(prev => prev === emoji ? null : emoji)
    onReact?.(message.id, emoji)
    setShowReactionPicker(false)
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false)
      }
    }
    if (showMenu || showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu, showReactionPicker])

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
      id={`message-${message.id}`}
      className={`group relative flex items-end gap-2 px-2 sm:px-4 py-1 transition-all duration-200 select-none
        ${isMine ? 'flex-row-reverse' : 'flex-row'}
        ${isSelected ? (isDark ? 'bg-emerald-900/20' : 'bg-emerald-50/60') : 'hover:bg-black/[0.02]'}
      `}
      onClick={() => isSelectionMode && onSelect?.(message.id)}
      onDoubleClick={(e) => {
        if (!isSelectionMode) {
          e.stopPropagation()
          onReply(message)
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
        transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
      }}
    >
      {/* Swipe to reply icon indicator behind the bubble */}
      {swipeOffset > 15 && (
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform pointer-events-none"
          style={{ transform: `scale(${Math.min(swipeOffset / 45, 1)})` }}
        >
          <Reply size={16} />
        </div>
      )}

      {/* Selection checkbox */}
      {isSelectionMode && (
        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          ${isSelected ? 'bg-emerald-600 border-emerald-600' : (isDark ? 'border-slate-500' : 'border-slate-300')}`}>
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

      {/* Bubble + actions container */}
      <div className={`relative flex flex-col max-w-[85%] sm:max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>

        {/* ── 1. Image Bubble ── */}
        {imageUrl ? (
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 max-w-xs sm:max-w-sm group/bubble">
            <img
              src={imageUrl}
              alt="Image partagée"
              className="w-full h-auto max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setShowImageModal(imageUrl)}
            />
            {/* WhatsApp inline action dropdown trigger */}
            {!isSelectionMode && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v) }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover/bubble:opacity-100 transition-opacity"
                title="Options"
              >
                <ChevronDown size={14} />
              </button>
            )}
            <div className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
              <span>{formatTime(message.createdAt)}</span>
              {isMine && (message.read ? <CheckCheck size={11} className="text-cyan-300" /> : <Check size={11} className="text-white/80" />)}
            </div>
          </div>
        ) : docMatch ? (
          /* ── 2. Document / File Card ── */
          <div className={`relative p-3.5 rounded-2xl border shadow-lg w-full max-w-xs sm:max-w-sm group/bubble ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
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
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex-shrink-0 transition-colors"
              >
                Ouvrir
              </a>
            </div>
            {/* Inline Chevron */}
            {!isSelectionMode && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v) }}
                className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover/bubble:opacity-100 transition-opacity ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                title="Options"
              >
                <ChevronDown size={14} />
              </button>
            )}
            <div className="text-[10px] text-slate-400 mt-2 text-right">
              {formatTime(message.createdAt)}
            </div>
          </div>
        ) : proposalMatch ? (
          /* ── 3. Enhanced Professional Proposal / Quote Card ── */
          <div className={`relative p-4 rounded-2xl border shadow-2xl w-full max-w-sm sm:max-w-md group/bubble ${isDark ? 'bg-slate-900/95 border-emerald-500/40 text-white' : 'bg-white border-emerald-500/40 text-slate-900'}`}>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                💼 PROPOSITION & DEVIS PRO
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
                {!isSelectionMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v) }}
                    className="p-1 rounded-full opacity-0 group-hover/bubble:opacity-100 transition-opacity text-slate-400 hover:text-white"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
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
          /* ── 4. Event Card in Chat ── */
          <div className={`relative p-4 rounded-2xl border shadow-xl w-full max-w-sm group/bubble ${isDark ? 'bg-zinc-900 border-purple-500/40 text-white' : 'bg-white border-purple-500/40 text-zinc-900'}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 ${
                eventMatch[6] === 'true' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {eventMatch[6] === 'true' ? '🔴 EN DIRECT' : '📅 ÉVÉNEMENT'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400">{formatTime(message.createdAt)}</span>
                {!isSelectionMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v) }}
                    className="p-1 rounded-full opacity-0 group-hover/bubble:opacity-100 transition-opacity text-slate-400 hover:text-white"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
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
          /* ── 5. System Notification in Chat ── */
          <div className="w-full text-center my-1.5">
            <span className="inline-block px-3 py-1 rounded-full bg-zinc-800/90 text-zinc-300 text-[11px] font-medium border border-zinc-700/60 shadow-sm">
              ℹ️ {sysNotifMatch[1]}
            </span>
          </div>
        ) : (
          /* ── 6. Standard Text Bubble (WhatsApp Look & Feel) ── */
          <div
            className={`group/bubble relative px-3 py-2 shadow-sm transition-all duration-150
              ${isMine
                ? 'rounded-2xl rounded-tr-sm bg-emerald-600 text-white'
                : isDark
                  ? 'rounded-2xl rounded-tl-sm bg-slate-800 border border-slate-700/70 text-slate-100'
                  : 'rounded-2xl rounded-tl-sm bg-white border border-slate-200/80 text-slate-800 shadow-sm'
              }
            `}
          >
            {/* WhatsApp-Style Inline Dropdown Chevron in Top Right */}
            {!isSelectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(v => !v)
                }}
                className={`absolute top-1.5 right-1.5 p-1 rounded-full opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10
                  ${isMine
                    ? 'text-white/80 hover:text-white hover:bg-black/20'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                title="Options du message"
              >
                <ChevronDown size={14} />
              </button>
            )}

            {/* ── WhatsApp-Style Quoted Message Preview EMBEDDED inside the Bubble ── */}
            {message.replyPreview && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  if (message.replyToId && onJumpToMessage) {
                    onJumpToMessage(message.replyToId)
                  }
                }}
                className={`mb-2 px-2.5 py-1.5 rounded-lg border-l-[3.5px] cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] select-none
                  ${isMine
                    ? 'bg-black/20 border-l-white/90 text-white/95'
                    : isDark
                      ? 'bg-black/30 border-l-emerald-400 text-slate-200'
                      : 'bg-emerald-50 border-l-emerald-600 text-slate-800'
                  }`}
                title="Cliquer pour afficher le message d'origine"
              >
                <span className={`font-bold block truncate text-[11px] leading-tight ${isMine ? 'text-emerald-100' : 'text-emerald-500'}`}>
                  {message.replyPreview.senderName || (message.replyPreview as any).sender_name || 'Message'}
                </span>
                <span className="truncate block opacity-85 text-[12px] leading-snug mt-0.5" style={{ maxWidth: 280 }}>
                  {message.replyPreview.content}
                </span>
              </div>
            )}

            {/* Message Text Content */}
            <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap pr-4">
              {highlightText(displayContent, searchQuery)}
            </p>

            {/* Expand / Collapse Button for very long messages */}
            {isLong && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(v => !v) }}
                className={`text-xs font-bold mt-1 underline hover:no-underline block ${isMine ? 'text-emerald-100' : 'text-emerald-500'}`}
              >
                {isExpanded ? 'Voir moins' : 'Voir plus'}
              </button>
            )}

            {/* Metadata row (Time + Read receipt + Star + Edited) */}
            <div className={`flex items-center gap-1 mt-0.5 select-none ${isMine ? 'justify-end' : 'justify-start'}`}>
              {message.isImportant && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
              {message.isEdited && (
                <span className={`text-[10px] ${isMine ? 'text-emerald-200' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                  modifié
                </span>
              )}
              <span
                className={`text-[10px] cursor-default ${isMine ? 'text-emerald-100/90' : (isDark ? 'text-slate-400' : 'text-slate-400')}`}
                title={formatFullDate(message.createdAt)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {formatTime(message.createdAt)}
              </span>
              {isMine && (
                message.read
                  ? <CheckCheck size={13} className="text-cyan-200" />
                  : <Check size={13} className="text-emerald-200" />
              )}
            </div>

            {/* Full date tooltip on hover */}
            {showTooltip && (
              <div className={`absolute bottom-full mb-1.5 ${isMine ? 'right-0' : 'left-0'} z-50
                px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap shadow-xl pointer-events-none backdrop-blur-md
                ${isDark ? 'bg-slate-900/95 text-slate-200 border border-slate-700' : 'bg-white/95 text-slate-700 border border-slate-200 shadow-md'}`}>
                {formatFullDate(message.createdAt)}
              </div>
            )}
          </div>
        )}

        {/* ── Floating Reaction Bar (👍 ❤️ 😂 😮 😢 🙏) ── */}
        {showReactionPicker && (
          <div
            ref={reactionRef}
            className={`absolute -top-10 ${isMine ? 'right-0' : 'left-0'} z-50 flex items-center gap-1 px-2 py-1 rounded-full shadow-2xl border backdrop-blur-lg animate-in fade-in zoom-in duration-150
              ${isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}
          >
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation()
                  handleQuickReaction(emoji)
                }}
                className="text-base p-1 rounded-full hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Active Reaction Badge under bubble */}
        {selectedEmoji && (
          <div
            onClick={() => handleQuickReaction(selectedEmoji)}
            className={`-mt-2 ${isMine ? 'mr-2 self-end' : 'ml-2 self-start'} px-2 py-0.5 rounded-full text-xs font-semibold shadow-md border cursor-pointer hover:scale-105 transition-transform flex items-center gap-1
              ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            <span>{selectedEmoji}</span>
            <span className="text-[10px] text-emerald-500 font-bold">1</span>
          </div>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImageModal(null)}>
          <img src={showImageModal} alt="Plein écran" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* WhatsApp Context Menu Dropdown */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            ref={menuRef}
            className={`absolute z-50 w-52 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-xl animate-in fade-in duration-150
              ${isMine ? 'right-2' : 'left-2'} top-full mt-1
              ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}
          >
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  item.action()
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-left transition-colors
                  ${'danger' in item && item.danger
                    ? isDark
                      ? 'text-red-400 hover:bg-red-900/20'
                      : 'text-red-500 hover:bg-red-50'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <item.icon size={15} className="flex-shrink-0 opacity-80" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
