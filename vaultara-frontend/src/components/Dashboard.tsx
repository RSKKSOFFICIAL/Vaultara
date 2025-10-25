import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Clock, Heart, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useVaultaraContract } from '../hooks/useVaultaraContract';
import { useLitProtocol } from '../hooks/useLitProtocol';
import { TransactionHistory } from './TransactionHistory';

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
    updateBeneficiary,
    removeBeneficiary,
    triggerInheritance,
    fundVault,
    deactivateVault,
    withdrawFunds,
  } = useVaultaraContract(provider, signer);

  const [showInitModal, setShowInitModal] = useState(false);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [heartbeatDays, setHeartbeatDays] = useState('7');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('');
  const [beneficiaryShare, setBeneficiaryShare] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showUpdateBeneficiaryModal, setShowUpdateBeneficiaryModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('');
  const [newSharePercentage, setNewSharePercentage] = useState('');
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

  const handleUpdateBeneficiary = async () => {
    const result = await updateBeneficiary(selectedBeneficiary, Number(newSharePercentage));

    if (result.success) {
      setTxStatus({ type: 'success', message: 'Beneficiary updated successfully!' });
      setShowUpdateBeneficiaryModal(false);
      setSelectedBeneficiary('');
      setNewSharePercentage('');
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to update beneficiary' });
    }
  };

  const handleRemoveBeneficiary = async (address: string) => {
    if (!window.confirm(`Are you sure you want to remove beneficiary ${address.slice(0, 6)}...${address.slice(-4)}?`)) {
      return;
    }

    const result = await removeBeneficiary(address);
    if (result.success) {
      setTxStatus({ type: 'success', message: 'Beneficiary removed successfully!' });
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to remove beneficiary' });
    }
  };

  const handleDeactivateVault = async () => {
    try {
      if (!window.confirm('Are you sure you want to deactivate the vault? You can withdraw funds after deactivation.')) {
        return;
      }

      const result = await deactivateVault();

      if (result.success) {
        setTxStatus({ type: 'success', message: 'Vault deactivated successfully!' });
      } else {
        // Parse error message to be user-friendly
        let errorMsg = 'Failed to deactivate vault';

        if (result.error?.includes('InheritanceAlreadyTriggered')) {
          errorMsg = 'Cannot deactivate: Inheritance has already been triggered';
        } else if (result.error?.includes('OwnableUnauthorizedAccount')) {
          errorMsg = 'Only the vault owner can deactivate';
        } else if (result.error?.includes('VaultNotActive')) {
          errorMsg = 'Vault is already inactive';
        } else if (result.error?.includes('user rejected')) {
          errorMsg = 'Transaction cancelled by user';
        }

        setTxStatus({ type: 'error', message: errorMsg });
      }
    } catch (err: any) {
      console.error('Deactivate error:', err);

      let errorMsg = 'Transaction failed';
      if (err.message?.includes('user rejected')) {
        errorMsg = 'Transaction cancelled';
      }

      setTxStatus({ type: 'error', message: errorMsg });
    }
  };

  const handleWithdrawFunds = async () => {
    if (!window.confirm('Withdraw all funds from the vault?')) {
      return;
    }

    const result = await withdrawFunds();
    if (result.success) {
      setTxStatus({ type: 'success', message: 'Funds withdrawn successfully!' });
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to withdraw funds' });
    }
  };

  const handleTriggerInheritance = async () => {
    if (!window.confirm('Are you sure you want to trigger inheritance? This will distribute all funds to beneficiaries and cannot be reversed!')) {
      return;
    }

    const result = await triggerInheritance();
    if (result.success) {
      setTxStatus({ type: 'success', message: 'Inheritance triggered! Funds distributed to beneficiaries.' });
    } else {
      setTxStatus({ type: 'error', message: result.error || 'Failed to trigger inheritance' });
    }
  };
  const { simpleEncrypt } = useLitProtocol(account);
  const handleAddBeneficiary = async () => {
    const encryptedMetadata = await simpleEncrypt(beneficiaryAddress, account);

    const result = await addBeneficiary(
      beneficiaryAddress,
      Number(beneficiaryShare),
      encryptedMetadata
    );

    if (result.success) {
      setTxStatus({ type: 'success', message: 'Beneficiary added with Lit Protocol encryption!' });
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
        <div className={`flex items-center justify-between p-4 rounded-lg animate-fadeIn ${txStatus.type === 'success'
          ? 'bg-green-500/20 border border-green-500 text-green-200'
          : 'bg-red-500/20 border border-red-500 text-red-200'
          }`}>
          <div className="flex items-center space-x-2">
            {txStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{txStatus.message}</span>
          </div>
          <button
            onClick={() => setTxStatus(null)}
            className="text-gray-400 hover:text-white transition-all"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Unable to load contract data</p>
              <p className="text-xs text-yellow-300 mt-1">Please ensure you're connected to Sepolia testnet</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold underline"
          >
            Refresh
          </button>
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
                <span className={`text-xs px-2 py-1 rounded ${vaultStatus.isExpired ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
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
          {/* Advanced Actions */}
          {vaultStatus && vaultStatus.isActive && (
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Advanced Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Trigger Inheritance */}
                {vaultStatus.isExpired && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Heartbeat Expired!</h4>
                        <p className="text-sm text-gray-400">
                          The heartbeat has expired. Anyone can trigger inheritance to distribute funds to beneficiaries.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTriggerInheritance}
                      disabled={loading || totalAllocated !== 100}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>{loading ? 'Triggering...' : 'Trigger Inheritance'}</span>
                    </button>
                    {totalAllocated !== 100 && (
                      <p className="text-xs text-red-400 mt-2 text-center">
                        Total allocation must be 100% to trigger inheritance
                      </p>
                    )}
                  </div>
                )}

                {/* Vault Management */}
                {isOwner && !vaultStatus.isExpired && (
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Vault Management</h4>
                    <div className="space-y-2">
                      {vaultStatus.isActive ? (
                        <>
                          <button
                            onClick={handleDeactivateVault}
                            disabled={loading}
                            className="w-full bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 text-sm"
                          >
                            Deactivate Vault
                          </button>
                          <p className="text-xs text-gray-500 text-center">
                            Deactivating allows you to withdraw funds
                          </p>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleWithdrawFunds}
                            disabled={loading || vaultStatus.contractBalance === BigInt(0)}
                            className="w-full bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 text-sm"
                          >
                            Withdraw Funds
                          </button>
                          <p className="text-xs text-gray-500 text-center">
                            Balance: {ethers.formatEther(vaultStatus.contractBalance)} ETH
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg hover:bg-slate-900/70 transition-all">
                    <div className="flex-1">
                      <p className="text-white font-mono text-sm mb-1">
                        {b.beneficiaryAddress.slice(0, 6)}...{b.beneficiaryAddress.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Share: {(Number(b.sharePercentage) / 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-4">
                        <p className="text-purple-400 font-semibold text-lg">
                          {(Number(b.sharePercentage) / 100).toFixed(1)}%
                        </p>
                      </div>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBeneficiary(b.beneficiaryAddress);
                              setNewSharePercentage((Number(b.sharePercentage) / 100).toString());
                              setShowUpdateBeneficiaryModal(true);
                            }}
                            disabled={loading}
                            className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 border border-blue-500/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveBeneficiary(b.beneficiaryAddress)}
                            disabled={loading}
                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 border border-red-500/30"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}{/* Transaction History */}
          <TransactionHistory />
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

      {/* Update Beneficiary Modal */}
      {showUpdateBeneficiaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Update Beneficiary Share</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Beneficiary Address</label>
                <input
                  type="text"
                  value={selectedBeneficiary}
                  disabled
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-gray-500 font-mono text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Share Percentage (%)</label>
                <input
                  type="number"
                  value={newSharePercentage}
                  onChange={(e) => setNewSharePercentage(e.target.value)}
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
                onClick={handleUpdateBeneficiary}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => {
                  setShowUpdateBeneficiaryModal(false);
                  setSelectedBeneficiary('');
                  setNewSharePercentage('');
                }}
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