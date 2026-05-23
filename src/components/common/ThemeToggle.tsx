import { useTheme } from '../../contexts/ThemeContext'
import { Moon, Sun, Monitor } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 bg-zinc-800/50 dark:bg-zinc-700/50 rounded-lg p-1">
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark' ? 'bg-zinc-700 dark:bg-zinc-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-300 dark:hover:text-zinc-200'
        }`}
        title="Mode sombre"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light' ? 'bg-zinc-700 dark:bg-zinc-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-300 dark:hover:text-zinc-200'
        }`}
        title="Mode clair"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('auto')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'auto' ? 'bg-zinc-700 dark:bg-zinc-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-300 dark:hover:text-zinc-200'
        }`}
        title="Mode automatique"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  )
}
