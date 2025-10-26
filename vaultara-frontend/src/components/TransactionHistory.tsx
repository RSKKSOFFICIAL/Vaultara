import { ExternalLink, Clock, Activity, TrendingUp } from "lucide-react"
import { useBlockscout } from "../hooks/useBlockscout"

export const TransactionHistory = () => {
    const { transactions, loading, error, formatTimestamp, getTransactionType } = useBlockscout()

    if (loading && transactions.length === 0) {
        return (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span>Transaction History</span>
                </h3>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                    <p className="text-gray-400 mt-4 text-sm">Loading transactions...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span>Transaction History</span>
                </h3>
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                    <p>Error loading transactions: {error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span>Transaction History</span>
                </h3>
                <a
                    href={`https://eth-sepolia.blockscout.com/address/0xC11949532F5C46d567D254dCcFAd4BDC87f1306A`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center space-x-1 transition-all"
                >
                    <span>View on Blockscout</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No transactions yet</p>
                    <p className="text-gray-500 text-sm mt-2">Transactions will appear here once you interact with the vault</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.slice(0, 10).map((tx, idx) => (
                        <div
                            key={idx}
                            className="bg-slate-900/50 p-4 rounded-lg hover:bg-slate-900/70 transition-all border border-slate-700/30"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${tx.isError === "0" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                                                }`}
                                        >
                                            {tx.isError === "0" ? "Success" : "Failed"}
                                        </span>
                                        <span className="text-cyan-400 font-semibold text-sm">
                                            {getTransactionType(tx.methodId, tx.functionName)}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatTimestamp(tx.timeStamp)}</span>
                                    </div>
                                </div>
                                <a
                                    href={`https://eth-sepolia.blockscout.com/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:text-cyan-300 transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Block:</span>
                                    <span className="text-gray-300 font-mono">{tx.blockNumber}</span>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-gray-500">Hash:</span>
                                    <span className="text-gray-300 font-mono">
                                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                                    </span>
                                </div>
                                {tx.value !== "0" && (
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-gray-500">Value:</span>
                                        <span className="text-green-400 font-semibold">
                                            {(Number.parseInt(tx.value) / 1e18).toFixed(4)} ETH
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
                <p className="text-xs text-gray-500">
                    Powered by{" "}
                    <a
                        href="https://blockscout.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-all"
                    >
                        Blockscout
                    </a>
                </p>
            </div>
        </div>
    )
}
