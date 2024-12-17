# Jupiter Protocol Token Sniper Bot

A Solana-based bot that monitors and automatically swaps tokens using Jupiter Protocol when they become available for trading.

## Features
- Monitors token availability on Jupiter Protocol
- Automatically executes swaps when tokens become tradable
- Configurable polling interval and slippage
- Uses Solana's versioned transactions for better reliability

## Prerequisites
- Node.js (v16 or higher)
- npm (Node Package Manager)
- A Solana wallet with SOL for transactions

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sol-sniper
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
SOLANA_RPC_URL=your_rpc_url_here
WALLET_PRIVATE_KEY=your_private_key_here
BITQUERY_BEARER_TOKEN=your_bearer_token_here
```
> ⚠️ **Security Warning**: Never share or commit your `.env` file. Keep your private key secure!

## Configuration

The bot's parameters can be modified in `index.js`:
- `POLLING_INTERVAL`: How often to check token availability (in milliseconds)
- `INPUT_TOKEN`: The token you're swapping from (default is SOL)
- `AMOUNT_TO_SWAP`: Amount to swap in lamports (smallest decimal)
- `SLIPPAGE_BPS`: Maximum slippage tolerance in basis points (100 = 1%)

## Usage

To start sniping a token:
```bash
npm run snipe <TOKEN_ADDRESS>
```

Replace `<TOKEN_ADDRESS>` with the address of the token you want to snipe.

Example:
```bash
npm run snipe 2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv
```

The bot will continuously monitor the token until it becomes tradable and then execute the swap immediately.

## RPC Recommendations

For better performance, consider using a premium RPC provider:
- [QuickNode](https://www.quicknode.com/)
- [Alchemy](https://www.alchemy.com/)
- [Helius](https://helius.xyz/)

## Important Notes

1. Ensure you have enough SOL in your wallet for:
   - The swap amount
   - Transaction fees
   - Any additional fees

2. The bot uses the Jupiter Protocol API v6

3. Test with small amounts first

4. Monitor your transactions on [Solscan](https://solscan.io)

## License

ISC

## Disclaimer

This bot is for educational purposes only. Use at your own risk. The authors are not responsible for any financial losses incurred while using this bot.