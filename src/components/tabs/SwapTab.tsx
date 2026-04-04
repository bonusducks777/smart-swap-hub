import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { type Token } from '@/lib/tokens';
import { useChain } from '@/lib/chain-context';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type RouteMode } from '@/hooks/useUniswapQuote';
import { useUniswapApiQuote } from '@/hooks/useUniswapApiQuote';
import { useApiSwapExecution } from '@/hooks/useApiSwapExecution';
import { useTokenBalances } from '@/hooks/useTokenBalances';

const ROUTE_MODES: { id: RouteMode; icon: string; label: string; desc: string }[] = [
  { id: 'auto', icon: '🌐', label: 'Auto', desc: 'Best route via V2/V3/UniswapX' },
  { id: 'payment', icon: '⚡', label: 'Payment', desc: 'Deterministic, no solver delay' },
];

const MODE_DETAILS: Record<RouteMode, { protocols: string; detail: string }> = {
  auto: { protocols: 'V3 + V2 + UNISWAPX_V3', detail: 'API picks the best route — may use solver auctions (UniswapX) for better pricing' },
  payment: { protocols: 'V3 + V2', detail: 'Direct AMM execution only — deterministic, no solver delay, ideal for checkout flows' },
};

const STEP_LABELS: Record<string, string> = {
  'idle': '',
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
  const { activeChain } = useChain();
  const chainTokens = activeChain.tokens;
  const [fromToken, setFromToken] = useState<Token>(chainTokens[0]);
  const [toToken, setToToken] = useState<Token>(chainTokens.length > 2 ? chainTokens[2] : chainTokens[1] || chainTokens[0]);
  const [fromAmount, setFromAmount] = useState('');
  const [routeMode, setRouteMode] = useState<RouteMode>('auto');
  const [slippage, setSlippage] = useState('5');

  useEffect(() => {
    setFromToken(chainTokens[0]);
    setToToken(chainTokens.length > 2 ? chainTokens[2] : chainTokens[1] || chainTokens[0]);
    setFromAmount('');
  }, [activeChain.id]);

  const { quote, isLoading: quoteLoading, error: quoteError } = useUniswapApiQuote(fromToken, toToken, fromAmount, routeMode);
  const { executeSwap, step, txHash, error: swapError, reset } = useApiSwapExecution();

  const { balances } = useTokenBalances();
  const fromBalance = balances.find(b => b.symbol === fromToken.symbol);

  const handleSwap = () => {
    if (!quote) return;
    executeSwap(quote);
  };

  // Extract rich quote details from API response
  const gasUsd = quote?.quote?.gasFeeUSD ? `$${parseFloat(quote.quote.gasFeeUSD).toFixed(4)}` : null;
  const gasEstLabel = quote ? `~${Number(quote.gasEstimate).toLocaleString()} gas${gasUsd ? ` (${gasUsd})` : ''}` : '—';
  const priceImpact = quote?.quote?.priceImpact != null ? `${quote.quote.priceImpact}%` : null;
  const outputAmount = quote ? parseFloat(quote.formattedOut) : 0;
  const minOutput = quote ? (outputAmount * (1 - parseFloat(slippage) / 100)).toFixed(6) : null;

  const active = ROUTE_MODES.find(r => r.id === routeMode)!;
  const modeInfo = MODE_DETAILS[routeMode];

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      {/* Route Mode Selector */}
      <div className="grid grid-cols-2 gap-2">
        {ROUTE_MODES.map(rm => (
          <button
            key={rm.id}
            onClick={() => { setRouteMode(rm.id); reset(); }}
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

      {/* Mode Explanation */}
      <div className="glass rounded-lg px-4 py-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{active.icon}</span>
          <span className="text-sm font-semibold text-foreground">{active.label} Mode</span>
          <span className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">{modeInfo.protocols}</span>
        </div>
        <p className="text-xs text-muted-foreground">{modeInfo.detail}</p>
      </div>

      {/* Swap Card */}
      <div className="glass rounded-xl p-4 space-y-3">
        {/* From */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs text-muted-foreground font-medium">You pay</label>
            {fromBalance && (
              <button onClick={() => setFromAmount(fromBalance.formatted)} className="text-[10px] text-primary hover:underline">
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
                outputAmount.toFixed(6)
              ) : quoteError ? (
                <span className="text-destructive text-sm">{quoteError}</span>
              ) : (
                '0.00'
              )}
            </div>
            <TokenSelector selected={toToken} onSelect={t => { setToToken(t); reset(); }} exclude={fromToken.symbol} />
          </div>
        </div>

        {/* Route Info */}
        {quote && (
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-xs animate-slide-up">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Routing</span>
              <span className="text-foreground font-mono">{quote.routing}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Estimate</span>
              <span className="text-foreground font-mono">{gasEstLabel}</span>
            </div>
            {priceImpact && (() => {
              const impact = parseFloat(priceImpact);
              const slippageNum = parseFloat(slippage);
              const isCloseToSlippage = impact >= slippageNum * 0.7;
              const isOverSlippage = impact >= slippageNum;
              return (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span className={`font-mono ${isOverSlippage ? 'text-destructive' : isCloseToSlippage ? 'text-warning' : impact > 1 ? 'text-warning' : 'text-foreground'}`}>
                      {priceImpact}
                    </span>
                  </div>
                  {isCloseToSlippage && (
                    <div className={`rounded-md px-2 py-1.5 text-[10px] font-medium ${isOverSlippage ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      ⚠️ {isOverSlippage
                        ? `Price impact (${priceImpact}) exceeds your slippage tolerance (${slippage}%) — tx will likely revert`
                        : `Price impact (${priceImpact}) is close to your slippage tolerance (${slippage}%) — consider adjusting`}
                    </div>
                  )}
                </>
              );
            })()}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min. Output ({slippage}% slippage)</span>
              <span className="text-foreground font-mono">
                {minOutput} {toToken.symbol}
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
              <a href={`${activeChain.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block">
                View on Explorer →
              </a>
            )}
          </div>
        )}

        {/* Swap Button */}
        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: isConnected && quote ? 'var(--gradient-primary)' : undefined }}
          disabled={!isConnected || !quote || ['swapping', 'approving', 'checking-approval', 'signing-permit', 'building-swap'].includes(step)}
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
