import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';

const WalletConnect = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
          <span className="text-xs text-muted-foreground">{chain?.name || 'Sepolia'}</span>
          <span className="text-sm font-mono font-medium text-foreground">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
          {balance && (
            <span className="text-xs text-muted-foreground">
              {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="glow-primary"
      style={{ background: 'var(--gradient-primary)' }}
    >
      {isPending ? 'Connecting…' : '🦊 Connect MetaMask'}
    </Button>
  );
};

export default WalletConnect;
