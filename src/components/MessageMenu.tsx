import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Copy, Star, StarOff, Flag, Reply, Forward } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MessageMenuProps {
  messageId: string;
  isOwnMessage: boolean;
  isImportant: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onToggleImportant?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  content?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

const MessageMenu: React.FC<MessageMenuProps> = ({
  messageId,
  isOwnMessage,
  isImportant,
  onEdit,
  onReply,
  onForward,
  onDelete,
  onCopy,
  onToggleImportant,
  onReport,
  content = '',
  canEdit = true,
  canDelete = true,
}) => {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (onCopy && content) {
      onCopy(content);
      navigator.clipboard.writeText(content);
    }
    setIsOpen(false);
  };

  const handleEdit = () => {
    if (onEdit && content) {
      onEdit(messageId, content);
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(messageId);
    }
    setIsOpen(false);
  };

  const handleReply = () => {
    if (onReply) {
      onReply(messageId);
    }
    setIsOpen(false);
  };

  const handleForward = () => {
    if (onForward) {
      onForward(messageId);
    }
    setIsOpen(false);
  };

  const handleToggleImportant = () => {
    if (onToggleImportant) {
      onToggleImportant(messageId);
    }
    setIsOpen(false);
  };

  const handleReport = () => {
    if (onReport) {
      onReport(messageId);
    }
    setIsOpen(false);
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full hover:opacity-70 transition-opacity ${
          isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-50 ${
            isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="py-1">
            {onReply && (
              <button
                onClick={handleReply}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                  isDark
                    ? 'text-zinc-300 hover:bg-zinc-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Reply size={16} />
                <span>Répondre</span>
              </button>
            )}

            {onForward && (
              <button
                onClick={handleForward}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                  isDark
                    ? 'text-zinc-300 hover:bg-zinc-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Forward size={16} />
                <span>Transférer</span>
              </button>
            )}

            {onCopy && content && (
              <button
                onClick={handleCopy}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                  isDark
                    ? 'text-zinc-300 hover:bg-zinc-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Copy size={16} />
                <span>Copier</span>
              </button>
            )}

            {onToggleImportant && (
              <button
                onClick={handleToggleImportant}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                  isDark
                    ? 'text-zinc-300 hover:bg-zinc-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isImportant ? <StarOff size={16} /> : <Star size={16} />}
                <span>{isImportant ? 'Retirer des importants' : 'Marquer important'}</span>
              </button>
            )}

            {isOwnMessage && canEdit && onEdit && (
              <button
                onClick={handleEdit}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                  isDark
                    ? 'text-zinc-300 hover:bg-zinc-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Edit size={16} />
                <span>Modifier</span>
              </button>
            )}

            {isOwnMessage && canDelete && onDelete && (
              <button
                onClick={handleDelete}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                  isDark
                    ? 'text-red-400 hover:bg-zinc-700'
                    : 'text-red-600 hover:bg-gray-100'
                }`}
              >
                <Trash2 size={16} />
                <span>Supprimer</span>
              </button>
            )}

            {!isOwnMessage && onReport && (
              <button
                onClick={handleReport}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 ${
                  isDark
                    ? 'text-red-400 hover:bg-zinc-700'
                    : 'text-red-600 hover:bg-gray-100'
                }`}
              >
                <Flag size={16} />
                <span>Signaler</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageMenu;
