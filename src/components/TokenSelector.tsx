import { useState } from 'react';
import { SEPOLIA_TOKENS, type Token } from '@/lib/tokens';

interface TokenSelectorProps {
  selected: Token;
  onSelect: (token: Token) => void;
  exclude?: string;
}

const TokenSelector = ({ selected, onSelect, exclude }: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const tokens = SEPOLIA_TOKENS.filter(t => t.symbol !== exclude);

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
        <div className="absolute top-full mt-1 left-0 z-50 glass rounded-lg p-1 min-w-[180px] animate-slide-up">
          {tokens.map(token => (
            <button
              key={token.symbol}
              onClick={() => { onSelect(token); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              <span>{token.icon}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-foreground">{token.symbol}</div>
                <div className="text-xs text-muted-foreground">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenSelector;
