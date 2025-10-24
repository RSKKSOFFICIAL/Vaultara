import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_CHAIN_ID } from '../contracts/config';

export const useWallet = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if already connected on mount
    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []);

    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
            // User disconnected wallet
            disconnect();
        } else {
            setAccount(accounts[0]);
        }
    };

    const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
    };

    const checkIfWalletIsConnected = async () => {
        try {
            if (!window.ethereum) {
                setError('MetaMask is not installed');
                return;
            }

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            if (accounts.length > 0) {
                const ethersProvider = new ethers.BrowserProvider(window.ethereum);
                const ethersSigner = await ethersProvider.getSigner();
                const network = await ethersProvider.getNetwork();

                setProvider(ethersProvider);
                setSigner(ethersSigner);
                setAccount(accounts[0]);
                setChainId(Number(network.chainId));
            }
        } catch (err) {
            console.error('Error checking wallet connection:', err);
            setError('Failed to check wallet connection');
        }
    };

    const connectWallet = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            if (!window.ethereum) {
                setError('MetaMask is not installed. Please install MetaMask to use this app.');
                setIsConnecting(false);
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            const ethersSigner = await ethersProvider.getSigner();
            const network = await ethersProvider.getNetwork();

            setProvider(ethersProvider);
            setSigner(ethersSigner);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));

            // Check if on correct network
            if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
                await switchToSepolia();
            }

            setIsConnecting(false);
        } catch (err: any) {
            console.error('Error connecting wallet:', err);
            setError(err.message || 'Failed to connect wallet');
            setIsConnecting(false);
        }
    };

    const switchToSepolia = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                                chainName: 'Sepolia Testnet',
                                nativeCurrency: {
                                    name: 'Sepolia ETH',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://sepolia.infura.io/v3/'],
                                blockExplorerUrls: ['https://sepolia.etherscan.io'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error('Error adding Sepolia network:', addError);
                    setError('Failed to add Sepolia network to MetaMask');
                }
            } else {
                console.error('Error switching to Sepolia:', switchError);
                setError('Failed to switch to Sepolia network');
            }
        }
    };

    const disconnect = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
        setError(null);
    };

    const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

    return {
        account,
        provider,
        signer,
        chainId,
        isConnecting,
        error,
        isCorrectNetwork,
        connectWallet,
        disconnect,
        switchToSepolia,
    };
};

// Extend Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}