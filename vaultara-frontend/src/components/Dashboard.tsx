"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Clock, Heart, Users, DollarSign, AlertCircle, CheckCircle, Zap, Lock } from "lucide-react"
import { useVaultaraContract } from "../hooks/useVaultaraContract"
import { useLitProtocol } from "../hooks/useLitProtocol"
import { TransactionHistory } from "./TransactionHistory"

interface DashboardProps {
  provider: ethers.BrowserProvider
  signer: ethers.JsonRpcSigner
  account: string
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
  } = useVaultaraContract(provider, signer)

  const [showInitModal, setShowInitModal] = useState(false)
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [heartbeatDays, setHeartbeatDays] = useState("7")
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("")
  const [beneficiaryShare, setBeneficiaryShare] = useState("")
  const [fundAmount, setFundAmount] = useState("")
  const [txStatus, setTxStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showUpdateBeneficiaryModal, setShowUpdateBeneficiaryModal] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("")
  const [newSharePercentage, setNewSharePercentage] = useState("")
  const isOwner = vaultStatus?.owner.toLowerCase() === account.toLowerCase()

  const formatTimeRemaining = (seconds: bigint) => {
    const num = Number(seconds)
    const days = Math.floor(num / 86400)
    const hours = Math.floor((num % 86400) / 3600)
    const minutes = Math.floor((num % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const handleInitializeVault = async () => {
    const result = await initializeVault(Number(heartbeatDays))
    if (result.success) {
      setTxStatus({ type: "success", message: "Vault initialized successfully!" })
      setShowInitModal(false)
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to initialize vault" })
    }
  }

  const handleSendHeartbeat = async () => {
    const result = await sendHeartbeat()
    if (result.success) {
      setTxStatus({ type: "success", message: "Heartbeat sent successfully!" })
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to send heartbeat" })
    }
  }

  const handleUpdateBeneficiary = async () => {
    const result = await updateBeneficiary(selectedBeneficiary, Number(newSharePercentage))

    if (result.success) {
      setTxStatus({ type: "success", message: "Beneficiary updated successfully!" })
      setShowUpdateBeneficiaryModal(false)
      setSelectedBeneficiary("")
      setNewSharePercentage("")
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to update beneficiary" })
    }
  }

  const handleRemoveBeneficiary = async (address: string) => {
    if (!window.confirm(`Are you sure you want to remove beneficiary ${address.slice(0, 6)}...${address.slice(-4)}?`)) {
      return
    }

    const result = await removeBeneficiary(address)
    if (result.success) {
      setTxStatus({ type: "success", message: "Beneficiary removed successfully!" })
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to remove beneficiary" })
    }
  }

  const handleDeactivateVault = async () => {
    try {
      if (
        !window.confirm("Are you sure you want to deactivate the vault? You can withdraw funds after deactivation.")
      ) {
        return
      }

      const result = await deactivateVault()

      if (result.success) {
        setTxStatus({ type: "success", message: "Vault deactivated successfully!" })
      } else {
        let errorMsg = "Failed to deactivate vault"

        if (result.error?.includes("InheritanceAlreadyTriggered")) {
          errorMsg = "Cannot deactivate: Inheritance has already been triggered"
        } else if (result.error?.includes("OwnableUnauthorizedAccount")) {
          errorMsg = "Only the vault owner can deactivate"
        } else if (result.error?.includes("VaultNotActive")) {
          errorMsg = "Vault is already inactive"
        } else if (result.error?.includes("user rejected")) {
          errorMsg = "Transaction cancelled by user"
        }

        setTxStatus({ type: "error", message: errorMsg })
      }
    } catch (err: any) {
      console.error("Deactivate error:", err)

      let errorMsg = "Transaction failed"
      if (err.message?.includes("user rejected")) {
        errorMsg = "Transaction cancelled"
      }

      setTxStatus({ type: "error", message: errorMsg })
    }
  }

  const handleWithdrawFunds = async () => {
    if (!window.confirm("Withdraw all funds from the vault?")) {
      return
    }

    const result = await withdrawFunds()
    if (result.success) {
      setTxStatus({ type: "success", message: "Funds withdrawn successfully!" })
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to withdraw funds" })
    }
  }

  const handleTriggerInheritance = async () => {
    if (
      !window.confirm(
        "Are you sure you want to trigger inheritance? This will distribute all funds to beneficiaries and cannot be reversed!",
      )
    ) {
      return
    }

    const result = await triggerInheritance()
    if (result.success) {
      setTxStatus({ type: "success", message: "Inheritance triggered! Funds distributed to beneficiaries." })
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to trigger inheritance" })
    }
  }

  const { simpleEncrypt } = useLitProtocol(account)
  const handleAddBeneficiary = async () => {
    const encryptedMetadata = await simpleEncrypt(beneficiaryAddress, account)

    const result = await addBeneficiary(beneficiaryAddress, Number(beneficiaryShare), encryptedMetadata)

    if (result.success) {
      setTxStatus({ type: "success", message: "Beneficiary added with Lit Protocol encryption!" })
      setShowAddBeneficiaryModal(false)
      setBeneficiaryAddress("")
      setBeneficiaryShare("")
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to add beneficiary" })
    }
  }

  const handleFundVault = async () => {
    const result = await fundVault(fundAmount)
    if (result.success) {
      setTxStatus({ type: "success", message: "Vault funded successfully!" })
      setShowFundModal(false)
      setFundAmount("")
    } else {
      setTxStatus({ type: "error", message: result.error || "Failed to fund vault" })
    }
  }

  useEffect(() => {
    if (txStatus) {
      const timer = setTimeout(() => setTxStatus(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [txStatus])

  const totalAllocated = beneficiaries.reduce((sum, b) => sum + Number(b.sharePercentage) / 100, 0)

  return (
    <div className="space-y-6">
      {txStatus && (
        <div
          className={`flex items-center justify-between p-4 rounded-lg animate-fadeIn backdrop-blur border ${
            txStatus.type === "success"
              ? "bg-green-500/10 border-green-500/50 text-green-200"
              : "bg-red-500/10 border-red-500/50 text-red-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {txStatus.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium text-sm">{txStatus.message}</span>
          </div>
          <button onClick={() => setTxStatus(null)} className="text-gray-400 hover:text-white transition-all">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg backdrop-blur">
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
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-8 text-center">
          <div className="p-4 bg-orange-600/20 rounded-full w-fit mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 font-poppins">Vault Not Initialized</h3>
          <p className="text-gray-400 mb-6 font-inter">
            Set up your heartbeat interval to start protecting your assets.
          </p>
          <button
            onClick={() => setShowInitModal(true)}
            disabled={!isOwner}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
          >
            {isOwner ? "Initialize Vault" : "Only Owner Can Initialize"}
          </button>
        </div>
      )}

      {/* Vault Active - Main Dashboard */}
      {vaultStatus && vaultStatus.isActive && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Heartbeat Status */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-orange-600/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-600/20 rounded-lg">
                  <Heart className="w-5 h-5 text-orange-600" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    vaultStatus.isExpired ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {vaultStatus.isExpired ? "EXPIRED" : "ACTIVE"}
                </span>
              </div>
              <p className="text-2xl font-bold text-white font-poppins">
                {vaultStatus.isExpired ? "0s" : formatTimeRemaining(vaultStatus.timeUntilExpiry)}
              </p>
              <p className="text-xs text-gray-400 mt-2 font-inter">Until Next Heartbeat</p>
            </div>

            {/* Vault Balance */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-orange-600/50 transition-all">
              <div className="p-2 bg-orange-600/20 rounded-lg w-fit mb-4">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-white font-poppins">
                {ethers.formatEther(vaultStatus.contractBalance)} ETH
              </p>
              <p className="text-xs text-gray-400 mt-2 font-inter">Vault Balance</p>
            </div>

            {/* Beneficiaries */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-orange-600/50 transition-all">
              <div className="p-2 bg-orange-600/20 rounded-lg w-fit mb-4">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-white font-poppins">{beneficiaries.length}</p>
              <p className="text-xs text-gray-400 mt-2 font-inter">Beneficiaries</p>
            </div>

            {/* Heartbeat Interval */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-orange-600/50 transition-all">
              <div className="p-2 bg-orange-600/20 rounded-lg w-fit mb-4">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-white font-poppins">
                {Number(vaultStatus.heartbeatInterval) / 86400}d
              </p>
              <p className="text-xs text-gray-400 mt-2 font-inter">Heartbeat Interval</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={handleSendHeartbeat}
              disabled={loading || !isOwner || vaultStatus.isExpired}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg font-poppins"
            >
              <Heart className="w-5 h-5" />
              <span>{loading ? "Sending..." : "Send Heartbeat"}</span>
            </button>

            <button
              onClick={() => setShowAddBeneficiaryModal(true)}
              disabled={loading || !isOwner}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg font-poppins"
            >
              <Users className="w-5 h-5" />
              <span>Add Beneficiary</span>
            </button>

            <button
              onClick={() => setShowFundModal(true)}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg font-poppins"
            >
              <DollarSign className="w-5 h-5" />
              <span>Fund Vault</span>
            </button>
          </div>

          {/* Advanced Actions */}
          {vaultStatus && vaultStatus.isActive && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <span>Advanced Actions</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trigger Inheritance */}
                {vaultStatus.isExpired && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Heartbeat Expired!</h4>
                        <p className="text-sm text-gray-400">
                          The heartbeat has expired. Anyone can trigger inheritance to distribute funds to
                          beneficiaries.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTriggerInheritance}
                      disabled={loading || totalAllocated !== 100}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>{loading ? "Triggering..." : "Trigger Inheritance"}</span>
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
                          <p className="text-xs text-gray-500 text-center">Deactivating allows you to withdraw funds</p>
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
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white font-poppins">Beneficiaries</h3>
                <span className="text-sm text-gray-400 bg-gray-900/50 px-3 py-1 rounded-full font-inter">
                  Allocated: {totalAllocated.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-3">
                {beneficiaries.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900/50 p-4 rounded-lg hover:bg-gray-900/70 transition-all border border-gray-700/30 gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-white font-mono text-sm mb-1">
                        {b.beneficiaryAddress.slice(0, 6)}...{b.beneficiaryAddress.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-400 font-inter">
                        Share: {(Number(b.sharePercentage) / 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <div className="text-right mr-4">
                        <p className="text-orange-600 font-semibold text-lg font-poppins">
                          {(Number(b.sharePercentage) / 100).toFixed(1)}%
                        </p>
                      </div>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedBeneficiary(b.beneficiaryAddress)
                              setNewSharePercentage((Number(b.sharePercentage) / 100).toString())
                              setShowUpdateBeneficiaryModal(true)
                            }}
                            disabled={loading}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 border border-gray-600"
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
          )}

          {/* Transaction History */}
          <TransactionHistory />
        </>
      )}

      {/* Initialize Vault Modal */}
      {showInitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 font-poppins">Initialize Vault</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2 font-inter">Heartbeat Interval (days)</label>
              <input
                type="number"
                value={heartbeatDays}
                onChange={(e) => setHeartbeatDays(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-600 focus:outline-none transition-all font-inter"
                min="1"
                max="365"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleInitializeVault}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 font-poppins"
              >
                {loading ? "Initializing..." : "Initialize"}
              </button>
              <button
                onClick={() => setShowInitModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all font-poppins"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {showAddBeneficiaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 font-poppins">Add Beneficiary</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-inter">Beneficiary Address</label>
                <input
                  type="text"
                  value={beneficiaryAddress}
                  onChange={(e) => setBeneficiaryAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-orange-600 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-inter">Share Percentage (%)</label>
                <input
                  type="number"
                  value={beneficiaryShare}
                  onChange={(e) => setBeneficiaryShare(e.target.value)}
                  placeholder="e.g., 50 for 50%"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-600 focus:outline-none transition-all font-inter"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <p className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded font-inter">
                Currently allocated: {totalAllocated.toFixed(1)}%. Total must equal 100%.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddBeneficiary}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 font-poppins"
              >
                {loading ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => setShowAddBeneficiaryModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all font-poppins"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Beneficiary Modal */}
      {showUpdateBeneficiaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 font-poppins">Update Beneficiary Share</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-inter">Beneficiary Address</label>
                <input
                  type="text"
                  value={selectedBeneficiary}
                  disabled
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-gray-500 font-mono text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-inter">New Share Percentage (%)</label>
                <input
                  type="number"
                  value={newSharePercentage}
                  onChange={(e) => setNewSharePercentage(e.target.value)}
                  placeholder="e.g., 50 for 50%"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-600 focus:outline-none transition-all font-inter"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <p className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded font-inter">
                Currently allocated: {totalAllocated.toFixed(1)}%. Total must equal 100%.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateBeneficiary}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 font-poppins"
              >
                {loading ? "Updating..." : "Update"}
              </button>
              <button
                onClick={() => {
                  setShowUpdateBeneficiaryModal(false)
                  setSelectedBeneficiary("")
                  setNewSharePercentage("")
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all font-poppins"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Vault Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 font-poppins">Fund Vault</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2 font-inter">Amount (ETH)</label>
              <input
                type="text"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="0.1"
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-600 focus:outline-none transition-all font-inter"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleFundVault}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 font-poppins"
              >
                {loading ? "Sending..." : "Fund"}
              </button>
              <button
                onClick={() => setShowFundModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all font-poppins"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
