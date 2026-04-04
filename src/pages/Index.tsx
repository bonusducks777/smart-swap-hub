import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi-config';
import { ChainProvider } from '@/lib/chain-context';
import WalletConnect from '@/components/WalletConnect';
import ChainSelector from '@/components/ChainSelector';
import SwapTab from '@/components/tabs/SwapTab';
import SendTab from '@/components/tabs/SendTab';
import MerchantTab from '@/components/tabs/MerchantTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import { useChain } from '@/lib/chain-context';

const wagmiQueryClient = new QueryClient();

type Tab = 'swap' | 'send' | 'merchant' | 'settings';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'swap', icon: '🔄', label: 'Swap' },
  { id: 'send', icon: '📤', label: 'Send' },
  { id: 'merchant', icon: '🏪', label: 'Merchant' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState<Tab>('swap');
  const { activeChain } = useChain();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦄</span>
            <h1 className="text-xl font-bold gradient-text">UniSwap Dev Console</h1>
            {activeChain.id === 11155111 && (
              <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-full font-medium">TESTNET</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ChainSelector />
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="relative z-10 border-b border-border/30">
        <div className="container flex gap-1 py-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 container py-8">
        {activeTab === 'swap' && <SwapTab />}
        {activeTab === 'send' && <SendTab />}
        {activeTab === 'merchant' && <MerchantTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
};

const Index = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={wagmiQueryClient}>
      <ChainProvider>
        <DashboardContent />
      </ChainProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default Index;
