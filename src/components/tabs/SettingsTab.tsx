import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChain } from '@/lib/chain-context';

const SettingsTab = () => {
  const [apiKey] = useState(() => localStorage.getItem('uniswap_api_key') || '');
  const [inputKey, setInputKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);
  const { activeChain } = useChain();

  const handleSave = () => {
    if (inputKey) {
      localStorage.setItem('uniswap_api_key', inputKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">API Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Enter your Uniswap Trading API key. All swaps and quotes are routed through the Uniswap API.
        </p>

        {!apiKey && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
            ⚠️ No API key set. Quotes will fail until you save a valid key.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium">Uniswap API Key</label>
          <Input
            type="password"
            placeholder="Enter your API key…"
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Get your key at{' '}
            <a href="https://developer.uniswap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              developer.uniswap.org
            </a>
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="w-full"
          style={{ background: 'var(--gradient-primary)' }}
          disabled={!inputKey}
        >
          {saved ? '✓ Saved!' : 'Save API Key'}
        </Button>
      </div>

      <div className="glass rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">API Key Status</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">API Key</span>
            <span className={`font-mono ${apiKey ? 'text-success' : 'text-destructive'}`}>
              {apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : 'Not set'}
            </span>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Network Info</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="text-foreground font-mono">{activeChain.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chain ID</span>
            <span className="text-foreground font-mono">{activeChain.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
