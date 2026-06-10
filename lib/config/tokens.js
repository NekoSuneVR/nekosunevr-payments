const { chainConfigs } = require('./chains');

// Token registry: each key becomes a `<KEY>Module` export (e.g. USDT_BSCModule).
// `chain` references a base entry in chainConfigs (must be EVM or Tron). `contract`
// is the token contract address and `decimals` its on-chain precision.
// Add a new token by appending one line here — no other code changes required.
const tokenRegistry = {
    // --- Ethereum (ERC-20) ---
    USDT_ETH: { chain: 'eth', symbol: 'USDT', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    USDC_ETH: { chain: 'eth', symbol: 'USDC', contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },

    // --- BNB Smart Chain (BEP-20) ---
    USDT_BSC: { chain: 'bnb', symbol: 'USDT', contract: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    USDC_BSC: { chain: 'bnb', symbol: 'USDC', contract: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },

    // --- Polygon (PoS) ---
    USDT_POL: { chain: 'pol', symbol: 'USDT', contract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    USDC_POL: { chain: 'pol', symbol: 'USDC', contract: '0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359', decimals: 6 },

    // --- Tron (TRC-20) — contracts verified on Tronscan; mind the mixed decimals ---
    USDT_TRX: { chain: 'trx', symbol: 'USDT', contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6 },
    USDC_TRX: { chain: 'trx', symbol: 'USDC', contract: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', decimals: 6 },
    USDD_TRX: { chain: 'trx', symbol: 'USDD', contract: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz', decimals: 18 }, // USDD 2.0 (legacy TPYmHE… is now USDDOLD)
    TUSD_TRX: { chain: 'trx', symbol: 'TUSD', contract: 'TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4', decimals: 18 },
    JST_TRX: { chain: 'trx', symbol: 'JST', contract: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', decimals: 18 },
    SUN_TRX: { chain: 'trx', symbol: 'SUN', contract: 'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S', decimals: 18 },
    BTT_TRX: { chain: 'trx', symbol: 'BTT', contract: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4', decimals: 18 },
    WIN_TRX: { chain: 'trx', symbol: 'WIN', contract: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', decimals: 6 },
    WTRX_TRX: { chain: 'trx', symbol: 'WTRX', contract: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', decimals: 6 },
    NFT_TRX: { chain: 'trx', symbol: 'NFT', contract: 'TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq', decimals: 6 }, // APENFT (on-chain name now AINFT)
    HTX_TRX: { chain: 'trx', symbol: 'HTX', contract: 'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6', decimals: 18 },

    // --- EVM L2 tokens (native USDC on Base / Arbitrum / Optimism, via Blockscout) ---
    USDC_BASE: { chain: 'base', symbol: 'USDC', contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    USDC_ARBITRUM: { chain: 'arbitrum', symbol: 'USDC', contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    USDC_OPTIMISM: { chain: 'optimism', symbol: 'USDC', contract: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },

    // --- Solana SPL tokens (canonical mints; base58 case-sensitive) ---
    USDC_SOL: { chain: 'sol', symbol: 'USDC', contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
    USDT_SOL: { chain: 'sol', symbol: 'USDT', contract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },

    // --- Node/staking utility tokens (earn by running infrastructure) ---
    // Livepeer (run an orchestrator/transcoder), Mysterium (run a node / VPN relay).
    LPT_ETH: { chain: 'eth', symbol: 'LPT', contract: '0x58b6A8A3302369DAEc383334672404Ee733aB239', decimals: 18 },
    MYST_ETH: { chain: 'eth', symbol: 'MYST', contract: '0x4Cf89ca06ad997bC732Dc876ed2A7F26a9E7f361', decimals: 18 },
    MYST_POL: { chain: 'pol', symbol: 'MYST', contract: '0x1379e8886a944d2d9d440b3d88df536aea08d9f3', decimals: 18 },

    // --- High-value / liquid tokens (contracts verified on Etherscan/BscScan/PolygonScan) ---
    // Ethereum
    WBTC_ETH: { chain: 'eth', symbol: 'WBTC', contract: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    DAI_ETH: { chain: 'eth', symbol: 'DAI', contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    WETH_ETH: { chain: 'eth', symbol: 'WETH', contract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    LINK_ETH: { chain: 'eth', symbol: 'LINK', contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
    UNI_ETH: { chain: 'eth', symbol: 'UNI', contract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
    AAVE_ETH: { chain: 'eth', symbol: 'AAVE', contract: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18 },
    SHIB_ETH: { chain: 'eth', symbol: 'SHIB', contract: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18 },
    // BNB Smart Chain (BTCB is 18 decimals, not 8 — Binance-Peg wrapper)
    WBNB_BSC: { chain: 'bnb', symbol: 'WBNB', contract: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
    BTCB_BSC: { chain: 'bnb', symbol: 'BTCB', contract: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18 },
    ETH_BSC: { chain: 'bnb', symbol: 'ETH', contract: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 },
    CAKE_BSC: { chain: 'bnb', symbol: 'CAKE', contract: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 },
    // Polygon (WBTC is 8 decimals; WMATIC === WPOL, same address)
    WMATIC_POL: { chain: 'pol', symbol: 'WMATIC', contract: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    WETH_POL: { chain: 'pol', symbol: 'WETH', contract: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
    WBTC_POL: { chain: 'pol', symbol: 'WBTC', contract: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 },
    DAI_POL: { chain: 'pol', symbol: 'DAI', contract: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    LINK_POL: { chain: 'pol', symbol: 'LINK', contract: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18 }
};

// Build the ChainModule config for a token key by layering the token's contract
// and decimals on top of its base chain's explorer config. EVM tokens use
// `evmDecimals`; Tron tokens use `tronDecimals` (matching ChainModule's matching logic).
const buildTokenConfig = (tokenKey) => {
    const token = tokenRegistry[tokenKey];
    if (!token) throw new Error(`Unknown token: ${tokenKey}`);
    const baseConfig = chainConfigs[token.chain];
    if (!baseConfig) throw new Error(`Token ${tokenKey} references unknown chain "${token.chain}"`);
    const merged = {
        ...baseConfig,
        tokenContract: token.contract,
        assetSymbol: token.symbol
    };
    if (baseConfig.isTron) {
        merged.tronDecimals = token.decimals;
    } else if (baseConfig.isSolana) {
        merged.solDecimals = token.decimals;
    } else {
        merged.evmDecimals = token.decimals;
    }
    return merged;
};

module.exports = { tokenRegistry, buildTokenConfig };
