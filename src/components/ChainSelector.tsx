import { SUPPORTED_CHAINS } from '@/lib/tokens';
import { useChain } from '@/lib/chain-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ChainSelector = () => {
  const { activeChain, setActiveChain } = useChain();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg glass px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/30">
          <span>{activeChain.icon}</span>
          <span className="hidden text-foreground sm:inline">{activeChain.name}</span>
          <span className="text-xs text-muted-foreground">▾</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[9999] max-h-80 w-56 overflow-y-auto rounded-xl border border-border/50 p-2 glass"
      >
        {SUPPORTED_CHAINS.map((chain) => {
          const isActive = activeChain.id === chain.id;

          return (
            <DropdownMenuItem
              key={chain.id}
              onSelect={() => setActiveChain(chain)}
              className={isActive
                ? 'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary focus:bg-primary/10 focus:text-primary'
                : 'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground focus:bg-secondary focus:text-foreground'
              }
            >
              <span className="text-lg">{chain.icon}</span>
              <div className="text-left">
                <div>{chain.name}</div>
                <div className="text-[10px] text-muted-foreground">Chain ID: {chain.id}</div>
              </div>
              {chain.id === 11155111 && (
                <span className="ml-auto rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] text-warning">TEST</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChainSelector;
