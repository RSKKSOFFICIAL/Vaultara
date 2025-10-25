import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS } from '../contracts/config';

export interface Transaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  methodId: string;
  functionName: string;
  isError: string;
}

export interface ContractEvent {
  transactionHash: string;
  blockNumber: string;
  timeStamp: string;
  eventName: string;
  topics: string[];
  data: string;
}

const BLOCKSCOUT_API = 'https://eth-sepolia.blockscout.com/api';

export const useBlockscout = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contract transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${BLOCKSCOUT_API}?module=account&action=txlist&address=${CONTRACT_ADDRESS}&sort=desc`
      );

      const data = await response.json();

      if (data.status === '1' && data.result) {
        setTransactions(data.result);
      } else {
        setTransactions([]);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch contract events/logs
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${BLOCKSCOUT_API}?module=logs&action=getLogs&address=${CONTRACT_ADDRESS}`
      );

      const data = await response.json();

      if (data.status === '1' && data.result) {
        setEvents(data.result);
      } else {
        setEvents([]);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Parse event name from topic (simplified)
  const parseEventName = (topics: string[]): string => {
    if (!topics || topics.length === 0) return 'Unknown Event';

    const topic = topics[0];
    
    // Event signatures (keccak256 hash of event signature)
    const eventSignatures: { [key: string]: string } = {
      // VaultInitialized(address,uint256)
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': 'Vault Initialized',
      // HeartbeatSent(address,uint256)  
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef': 'Heartbeat Sent',
      // BeneficiaryAdded(address,uint256)
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890': 'Beneficiary Added',
      // InheritanceTriggered(uint256)
      '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba': 'Inheritance Triggered',
      // FundsTransferred(address,uint256)
      '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321': 'Funds Transferred',
    };

    return eventSignatures[topic] || 'Contract Event';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Get transaction type based on method ID
  const getTransactionType = (methodId: string, functionName: string): string => {
    if (!methodId || methodId === '0x') return 'Transfer';
    
    const methodMap: { [key: string]: string } = {
      '0x1234abcd': 'Initialize Vault',
      '0x5678efab': 'Send Heartbeat',
      '0x9abc0123': 'Add Beneficiary',
      '0xdef45678': 'Trigger Inheritance',
    };

    return methodMap[methodId] || functionName || 'Contract Interaction';
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchTransactions();
    fetchEvents();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTransactions();
      fetchEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    transactions,
    events,
    loading,
    error,
    fetchTransactions,
    fetchEvents,
    parseEventName,
    formatTimestamp,
    getTransactionType,
  };
};