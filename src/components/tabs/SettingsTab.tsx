import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SettingsTab = () => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem('uniswap_api_key', apiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">API Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Enter your Uniswap API key to enable live routing and swap execution on Sepolia testnet.
        </p>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium">Uniswap API Key</label>
          <Input
            type="password"
            placeholder="Enter your API key…"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Get your key at{' '}
            <a href="https://app.uniswap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              app.uniswap.org
            </a>
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="w-full"
          style={{ background: 'var(--gradient-primary)' }}
          disabled={!apiKey}
        >
          {saved ? '✓ Saved!' : 'Save API Key'}
        </Button>
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
