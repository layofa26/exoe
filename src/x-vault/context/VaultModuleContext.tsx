import React, { createContext, useContext, useState } from 'react';
import { ActiveModule } from '../types/vault';

interface VaultModuleContextType {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
}

const VaultModuleContext = createContext<VaultModuleContextType | undefined>(undefined);

export const VaultModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('pro');

  return (
    <VaultModuleContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </VaultModuleContext.Provider>
  );
};

export const useVaultModule = () => {
  const context = useContext(VaultModuleContext);
  if (!context) {
    throw new Error('useVaultModule must be used within a VaultModuleProvider');
  }
  return context;
};
