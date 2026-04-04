import { useState } from 'react';
import { useAccount } from 'wagmi';
import { SEPOLIA_TOKENS, CHAINS, type Token } from '@/lib/tokens';
import TokenSelector from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SendTab = () => {
  const { isConnected } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sendToken, setSendToken] = useState<Token>(SEPOLIA_TOKENS[2]);
  const [detectedChain, setDetectedChain] = useState(CHAINS[0]);
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  const isValidAddress = recipient.startsWith('0x') && recipient.length === 42;
  const needsBridge = detectedChain.id !== 'ethereum';
  const needsSwap = sendToken.symbol !== 'ETH';

  const handleConfirm = () => setStep('confirm');
  const handleBack = () => setStep('input');

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
              <span className="text-muted-foreground">Recipient Chain</span>
              <span className="text-foreground">{detectedChain.icon} {detectedChain.name}</span>
            </div>
          </div>

          {/* Route visualization */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Route</div>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="bg-card rounded-md px-2 py-1 text-foreground">{sendToken.icon} {sendToken.symbol}</span>
              {needsSwap && (
                <>
                  <span className="text-muted-foreground">→ swap →</span>
                  <span className="bg-card rounded-md px-2 py-1 text-foreground">⟠ ETH</span>
                </>
              )}
              {needsBridge && (
                <>
                  <span className="text-muted-foreground">→ bridge →</span>
                  <span className="bg-card rounded-md px-2 py-1 text-foreground">{detectedChain.icon} {detectedChain.name}</span>
                </>
              )}
              <span className="text-muted-foreground">→ deliver</span>
            </div>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Est. time: {needsBridge ? '~2 min' : '~15s'}</span>
            <span>Est. fees: {needsBridge ? '$0.85' : '$0.42'}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleBack}>Back</Button>
          <Button
            className="flex-1"
            style={{ background: 'var(--gradient-primary)' }}
          >
            Confirm & Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className="glass rounded-xl p-4 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Send Anything, Anywhere</h3>
        <p className="text-sm text-muted-foreground">
          Enter a recipient and amount. We'll handle swaps, bridging, and chain detection automatically.
        </p>

        {/* Recipient */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Recipient Address</label>
          <Input
            placeholder="0x… or ENS name"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="font-mono text-sm"
          />
          {isValidAddress && (
            <div className="flex items-center gap-2 text-xs animate-slide-up">
              <span className="text-muted-foreground">Detected chain:</span>
              <div className="flex gap-1">
                {CHAINS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setDetectedChain(c)}
                    className={`px-2 py-0.5 rounded-md transition-colors text-xs ${
                      detectedChain.id === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Amount + Token */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Amount</label>
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

        {/* Safety toggles */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" className="rounded border-border" />
            <span>Don't touch my ETH</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            <span>MEV protection</span>
          </label>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: isConnected && isValidAddress && amount ? 'var(--gradient-primary)' : undefined }}
          disabled={!isConnected || !isValidAddress || !amount}
          onClick={handleConfirm}
        >
          {!isConnected ? 'Connect Wallet' : !isValidAddress ? 'Enter Valid Address' : !amount ? 'Enter Amount' : 'Review Transaction'}
        </Button>
      </div>
    </div>
  );
};

export default SendTab;
