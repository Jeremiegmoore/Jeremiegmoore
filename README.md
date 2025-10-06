# @Jeremiegmoore

## 🔐 Security Configuration

This repository contains crypto wallet recovery and management scripts. All sensitive information (wallet addresses, private keys, API keys) should be configured via environment variables.

### Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values with your actual configuration:
   - `VAULT_ADDRESS`: Your secure wallet address where funds will be swept
   - `VAULT_KEY`: Private key for your vault wallet (keep this secure!)
   - `INFURA_RPC`: Your Infura RPC endpoint URL
   - `ENS_NAME`: Your ENS name (if applicable)
   - `VALIDATOR_INDEX`: Your validator index (if running validator scripts)

3. **IMPORTANT**: Never commit your `.env` file to version control. It's already listed in `.gitignore`.

### Available Scripts

- `scripts/sweep_assets.js` - Sweep ETH, ERC20 tokens, and NFTs to your secure vault
- `scripts/fix_recovery_suite.js` - Patch sweep with recovery logging
- `scripts/portfolio_tracker.js` - Track portfolio balance
- `scripts/recovery_suite.js` - Full recovery suite with validator rotation
- `scripts/run_local_sync.js` - Sync data to IPFS and ENS
- `scripts/ens_ipfs_sync.js` - ENS and IPFS synchronization

### Security Best Practices

- ⚠️ Never share your `.env` file
- ⚠️ Never commit private keys or wallet addresses to Git
- ⚠️ Use a dedicated secure wallet for sweeping operations
- ⚠️ Test scripts on testnets first before using with real assets

<!---
Jeremiegmoore/Jeremiegmoore is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->
