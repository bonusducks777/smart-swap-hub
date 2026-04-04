import { useState } from 'react';
import { useAccount } from 'wagmi';
import { SEPOLIA_TOKENS, type Token } from '@/lib/tokens';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type RouteMode = 'cheapest' | 'fastest' | 'safe' | 'crosschain';

const ROUTE_MODES: { id: RouteMode; icon: string; label: string; desc: string }[] = [
  { id: 'cheapest', icon: '💸', label: 'Save Money', desc: 'Best price, may take longer' },
  { id: 'fastest', icon: '⚡', label: 'Instant', desc: 'Fastest execution' },
  { id: 'safe', icon: '🛡', label: 'Safe', desc: 'Protected from MEV' },
  { id: 'crosschain', icon: '🌐', label: 'Cross-Chain', desc: 'Best route across chains' },
];

const SwapTab = () => {
  const { isConnected } = useAccount();
  const [fromToken, setFromToken] = useState<Token>(SEPOLIA_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(SEPOLIA_TOKENS[2]);
  const [fromAmount, setFromAmount] = useState('');
  const [routeMode, setRouteMode] = useState<RouteMode>('cheapest');
  const [slippage, setSlippage] = useState('0.5');

  const estimatedOutput = fromAmount ? (parseFloat(fromAmount) * 1847.32).toFixed(2) : '0.00';

  const routeInfo: Record<RouteMode, { path: string; gas: string; time: string; savings: string }> = {
    cheapest: { path: 'ETH → WETH → USDC (split 60/40)', gas: '~$0.42', time: '~45s', savings: 'Save $2.15 vs direct' },
    fastest: { path: 'ETH → USDC (direct pool)', gas: '~$1.20', time: '~12s', savings: 'Fastest available' },
    safe: { path: 'ETH → USDC (UniswapX private)', gas: '~$0.85', time: '~30s', savings: 'MEV protected' },
    crosschain: { path: 'ETH (L1) → Bridge → Base → USDC', gas: '~$0.15', time: '~2min', savings: 'Save $3.40 via Base' },
  };

  const currentRoute = routeInfo[routeMode];

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      {/* Route Mode Selector */}
      <div className="grid grid-cols-4 gap-2">
        {ROUTE_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setRouteMode(mode.id)}
            className={`glass rounded-lg p-3 text-center transition-all ${
              routeMode === mode.id
                ? 'border-primary/60 glow-primary'
                : 'hover:border-primary/30'
            }`}
          >
            <div className="text-xl mb-1">{mode.icon}</div>
            <div className="text-xs font-semibold text-foreground">{mode.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</div>
          </button>
        ))}
      </div>

      {/* Swap Card */}
      <div className="glass rounded-xl p-4 space-y-3">
        {/* From */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">You pay</label>
          <div className="flex gap-2 items-center bg-secondary rounded-lg p-3">
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              className="border-0 bg-transparent text-2xl font-semibold text-foreground p-0 h-auto focus-visible:ring-0"
            />
            <TokenSelector selected={fromToken} onSelect={setFromToken} exclude={toToken.symbol} />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <button
            onClick={() => { setFromToken(toToken); setToToken(fromToken); }}
            className="glass rounded-full p-2 hover:border-primary/50 transition-colors"
          >
            ↕️
          </button>
        </div>

        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">You receive</label>
          <div className="flex gap-2 items-center bg-secondary rounded-lg p-3">
            <div className="text-2xl font-semibold text-foreground flex-1">
              {estimatedOutput}
            </div>
            <TokenSelector selected={toToken} onSelect={setToToken} exclude={fromToken.symbol} />
          </div>
        </div>

        {/* Route Info */}
        {fromAmount && (
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-xs animate-slide-up">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="text-foreground font-mono">{currentRoute.path}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Gas</span>
              <span className="text-foreground">{currentRoute.gas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="text-foreground">{currentRoute.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insight</span>
              <span className="text-success font-medium">{currentRoute.savings}</span>
            </div>
          </div>
        )}

        {/* Slippage */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Slippage:</span>
          {['0.1', '0.5', '1.0'].map(s => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              className={`px-2 py-1 rounded-md transition-colors ${
                slippage === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {s}%
            </button>
          ))}
        </div>

        {/* Swap Button */}
        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: isConnected ? 'var(--gradient-primary)' : undefined }}
          disabled={!isConnected || !fromAmount}
        >
          {!isConnected ? 'Connect Wallet First' : !fromAmount ? 'Enter Amount' : `Swap ${fromToken.symbol} → ${toToken.symbol}`}
        </Button>
      </div>
    </div>
  );
};

export default SwapTab;
