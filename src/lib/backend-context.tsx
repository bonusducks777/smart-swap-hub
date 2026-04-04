import { createContext, useContext, useState, type ReactNode } from 'react';

export type BackendMode = 'onchain' | 'api';

interface BackendContextType {
  mode: BackendMode;
  setMode: (mode: BackendMode) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  hasApiKey: boolean;
}

const BackendContext = createContext<BackendContextType | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<BackendMode>('onchain');
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem('uniswap_api_key') || '');

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('uniswap_api_key', key);
  };

  return (
    <BackendContext.Provider value={{ mode, setMode, apiKey, setApiKey, hasApiKey: apiKey.length > 0 }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackendMode() {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error('useBackendMode must be used within BackendProvider');
  return ctx;
}
