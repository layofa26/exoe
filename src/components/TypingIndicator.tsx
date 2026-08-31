import React from 'react'

interface TypingIndicatorProps {
  username: string
  theme: 'dark' | 'light'
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username, theme }) => {
  const isDark = theme === 'dark'

  return (
    <div className="flex items-end gap-2 px-4 py-1 animate-fade-in">
      {/* Avatar placeholder */}
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
          ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}
      >
        {username.charAt(0).toUpperCase()}
      </div>

      {/* Bubble */}
      <div
        className={`flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm
          ${isDark
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-slate-200 shadow-md'}`}
      >
        <span
          className={`text-xs mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {username}
        </span>
        {/* Three animated dots */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full inline-block ${isDark ? 'bg-violet-400' : 'bg-violet-500'}`}
            style={{
              animation: 'typingBounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
