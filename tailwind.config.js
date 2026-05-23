/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EXILE Brand
        primary: '#1E40AF',      // Bleu institutionnel
        secondary: '#7C3AED',    // Violet créatif
        accent: '#F59E0B',       // Orange divertissement
        
        // Modules
        pro: '#059669',          // Vert Professional
        funny: '#EC4899',        // Rose Funny (future)
        social: '#2563EB',       // Bleu Social
        
        // States
        verified: '#10B981',     // Badge vérifié
        pending: '#F59E0B',      // En attente
        alert: '#EF4444',        // Alertes urgentes
        elite: '#FBBF24',        // Niveau Elite
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
