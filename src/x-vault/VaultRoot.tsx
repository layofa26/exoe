import React, { useState } from 'react';
import { VaultAuthProvider, useVaultAuth } from './context/VaultAuthContext';
import { VaultModuleProvider, useVaultModule } from './context/VaultModuleContext';
import { VaultBasicGate } from './pages/VaultBasicGate';
import { VaultLockScreen } from './pages/VaultLockScreen';
import { VaultSidebar, VaultTab } from './components/layout/VaultSidebar';
import { VaultNavbar } from './components/layout/VaultNavbar';

// Sections
import { VaultErrorBoundary } from './components/common/VaultErrorBoundary';
import { VaultOverview } from './pages/VaultOverview';
import { UsersSection } from './pages/sections/UsersSection';
import { AnalyticsSection } from './pages/sections/AnalyticsSection';
import { ContentSection } from './pages/sections/ContentSection';
import { ModerationSection } from './pages/sections/ModerationSection';
import { MonetizationSection } from './pages/sections/MonetizationSection';
import { NotificationsSection } from './pages/sections/NotificationsSection';
import { SettingsSection } from './pages/sections/SettingsSection';
import { TrashSection } from './pages/sections/TrashSection';

const Stealth404: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 text-center">
    <h1 className="text-6xl font-extrabold text-slate-700 dark:text-slate-300 font-mono mb-2">404</h1>
    <p className="text-base text-slate-500 dark:text-slate-400">Page non trouvée ou ressource inaccessible.</p>
    <a href="/" className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">
      Retour à l'accueil
    </a>
  </div>
);

const VAULT_USER = 'mb#66:';
const VAULT_PASS = 'xV@9#mK2?/m';

const VaultInnerApp: React.FC = () => {
  const { isAuthenticated } = useVaultAuth();
  const { activeModule } = useVaultModule();
  const [authorized, setAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem('vault_basic') === 'true';
  });
  const [currentTab, setCurrentTab] = useState<VaultTab>('overview');

  // 3. HTTP Basic Auth anvan PIN (prompt natif navigatè a)
  React.useEffect(() => {
    const credentials = sessionStorage.getItem('vault_basic');
    
    if (!credentials) {
      // Prompt natif
      const user = window.prompt('Utilisateur :');
      const pass = window.prompt('Mot de passe :');
      
      const isMatch = 
        (user === VAULT_USER && pass === VAULT_PASS) ||
        (user === 'exile_commander' && pass === 'CHANGE_ME_VAULT_2026');

      if (isMatch) {
        sessionStorage.setItem('vault_basic', 'true');
        setAuthorized(true);
      } else {
        window.location.href = '/';
      }
    } else {
      setAuthorized(true);
    }
  }, []);

  // Si pa otorize nan Basic Auth, pa afiche anyen nan paj la
  if (!authorized) return null;

  // 2e KOUCH : Ekran PIN sekirite
  if (!isAuthenticated) {
    return <VaultLockScreen />;
  }

  // 3. KOUCH 3: Dashboard X-Vault
  const renderSection = () => {
    // Si nou sou modil social, pa afiche anyen (se itilizatè a k ap di kisa pou mete)
    if (activeModule === 'social') {
      return null;
    }

    switch (currentTab) {
      case 'overview':
        return <VaultOverview onNavigateTab={setCurrentTab} />;
      case 'users':
        return <UsersSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'content':
        return <ContentSection />;
      case 'moderation':
        return <ModerationSection />;
      case 'monetization':
        return <MonetizationSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'settings':
        return <SettingsSection />;
      case 'trash':
        return activeModule === 'pro' ? <TrashSection /> : null;
      default:
        return <VaultOverview onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <VaultSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <VaultNavbar />
        
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/90 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <VaultErrorBoundary key={currentTab}>
              {renderSection()}
            </VaultErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export const VaultRoot: React.FC = () => {
  return (
    <VaultAuthProvider>
      <VaultModuleProvider>
        <VaultInnerApp />
      </VaultModuleProvider>
    </VaultAuthProvider>
  );
};

export default VaultRoot;
