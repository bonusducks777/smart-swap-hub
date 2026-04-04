import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

interface TxEntry {
  id: string;
  from: string;
  token: string;
  amount: string;
  settled: string;
  settledToken: string;
  time: string;
  status: 'completed' | 'pending';
}

const MOCK_TXS: TxEntry[] = [
  { id: '1', from: '0x1a2b…c3d4', token: 'ETH', amount: '0.5', settled: '922.50', settledToken: 'USDC', time: '2 min ago', status: 'completed' },
  { id: '2', from: '0x5e6f…7890', token: 'UNI', amount: '150', settled: '1,245.00', settledToken: 'USDC', time: '5 min ago', status: 'completed' },
  { id: '3', from: '0xab12…cd34', token: 'LINK', amount: '80', settled: '1,120.00', settledToken: 'USDC', time: '8 min ago', status: 'completed' },
  { id: '4', from: '0xef56…7890', token: 'DAI', amount: '500', settled: '499.85', settledToken: 'USDC', time: 'just now', status: 'pending' },
];

const MerchantTab = () => {
  const { isConnected } = useAccount();
  const [settlementToken, setSettlementToken] = useState('USDC');
  const [autoConvert, setAutoConvert] = useState(true);
  const [inventoryAware, setInventoryAware] = useState(false);

  const totalSettled = '$3,787.35';
  const txCount = MOCK_TXS.length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gradient-text">{totalSettled}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Settled (24h)</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{txCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Transactions</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-success">99.2%</div>
          <div className="text-xs text-muted-foreground mt-1">Auto-converted</div>
        </div>
      </div>

      {/* Settings */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Settlement Settings</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Settle in</span>
          <div className="flex gap-1">
            {['USDC', 'DAI', 'ETH'].map(t => (
              <button
                key={t}
                onClick={() => setSettlementToken(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  settlementToken === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Auto-convert incoming</span>
            <p className="text-[10px] text-muted-foreground">All received tokens auto-swap to {settlementToken}</p>
          </div>
          <button
            onClick={() => setAutoConvert(!autoConvert)}
            className={`w-10 h-5 rounded-full transition-colors relative ${autoConvert ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${autoConvert ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Inventory-aware routing</span>
            <p className="text-[10px] text-muted-foreground">Accept DAI if {settlementToken} liquidity is low</p>
          </div>
          <button
            onClick={() => setInventoryAware(!inventoryAware)}
            className={`w-10 h-5 rounded-full transition-colors relative ${inventoryAware ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${inventoryAware ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
        <div className="space-y-2">
          {MOCK_TXS.map(tx => (
            <div key={tx.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${tx.status === 'completed' ? 'bg-success' : 'bg-warning animate-pulse-glow'}`} />
                <div>
                  <div className="text-sm font-mono text-foreground">{tx.from}</div>
                  <div className="text-xs text-muted-foreground">{tx.amount} {tx.token} → {tx.settled} {tx.settledToken}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{tx.time}</div>
                <div className={`text-[10px] font-medium ${tx.status === 'completed' ? 'text-success' : 'text-warning'}`}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isConnected && (
        <p className="text-center text-sm text-muted-foreground">Connect wallet to enable merchant features</p>
      )}
    </div>
  );
};

export default MerchantTab;
