"use client"

import { useWallet } from "./hooks/useWallet"
import { Wallet, Shield, Clock, Users, LogOut, ArrowRight, Menu, X } from "lucide-react"
import { Dashboard } from "./components/Dashboard"
import { useState, useEffect } from "react"

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
    switchToSepolia,
  } = useWallet()

  const [hasError, setHasError] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-6 inline-block p-3 bg-red-500/10 rounded-full border border-red-500/30">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-8">Please try reloading the page</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-600/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <header className="border-b border-gray-800 backdrop-blur-xl bg-black/80 sticky top-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white font-poppins">Vaultara</h1>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {!account ? (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group"
                >
                  <Wallet className="w-5 h-5" />
                  <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  {!isCorrectNetwork && (
                    <button
                      onClick={switchToSepolia}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-yellow-500/50"
                    >
                      Switch to Sepolia
                    </button>
                  )}
                  <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 px-4 py-2 rounded-lg backdrop-blur">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-300 font-mono">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={disconnect}
                    className="flex items-center space-x-2 bg-gray-900 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 text-gray-300 hover:text-red-300 px-4 py-2 rounded-lg font-semibold transition-all"
                    title="Disconnect wallet"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-900 rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-700 space-y-3">
              {!account ? (
                <button
                  onClick={() => {
                    connectWallet()
                    setMobileMenuOpen(false)
                  }}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  <Wallet className="w-5 h-5" />
                  <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                </button>
              ) : (
                <>
                  {!isCorrectNetwork && (
                    <button
                      onClick={switchToSepolia}
                      className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-yellow-500/50"
                    >
                      Switch to Sepolia
                    </button>
                  )}
                  <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 px-4 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-300 font-mono">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      disconnect()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 text-gray-300 hover:text-red-300 px-4 py-2 rounded-lg font-semibold transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 relative z-10">
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {!account ? (
          <div className="text-center py-12 md:py-20">
            <div className="inline-block mb-8 animate-bounce" style={{ animationDuration: "3s" }}>
              <svg
                viewBox="0 0 200 200"
                className="w-32 h-32 md:w-48 md:h-48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Hexagon outer frame - white */}
                <polygon
                  points="100,20 170,55 170,145 100,180 30,145 30,55"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                />
                {/* Inner hexagon */}
                <polygon
                  points="100,40 155,70 155,130 100,160 45,130 45,70"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                />
                {/* Lion head simplified */}
                <circle cx="100" cy="90" r="25" stroke="white" strokeWidth="2" fill="none" />
                {/* Eyes */}
                <circle cx="92" cy="85" r="3" fill="white" />
                <circle cx="108" cy="85" r="3" fill="white" />
                {/* Nose */}
                <polygon points="100,95 97,100 103,100" fill="white" />
                {/* Mane */}
                <path
                  d="M 75 80 Q 70 70 75 60 Q 80 65 85 60 Q 90 70 85 80"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M 125 80 Q 130 70 125 60 Q 120 65 115 60 Q 110 70 115 80"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>

            <div className="mb-8">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight font-poppins">
                Your Digital Legacy,
              </h2>
              <div className="h-16 md:h-20 flex items-center justify-center">
                <span className="text-4xl md:text-6xl font-bold text-orange-600 font-poppins typewriter">
                  Protected Forever
                </span>
              </div>
            </div>

            <p className="text-base md:text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-inter">
              Vaultara ensures your crypto assets are never lost. Set up heartbeat checks and encrypted beneficiaries
              for automatic inheritance.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto mb-12">
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-8 hover:border-orange-600/50 transition-all group hover:bg-gray-900/70 hover:shadow-lg hover:shadow-orange-600/20">
                <div className="p-3 bg-orange-600/20 rounded-lg w-fit mx-auto mb-4 group-hover:bg-orange-600/30 transition-all">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-poppins">Heartbeat Mechanism</h3>
                <p className="text-gray-400 text-sm font-inter">Periodic on-chain checks to confirm you're active</p>
              </div>

              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-8 hover:border-orange-600/50 transition-all group hover:bg-gray-900/70 hover:shadow-lg hover:shadow-orange-600/20">
                <div className="p-3 bg-orange-600/20 rounded-lg w-fit mx-auto mb-4 group-hover:bg-orange-600/30 transition-all">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-poppins">Encrypted Privacy</h3>
                <p className="text-gray-400 text-sm font-inter">Beneficiary data secured with Lit Protocol</p>
              </div>

              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-8 hover:border-orange-600/50 transition-all group hover:bg-gray-900/70 hover:shadow-lg hover:shadow-orange-600/20">
                <div className="p-3 bg-orange-600/20 rounded-lg w-fit mx-auto mb-4 group-hover:bg-orange-600/30 transition-all">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-poppins">Auto Transfer</h3>
                <p className="text-gray-400 text-sm font-inter">Funds automatically sent to beneficiaries</p>
              </div>
            </div>

            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all disabled:opacity-50 inline-flex items-center space-x-2 shadow-lg group font-poppins"
            >
              <Wallet className="w-6 h-6" />
              <span>{isConnecting ? "Connecting..." : "Get Started"}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          // Dashboard (Connected)
          <div>
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2 font-poppins">Dashboard</h2>
              <p className="text-gray-400 font-inter">Manage your inheritance vault</p>
            </div>

            {!isCorrectNetwork ? (
              <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 px-6 py-4 rounded-lg backdrop-blur">
                <p className="font-semibold">Wrong Network</p>
                <p className="text-sm mt-1">Please switch to Sepolia testnet to use Vaultara.</p>
              </div>
            ) : (
              <>
                {provider && signer && account && <Dashboard provider={provider} signer={signer} account={account} />}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-20 bg-black/80 backdrop-blur relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400 text-sm font-inter">
            <p className="font-medium text-white">Vaultara - Self-Sovereign Crypto Inheritance</p>
            <p className="mt-2 text-gray-500">Built with Hardhat, Lit Protocol & Blockscout</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
