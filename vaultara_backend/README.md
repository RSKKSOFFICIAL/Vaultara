# Vaultara - Smart Contract Backend

##  Overview

The Vaultara smart contract is a self-sovereign crypto inheritance solution built on Ethereum. It ensures digital assets are never lost by implementing an automated heartbeat mechanism that transfers funds to designated beneficiaries if the owner becomes inactive.

##  Architecture

### Core Contract: `VaultaraInheritance.sol`

**Key Features:**
- Heartbeat mechanism for owner activity verification
- Encrypted beneficiary management
- Automatic fund distribution on inactivity
- Comprehensive security measures

### Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Ownable**: Access control for sensitive operations
- **Custom Errors**: Gas-efficient error handling
- **Input Validation**: All parameters validated before execution
- **Event Logging**: Complete on-chain audit trail

##  Tech Stack

- **Solidity**: ^0.8.20
- **Hardhat**: ^3.0.7
- **OpenZeppelin Contracts**: ^5.4.0
- **TypeScript**: ^5.8.0
- **Ethers.js**: ^6.15.0

##  Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables

Create a `.env` file with:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

##  Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npx hardhat coverage

# Run specific test file
npx hardhat test test/VaultaraInheritance.test.ts
```

### Test Coverage

- 48 comprehensive tests
- 100% function coverage
- Edge cases and security scenarios tested

## Smart Contract Functions

### Owner Functions

| Function                                   | Description                              | Access     |
| ------------------------------------------ | ---------------------------------------- | ---------- |
| `initializeVault(uint256 interval)`        | Initialize vault with heartbeat interval | Owner only |
| `sendHeartbeat()`                          | Send heartbeat to prove activity         | Owner only |
| `addBeneficiary(address, uint256, string)` | Add beneficiary with encrypted data      | Owner only |
| `updateBeneficiary(address, uint256)`      | Update beneficiary share                 | Owner only |
| `removeBeneficiary(address)`               | Remove a beneficiary                     | Owner only |
| `updateHeartbeatInterval(uint256)`         | Change heartbeat interval                | Owner only |
| `deactivateVault()`                        | Deactivate vault                         | Owner only |
| `withdrawFunds()`                          | Withdraw funds (when inactive)           | Owner only |

### Public Functions

| Function                   | Description                | Access                |
| -------------------------- | -------------------------- | --------------------- |
| `triggerInheritance()`     | Trigger fund distribution  | Anyone (when expired) |
| `isHeartbeatExpired()`     | Check if heartbeat expired | Public view           |
| `getActiveBeneficiaries()` | Get list of beneficiaries  | Public view           |
| `getTimeUntilExpiry()`     | Time until next heartbeat  | Public view           |

##  Contract Flow

```
1. Owner deploys contract
2. Owner initializes vault with heartbeat interval (e.g., 7 days)
3. Owner adds beneficiaries with share percentages (must total 100%)
4. Owner funds the contract with ETH
5. Owner sends periodic heartbeats to stay active
6. If heartbeat expires:
   - Anyone can call triggerInheritance()
   - Contract automatically distributes funds to beneficiaries
   - Vault becomes inactive
```

##  Deployment

### Deploy to Sepolia Testnet

```bash
npx hardhat ignition deploy ignition/modules/VaultaraInheritance.ts --network sepolia
```

### Verify on Blockscout

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

### Current Deployment

- **Network**: Sepolia Testnet
- **Contract Address**: `0xC11949532F5C46d567D254dCcFAd4BDC87f1306A`
- **Blockscout**: [View Contract](https://eth-sepolia.blockscout.com/address/0xC11949532F5C46d567D254dCcFAd4BDC87f1306A)

##  Gas Optimization

- Custom errors instead of revert strings
- Efficient storage patterns
- Minimal on-chain computation
- Optimized loops and iterations

##  Security Considerations

### Implemented

- Reentrancy protection
- Integer overflow/underflow protection (Solidity 0.8+)
- Access control modifiers
- Input validation
- Share percentage validation (must equal 100%)
- Heartbeat interval bounds (1-365 days)

### Auditing

This is a prototype/MVP. For production:
- Professional security audit required
- Formal verification recommended
- Bug bounty program suggested

## License

MIT License 

## Contributing

This is a hackathon project. For production improvements:
1. Fork the repository
2. Create feature branch
3. Submit pull request with tests

## Contact

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ for ETHOnline 2025 by [Ravi Shankar kumar](https://x.com/RaviShanka5139)**