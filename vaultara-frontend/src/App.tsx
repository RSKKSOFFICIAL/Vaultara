import { useWallet } from './hooks/useWallet';
import { Wallet, Shield, Clock, Users, LogOut } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { useState, useEffect } from 'react';

function App() {
  const {
    account,
    provider,
    signer,
    isConnecting,
    error,
    isCorrectNetwork,
    connectWallet,
    disconnect,  
    switchToSepolia
  } = useWallet();

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 px-6 py-3 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Vaultara</h1>
            </div>

            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
              >
                <Wallet className="w-5 h-5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                {!isCorrectNetwork && (
                  <button
                    onClick={switchToSepolia}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-yellow-500/50"
                  >
                    Switch to Sepolia
                  </button>
                )}
                <div className="flex items-center space-x-2 bg-slate-800 border border-purple-500/30 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-purple-300 font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-red-600 border border-purple-500/30 hover:border-red-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-500/50"
                  title="Disconnect wallet"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!account ? (
          // Hero Section (Not Connected)
          <div className="text-center py-20">
            <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-6">
              <Shield className="w-16 h-16 text-purple-400" />
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">
              Your Digital Legacy, <span className="text-purple-400">Protected</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Vaultara ensures your crypto assets are never lost. Set up heartbeat checks and encrypted beneficiaries for automatic inheritance.
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Heartbeat Mechanism</h3>
                <p className="text-gray-400">
                  Periodic on-chain checks to confirm you're active
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Encrypted Privacy</h3>
                <p className="text-gray-400">
                  Beneficiary data secured with Lit Protocol
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Auto Transfer</h3>
                <p className="text-gray-400">
                  Funds automatically sent to beneficiaries
                </p>
              </div>
            </div>

            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="mt-12 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all disabled:opacity-50 inline-flex items-center space-x-2"
            >
              <Wallet className="w-6 h-6" />
              <span>{isConnecting ? 'Connecting...' : 'Get Started'}</span>
            </button>
          </div>
        ) : (
          // Dashboard (Connected)
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
              <p className="text-gray-400">Manage your inheritance vault</p>
            </div>

            {!isCorrectNetwork ? (
              <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-6 py-4 rounded-lg">
                <p className="font-semibold">Wrong Network</p>
                <p>Please switch to Sepolia testnet to use Vaultara.</p>
              </div>
            ) : (
              <>
                {provider && signer && account && (
                  <Dashboard provider={provider} signer={signer} account={account} />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>Vaultara - Self-Sovereign Crypto Inheritance</p>
            <p className="mt-1">Built with Hardhat, Lit Protocol & Blockscout</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;