import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { SUPPORTED_CHAINS, type ChainConfig } from '@/lib/tokens';

interface ChainContextValue {
  activeChain: ChainConfig;
  setActiveChain: (chain: ChainConfig) => void;
  switchToChain: (chainId: number) => void;
}

const ChainContext = createContext<ChainContextValue>({
  activeChain: SUPPORTED_CHAINS[0],
  setActiveChain: () => {},
  switchToChain: () => {},
});

export function ChainProvider({ children }: { children: ReactNode }) {
  const [activeChain, setActiveChain] = useState<ChainConfig>(SUPPORTED_CHAINS[0]);
  const { switchChain } = useSwitchChain();

  const switchToChain = (chainId: number) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (chain) {
      setActiveChain(chain);
      try {
        switchChain({ chainId });
      } catch {
        // User may reject the switch
      }
    }
  };

  return (
    <ChainContext.Provider value={{ activeChain, setActiveChain: (c) => { setActiveChain(c); switchToChain(c.id); }, switchToChain }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  return useContext(ChainContext);
}
