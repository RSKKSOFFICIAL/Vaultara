import { useState, useEffect } from 'react';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork, LIT_RPC } from '@lit-protocol/constants';
import { ethers } from 'ethers';

export const useLitProtocol = (account: string | null) => {
  const [litNodeClient, setLitNodeClient] = useState<LitNodeClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLit = async () => {
      try {
        const client = new LitNodeClient({
          litNetwork: LitNetwork.DatilDev,
          debug: false,
        });
        
        await client.connect();
        setLitNodeClient(client);
        setIsInitialized(true);
        console.log('✅ Lit Protocol initialized');
      } catch (err: any) {
        console.error('❌ Lit Protocol init error:', err);
        setError(err.message);
      }
    };

    initLit();

    return () => {
      litNodeClient?.disconnect();
    };
  }, []);

  /**
   * Encrypt beneficiary data using Lit Protocol
   */
  const encryptBeneficiary = async (
    beneficiaryAddress: string,
    ownerAddress: string
  ): Promise<string> => {
    if (!litNodeClient || !isInitialized) {
      console.warn('Lit not ready, using fallback encryption');
      return simpleFallbackEncrypt(beneficiaryAddress, ownerAddress);
    }

    try {
      const dataToEncrypt = JSON.stringify({
        beneficiary: beneficiaryAddress,
        timestamp: Date.now(),
      });

      // Access control: only owner wallet can decrypt
      const accessControlConditions = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: ownerAddress.toLowerCase(),
          },
        },
      ];

      const { ciphertext, dataToEncryptHash } = await litNodeClient.encrypt({
        accessControlConditions,
        dataToEncrypt,
      });

      // Combine into single string for storage
      return JSON.stringify({
        ciphertext,
        dataToEncryptHash,
        version: 'lit-v1',
      });
    } catch (err: any) {
      console.error('Encryption error, using fallback:', err);
      return simpleFallbackEncrypt(beneficiaryAddress, ownerAddress);
    }
  };

  /**
   * Decrypt beneficiary data
   */
  const decryptBeneficiary = async (
    encryptedData: string,
    ownerAddress: string,
    signer: ethers.JsonRpcSigner
  ): Promise<string | null> => {
    try {
      const parsed = JSON.parse(encryptedData);
      
      // Check if it's Lit encrypted or fallback
      if (parsed.version !== 'lit-v1') {
        return simpleFallbackDecrypt(encryptedData, ownerAddress);
      }

      if (!litNodeClient || !isInitialized) {
        return null;
      }

      const accessControlConditions = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: ownerAddress.toLowerCase(),
          },
        },
      ];

      const decryptedData = await litNodeClient.decrypt({
        accessControlConditions,
        ciphertext: parsed.ciphertext,
        dataToEncryptHash: parsed.dataToEncryptHash,
        chain: 'ethereum',
      });

      const decryptedString = new TextDecoder().decode(decryptedData);
      const data = JSON.parse(decryptedString);
      return data.beneficiary;
    } catch (err) {
      console.error('Decryption error:', err);
      return simpleFallbackDecrypt(encryptedData, ownerAddress);
    }
  };

  // Fallback simple encryption if Lit fails
  const simpleFallbackEncrypt = (beneficiaryAddress: string, ownerAddress: string): string => {
    const data = JSON.stringify({
      beneficiary: beneficiaryAddress,
      owner: ownerAddress,
      timestamp: Date.now(),
      version: 'simple-v1',
    });
    return btoa(data);
  };

  const simpleFallbackDecrypt = (encryptedString: string, ownerAddress: string): string | null => {
    try {
      const decoded = atob(encryptedString);
      const data = JSON.parse(decoded);
      if (data.owner?.toLowerCase() === ownerAddress.toLowerCase()) {
        return data.beneficiary;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Main API
  const simpleEncrypt = async (beneficiaryAddress: string, ownerAddress: string): Promise<string> => {
    return encryptBeneficiary(beneficiaryAddress, ownerAddress);
  };

  const simpleDecrypt = async (
    encryptedString: string,
    ownerAddress: string,
    signer?: ethers.JsonRpcSigner
  ): Promise<string | null> => {
    return decryptBeneficiary(encryptedString, ownerAddress, signer!);
  };

  return {
    isInitialized,
    error,
    simpleEncrypt,
    simpleDecrypt,
  };
};