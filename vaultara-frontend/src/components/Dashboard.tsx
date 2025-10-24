import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Clock, Heart, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useVaultaraContract } from '../hooks/useVaultaraContract';

interface DashboardProps {
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  account: string;
}

export const Dashboard = ({ provider, signer, account }: DashboardProps) => {
  const {
    vaultStatus,
    beneficiaries,
    loading,
    error,
    initializeVault,
    sendHeartbeat,
    addBeneficiary,
    fundVault,
  } = useVaultaraContract(provider, signer);

  const [showInitModal, setShowInitModal] = useState(false);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [heartbeatDays, setHeartbeatDays] = useState('7');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('');
  const [beneficiaryShare, setBeneficiaryShare] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isOwner = vaultStatus?.owner.toLowerCase() === account.toLowerCase();

  // Format time remaining
  const formatTimeRemaining = (seconds: bigint) => {
    const num = Number(seconds);
    const days = Math.floor(num / 86400);
    const hours = Math.floor((num % 86400) / 3600);
    const minutes = Math.floor((num % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleInitializeVault = async () => {
    const result = await initializeVault(Number(heartbeatDays));
    if (result.success) {
      setTxStatus({ type: 'success', message: 'Vault initialized successfully!' });
      setShowInitModal(false);
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to initialize vault' });
    }
  };

  const handleSendHeartbeat = async () => {
    const result = await sendHeartbeat();
    if (result.success) {
      setTxStatus({ type: 'success', message: 'Heartbeat sent successfully!' });
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to send heartbeat' });
    }
  };

  const handleAddBeneficiary = async () => {
    // For now, we'll use plain text metadata (Lit Protocol integration comes next)
    const metadata = `beneficiary_${Date.now()}`;
    const result = await addBeneficiary(beneficiaryAddress, Number(beneficiaryShare), metadata);
    
    if (result.success) {
      setTxStatus({ type: 'success', message: 'Beneficiary added successfully!' });
      setShowAddBeneficiaryModal(false);
      setBeneficiaryAddress('');
      setBeneficiaryShare('');
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to add beneficiary' });
    }
  };

  const handleFundVault = async () => {
    const result = await fundVault(fundAmount);
    if (result.success) {
      setTxStatus({ type: 'success', message: 'Vault funded successfully!' });
      setShowFundModal(false);
      setFundAmount('');
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to fund vault' });
    }
  };

  // Clear status messages after 5 seconds
  useEffect(() => {
    if (txStatus) {
      const timer = setTimeout(() => setTxStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [txStatus]);

  // Calculate total allocated percentage
  const totalAllocated = beneficiaries.reduce((sum, b) => sum + Number(b.sharePercentage) / 100, 0);

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {txStatus && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg ${
          txStatus.type === 'success' 
            ? 'bg-green-500/20 border border-green-500 text-green-200' 
            : 'bg-red-500/20 border border-red-500 text-red-200'
        }`}>
          {txStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{txStatus.message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Vault Not Initialized */}
      {vaultStatus && !vaultStatus.isActive && (
        <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-8 text-center">
          <Clock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Vault Not Initialized</h3>
          <p className="text-gray-400 mb-6">Set up your heartbeat interval to start protecting your assets.</p>
          <button
            onClick={() => setShowInitModal(true)}
            disabled={!isOwner}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOwner ? 'Initialize Vault' : 'Only Owner Can Initialize'}
          </button>
        </div>
      )}

      {/* Vault Active - Main Dashboard */}
      {vaultStatus && vaultStatus.isActive && (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Heartbeat Status */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-6 h-6 text-purple-400" />
                <span className={`text-xs px-2 py-1 rounded ${
                  vaultStatus.isExpired ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                }`}>
                  {vaultStatus.isExpired ? 'EXPIRED' : 'ACTIVE'}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {vaultStatus.isExpired ? '0s' : formatTimeRemaining(vaultStatus.timeUntilExpiry)}
              </p>
              <p className="text-sm text-gray-400">Until Next Heartbeat</p>
            </div>

            {/* Vault Balance */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <DollarSign className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {ethers.formatEther(vaultStatus.contractBalance)} ETH
              </p>
              <p className="text-sm text-gray-400">Vault Balance</p>
            </div>

            {/* Beneficiaries */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <Users className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">{beneficiaries.length}</p>
              <p className="text-sm text-gray-400">Beneficiaries</p>
            </div>

            {/* Heartbeat Interval */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <Clock className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {Number(vaultStatus.heartbeatInterval) / 86400}d
              </p>
              <p className="text-sm text-gray-400">Heartbeat Interval</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={handleSendHeartbeat}
              disabled={loading || !isOwner || vaultStatus.isExpired}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Heart className="w-5 h-5" />
              <span>{loading ? 'Sending...' : 'Send Heartbeat'}</span>
            </button>

            <button
              onClick={() => setShowAddBeneficiaryModal(true)}
              disabled={loading || !isOwner}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Add Beneficiary</span>
            </button>

            <button
              onClick={() => setShowFundModal(true)}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <DollarSign className="w-5 h-5" />
              <span>Fund Vault</span>
            </button>
          </div>

          {/* Beneficiaries List */}
          {beneficiaries.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Beneficiaries</h3>
                <span className="text-sm text-gray-400">
                  Allocated: {totalAllocated.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-3">
                {beneficiaries.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg">
                    <div>
                      <p className="text-white font-mono text-sm">
                        {b.beneficiaryAddress.slice(0, 6)}...{b.beneficiaryAddress.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 font-semibold">
                        {(Number(b.sharePercentage) / 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Initialize Vault Modal */}
      {showInitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Initialize Vault</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Heartbeat Interval (days)</label>
              <input
                type="number"
                value={heartbeatDays}
                onChange={(e) => setHeartbeatDays(e.target.value)}
                className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
                min="1"
                max="365"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleInitializeVault}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'Initializing...' : 'Initialize'}
              </button>
              <button
                onClick={() => setShowInitModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {showAddBeneficiaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Add Beneficiary</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Beneficiary Address</label>
                <input
                  type="text"
                  value={beneficiaryAddress}
                  onChange={(e) => setBeneficiaryAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Share Percentage (%)</label>
                <input
                  type="number"
                  value={beneficiaryShare}
                  onChange={(e) => setBeneficiaryShare(e.target.value)}
                  placeholder="e.g., 50 for 50%"
                  className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <p className="text-xs text-gray-400">
                Currently allocated: {totalAllocated.toFixed(1)}%. Total must equal 100%.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddBeneficiary}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => setShowAddBeneficiaryModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Vault Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Fund Vault</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount (ETH)</label>
              <input
                type="text"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="0.1"
                className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleFundVault}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Fund'}
              </button>
              <button
                onClick={() => setShowFundModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};