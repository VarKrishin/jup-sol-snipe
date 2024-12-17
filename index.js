require('dotenv').config();
const {
  Connection,
  PublicKey,
  VersionedTransaction,
  Keypair,
} = require("@solana/web3.js");
const fetch = require("cross-fetch");
const { Wallet } = require("@project-serum/anchor");
const bs58 = require("bs58");

// Initialize connection and wallet
const connection = new Connection(
    process.env.SOLANA_RPC_URL,
    {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0
    }
);
const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY)));

// Configuration
const POLLING_INTERVAL = 25; // 25ms = 0.025 seconds
const INPUT_TOKEN = "So11111111111111111111111111111111111111112"; // SOL
const LAMPORTS_PER_SOL = 1000000000; // 1e9
const AMOUNT_TO_SWAP_SOL = 0.5; // Amount in SOL
const AMOUNT_TO_SWAP = AMOUNT_TO_SWAP_SOL * LAMPORTS_PER_SOL; // Convert to lamports
const SLIPPAGE_BPS = 2500; // Increased to 25% from 1.5% to handle volatile tokens

async function checkAndSwapToken(outputToken) {
    try {
        let txSuccess = false;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (!txSuccess && retryCount < MAX_RETRIES) {
            try {
                // Get fresh quote for each attempt
                const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${INPUT_TOKEN}&outputMint=${outputToken}&amount=${AMOUNT_TO_SWAP}&slippageBps=${SLIPPAGE_BPS}`;
                
                const quoteResponse = await fetch(quoteUrl);
                const quoteData = await quoteResponse.json();

                if (quoteData.error || 
                    quoteData.errorCode === "TOKEN_NOT_TRADABLE" || 
                    quoteData.errorCode === "COULD_NOT_FIND_ANY_ROUTE") {
                    return false;
                }

                console.log(`Attempt ${retryCount + 1}: Executing swap with ${SLIPPAGE_BPS/100}% slippage tolerance...`);
                
                const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        quoteResponse: quoteData,
                        userPublicKey: wallet.publicKey.toString(),
                        wrapAndUnwrapSol: true,
                    }),
                });

                const { swapTransaction } = await swapResponse.json();
                const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
                
                const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
                transaction.sign([wallet.payer]);
                
                const rawTransaction = transaction.serialize();
                
                const txid = await connection.sendRawTransaction(rawTransaction, {
                    skipPreflight: true,
                    maxRetries: 2,
                    preflightCommitment: "processed",
                });

                // Wait for transaction confirmation
                console.log(`Transaction sent! Waiting for confirmation... ${txid}`);
                const confirmation = await connection.confirmTransaction(txid, "confirmed");
                
                if (confirmation.value.err) {
                    console.log(`Transaction failed: ${txid}`);
                    throw new Error("Transaction failed");
                }

                // Check if transaction was successful
                const txInfo = await connection.getTransaction(txid, {
                    commitment: "confirmed",
                    maxSupportedTransactionVersion: 0
                });

                if (txInfo && !txInfo.meta.err) {
                    console.log(`Swap successful! https://solscan.io/tx/${txid}`);
                    txSuccess = true;
                    return true;
                } else {
                    throw new Error("Transaction verification failed");
                }

            } catch (error) {
                retryCount++;
                console.log(`Attempt ${retryCount} failed: ${error.message}`);
                if (retryCount < MAX_RETRIES) {
                    console.log(`Retrying in 1 second...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        // If we've exhausted all retries and still no success, continue sniping
        console.log("All swap attempts failed, continuing to snipe...");
        return false;

    } catch (error) {
        console.error("Error in checkAndSwapToken:", error);
        return false;
    }
}

async function startSniping(tokenAddress) {
    console.log(`Starting to snipe token: ${tokenAddress}`);
    console.log(`Polling every ${POLLING_INTERVAL}ms...`);

    let successful = false;
    let startTime = Date.now();

    while (!successful) {
        successful = await checkAndSwapToken(tokenAddress);
        
        if (!successful) {
            // Use setTimeout with 0 to prevent event loop blocking
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            
            // Log every second
            if (Date.now() - startTime > 1000) {
                console.log(`Still searching... Time elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
                startTime = Date.now();
            }
        }
    }
}

// Usage example
if (require.main === module) {
    const targetToken = process.argv[2];
    if (!targetToken) {
        console.error("Please provide a token address to snipe!");
        process.exit(1);
    }

    startSniping(targetToken).catch(console.error);
}

module.exports = { startSniping }; 