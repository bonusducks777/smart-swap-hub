import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, parseEther } from 'viem';
import { type Token } from '@/lib/tokens';
import { ERC20_ABI, isNativeETH } from '@/lib/contracts';
import { useChain } from '@/lib/chain-context';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useUniswapApiQuote } from '@/hooks/useUniswapApiQuote';
import { useApiSwapExecution } from '@/hooks/useApiSwapExecution';
import type { RouteMode } from '@/hooks/useUniswapQuote';

type TxStatus = 'idle' | 'sending' | 'confirming' | 'done' | 'error';

const ROUTE_MODES: { id: RouteMode; icon: string; label: string; desc: string }[] = [
  { id: 'auto', icon: '🌐', label: 'Auto', desc: 'Best route' },
  { id: 'payment', icon: '⚡', label: 'Payment', desc: 'Deterministic' },
];

const SendTab = () => {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { activeChain } = useChain();
  const { balances } = useTokenBalances();
  const chainTokens = activeChain.tokens;

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sendToken, setSendToken] = useState<Token>(chainTokens[0]);
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Swap-and-send state
  const [swapFromToken, setSwapFromToken] = useState<Token>(chainTokens[0]);
  const [routeMode, setRouteMode] = useState<RouteMode>('payment');

  useEffect(() => {
    setSendToken(chainTokens[0]);
    setSwapFromToken(chainTokens[0]);
    setAmount('');
  }, [activeChain.id]);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipient);
  const senderBalance = balances.find(b => b.symbol === sendToken.symbol);
  const hasBalance = senderBalance && parseFloat(senderBalance.formatted) > 0;
  const needsSwap = !hasBalance && amount && parseFloat(amount) > 0;

  // Use EXACT_OUTPUT: user specifies how much sendToken to deliver, API tells us how much swapFromToken is needed
  const validRecipient = isValidAddress ? recipient : undefined;
  const apiQuote = useUniswapApiQuote(
    swapFromToken, sendToken, needsSwap ? amount : '', routeMode,
    undefined, validRecipient, 'EXACT_OUTPUT',
  );
  const apiSwap = useApiSwapExecution();

  const swapFromBalance = balances.find(b => b.symbol === swapFromToken.symbol);

  // Gas info from quote
  const gasUsd = apiQuote.quote?.quote?.gasFeeUSD ? `$${parseFloat(apiQuote.quote.quote.gasFeeUSD).toFixed(4)}` : null;
  const gasEstLabel = apiQuote.quote ? `~${Number(apiQuote.quote.gasEstimate).toLocaleString()} gas${gasUsd ? ` (${gasUsd})` : ''}` : null;

  const executeSend = async () => {
    if (!walletClient || !publicClient || !address || !isValidAddress || !amount) return;

    setTxStatus('sending');
    setTxError(null);
    setTxHash(null);

    try {
      let hash: `0x${string}`;

      if (isNativeETH(sendToken.address)) {
        hash = await walletClient.sendTransaction({
          to: recipient as `0x${string}`,
          value: parseEther(amount),
          chain: walletClient.chain,
          account: address,
          kzg: undefined as any,
        });
      } else {
        const parsedAmount = parseUnits(amount, sendToken.decimals);
        hash = await walletClient.writeContract({
          address: sendToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, parsedAmount],
          chain: walletClient.chain,
          account: address,
        });
      }

      setTxHash(hash);
      setTxStatus('confirming');
      await publicClient.waitForTransactionReceipt({ hash });
      setTxStatus('done');
    } catch (err: unknown) {
      setTxStatus('error');
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      if (msg.includes('User rejected')) {
        setTxError('Transaction rejected by user');
      } else if (msg.includes('insufficient funds')) {
        setTxError('Insufficient balance');
      } else {
        setTxError(msg.length > 150 ? msg.slice(0, 150) + '…' : msg);
      }
    }
  };

  // Swap directly to recipient — one transaction, tokens land in their wallet
  const handleSwapToRecipient = () => {
    const quote = apiQuote.quote;
    if (!quote) return;
    apiSwap.executeSwap(quote);
  };

  // Confirm screen for direct sends (user already has the token)
  if (step === 'confirm' && isValidAddress && amount) {
    return (
      <div className="max-w-lg mx-auto glass rounded-xl p-6 space-y-4 animate-slide-up">
        <h3 className="text-lg font-semibold text-foreground">Confirm Transaction</h3>
        <div className="space-y-3">
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Send</span>
              <span className="font-semibold text-foreground">{amount} {sendToken.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">To</span>
              <span className="font-mono text-foreground text-xs">{recipient.slice(0, 10)}…{recipient.slice(-6)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="text-foreground">{activeChain.icon} {activeChain.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="text-foreground">{isNativeETH(sendToken.address) ? 'Native ETH transfer' : 'ERC-20 transfer'}</span>
            </div>
          </div>

          {txStatus !== 'idle' && (
            <div className={`rounded-lg p-3 text-sm animate-slide-up ${
              txStatus === 'done' ? 'bg-success/10 text-success' :
              txStatus === 'error' ? 'bg-destructive/10 text-destructive' :
              'bg-info/10 text-info'
            }`}>
              <div className="font-medium">
                {txStatus === 'sending' && 'Confirm in MetaMask…'}
                {txStatus === 'confirming' && 'Waiting for confirmation…'}
                {txStatus === 'done' && 'Transfer complete! ✓'}
                {txStatus === 'error' && 'Transfer failed'}
              </div>
              {txError && <div className="text-xs mt-1 break-all">{txError}</div>}
              {txHash && (
                <a href={`${activeChain.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block">
                  View on Explorer →
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => { setStep('input'); setTxStatus('idle'); }}>Back</Button>
          <Button
            className="flex-1"
            style={{ background: 'var(--gradient-primary)' }}
            disabled={txStatus === 'sending' || txStatus === 'confirming'}
            onClick={executeSend}
          >
            {txStatus === 'sending' ? 'Sending…' : txStatus === 'confirming' ? 'Confirming…' : txStatus === 'done' ? 'Done!' : 'Confirm & Send'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className="glass rounded-xl p-4 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Send Tokens</h3>
        <p className="text-sm text-muted-foreground">
          Send tokens to any address on {activeChain.name}.
        </p>

        {/* Wallet Balances */}
        {isConnected && balances.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Your Balances</label>
            <div className="bg-secondary rounded-lg p-3 space-y-1.5 max-h-32 overflow-y-auto">
              {balances.map(b => (
                <button
                  key={b.symbol}
                  onClick={() => {
                    const token = chainTokens.find(t => t.symbol === b.symbol);
                    if (token) setSendToken(token);
                  }}
                  className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors ${
                    sendToken.symbol === b.symbol ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  <span className="font-medium">{b.symbol}</span>
                  <span className="font-mono">{b.formatted}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recipient */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Recipient Address</label>
          <Input placeholder="0x…" value={recipient} onChange={e => setRecipient(e.target.value)} className="font-mono text-sm" />
          {recipient && !isValidAddress && (
            <p className="text-xs text-destructive">Invalid Ethereum address</p>
          )}
        </div>

        {/* Amount + Token */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs text-muted-foreground font-medium">Amount to send</label>
            {senderBalance && (
              <button onClick={() => setAmount(senderBalance.formatted)} className="text-[10px] text-primary hover:underline">
                Balance: {senderBalance.formatted} {sendToken.symbol} (MAX)
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center bg-secondary rounded-lg p-3">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="border-0 bg-transparent text-2xl font-semibold text-foreground p-0 h-auto focus-visible:ring-0"
            />
            <TokenSelector selected={sendToken} onSelect={setSendToken} />
          </div>
        </div>

        {/* Swap-and-Send Panel — tokens go directly to recipient */}
        {needsSwap && (
          <div className="border border-warning/30 bg-warning/5 rounded-xl p-4 space-y-3 animate-slide-up">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔄</span>
              <span className="text-sm font-semibold text-foreground">Swap & Send in One Transaction</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You don't hold {sendToken.symbol}. We'll swap from your tokens and send directly to the recipient — no extra step.
            </p>

            {!isValidAddress && (
              <p className="text-xs text-warning">Enter recipient address above to get a quote.</p>
            )}

            {/* Source token */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-muted-foreground font-medium">Swap from</label>
                {swapFromBalance && (
                  <span className="text-[10px] text-muted-foreground">
                    Balance: {swapFromBalance.formatted} {swapFromToken.symbol}
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center bg-secondary rounded-lg p-3">
                <div className="flex-1 text-sm text-muted-foreground">
                  {apiQuote.isLoading ? (
                    <span className="animate-pulse">Fetching quote…</span>
                  ) : apiQuote.quote ? (
                    <span className="text-foreground font-mono">
                      ~{parseFloat(apiQuote.quote.formattedOut).toFixed(6)} {sendToken.symbol}
                    </span>
                  ) : apiQuote.error ? (
                    <span className="text-destructive text-xs">{apiQuote.error}</span>
                  ) : (
                    '—'
                  )}
                </div>
                <TokenSelector selected={swapFromToken} onSelect={setSwapFromToken} exclude={sendToken.symbol} />
              </div>
            </div>

            {/* Route mode */}
            <div className="grid grid-cols-2 gap-1.5">
              {ROUTE_MODES.map(rm => (
                <button
                  key={rm.id}
                  onClick={() => setRouteMode(rm.id)}
                  className={`rounded-lg py-2 px-1 text-center transition-all text-[10px] ${
                    routeMode === rm.id
                      ? 'bg-primary/15 border border-primary/50 text-foreground font-semibold'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  <div>{rm.icon}</div>
                  <div>{rm.label}</div>
                </button>
              ))}
            </div>

            {/* Quote details */}
            {apiQuote.quote && (
              <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Routing</span>
                  <span className="text-foreground font-mono">{apiQuote.quote.routing}</span>
                </div>
                {gasEstLabel && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Estimate</span>
                    <span className="text-foreground font-mono">{gasEstLabel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="text-foreground font-mono text-[10px]">{recipient.slice(0, 8)}…{recipient.slice(-4)}</span>
                </div>
              </div>
            )}

            {/* Swap status */}
            {apiSwap.step !== 'idle' && (
              <div className={`rounded-lg p-3 text-xs animate-slide-up ${
                apiSwap.step === 'done' ? 'bg-success/10 text-success' :
                apiSwap.step === 'error' ? 'bg-destructive/10 text-destructive' :
                'bg-info/10 text-info'
              }`}>
                <div className="font-medium">
                  {apiSwap.step === 'done' ? 'Swap & Send complete! Tokens sent to recipient ✓' : apiSwap.step === 'error' ? 'Swap failed' : `${apiSwap.step}…`}
                </div>
                {apiSwap.error && <div className="text-xs mt-1 break-all">{apiSwap.error}</div>}
                {apiSwap.txHash && (
                  <a href={`${activeChain.explorerUrl}/tx/${apiSwap.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block">
                    View on Explorer →
                  </a>
                )}
              </div>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              style={{ background: isConnected && apiQuote.quote && isValidAddress ? 'var(--gradient-primary)' : undefined }}
              disabled={!apiQuote.quote || !isValidAddress || ['swapping', 'approving', 'checking-approval', 'signing-permit', 'building-swap'].includes(apiSwap.step)}
              onClick={handleSwapToRecipient}
            >
              {apiSwap.step === 'done'
                ? '✓ Sent!'
                : !isValidAddress
                ? 'Enter Recipient Address'
                : apiQuote.isLoading
                ? 'Getting Quote…'
                : apiQuote.quote
                ? `Swap & Send ${sendToken.symbol} to Recipient`
                : `Select source token`}
            </Button>
          </div>
        )}

        {/* Direct send button — only when user has the token */}
        {!needsSwap && (
          <Button
            className="w-full h-12 text-base font-semibold"
            style={{ background: isConnected && isValidAddress && amount ? 'var(--gradient-primary)' : undefined }}
            disabled={!isConnected || !isValidAddress || !amount}
            onClick={() => setStep('confirm')}
          >
            {!isConnected
              ? 'Connect Wallet'
              : !isValidAddress
              ? 'Enter Valid Address'
              : !amount
              ? 'Enter Amount'
              : 'Review Transaction'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SendTab;
