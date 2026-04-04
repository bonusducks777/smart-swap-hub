import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_TOKENS, CHAINS, type Token } from '@/lib/tokens';
import { ERC20_ABI, isNativeETH } from '@/lib/contracts';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTokenBalances } from '@/hooks/useTokenBalances';

type TxStatus = 'idle' | 'sending' | 'confirming' | 'done' | 'error';

const SendTab = () => {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { balances } = useTokenBalances();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sendToken, setSendToken] = useState<Token>(SEPOLIA_TOKENS[0]);
  const [recipientChain] = useState(CHAINS[0]); // Sepolia only for real txs
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipient);
  const senderBalance = balances.find(b => b.symbol === sendToken.symbol);

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
          chain: sepolia,
          account: address,
        });
      } else {
        const parsedAmount = parseUnits(amount, sendToken.decimals);
        hash = await walletClient.writeContract({
          address: sendToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, parsedAmount],
          chain: sepolia,
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
              <span className="text-foreground">{recipientChain.icon} Sepolia Testnet</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="text-foreground">{isNativeETH(sendToken.address) ? 'Native ETH transfer' : 'ERC-20 transfer'}</span>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
            ⚠️ Cross-chain bridging is not wired up on testnet. This sends directly on Sepolia.
          </div>

          {/* Status */}
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
          Send ETH or ERC-20 tokens to any address on Sepolia testnet.
        </p>

        {/* Recipient */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Recipient Address</label>
          <Input
            placeholder="0x…"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="font-mono text-sm"
          />
          {recipient && !isValidAddress && (
            <p className="text-xs text-destructive">Invalid Ethereum address</p>
          )}
        </div>

        {/* Amount + Token */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs text-muted-foreground font-medium">Amount</label>
            {senderBalance && (
              <button
                onClick={() => setAmount(senderBalance.formatted)}
                className="text-[10px] text-primary hover:underline"
              >
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

        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: isConnected && isValidAddress && amount ? 'var(--gradient-primary)' : undefined }}
          disabled={!isConnected || !isValidAddress || !amount}
          onClick={() => setStep('confirm')}
        >
          {!isConnected ? 'Connect Wallet' : !isValidAddress ? 'Enter Valid Address' : !amount ? 'Enter Amount' : 'Review Transaction'}
        </Button>
      </div>
    </div>
  );
};

export default SendTab;
