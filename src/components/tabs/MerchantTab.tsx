import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useChain } from '@/lib/chain-context';
import { useErc20Listener } from '@/hooks/useErc20Listener';
import { useUniswapApiQuote } from '@/hooks/useUniswapApiQuote';
import { useApiSwapExecution } from '@/hooks/useApiSwapExecution';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Token } from '@/lib/tokens';
import { isNativeETH } from '@/lib/contracts';

type RequestState = 'setup' | 'listening' | 'received';

const MerchantTab = () => {
  const { isConnected, address } = useAccount();
  const { balances, isLoading } = useTokenBalances();
  const { activeChain } = useChain();
  const chainTokens = activeChain.tokens;

  // Request setup
  const stableTokens = chainTokens.filter(t => ['USDC', 'USDT', 'DAI', 'cUSD', 'USDB'].includes(t.symbol));
  const defaultSettle = stableTokens[0] || chainTokens[0];
  const [settleToken, setSettleToken] = useState<Token>(defaultSettle);
  const [requestAmount, setRequestAmount] = useState('');
  const [slippage, setSlippage] = useState('5');
  const [state, setState] = useState<RequestState>('setup');

  // Listener
  const { transfer, listening, reset: resetListener } = useErc20Listener(
    address,
    state === 'listening',
  );

  // When transfer arrives, move to received
  useEffect(() => {
    if (transfer && state === 'listening') {
      setState('received');
    }
  }, [transfer, state]);

  // Build a token object from the received transfer for quoting
  const receivedToken: Token | null = transfer ? (() => {
    const known = chainTokens.find(t => t.address.toLowerCase() === transfer.token.toLowerCase());
    if (known) return known;
    return {
      symbol: transfer.symbol || '???',
      name: transfer.symbol || 'Unknown',
      address: transfer.token,
      decimals: transfer.decimals || 18,
      icon: '🪙',
    };
  })() : null;

  const receivedFormatted = transfer?.formatted || '0';
  const isSameToken = receivedToken && settleToken.address.toLowerCase() === receivedToken.address.toLowerCase();

  // Quote: swap received token → settle token (EXACT_INPUT with what we received)
  const quoteAmount = (state === 'received' && receivedToken && !isSameToken) ? receivedFormatted : '';
  const { quote, isLoading: quoteLoading, error: quoteError } = useUniswapApiQuote(
    receivedToken || chainTokens[0],
    settleToken,
    quoteAmount,
    'auto',
  );

  const { executeSwap, step: swapStep, txHash, error: swapError, reset: resetSwap } = useApiSwapExecution();

  // Check if received amount meets requested amount (with slippage tolerance)
  const slippagePct = parseFloat(slippage) / 100;
  const requestedNum = parseFloat(requestAmount) || 0;
  const minAcceptable = requestedNum * (1 - slippagePct);

  let amountStatus: 'sufficient' | 'insufficient' | 'pending' = 'pending';
  if (state === 'received' && requestedNum > 0) {
    if (isSameToken) {
      const receivedNum = parseFloat(receivedFormatted);
      amountStatus = receivedNum >= minAcceptable ? 'sufficient' : 'insufficient';
    } else if (quote) {
      const outputNum = parseFloat(quote.formattedOut);
      amountStatus = outputNum >= minAcceptable ? 'sufficient' : 'insufficient';
    }
  }

  const gasUsd = quote?.quote?.gasFeeUSD ? `$${parseFloat(quote.quote.gasFeeUSD).toFixed(4)}` : null;

  const handleStartListening = () => {
    if (!requestAmount || parseFloat(requestAmount) <= 0) return;
    setState('listening');
  };

  const handleExecuteSwap = () => {
    if (!quote) return;
    executeSwap(quote);
  };

  const handleReset = () => {
    setState('setup');
    setRequestAmount('');
    resetListener();
    resetSwap();
  };

  // Reset tokens on chain change
  useEffect(() => {
    const stable = chainTokens.filter(t => ['USDC', 'USDT', 'DAI', 'cUSD', 'USDB'].includes(t.symbol));
    setSettleToken(stable[0] || chainTokens[0]);
    handleReset();
  }, [activeChain.id]);

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      {/* Wallet Holdings */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Wallet Holdings</h3>
        {!isConnected ? (
          <p className="text-sm text-muted-foreground">Connect wallet to view balances</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading balances…</p>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {balances.map(b => (
              <div key={b.symbol} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-foreground">{b.symbol}</span>
                <span className="text-sm font-mono text-foreground">{b.formatted}</span>
              </div>
            ))}
            {balances.length === 0 && (
              <p className="text-xs text-muted-foreground">No balances found</p>
            )}
          </div>
        )}
      </div>

      {/* Payment Request */}
      <div className="glass rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          {state === 'setup' && '💳 Create Payment Request'}
          {state === 'listening' && '📡 Waiting for Payment…'}
          {state === 'received' && '📬 Payment Received'}
        </h3>

        {/* ---- SETUP ---- */}
        {state === 'setup' && (
          <>
            <p className="text-xs text-muted-foreground">
              Specify the amount you want to receive and the token you want to settle in. We'll listen for incoming ERC-20 transfers and auto-check if the amount covers your request.
            </p>

            {/* Amount + settle token */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Request Amount</label>
              <div className="flex gap-2 items-center bg-secondary rounded-lg p-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={requestAmount}
                  onChange={e => setRequestAmount(e.target.value)}
                  className="border-0 bg-transparent text-2xl font-semibold text-foreground p-0 h-auto focus-visible:ring-0"
                />
                <TokenSelector selected={settleToken} onSelect={setSettleToken} />
              </div>
            </div>

            {/* Slippage tolerance */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Acceptance tolerance:</span>
              {['1', '3', '5', '10'].map(s => (
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

            <Button
              className="w-full h-12 text-base font-semibold"
              style={{ background: isConnected && requestAmount ? 'var(--gradient-primary)' : undefined }}
              disabled={!isConnected || !requestAmount || parseFloat(requestAmount) <= 0}
              onClick={handleStartListening}
            >
              {!isConnected ? 'Connect Wallet' : !requestAmount ? 'Enter Amount' : '📡 Start Listening for Payment'}
            </Button>
          </>
        )}

        {/* ---- LISTENING ---- */}
        {state === 'listening' && (
          <>
            <div className="bg-info/10 border border-info/30 rounded-lg p-4 space-y-2 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-lg">📡</span>
                <span className="text-sm font-semibold text-info">Listening for incoming ERC-20 transfers…</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Waiting for any token to be sent to your wallet. The listener will capture the first incoming transfer.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Requesting: <span className="text-foreground font-mono">{requestAmount} {settleToken.symbol}</span></div>
                <div>Tolerance: <span className="text-foreground font-mono">±{slippage}%</span></div>
                <div>Min acceptable: <span className="text-foreground font-mono">{minAcceptable.toFixed(settleToken.decimals > 6 ? 6 : 2)} {settleToken.symbol}</span></div>
              </div>
            </div>

            {address && (
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Send payment to:</div>
                <div className="text-sm font-mono text-foreground break-all mt-1">{address}</div>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={handleReset}>
              Cancel
            </Button>
          </>
        )}

        {/* ---- RECEIVED ---- */}
        {state === 'received' && transfer && receivedToken && (
          <>
            {/* Transfer details */}
            <div className="bg-secondary rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received</span>
                <span className="font-mono font-semibold text-foreground">{receivedFormatted} {receivedToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-mono text-foreground text-xs">{transfer.from.slice(0, 10)}…{transfer.from.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="font-mono text-foreground text-xs">{transfer.token.slice(0, 10)}…{transfer.token.slice(-6)}</span>
              </div>
              <a
                href={`${activeChain.explorerUrl}/tx/${transfer.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline"
              >
                View on Explorer →
              </a>
            </div>

            {/* Status badge */}
            <div className={`rounded-lg p-3 text-sm font-semibold text-center ${
              amountStatus === 'sufficient' ? 'bg-success/15 text-success border border-success/30' :
              amountStatus === 'insufficient' ? 'bg-destructive/15 text-destructive border border-destructive/30' :
              'bg-muted/15 text-muted-foreground'
            }`}>
              {amountStatus === 'sufficient' && '✅ Right amount received'}
              {amountStatus === 'insufficient' && `⚠️ Insufficient — need ≥${minAcceptable.toFixed(2)} ${settleToken.symbol}`}
              {amountStatus === 'pending' && 'Calculating…'}
            </div>

            {/* Swap section (if different token) */}
            {!isSameToken && (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Received <span className="text-foreground font-semibold">{receivedToken.symbol}</span> but you want <span className="text-foreground font-semibold">{settleToken.symbol}</span>. Swap below:
                </div>

                {quoteLoading && (
                  <div className="text-sm text-muted-foreground animate-pulse">Getting swap quote…</div>
                )}
                {quoteError && (
                  <div className="text-xs text-destructive">{quoteError}</div>
                )}
                {quote && (
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Swap</span>
                      <span className="font-mono text-foreground">{receivedFormatted} {receivedToken.symbol} → {quote.formattedOut} {settleToken.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Routing</span>
                      <span className="font-mono text-foreground">{quote.routing}</span>
                    </div>
                    {gasUsd && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gas</span>
                        <span className="font-mono text-foreground">{gasUsd}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Swap status */}
                {swapStep !== 'idle' && (
                  <div className={`rounded-lg p-3 text-xs animate-slide-up ${
                    swapStep === 'done' ? 'bg-success/10 text-success' :
                    swapStep === 'error' ? 'bg-destructive/10 text-destructive' :
                    'bg-info/10 text-info'
                  }`}>
                    <div className="font-medium">
                      {swapStep === 'done' ? 'Swap complete! ✓' : swapStep === 'error' ? 'Swap failed' : `${swapStep}…`}
                    </div>
                    {swapError && <div className="text-xs mt-1 break-all">{swapError}</div>}
                    {txHash && (
                      <a href={`${activeChain.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block">
                        View on Explorer →
                      </a>
                    )}
                  </div>
                )}

                <Button
                  className="w-full h-12 text-base font-semibold"
                  style={{ background: quote ? 'var(--gradient-primary)' : undefined }}
                  disabled={!quote || ['swapping', 'approving', 'checking-approval', 'signing-permit', 'building-swap'].includes(swapStep)}
                  onClick={handleExecuteSwap}
                >
                  {swapStep === 'done'
                    ? '✓ Settled!'
                    : quoteLoading
                    ? 'Getting Quote…'
                    : quote
                    ? `Swap ${receivedToken.symbol} → ${settleToken.symbol}`
                    : 'No Quote Available'}
                </Button>
              </div>
            )}

            {/* If same token received, just show settled */}
            {isSameToken && amountStatus === 'sufficient' && (
              <div className="text-center text-sm text-success font-semibold py-2">
                ✅ Payment settled — no swap needed
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={handleReset}>
              New Request
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MerchantTab;
