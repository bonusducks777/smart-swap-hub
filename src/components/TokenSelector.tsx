import { useState } from 'react';
import { useChain } from '@/lib/chain-context';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import type { Token } from '@/lib/tokens';

interface TokenSelectorProps {
  selected: Token;
  onSelect: (token: Token) => void;
  exclude?: string;
}

const TokenSelector = ({ selected, onSelect, exclude }: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { activeChain } = useChain();
  const { balances } = useTokenBalances();
  const tokens = activeChain.tokens.filter(t => t.symbol !== exclude);

  const getBalance = (symbol: string) => balances.find(b => b.symbol === symbol);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 glass rounded-lg px-3 py-2 hover:border-primary/50 transition-colors"
      >
        <span className="text-lg">{selected.icon}</span>
        <span className="font-semibold text-foreground">{selected.symbol}</span>
        <span className="text-muted-foreground text-xs">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-50 glass rounded-lg p-1 min-w-[220px] max-h-64 overflow-y-auto animate-slide-up">
            {tokens.map(token => {
              const bal = getBalance(token.symbol);
              return (
                <button
                  key={token.address}
                  onClick={() => { onSelect(token); setOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-secondary transition-colors"
                >
                  <span>{token.icon}</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                  </div>
                  {bal && (
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {bal.formatted}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TokenSelector;
