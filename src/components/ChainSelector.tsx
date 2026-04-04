import { useState } from 'react';
import { SUPPORTED_CHAINS, type ChainConfig } from '@/lib/tokens';
import { useChain } from '@/lib/chain-context';

const ChainSelector = () => {
  const { activeChain, setActiveChain } = useChain();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-sm font-medium hover:border-primary/30 transition-all"
      >
        <span>{activeChain.icon}</span>
        <span className="text-foreground hidden sm:inline">{activeChain.name}</span>
        <span className="text-muted-foreground text-xs">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 glass rounded-xl border border-border/50 p-2 shadow-lg max-h-80 overflow-y-auto">
            {SUPPORTED_CHAINS.map(chain => (
              <button
                key={chain.id}
                onClick={() => { setActiveChain(chain); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeChain.id === chain.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <span className="text-lg">{chain.icon}</span>
                <div className="text-left">
                  <div>{chain.name}</div>
                  <div className="text-[10px] text-muted-foreground">Chain ID: {chain.id}</div>
                </div>
                {chain.id === 11155111 && (
                  <span className="ml-auto text-[9px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">TEST</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ChainSelector;
