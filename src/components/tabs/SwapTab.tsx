import { useState } from 'react';
import { useAccount } from 'wagmi';
import { SEPOLIA_TOKENS, type Token } from '@/lib/tokens';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUniswapQuote, type RouteMode } from '@/hooks/useUniswapQuote';
import { useSwapExecution } from '@/hooks/useSwapExecution';
import { useTokenBalances } from '@/hooks/useTokenBalances';

// RouteMode type is imported from useUniswapQuote

const ROUTE_MODES: { id: RouteMode; icon: string; label: string; desc: string }[] = [
  { id: 'cheapest', icon: '💸', label: 'Save Money', desc: 'Best price, may take longer' },
  { id: 'fastest', icon: '⚡', label: 'Instant', desc: 'Fastest execution' },
  { id: 'safe', icon: '🛡', label: 'Safe', desc: 'MEV protected (UniswapX)' },
  { id: 'crosschain', icon: '🌐', label: 'Cross-Chain', desc: 'Not available on testnet' },
];

const STEP_LABELS: Record<string, string> = {
  'idle': '',
  'checking-allowance': 'Checking token allowance…',
  'approving': 'Approve token in MetaMask…',
  'swapping': 'Confirm swap in MetaMask…',
  'done': 'Swap complete! ✓',
  'error': 'Swap failed',
};

const SwapTab = () => {
  const { isConnected } = useAccount();
  const [fromToken, setFromToken] = useState<Token>(SEPOLIA_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(SEPOLIA_TOKENS[2]);
  const [fromAmount, setFromAmount] = useState('');
  const [routeMode, setRouteMode] = useState<RouteMode>('cheapest');
  const [slippage, setSlippage] = useState('0.5');

  const { quote, isLoading: quoteLoading, error: quoteError } = useUniswapQuote(fromToken, toToken, fromAmount, routeMode);
  const { executeSwap, step, txHash, error: swapError, reset } = useSwapExecution();
  const { balances } = useTokenBalances();

  const fromBalance = balances.find(b => b.symbol === fromToken.symbol);

  const handleSwap = () => {
    if (!quote) return;
    executeSwap(
      fromToken,
      toToken,
      fromAmount,
      quote.amountOut,
      quote.feeTier,
      parseFloat(slippage),
    );
  };

  const handleMaxClick = () => {
    if (fromBalance) {
      setFromAmount(fromBalance.formatted);
    }
  };

  const feeTierLabel = quote ? `${quote.feeTier / 10000}%` : '—';
  const gasEstLabel = quote ? `~${Number(quote.gasEstimate).toLocaleString()} gas` : '—';

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      {/* Route Mode Selector */}
      <div className="grid grid-cols-4 gap-2">
        {ROUTE_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setRouteMode(mode.id)}
            disabled={mode.id === 'crosschain'}
            className={`glass rounded-lg p-3 text-center transition-all ${
              routeMode === mode.id ? 'border-primary/60 glow-primary' : 'hover:border-primary/30'
            } ${mode.id === 'crosschain' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-xl mb-1">{mode.icon}</div>
            <div className="text-xs font-semibold text-foreground">{mode.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</div>
          </button>
        ))}
      </div>

      {routeMode === 'safe' && (
        <div className="bg-info/10 border border-info/30 rounded-lg p-3 text-xs text-info">
          🛡 UniswapX private order flow is not available on Sepolia. Swap will execute via standard routing, but the UI demonstrates the UX pattern.
        </div>
      )}

      {/* Swap Card */}
      <div className="glass rounded-xl p-4 space-y-3">
        {/* From */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs text-muted-foreground font-medium">You pay</label>
            {fromBalance && (
              <button onClick={handleMaxClick} className="text-[10px] text-primary hover:underline">
                Balance: {fromBalance.formatted} {fromToken.symbol} (MAX)
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center bg-secondary rounded-lg p-3">
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={e => { setFromAmount(e.target.value); reset(); }}
              className="border-0 bg-transparent text-2xl font-semibold text-foreground p-0 h-auto focus-visible:ring-0"
            />
            <TokenSelector selected={fromToken} onSelect={t => { setFromToken(t); reset(); }} exclude={toToken.symbol} />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <button
            onClick={() => { setFromToken(toToken); setToToken(fromToken); reset(); }}
            className="glass rounded-full p-2 hover:border-primary/50 transition-colors"
          >
            ↕️
          </button>
        </div>

        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">You receive</label>
          <div className="flex gap-2 items-center bg-secondary rounded-lg p-3">
            <div className="text-2xl font-semibold text-foreground flex-1 font-mono">
              {quoteLoading ? (
                <span className="text-muted-foreground animate-pulse">Fetching…</span>
              ) : quote ? (
                parseFloat(quote.formattedOut).toFixed(6)
              ) : quoteError ? (
                <span className="text-destructive text-sm">{quoteError}</span>
              ) : (
                '0.00'
              )}
            </div>
            <TokenSelector selected={toToken} onSelect={t => { setToToken(t); reset(); }} exclude={fromToken.symbol} />
          </div>
        </div>

        {/* Route Info — real data */}
        {quote && (
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-xs animate-slide-up">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pool Fee Tier</span>
              <span className="text-foreground font-mono">{feeTierLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Estimate</span>
              <span className="text-foreground font-mono">{gasEstLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min. Output ({slippage}% slippage)</span>
              <span className="text-foreground font-mono">
                {(parseFloat(quote.formattedOut) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="text-foreground">
                {fromToken.symbol} → {toToken.symbol} (Uniswap V3)
              </span>
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
                slippage === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {s}%
            </button>
          ))}
        </div>

        {/* Status */}
        {step !== 'idle' && (
          <div className={`rounded-lg p-3 text-sm animate-slide-up ${
            step === 'done' ? 'bg-success/10 text-success' :
            step === 'error' ? 'bg-destructive/10 text-destructive' :
            'bg-info/10 text-info'
          }`}>
            <div className="font-medium">{STEP_LABELS[step]}</div>
            {swapError && <div className="text-xs mt-1 break-all">{swapError}</div>}
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline mt-1 block"
              >
                View on Etherscan →
              </a>
            )}
          </div>
        )}

        {/* Swap Button */}
        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: isConnected && quote ? 'var(--gradient-primary)' : undefined }}
          disabled={!isConnected || !quote || step === 'swapping' || step === 'approving' || step === 'checking-allowance'}
          onClick={handleSwap}
        >
          {!isConnected
            ? 'Connect Wallet First'
            : !fromAmount
            ? 'Enter Amount'
            : quoteLoading
            ? 'Fetching Quote…'
            : quoteError
            ? 'No Pool Available'
            : step === 'approving'
            ? 'Approving…'
            : step === 'swapping'
            ? 'Swapping…'
            : step === 'done'
            ? 'Swap Again'
            : `Swap ${fromToken.symbol} → ${toToken.symbol}`}
        </Button>
      </div>
    </div>
  );
};

export default SwapTab;
