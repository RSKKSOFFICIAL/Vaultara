# Vaultara - Frontend Application

##  Overview

Modern, responsive React application for interacting with the Vaultara inheritance smart contract. Built with TypeScript, Tailwind CSS, and ethers.js for seamless Web3 integration.

##  Features

###  Wallet Connection
- MetaMask integration
- Auto-detect network
- One-click wallet switching to Sepolia
- Disconnect functionality

###  Owner Dashboard
- **Vault Initialization**: Set heartbeat interval
- **Heartbeat Management**: Send periodic heartbeats
- **Beneficiary Management**: Add, edit, and remove beneficiaries
- **Fund Management**: Deposit and withdraw ETH
- **Real-time Status**: Live countdown timer and vault statistics

###  Security & Privacy
- **Lit Protocol Integration**: Encrypted beneficiary data
- **On-chain Verification**: All actions verifiable on Blockscout
- **Access Control**: Owner-only operations enforced

###  Transaction History
- **Blockscout Integration**: Live transaction feed
- **Event Tracking**: Heartbeats, beneficiary additions, inheritance triggers
- **Transaction Links**: Direct links to block explorer

##  Tech Stack

- **React**: ^19.1.1
- **TypeScript**: ^5.9.3
- **Vite**: ^7.1.7
- **Ethers.js**: ^6.13.0
- **Tailwind CSS**: ^4.1.16
- **Lucide React**: Icons
- **Lit Protocol**: Encryption
- **Blockscout SDK**: Live transaction

##  Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
MetaMask browser extension
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

##  Project Structure

```
vaultara-frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard component
│   │   └── TransactionHistory.tsx # Transaction feed
│   ├── hooks/
│   │   ├── useWallet.ts           # Wallet connection logic
│   │   ├── useVaultaraContract.ts # Smart contract interactions
│   │   ├── useLitProtocol.ts      # Encryption/decryption
│   │   └── useBlockscout.ts       # Transaction history
│   ├── contracts/
│   │   ├── VaultaraInheritance.json  # Contract ABI
│   │   └── config.ts                 # Contract address & network config
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── index.html                     # HTML template
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind configuration
└── tsconfig.json                  # TypeScript configuration
```

##  Key Components

### Dashboard Component

Main interface for vault management:

```typescript
Features:
- Vault status display (active/inactive/expired)
- Heartbeat countdown timer
- Beneficiary list with CRUD operations
- Fund management (deposit/withdraw)
- Transaction confirmation modals
```

### Transaction History Component

Real-time transaction feed from Blockscout:

```typescript
Features:
- Auto-refreshing transaction list
- Event type indicators
- Direct links to block explorer
- Success/failure status
- Timestamp display
```

### Custom Hooks

#### `useWallet`
- Wallet connection/disconnection
- Network detection and switching
- Account management
- MetaMask event listeners

#### `useVaultaraContract`
- Contract read/write operations
- Transaction handling
- Error management
- Real-time data refresh

#### `useLitProtocol`
- Beneficiary data encryption
- Decryption with access control
- Fallback encryption for stability

#### `useBlockscout`
- Transaction history fetching
- Event parsing
- Auto-refresh functionality

##  User Flows

### 1. Initialize Vault
```
Connect Wallet → Initialize Vault → Set Heartbeat Interval → Confirm Transaction
```

### 2. Add Beneficiary
```
Add Beneficiary → Enter Address → Set Share % → Encrypt Data → Confirm Transaction
```

### 3. Send Heartbeat
```
Click Send Heartbeat → Confirm Transaction → Timer Resets
```

### 4. Trigger Inheritance (when expired)
```
Heartbeat Expires → Anyone Can Trigger → Funds Distributed Automatically
```

##  Design System

### Color Palette
- **Primary**: Purple (#8b5cf6)
- **Background**: Dark gradient (slate → purple → slate)
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)
- **Warning**: Yellow (#f59e0b)

### Components
- Glassmorphism cards
- Smooth animations
- Responsive design
- Dark mode default

##  Configuration

### Contract Configuration

Update `src/contracts/config.ts`:

```typescript
export const CONTRACT_ADDRESS = "0xYourContractAddress";
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY";
```

### Network Configuration

Supports:
- Sepolia Testnet (primary)
- Ethereum Mainnet (production)

##  Troubleshooting

### MetaMask Not Detected
```
Solution: Install MetaMask browser extension
Link: https://metamask.io/download/
```

### Wrong Network
```
Solution: App will prompt to switch to Sepolia
Click "Switch to Sepolia" button in header
```

### Transaction Failing
```
Common causes:
- Insufficient gas
- Contract conditions not met (e.g., total share ≠ 100%)
- Heartbeat not expired (for inheritance trigger)

Solution: Check error message for specific details
```

### Contract Not Loading
```
Solution: 
1. Check if connected to Sepolia
2. Verify contract address in config.ts
3. Check RPC endpoint is working
```

##  Responsive Design

- **Desktop**: Full feature set with side-by-side layout
- **Tablet**: Stacked layout with collapsible sections
- **Mobile**: Optimized touch targets and single-column layout

##  Performance

- Vite for fast development
- Code splitting
- Lazy loading
- Optimized bundle size
- Tree shaking enabled

##  Security Best Practices

- Never store private keys in code
- All sensitive operations require user confirmation
- Input validation on all forms
- Safe external link handling (`rel="noopener noreferrer"`)
- XSS protection via React

##  Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Build
npm run build

# Deploy dist folder to Netlify
```

### Environment Variables (if needed)

No environment variables required - contract address is in code.

##  Browser Support

- Chrome/Edg
- Firefox 
- Safari
- Opera
- Brave

**Note**: Requires browser with Web3 wallet extension (MetaMask recommended)

##  Contributing

This is a hackathon MVP. Suggestions welcome via GitHub issues.

##  License

MIT License

##  Support

For issues or questions:
- Open GitHub issue
- Check Blockscout for transaction details
- Review MetaMask activity tab

---

**Built with ⚡ Vite + React + TypeScript by [Ravi Shankar Kumar](https://x.com/RaviShanka5139)**