import { useAccount } from 'wagmi';
import { useTokenBalances } from '@/hooks/useTokenBalances';

const MerchantTab = () => {
  const { isConnected, address } = useAccount();
  const { balances, isLoading } = useTokenBalances();

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-slide-up">
      {/* Wallet Holdings */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Wallet Holdings (Sepolia)</h3>
        {!isConnected ? (
          <p className="text-sm text-muted-foreground">Connect wallet to view balances</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading balances…</p>
        ) : (
          <div className="space-y-2">
            {balances.map(b => (
              <div key={b.symbol} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                <span className="text-sm font-medium text-foreground">{b.symbol}</span>
                <span className="text-sm font-mono text-foreground">{b.formatted}</span>
              </div>
            ))}
            {balances.length === 0 && (
              <p className="text-xs text-muted-foreground">No token balances found</p>
            )}
          </div>
        )}
      </div>

      {/* Merchant concept explanation */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Merchant Auto-Conversion</h3>
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning space-y-2">
          <p className="font-medium">⚠️ Not functional on testnet</p>
          <p>
            A real merchant dashboard requires a backend to monitor incoming transactions and auto-swap received tokens via Uniswap.
            This would need:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>An indexer/webhook to detect incoming ERC-20 transfers</li>
            <li>Backend service to execute auto-swaps via Uniswap</li>
            <li>UniswapX integration for MEV-protected settlement</li>
            <li>Multi-chain support with bridge protocol integration</li>
          </ul>
        </div>
      </div>

      {/* Concept cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="text-xl mb-2">💱</div>
          <h4 className="text-sm font-semibold text-foreground">Auto-Settle</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Receive any token → auto-swap to your preferred stablecoin. Requires backend with Uniswap routing.
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xl mb-2">📊</div>
          <h4 className="text-sm font-semibold text-foreground">Inventory-Aware</h4>
          <p className="text-xs text-muted-foreground mt-1">
            If USDC liquidity drops, temporarily accept DAI. Needs real-time liquidity monitoring.
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xl mb-2">🛡️</div>
          <h4 className="text-sm font-semibold text-foreground">MEV Protected</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Use UniswapX private order flow for settlement. Prevents sandwich attacks on auto-swaps.
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xl mb-2">🌐</div>
          <h4 className="text-sm font-semibold text-foreground">Multi-Chain</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Accept payments on any chain. Requires bridge protocol integration (e.g. Across, Stargate).
          </p>
        </div>
      </div>

      {isConnected && address && (
        <div className="glass rounded-xl p-3">
          <div className="text-xs text-muted-foreground">
            Merchant address: <span className="font-mono text-foreground">{address}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantTab;
