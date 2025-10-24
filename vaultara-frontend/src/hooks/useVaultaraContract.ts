import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../contracts/config';
import VaultaraABI from '../contracts/VaultaraInheritance.json';

export interface VaultStatus {
    isActive: boolean;
    heartbeatInterval: bigint;
    lastHeartbeat: bigint;
    timeUntilExpiry: bigint;
    isExpired: boolean;
    owner: string;
    contractBalance: bigint;
}

export interface Beneficiary {
    beneficiaryAddress: string;
    sharePercentage: bigint;
    encryptedMetadata: string;
    isActive: boolean;
}

export const useVaultaraContract = (
    provider: ethers.BrowserProvider | null,
    signer: ethers.JsonRpcSigner | null
) => {
    const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get contract instance
    const getContract = () => {
        if (!signer) return null;
        return new ethers.Contract(CONTRACT_ADDRESS, VaultaraABI.abi, signer);
    };

    const getReadOnlyContract = () => {
        if (!provider) return null;
        return new ethers.Contract(CONTRACT_ADDRESS, VaultaraABI.abi, provider);
    };

    // Fetch vault status
    const fetchVaultStatus = async () => {
        try {
            const contract = getReadOnlyContract();
            if (!contract) return;

            const [
                isActive,
                heartbeatInterval,
                lastHeartbeat,
                timeUntilExpiry,
                isExpired,
                owner,
                balance
            ] = await Promise.all([
                contract.isActive(),
                contract.heartbeatInterval(),
                contract.lastHeartbeat(),
                contract.getTimeUntilExpiry(),
                contract.isHeartbeatExpired(),
                contract.owner(),
                provider!.getBalance(CONTRACT_ADDRESS)
            ]);

            setVaultStatus({
                isActive,
                heartbeatInterval,
                lastHeartbeat,
                timeUntilExpiry,
                isExpired,
                owner,
                contractBalance: balance
            });
        } catch (err: any) {
            console.error('Error fetching vault status:', err);
            setError(err.message);
        }
    };

    // Fetch beneficiaries
    const fetchBeneficiaries = async () => {
        try {
            const contract = getReadOnlyContract();
            if (!contract) return;

            const activeBeneficiaries = await contract.getActiveBeneficiaries();
            setBeneficiaries(activeBeneficiaries);
        } catch (err: any) {
            console.error('Error fetching beneficiaries:', err);
            setError(err.message);
        }
    };

    // Initialize vault
    const initializeVault = async (heartbeatIntervalDays: number) => {
        try {
            setLoading(true);
            setError(null);

            const contract = getContract();
            if (!contract) throw new Error('Contract not available');

            const intervalSeconds = heartbeatIntervalDays * 24 * 60 * 60;
            const tx = await contract.initializeVault(intervalSeconds);

            await tx.wait();
            await fetchVaultStatus();

            setLoading(false);
            return { success: true, txHash: tx.hash };
        } catch (err: any) {
            console.error('Error initializing vault:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    // Send heartbeat
    const sendHeartbeat = async () => {
        try {
            setLoading(true);
            setError(null);

            const contract = getContract();
            if (!contract) throw new Error('Contract not available');

            const tx = await contract.sendHeartbeat();
            await tx.wait();
            await fetchVaultStatus();

            setLoading(false);
            return { success: true, txHash: tx.hash };
        } catch (err: any) {
            console.error('Error sending heartbeat:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    // Add beneficiary
    const addBeneficiary = async (
        address: string,
        sharePercentage: number,
        encryptedMetadata: string
    ) => {
        try {
            setLoading(true);
            setError(null);

            const contract = getContract();
            if (!contract) throw new Error('Contract not available');

            // Share percentage is stored as basis points (e.g., 50% = 5000)
            const shareInBasisPoints = sharePercentage * 100;

            const tx = await contract.addBeneficiary(
                address,
                shareInBasisPoints,
                encryptedMetadata
            );

            await tx.wait();
            await fetchBeneficiaries();

            setLoading(false);
            return { success: true, txHash: tx.hash };
        } catch (err: any) {
            console.error('Error adding beneficiary:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    // Remove beneficiary
    const removeBeneficiary = async (address: string) => {
        try {
            setLoading(true);
            setError(null);

            const contract = getContract();
            if (!contract) throw new Error('Contract not available');

            const tx = await contract.removeBeneficiary(address);
            await tx.wait();
            await fetchBeneficiaries();

            setLoading(false);
            return { success: true, txHash: tx.hash };
        } catch (err: any) {
            console.error('Error removing beneficiary:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    // Trigger inheritance (can be called by anyone if heartbeat expired)
    const triggerInheritance = async () => {
        try {
            setLoading(true);
            setError(null);

            const contract = getContract();
            if (!contract) throw new Error('Contract not available');

            const tx = await contract.triggerInheritance();
            await tx.wait();
            await fetchVaultStatus();

            setLoading(false);
            return { success: true, txHash: tx.hash };
        } catch (err: any) {
            console.error('Error triggering inheritance:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    // Fund the vault (send ETH to contract)
    const fundVault = async (amountEth: string) => {
        try {
            setLoading(true);
            setError(null);

            if (!signer) throw new Error('Signer not available');

            const tx = await signer.sendTransaction({
                to: CONTRACT_ADDRESS,
                value: ethers.parseEther(amountEth)
            });

            await tx.wait();
            await fetchVaultStatus();

            setLoading(false);
            return { success: true, txHash: tx.hash };
        } catch (err: any) {
            console.error('Error funding vault:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    };

    // Auto-refresh vault status every 10 seconds
    useEffect(() => {
        if (provider) {
            fetchVaultStatus();
            fetchBeneficiaries();

            const interval = setInterval(() => {
                fetchVaultStatus();
                fetchBeneficiaries();
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [provider]);

    return {
        vaultStatus,
        beneficiaries,
        loading,
        error,
        initializeVault,
        sendHeartbeat,
        addBeneficiary,
        removeBeneficiary,
        triggerInheritance,
        fundVault,
        refreshData: () => {
            fetchVaultStatus();
            fetchBeneficiaries();
        }
    };
};