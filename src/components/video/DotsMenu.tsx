import { useState, useEffect, useRef } from 'react';
import { DotsIcon, StarIcon, BellIcon, SaveIcon, FlagIcon, BlockIcon, ShareIcon, MessageCircleIcon } from '../icons/VideoIcons';

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const hKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', hKey);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', hKey); };
  }, [open]);

  const handleAction = (type: string) => {
    setOpen(false);
    switch(type) {
      case 'share':
        onShare?.();
        break;
      case 'save':
        onSave?.();
        break;
      case 'contact':
        onContact?.();
        break;
      case 'fav':
        show('Ajouté aux favoris ⭐');
        break;
      case 'bell':
        show('Notification activée 🔔');
        break;
    }
  };

  const items = [
    { icon: <ShareIcon />, label: 'Partager', action: () => handleAction('share') },
    { icon: <SaveIcon filled={saved} />, label: saved ? 'Retirer' : 'Enregistrer', action: () => handleAction('save') },
    { icon: <StarIcon />, label: 'Ajouter aux favoris', action: () => handleAction('fav') },
    { icon: <BellIcon />, label: "S'abonner aux alertes", action: () => handleAction('bell') },
    { icon: <MessageCircleIcon />, label: 'Contacter', action: () => handleAction('contact') },
  ];
  const danger = [
    { icon: <FlagIcon />, label: 'Signaler', msg: 'Contenu signalé. Merci.' },
    { icon: <BlockIcon />, label: "Bloquer l'utilisateur", msg: 'Utilisateur bloqué' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Plus d'options"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="w-4 h-4"><DotsIcon /></span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-[200] w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1">
          {items.map((item, i) => (
            <button key={i} role="menuitem" onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left">
              <span className="w-4 h-4 text-zinc-400 flex-shrink-0">{item.icon}</span>{item.label}
            </button>
          ))}
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
          {danger.map((item, i) => (
            <button key={i} role="menuitem" onClick={() => { show(item.msg); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left">
              <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
