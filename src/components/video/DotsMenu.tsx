import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { DotsIcon, StarIcon, SaveIcon, FlagIcon, ShareIcon, MessageCircleIcon } from '../icons/VideoIcons';

interface DotsMenuProps {
  videoId: string;
  authorId: string;
  show: (m: string) => void;
  saved?: boolean;
  onSave?: () => void;
  onShare?: () => void;
  onContact?: () => void;
}

export function DotsMenu({ videoId, authorId, show, saved = false, onSave, onShare, onContact }: DotsMenuProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const menuHeight = 220;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < menuHeight && rect.top > spaceBelow;
        setPos({
          top: openUpwards ? Math.max(8, rect.top - menuHeight) : rect.bottom + 6,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      }
    };
    updatePos();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (buttonRef.current && buttonRef.current.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open]);

  const handleAction = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    switch(type) {
      case 'contact':
        onContact?.();
        break;
      case 'share':
        onShare?.();
        break;
      case 'fav':
        onSave?.();
        break;
      case 'flag':
        show('Contenu signalé. Merci.');
        break;
    }
  };

  const items = [
    { icon: <MessageCircleIcon />, label: 'Contacter', type: 'contact' },
    { icon: <ShareIcon />, label: 'Partager', type: 'share' },
    { icon: <StarIcon />, label: saved ? 'Retirer des favoris' : 'Ajouter aux favoris', type: 'fav' },
    { icon: <FlagIcon />, label: 'Signaler', type: 'flag' },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        aria-label="Plus d'options"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
          isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
        }`}
      >
        <span className="w-4 h-4"><DotsIcon /></span>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            zIndex: 99999,
          }}
          className={`w-52 rounded-xl shadow-2xl overflow-hidden py-1 border animate-in fade-in zoom-in-95 duration-100 ${
            isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => handleAction(e, item.type)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left cursor-pointer ${
                isDark ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              <span className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
