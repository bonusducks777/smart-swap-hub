import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { type Token } from '@/lib/tokens';
import { useBackendMode } from '@/lib/backend-context';
import { useChain } from '@/lib/chain-context';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUniswapQuote, type RouteMode } from '@/hooks/useUniswapQuote';
import { useUniswapApiQuote } from '@/hooks/useUniswapApiQuote';
import { useSwapExecution } from '@/hooks/useSwapExecution';
import { useApiSwapExecution } from '@/hooks/useApiSwapExecution';
import { useTokenBalances } from '@/hooks/useTokenBalances';

const ROUTE_MODES: { id: RouteMode; icon: string; label: string; desc: string }[] = [
  { id: 'cheapest', icon: '💸', label: 'Save Money', desc: 'Solver auction, best price' },
  { id: 'fastest', icon: '⚡', label: 'Instant', desc: 'Direct AMM, immediate' },
  { id: 'safe', icon: '🛡', label: 'Protected', desc: 'MEV-shielded execution' },
  { id: 'crosschain', icon: '🌉', label: 'Global', desc: 'Cross-chain best price' },
];

const STEP_LABELS: Record<string, string> = {
  'idle': '',
  'checking-allowance': 'Checking token allowance…',
  'checking-approval': 'Checking approval via API…',
  'approving': 'Approve token in MetaMask…',
  'signing-permit': 'Sign Permit2 in MetaMask…',
  'building-swap': 'Building swap transaction…',
  'swapping': 'Confirm swap in MetaMask…',
  'done': 'Swap complete! ✓',
  'error': 'Swap failed',
};

const SwapTab = () => {
  const { isConnected } = useAccount();
  const { mode } = useBackendMode();
  const { activeChain } = useChain();
  const chainTokens = activeChain.tokens;
  const [fromToken, setFromToken] = useState<Token>(chainTokens[0]);
  const [toToken, setToToken] = useState<Token>(chainTokens.length > 2 ? chainTokens[2] : chainTokens[1] || chainTokens[0]);
  const [fromAmount, setFromAmount] = useState('');
  const [routeMode, setRouteMode] = useState<RouteMode>('cheapest');
  const [slippage, setSlippage] = useState('0.5');

  // Reset tokens when chain changes
  useEffect(() => {
    setFromToken(chainTokens[0]);
    setToToken(chainTokens.length > 2 ? chainTokens[2] : chainTokens[1] || chainTokens[0]);
    setFromAmount('');
  }, [activeChain.id]);

  // On-chain hooks (always called, React rules of hooks)
  const onchainQuote = useUniswapQuote(fromToken, toToken, mode === 'onchain' ? fromAmount : '', routeMode);
  const onchainSwap = useSwapExecution();

  // API hooks (always called)
  const apiQuote = useUniswapApiQuote(fromToken, toToken, mode === 'api' ? fromAmount : '', routeMode);
  const apiSwap = useApiSwapExecution();

  // Select active backend
  const { quote, isLoading: quoteLoading, error: quoteError } = mode === 'onchain' ? onchainQuote : apiQuote;
  const { step, txHash, error: swapError, reset } = mode === 'onchain' ? onchainSwap : apiSwap;

  const { balances } = useTokenBalances();
  const fromBalance = balances.find(b => b.symbol === fromToken.symbol);

  const handleSwap = () => {
    if (!quote) return;
    if (mode === 'onchain') {
      const q = quote as { amountOut: bigint; feeTier: number };
      onchainSwap.executeSwap(fromToken, toToken, fromAmount, q.amountOut, q.feeTier, parseFloat(slippage));
    } else {
      const q = quote as import('@/hooks/useUniswapApiQuote').ApiQuoteResult;
      apiSwap.executeSwap(q);
    }
  };

  const handleReset = () => {
    if (mode === 'onchain') onchainSwap.reset();
    else apiSwap.reset();
  };

  const handleMaxClick = () => {
    if (fromBalance) setFromAmount(fromBalance.formatted);
  };

  const feeTierLabel = mode === 'onchain' && quote && 'feeTier' in quote
    ? `${(quote as any).feeTier / 10000}%`
    : mode === 'api' && quote && 'routing' in quote
    ? (quote as any).routing
    : '—';

  const gasEstLabel = quote ? `~${Number(quote.gasEstimate).toLocaleString()} gas` : '—';

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      {/* Backend indicator */}
      <div className={`text-center text-[10px] font-medium px-2 py-1 rounded-full w-fit mx-auto ${
        mode === 'api' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {mode === 'onchain' ? '⛓ QuoterV2 On-Chain' : '🌐 Uniswap Trading API'}
      </div>

      {/* Route Mode Selector */}
      <div className="grid grid-cols-4 gap-2">
        {ROUTE_MODES.map(rm => (
          <button
            key={rm.id}
            onClick={() => { setRouteMode(rm.id); handleReset(); }}
            className={`glass rounded-lg p-3 text-center transition-all ${
              routeMode === rm.id ? 'border-primary/60 glow-primary' : 'hover:border-primary/30'
            }`}
          >
            <div className="text-xl mb-1">{rm.icon}</div>
            <div className="text-xs font-semibold text-foreground">{rm.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{rm.desc}</div>
          </button>
        ))}
      </div>

      {/* Active Mode Explanation */}
      {(() => {
        const active = ROUTE_MODES.find(rm => rm.id === routeMode)!;
        const explanations: Record<RouteMode, { routing: string; detail: string }> = {
          cheapest: { routing: 'DUTCH_V2 / DUTCH_V3', detail: 'Solver competition (UniswapX) — may wait a few seconds to get you a better price' },
          fastest: { routing: 'CLASSIC (V3/V2)', detail: 'Direct AMM execution — immediate settlement at current market rate' },
          safe: { routing: 'PRIORITY (UniswapX)', detail: 'Order hidden from public mempool — solvers fill privately, reducing sandwich attacks' },
          crosschain: { routing: 'BRIDGE + CLASSIC + DUTCH', detail: 'Routes may cross chains for global best price — liquidity is not chain-local' },
        };
        const info = explanations[routeMode];
        return (
          <div className="glass rounded-lg px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{active.icon}</span>
              <span className="text-sm font-semibold text-foreground">{active.label} Mode</span>
              <span className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">{info.routing}</span>
            </div>
            <p className="text-xs text-muted-foreground">{info.detail}</p>
          </div>
        );
      })()}

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
              onChange={e => { setFromAmount(e.target.value); handleReset(); }}
              className="border-0 bg-transparent text-2xl font-semibold text-foreground p-0 h-auto focus-visible:ring-0"
            />
            <TokenSelector selected={fromToken} onSelect={t => { setFromToken(t); handleReset(); }} exclude={toToken.symbol} />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <button
            onClick={() => { setFromToken(toToken); setToToken(fromToken); handleReset(); }}
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
            <TokenSelector selected={toToken} onSelect={t => { setToToken(t); handleReset(); }} exclude={fromToken.symbol} />
          </div>
        </div>

        {/* Route Info */}
        {quote && (
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-xs animate-slide-up">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{mode === 'onchain' ? 'Pool Fee Tier' : 'Routing'}</span>
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
              <span className="text-muted-foreground">Backend</span>
              <span className="text-foreground">
                {mode === 'onchain' ? 'QuoterV2 → SwapRouter02' : `Uniswap API (${(quote as any).routing || 'CLASSIC'})`}
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
            <div className="font-medium">{STEP_LABELS[step] || step}</div>
            {swapError && <div className="text-xs mt-1 break-all">{swapError}</div>}
            {txHash && (
              <a
                href={`${activeChain.explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline mt-1 block"
              >
                View on Explorer →
              </a>
            )}
          </div>
        )}

        {/* Swap Button */}
        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: isConnected && quote ? 'var(--gradient-primary)' : undefined }}
          disabled={!isConnected || !quote || ['swapping', 'approving', 'checking-allowance', 'checking-approval', 'signing-permit', 'building-swap'].includes(step)}
          onClick={handleSwap}
        >
          {!isConnected
            ? 'Connect Wallet First'
            : !fromAmount
            ? 'Enter Amount'
            : quoteLoading
            ? 'Fetching Quote…'
            : quoteError
            ? 'No Quote Available'
            : step === 'approving'
            ? 'Approving…'
            : step === 'swapping'
            ? 'Swapping…'
            : step === 'signing-permit'
            ? 'Signing Permit…'
            : step === 'building-swap'
            ? 'Building Tx…'
            : step === 'done'
            ? 'Swap Again'
            : `Swap ${fromToken.symbol} → ${toToken.symbol}`}
        </Button>
      </div>
    </div>
  );
};

export default SwapTab;
