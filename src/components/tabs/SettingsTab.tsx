import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBackendMode } from '@/lib/backend-context';

const SettingsTab = () => {
  const { apiKey, setApiKey, mode } = useBackendMode();
  const [inputKey, setInputKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (inputKey) {
      setApiKey(inputKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">API Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Enter your Uniswap Trading API key to enable API-based routing. Toggle to "API" mode in the header to use it.
        </p>

        {mode === 'onchain' && (
          <div className="bg-info/10 border border-info/30 rounded-lg p-3 text-xs text-info">
            ℹ️ You're currently using <strong>On-Chain</strong> mode (QuoterV2 contract). No API key needed. Switch to <strong>API</strong> mode in the header to use the Uniswap Trading API.
          </div>
        )}

        {mode === 'api' && !apiKey && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
            ⚠️ API mode is active but no key is set. Quotes will fail until you save a valid key.
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
        <h3 className="text-sm font-semibold text-foreground">Backend Mode</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Mode</span>
            <span className="text-foreground font-mono">{mode === 'onchain' ? 'On-Chain (QuoterV2)' : 'Uniswap Trading API'}</span>
          </div>
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
            <span className="text-foreground font-mono">Sepolia Testnet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chain ID</span>
            <span className="text-foreground font-mono">11155111</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RPC</span>
            <span className="text-foreground font-mono">Default (MetaMask)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-success font-medium">● Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
