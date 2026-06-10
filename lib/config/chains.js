// Chain / gateway configuration, grouped by the mechanism used to detect or create
// payments. Each key in the composed `chainConfigs` map becomes a `<KEY>Module` export
// (see ../paymentgateway.js). Tokens live separately in ./tokens.js.
//
//   explorerChains    - free public block-explorer crypto (Blockbook/Insight UTXO, EVM, Tron)
//   steemForkChains   - Graphene/Steem-family chains via native RPC (free)
//   antelopeChains    - Antelope/EOSIO chains via chain+history APIs (free)
//   hiveEngineChains  - Hive-Engine sidechain tokens (free)
//   hostedGateways    - merchant/payment-processor APIs (require API keys)

// --- Free, public block-explorer crypto (no API key) ---
const explorerChains = {
    // EVM (Blockbook-style; honor token contracts via the token registry)
    bnb: {
        url: 'https://bscbook.guarda.com/api',
        altExplorerUrls: ['https://bsc1.trezor.io/api', 'https://bsc2.trezor.io/api'],
        isSteemFork: false,
        isEVM: true,
        evmDecimals: 18
    },
    pol: {
        url: 'https://maticbook.guarda.com/api',
        altExplorerUrls: ['https://pol1.trezor.io/api', 'https://pol2.trezor.io/api'],
        isSteemFork: false,
        isEVM: true,
        evmDecimals: 18
    },
    eth: { url: 'https://ethbook.guarda.co/api', isSteemFork: false, isEVM: true, evmDecimals: 18 },
    etc: {
        url: 'https://etc1.trezor.io/api/',
        altExplorerUrls: ['https://etc2.trezor.io/api/'],
        isSteemFork: false,
        isEVM: true,
        evmDecimals: 18
    },

    // EVM L2s via Blockscout (Etherscan-family API, no key required). Token-capable;
    // detection uses the EVM-API adapter (txlist/tokentx), not Blockbook.
    base: { url: 'https://base.blockscout.com/api/', isEVM: true, explorerApi: 'blockscout', evmDecimals: 18 },
    arbitrum: { url: 'https://arbitrum.blockscout.com/api/', isEVM: true, explorerApi: 'blockscout', evmDecimals: 18 },
    optimism: { url: 'https://optimism.blockscout.com/api/', isEVM: true, explorerApi: 'blockscout', evmDecimals: 18 },
    gnosis: { url: 'https://gnosis.blockscout.com/api/', isEVM: true, explorerApi: 'blockscout', evmDecimals: 18 },

    // EVM chains via Routescan (Etherscan-compatible, no key; native + tokens).
    avax: { url: 'https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api/', isEVM: true, explorerApi: 'etherscan', evmDecimals: 18 },
    ftm: { url: 'https://api.routescan.io/v2/network/mainnet/evm/250/etherscan/api/', isEVM: true, explorerApi: 'etherscan', evmDecimals: 18 },

    // EVM chain via generic JSON-RPC fallback (publicnode/chainlist). TOKEN detection only
    // (eth_getLogs over a recent block range) — native-coin detection is NOT supported on
    // RPC-only chains. Any EVM chain can be added this way: set explorerApi:'evmrpc' + an RPC url.
    cronos: { url: 'https://cronos-evm-rpc.publicnode.com/', isEVM: true, explorerApi: 'evmrpc', evmDecimals: 18 },

    // Solana (native RPC; SOL + SPL tokens). Public RPC is rate-limited — for volume set
    // NEKOPAY_SOL_EXPLORER_URL to a Helius/QuickNode endpoint.
    sol: { url: 'https://api.mainnet-beta.solana.com/', isSolana: true, solDecimals: 9 },

    // Tron (TRC-20 tokens via the token registry)
    trx: { url: 'https://tronbook.guarda.com/api', isSteemFork: false, isTron: true, tronDecimals: 6 },
    tron: { url: 'https://tronbook.guarda.com/api', isSteemFork: false, isTron: true, tronDecimals: 6 },

    // UTXO / PoS coins via public Blockbook — no API key.
    // (Trezor dropped per-coin Blockbook for DASH/DGB/BTG; DASH/BTG repointed to live
    //  public Blockbook instances below. Endpoints verified reachable June 2026.)
    dash: {
        url: 'https://dash4.trezor.io/api/',
        isSteemFork: false
    },
    zec: {
        url: 'https://zec1.trezor.io/api/',
        altExplorerUrls: ['https://zec2.trezor.io/api/'],
        isSteemFork: false
    },
    btg: {
        url: 'https://btgexplorer.com/api/',
        isSteemFork: false
    },
    // DGB has no verified free public Blockbook in 2026 — run your own indexer and set
    // NEKOPAY_DGB_EXPLORER_URL, or override `url` per call. Default left as a placeholder.
    dgb: {
        url: 'https://dgb1.trezor.io/api/',
        isSteemFork: false,
        explorerOffline: true,
        verified: false
    },

    // UTXO / PoS coins via FlitsWallet & community explorers — no API key
    bch: { url: 'https://bchbook.guarda.com/api/', isSteemFork: false },
    // FlitsWallet LTC explorer was returning 502 (June 2026) — flag unverified; supply your
    // own via NEKOPAY_LTC_EXPLORER_URL if it stays down.
    ltc: { url: 'https://ltc.flitswallet.app/api/v1/', isSteemFork: false, verified: false },
    doge: { url: 'https://doge.flitswallet.app/api/v1/', isSteemFork: false },
    // dogec (DogeCash) & znz (Zenzo): public explorers offline as of 2026 and projects
    // dormant. Kept for backward compatibility — supply your own explorer via
    // NEKOPAY_DOGEC_EXPLORER_URL / NEKOPAY_ZNZ_EXPLORER_URL if you still need them.
    dogec: { url: 'https://dogecexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false, explorerOffline: true, verified: false },
    znz: { url: 'https://znzexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false, explorerOffline: true, verified: false },
    pivx: { url: 'https://explorer.duddino.com/api/v1/', isSteemFork: false },
    btc: { url: 'https://btc.flitswallet.app/api/v1/', isSteemFork: false },
    fls: { url: 'https://fls.flitswallet.app/api/v1/', isSteemFork: false },
    sapp: { url: 'https://sapp.flitswallet.app/api/v1/', isSteemFork: false },
    mobic: { url: 'https://mobic.flitswallet.app/api/v1/', isSteemFork: false },
    saga: { url: 'https://saga.flitswallet.app/api/v1/', isSteemFork: false },
    pny: { url: 'https://pny.flitswallet.app/api/v1/', isSteemFork: false },
    monk: { url: 'https://monk.flitswallet.app/api/v1/', isSteemFork: false },
    ucr: { url: 'https://ucr.flitswallet.app/api/v1/', isSteemFork: false },
    kyan: { url: 'https://kyan.flitswallet.app/api/v1/', isSteemFork: false },
    dashd: { url: 'https://dashd.flitswallet.app/api/v1/', isSteemFork: false },
    owo: { url: 'https://owo.flitswallet.app/api/v1/', isSteemFork: false },
    sevenSevenSeven: { url: 'https://777.flitswallet.app/api/v1/', isSteemFork: false },
    cfl: { url: 'https://cfl.flitswallet.app/api/v1/', isSteemFork: false },
    bir: { url: 'https://bir.flitswallet.app/api/v1/', isSteemFork: false },
    azr: { url: 'https://azr.flitswallet.app/api/v1/', isSteemFork: false },
    becn: { url: 'https://becn.flitswallet.app/api/v1/', isSteemFork: false },
    // SCC explorer is in a redirect loop (June 2026) — flag unverified.
    scc: { url: 'https://scc.flitswallet.app/api/v1/', isSteemFork: false, verified: false }
};

// --- Steem-family chains (native RPC, free) ---
const steemForkChains = {
    hive: {
        url: 'https://api.hive.blog/',
        isSteemFork: true,
        rpcKind: 'hive',
        assetSymbol: 'HIVE',
        rpcUrls: ['https://api.hive.blog', 'https://anyx.io', 'https://hived.privex.io', 'https://rpc.ausbit.dev', 'https://api.openhive.network']
    },
    hbd: {
        url: 'https://api.hive.blog/',
        isSteemFork: true,
        rpcKind: 'hive',
        assetSymbol: 'HBD',
        rpcUrls: ['https://api.hive.blog', 'https://anyx.io', 'https://hived.privex.io', 'https://rpc.ausbit.dev', 'https://api.openhive.network']
    },
    blurt: {
        url: 'https://rpc.beblurt.com/',
        isSteemFork: true,
        rpcKind: 'blurt',
        assetSymbol: 'BLURT',
        rpcUrls: ['https://rpc.beblurt.com', 'https://blurt-rpc.saboin.com', 'https://rpc.blurt.one', 'https://rpc.blurt.live']
    },
    steem: {
        url: 'https://api.steemit.com/',
        isSteemFork: true,
        rpcKind: 'steem',
        assetSymbol: 'STEEM',
        rpcUrls: ['https://api.steemit.com']
    },
    sbd: {
        url: 'https://api.steemit.com/',
        isSteemFork: true,
        rpcKind: 'steem',
        assetSymbol: 'SBD',
        rpcUrls: ['https://api.steemit.com']
    }
};

// --- Antelope / EOSIO chains (chain + history APIs, free) ---
const antelopeChains = {
    tlos: {
        url: 'https://telos.greymass.com/',
        isSteemFork: false,
        assetSymbol: 'TLOS',
        antelopeHistoryUrl: 'https://mainnet.telos.net/v2/history/get_actions',
        antelopeHistoryMethod: 'GET',
        antelopeChainUrl: 'https://telos.greymass.com/v1/chain/get_account',
        antelopeBalancesUrl: 'https://telos.greymass.com/v1/chain/get_currency_balance',
        antelopeBalancesMethod: 'POST',
        antelopeTxUrl: 'https://mainnet.telos.net/v2/history/get_transaction'
    },
    eos: {
        url: 'https://eos.greymass.com/',
        isSteemFork: false,
        assetSymbol: 'EOS',
        antelopeHistoryUrl: 'https://eos.greymass.com/v1/history/get_actions',
        antelopeBalancesUrl: 'https://api.eosauthority.com/v1/chain/get_currency_balance',
        antelopeBalancesMethod: 'POST',
        antelopeTxUrl: 'https://eos.hyperion.eosrio.io/v2/history/get_transaction'
    },
    fio: {
        url: 'https://fio.greymass.com/',
        isSteemFork: false,
        assetSymbol: 'FIO',
        antelopeHistoryUrl: 'https://fio.greymass.com/v1/history/get_actions',
        antelopeBalancesUrl: 'https://fio.greymass.com/v1/chain/get_fio_balance',
        antelopeBalancesMethod: 'POST',
        antelopeBalanceAddressKey: 'fio_public_key',
        antelopeTxUrl: 'https://fio.greymass.com/v1/history/get_transaction',
        antelopeTxMethod: 'POST'
    },
    wax: {
        url: 'https://wax.greymass.com/',
        isSteemFork: false,
        assetSymbol: 'WAX',
        antelopeHistoryUrl: 'https://wax.greymass.com/v1/history/get_actions',
        antelopeChainUrl: 'https://api.waxsweden.org/v1/chain/get_account',
        antelopeBalancesUrl: 'https://wax.light-api.net/api/balances/wax',
        antelopeTxUrl: 'https://wax.eosrio.io/v1/history/get_transaction',
        antelopeTxMethod: 'POST'
    }
};

// --- Hive-Engine sidechain (free) ---
const hiveEngineChains = {
    hiveengine: {
        url: "https://accounts.hive-engine.com/accountHistory?account=",
        isHiveEngine: true,
    }
};

// ============================================================================
// Hosted payment gateways (require API keys via env vars), grouped by category.
//
// Config-driven gateways use the generic create/get/list flow
// (PaymentAPI.createGenericGatewayPayment etc.) driven entirely by `gatewayProfile`
// + `auth`. Default endpoints reflect each provider's docs but CAN BE OVERRIDDEN
// per call: createPayment({ endpoint, body, headers }). `verified:false` means the
// base URL/auth are correct but you should confirm the exact create/get path against
// the provider's docs before going live. `authMode` documents non-header auth that you
// must include in the request body/params yourself. `deprecated:true` = provider shut
// down / rebranding — verify before use.
// ============================================================================

// --- Fiat / cards / bank / wallets ---
// verified:true  = bespoke, official integration with a confirmed base URL.
// verified:false = generic-profile endpoints are approximations / not a clean REST flow —
//                  confirm against provider docs (triggers a runtime "use at your own risk" warning).
const fiatGateways = {
    stripe: { url: 'https://api.stripe.com/v1/', isStripe: true, verified: true },
    paypal: { url: 'https://api-m.paypal.com/', isPayPal: true, verified: true },
    xsolla: { url: 'https://api.xsolla.com/', isXsolla: true, verified: true },
    woo: { url: 'https://placeholder.com/wp-json/wc/v3/', isWooCommerce: true, verified: true },
    // Skrill is a redirect/SID flow, not a clean JSON REST base.
    skrill: { url: 'https://www.skrill.com/', isSkrill: true, verified: false },
    payoneer: { url: 'https://api.payoneer.com/', isPayoneer: true, gatewayType: 'payoneer', verified: false },
    paymentwall: { url: 'https://api.paymentwall.com/api/', isPaymentwall: true, gatewayType: 'paymentwall', verified: false },
    square: { url: 'https://connect.squareup.com/', isSquare: true, gatewayType: 'square', verified: false },
    // Worldpay rebranded to "Access Worldpay" — api.worldpay.com no longer resolves.
    worldpay: { url: 'https://access.worldpay.com/', isWorldpay: true, gatewayType: 'worldpay', verified: false },
    amazonpay: { url: 'https://pay-api.amazon.com/', isAmazonPay: true, gatewayType: 'amazonpay', verified: false },
    // Apple Pay / Google Pay are not simple REST gateways (client-side token / per-session
    // merchant validation). Kept as placeholders — see DOCS.
    applepay: { url: 'https://api.apple.com/', isApplePay: true, gatewayType: 'applepay', verified: false },
    googlepay: { url: 'https://payments.google.com/', isGooglePay: true, gatewayType: 'googlepay', verified: false },
    wechatpay: { url: 'https://api.mch.weixin.qq.com/', isWeChatPay: true, gatewayType: 'wechatpay', verified: false },
    ofx: { url: 'https://api.ofx.com/v1/', isOFX: true, gatewayType: 'ofx', verified: false },
    fortumo: { url: 'https://api.fortumo.com/', isFortumo: true, gatewayType: 'fortumo', verified: false },
    authorizenet: { url: 'https://api.authorize.net/', isAuthorizeNet: true, gatewayType: 'authorizenet', verified: false },
    alipay: { url: 'https://openapi.alipay.com/', isAlipay: true, gatewayType: 'alipay', verified: false },
    // Prepaid vouchers (also offered inside Tebex Checkout; standalone API here).
    paysafecard: {
        url: 'https://api.paysafecard.com/', gatewayType: 'paysafecard', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'v1/payments', listEndpoint: 'v1/payments', getEndpoint: (id) => `v1/payments/${id}` },
        auth: { scheme: 'Bearer ', env: 'PAYSAFECARD_API_KEY' }, requiresAuth: true
    }
};

// --- Crypto payment processors (incl. per-order address generation + payout/forward) ---
const cryptoGateways = {
    // Legacy Coinbase Commerce (still operational). Coinbase migrated Commerce to the
    // onchain payment protocol / "Coinbase Business" — see `coinbasebusiness` below and DOCS.
    coinbase: { url: 'https://api.commerce.coinbase.com/', isCoinbase: true, verified: true },
    // Coinbase Business — new Payment Link / onchain payments API (2024–2026 successor to
    // Commerce). Confirm endpoints at docs.cdp.coinbase.com/coinbase-business.
    coinbasebusiness: {
        url: 'https://business.coinbase.com/api/v1/', gatewayType: 'coinbasebusiness', verified: false,
        gatewayProfile: { createEndpoint: 'payment-links', listEndpoint: 'payment-links', getEndpoint: (id) => `payment-links/${id}` },
        auth: { scheme: 'Bearer ', env: 'COINBASE_BUSINESS_API_KEY' }, requiresAuth: true
    },
    nowpayments: { url: 'https://api.nowpayments.io/v1/', isNowPayments: true, verified: true },
    opennode: { url: 'https://api.opennode.com/', isOpenNode: true, verified: true },
    // GoURL cryptobox endpoints are non-standard / not validated here.
    gourl: { url: 'https://coins.gourl.io/', isGoURL: true, verified: false },
    bitpay: { url: 'https://bitpay.com/', isBitPay: true, gatewayType: 'bitpay', verified: false },
    coingate: {
        url: 'https://api.coingate.com/v2/', gatewayType: 'coingate', verified: false,
        gatewayProfile: { createEndpoint: 'orders', listEndpoint: 'orders', getEndpoint: (id) => `orders/${id}` },
        auth: { scheme: 'Bearer ', env: 'COINGATE_API_TOKEN' }, requiresAuth: true
    },
    blockonomics: {
        url: 'https://www.blockonomics.co/api/', gatewayType: 'blockonomics', category: 'gateway-payout', verified: false,
        gatewayProfile: { createEndpoint: 'new_address', listEndpoint: 'searchhistory', getEndpoint: (id) => `tx_detail?txid=${id}` },
        auth: { scheme: 'Bearer ', env: 'BLOCKONOMICS_API_KEY' }, requiresAuth: true
    },
    btcpay: {
        // Self-hosted: set NEKOPAY_BTCPAY_EXPLORER_URL (or pass url) to your instance, and
        // override the create endpoint to api/v1/stores/{storeId}/invoices.
        url: 'https://your-btcpay-instance.example/', gatewayType: 'btcpay', verified: false, selfHosted: true,
        gatewayProfile: { createEndpoint: 'api/v1/invoices', listEndpoint: 'api/v1/invoices', getEndpoint: (id) => `api/v1/invoices/${id}` },
        auth: { scheme: 'token ', env: 'BTCPAY_API_KEY' }, requiresAuth: true
    },
    confirmo: {
        url: 'https://api.confirmo.net/', gatewayType: 'confirmo', verified: false,
        gatewayProfile: { createEndpoint: 'api/v3/invoices', listEndpoint: 'api/v3/invoices', getEndpoint: (id) => `api/v3/invoices/${id}` },
        auth: { scheme: 'Bearer ', env: 'CONFIRMO_API_KEY' }, requiresAuth: true
    },
    cryptomus: {
        url: 'https://api.cryptomus.com/v1/', gatewayType: 'cryptomus', verified: false,
        authMode: 'hmac: send `merchant` + `sign` (md5(base64(body)+API_KEY)) headers via createPayment({ headers })',
        gatewayProfile: { createEndpoint: 'payment', listEndpoint: 'payment/list', getEndpoint: () => 'payment/info' }
    },
    oxapay: {
        url: 'https://api.oxapay.com/', gatewayType: 'oxapay', category: 'gateway-payout', verified: false,
        authMode: 'body: include your merchant/payout key in the request body via createPayment({ body })',
        gatewayProfile: { createEndpoint: 'merchants/request', listEndpoint: 'merchants/list', getEndpoint: () => 'merchants/inquiry' }
    },
    plisio: {
        url: 'https://api.plisio.net/api/v1/', gatewayType: 'plisio', verified: false,
        authMode: 'query: append ?api_key=... via createPayment({ body: {...}, headers })',
        gatewayProfile: { createEndpoint: 'invoices/new', listEndpoint: 'operations', getEndpoint: (id) => `operations/${id}` }
    },
    coinpayments: {
        url: 'https://www.coinpayments.net/', gatewayType: 'coinpayments', verified: false,
        authMode: 'hmac: HMAC-SHA512 of POST body with your private key in the `HMAC` header',
        gatewayProfile: { createEndpoint: 'api.php', listEndpoint: 'api.php', getEndpoint: () => 'api.php' }
    },
    coinremitter: {
        url: 'https://api.coinremitter.com/v3/', gatewayType: 'coinremitter', verified: false,
        authMode: 'body: include api_key + password in the request body via createPayment({ body })',
        gatewayProfile: { createEndpoint: 'create-invoice', listEndpoint: 'get-invoices', getEndpoint: () => 'get-invoice' }
    },
    // Coinify — crypto payment gateway / buy-crypto API. Auth = API key + password (+ IPN
    // secret) with request signing; confirm the scheme at coinify.readme.io. Sandbox:
    // https://api.sandbox.coinify.com/v3/
    coinify: {
        url: 'https://api.coinify.com/v3/', gatewayType: 'coinify', verified: false,
        authMode: 'api key + password + signature (see coinify.readme.io) — supply via createPayment({ headers, body })',
        gatewayProfile: { createEndpoint: 'invoices', listEndpoint: 'invoices', getEndpoint: (id) => `invoices/${id}` }
    }
};

// --- Bitcoin Lightning ---
const lightningGateways = {
    zbd: {
        url: 'https://api.zebedee.io/v0/', gatewayType: 'zbd', verified: false,
        gatewayProfile: { createEndpoint: 'charges', listEndpoint: 'charges', getEndpoint: (id) => `charges/${id}` },
        auth: { name: 'apikey', scheme: '', env: 'ZBD_API_KEY' }, requiresAuth: true
    },
    strike: {
        url: 'https://api.strike.me/v1/', gatewayType: 'strike', verified: false,
        gatewayProfile: { createEndpoint: 'invoices', listEndpoint: 'invoices', getEndpoint: (id) => `invoices/${id}` },
        auth: { scheme: 'Bearer ', env: 'STRIKE_API_KEY' }, requiresAuth: true
    },
    speed: {
        url: 'https://api.tryspeed.com/', gatewayType: 'speed', verified: false,
        gatewayProfile: { createEndpoint: 'payments', listEndpoint: 'payments', getEndpoint: (id) => `payments/${id}` },
        auth: { basic: true, env: 'SPEED_SECRET_KEY' }, requiresAuth: true
    },
    alby: {
        url: 'https://api.getalby.com/', gatewayType: 'alby', verified: false,
        gatewayProfile: { createEndpoint: 'invoices', listEndpoint: 'invoices', getEndpoint: (id) => `invoices/${id}` },
        auth: { scheme: 'Bearer ', env: 'ALBY_ACCESS_TOKEN' }, requiresAuth: true
    }
};

// --- Gaming-server / Discord commerce (Tebex-style) ---
const gamingGateways = {
    tebex: { url: 'https://plugin.tebex.io/', isTebex: true, verified: true },
    craftingstore: { url: 'https://api.craftingstore.net/v2/', isCraftingStore: true, verified: true },
    // Sellix was reportedly seized / shut down in early 2024 — verify before relying on it.
    sellix: { url: 'https://dev.sellix.io/v1/', isSellix: true, deprecated: true, verified: false },
    paynow: {
        url: 'https://api.paynow.gg/v1/', gatewayType: 'paynow', verified: false,
        gatewayProfile: { createEndpoint: 'checkouts', listEndpoint: 'orders', getEndpoint: (id) => `orders/${id}` },
        auth: { scheme: 'apikey ', env: 'PAYNOW_API_KEY' }, requiresAuth: true
    },
    // Sellpass is rebranding to "Antistock" with development paused as of late 2025
    // (and carries trust warnings). Marked deprecated — use `antistock` (its successor).
    sellpass: {
        url: 'https://dev.sellpass.io/', gatewayType: 'sellpass', verified: false, deprecated: true,
        gatewayProfile: { createEndpoint: 'invoices', listEndpoint: 'invoices', getEndpoint: (id) => `invoices/${id}` },
        auth: { scheme: 'Bearer ', env: 'SELLPASS_API_KEY' }, requiresAuth: true
    },
    // Antistock — successor to Sellpass (antistock.io). Confirm the API base/endpoints
    // against their docs before production.
    antistock: {
        url: 'https://dev.antistock.io/', gatewayType: 'antistock', verified: false,
        gatewayProfile: { createEndpoint: 'invoices', listEndpoint: 'invoices', getEndpoint: (id) => `invoices/${id}` },
        auth: { scheme: 'Bearer ', env: 'ANTISTOCK_API_KEY' }, requiresAuth: true
    }
};

// --- Steam skins (CS2 / Dota 2 in-game items as payment) ---
// Both use a signed (HMAC) API — pass your shop id + computed signature via
// createPayment({ body, headers }). Confirm exact methods in the provider docs:
//   SkinPay:   https://skinpay.com/api-docs/
//   SkinsBack: https://skinsback.com (method-based api.php, md5 signature)
const skinsGateways = {
    skinpay: {
        url: 'https://skinpay.com/api/', gatewayType: 'skinpay', verified: false,
        authMode: 'hmac: api key + signature in the request body (see skinpay.com/api-docs)',
        gatewayProfile: { createEndpoint: 'create', listEndpoint: 'list', getEndpoint: (id) => `status/${id}` }
    },
    skinsback: {
        url: 'https://skinsback.com/', gatewayType: 'skinsback', verified: false,
        authMode: 'hmac: shopid + md5 signature of sorted params, or X-CLIENT-ID/X-CLIENT-SECRET headers',
        gatewayProfile: { createEndpoint: 'api.php', listEndpoint: 'api.php', getEndpoint: () => 'api.php' }
    },
    // Skins.cash — strongest reputation of the skin gateways, but the deposit/payment API
    // is partnership-gated: apply at skins.cash/partnership/deposit-skins to get your
    // real base URL + credentials, then override `url`/endpoints.
    skinscash: {
        url: 'https://skins.cash/', gatewayType: 'skinscash', verified: false,
        authMode: 'partnership-gated: base URL + auth supplied after approval — override url/headers',
        gatewayProfile: { createEndpoint: 'deposit', listEndpoint: 'deposits', getEndpoint: (id) => `deposit/${id}` }
    },
    // PaySkin — docs at docs.payskin.gg (transaction creation + refunds). Base URL unconfirmed.
    payskin: {
        url: 'https://api.payskin.gg/', gatewayType: 'payskin', verified: false,
        authMode: 'api key + merchant id (see docs.payskin.gg) — pass via createPayment({ headers })',
        gatewayProfile: { createEndpoint: 'transactions', listEndpoint: 'transactions', getEndpoint: (id) => `transactions/${id}` }
    },
    // Skinify — documented API (skinify.io/en/api-docs) but thin independent reputation;
    // low-volume pilot only. Base URL/auth unconfirmed.
    skinify: {
        url: 'https://skinify.io/api/', gatewayType: 'skinify', verified: false,
        authMode: 'api key (see skinify.io/en/api-docs) — pass via createPayment({ headers })',
        gatewayProfile: { createEndpoint: 'deposit', listEndpoint: 'deposits', getEndpoint: (id) => `deposit/${id}` }
    }
};

// --- Regional / global PSP aggregators (one API → many local payment methods) ---
// These unlock most country-specific methods (iDEAL, Pix, UPI, OXXO, M-Pesa, Klarna,
// Bancontact, BLIK, ...) without a separate integration each. Categorized as fiat.
// All verified:false — confirm the exact create/get path against the provider's docs.
const pspGateways = {
    mollie: {  // EU: iDEAL, Bancontact, Przelewy24, KBC, Klarna...
        url: 'https://api.mollie.com/v2/', gatewayType: 'mollie', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'payments', listEndpoint: 'payments', getEndpoint: (id) => `payments/${id}` },
        auth: { scheme: 'Bearer ', env: 'MOLLIE_API_KEY' }, requiresAuth: true
    },
    mercadopago: {  // LatAm: Pix, PSE, OXXO, boleto...
        url: 'https://api.mercadopago.com/', gatewayType: 'mercadopago', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'checkout/preferences', listEndpoint: 'v1/payments/search', getEndpoint: (id) => `v1/payments/${id}` },
        auth: { scheme: 'Bearer ', env: 'MERCADOPAGO_ACCESS_TOKEN' }, requiresAuth: true
    },
    razorpay: {  // India: UPI, netbanking, cards...
        url: 'https://api.razorpay.com/v1/', gatewayType: 'razorpay', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'payment_links', listEndpoint: 'payment_links', getEndpoint: (id) => `payment_links/${id}` },
        auth: { basic: true, env: 'RAZORPAY_KEY_ID', env2: 'RAZORPAY_KEY_SECRET' }, requiresAuth: true
    },
    paystack: {  // Africa: cards, bank, mobile money
        url: 'https://api.paystack.co/', gatewayType: 'paystack', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'transaction/initialize', listEndpoint: 'transaction', getEndpoint: (id) => `transaction/verify/${id}` },
        auth: { scheme: 'Bearer ', env: 'PAYSTACK_SECRET_KEY' }, requiresAuth: true
    },
    flutterwave: {  // Africa: M-Pesa, mobile money, cards
        url: 'https://api.flutterwave.com/v3/', gatewayType: 'flutterwave', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'payments', listEndpoint: 'transactions', getEndpoint: (id) => `transactions/${id}/verify` },
        auth: { scheme: 'Bearer ', env: 'FLUTTERWAVE_SECRET_KEY' }, requiresAuth: true
    },
    checkoutcom: {  // global aggregator
        url: 'https://api.checkout.com/', gatewayType: 'checkoutcom', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'payments', listEndpoint: 'payments', getEndpoint: (id) => `payments/${id}` },
        auth: { scheme: 'Bearer ', env: 'CHECKOUT_SECRET_KEY' }, requiresAuth: true
    },
    adyen: {  // global aggregator — live base URL is account-prefix specific, override `url`
        url: 'https://checkout-test.adyen.com/v71/', gatewayType: 'adyen', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'payments', listEndpoint: 'payments', getEndpoint: (id) => `payments/${id}` },
        auth: { name: 'X-API-Key', scheme: '', env: 'ADYEN_API_KEY' }, requiresAuth: true
    },
    klarna: {  // BNPL — region base differs (api-na/api-eu/api-oc), override `url`
        url: 'https://api.klarna.com/', gatewayType: 'klarna', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'payments/v1/sessions', listEndpoint: 'ordermanagement/v1/orders', getEndpoint: (id) => `payments/v1/sessions/${id}` },
        auth: { basic: true, env: 'KLARNA_USERNAME', env2: 'KLARNA_PASSWORD' }, requiresAuth: true
    },
    revolut: {  // Revolut Pay / Merchant API
        url: 'https://merchant.revolut.com/api/', gatewayType: 'revolut', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'orders', listEndpoint: 'orders', getEndpoint: (id) => `orders/${id}` },
        auth: { scheme: 'Bearer ', env: 'REVOLUT_SECRET_KEY' }, requiresAuth: true
    },
    pagseguro: {  // Brazil: Pix, boleto, cards
        url: 'https://api.pagseguro.com/', gatewayType: 'pagseguro', category: 'gateway-fiat', verified: false,
        gatewayProfile: { createEndpoint: 'orders', listEndpoint: 'orders', getEndpoint: (id) => `orders/${id}` },
        auth: { scheme: 'Bearer ', env: 'PAGSEGURO_TOKEN' }, requiresAuth: true
    }
};

// --- Bank transfer / mobile money / open banking ---
// Mostly payout/transfer or pay-by-bank (payment-initiation) rails, not card checkout.
// All verified:false — confirm flows/endpoints against provider docs.
const bankGateways = {
    // Wise (ex-TransferWise) Platform/Business API — payouts & transfers to bank accounts.
    // NOT a card-checkout gateway. Multi-step (quote → recipient → transfer → fund);
    // the create default hits quotes. Sandbox: https://api.sandbox.transferwise.tech/
    wise: {
        url: 'https://api.transferwise.com/', gatewayType: 'wise', category: 'gateway-bank', verified: false,
        gatewayProfile: { createEndpoint: 'v1/quotes', listEndpoint: 'v1/transfers', getEndpoint: (id) => `v1/transfers/${id}` },
        auth: { scheme: 'Bearer ', env: 'WISE_API_TOKEN' }, requiresAuth: true
    },
    // GoCardless — bank debit / recurring pulls. Needs a `GoCardless-Version` header too
    // (pass via createPayment({ headers: { 'GoCardless-Version': '2015-07-06' } })).
    gocardless: {
        url: 'https://api.gocardless.com/', gatewayType: 'gocardless', category: 'gateway-bank', verified: false,
        gatewayProfile: { createEndpoint: 'billing_requests', listEndpoint: 'payments', getEndpoint: (id) => `payments/${id}` },
        auth: { scheme: 'Bearer ', env: 'GOCARDLESS_ACCESS_TOKEN' }, requiresAuth: true
    },
    // TrueLayer — open-banking pay-by-bank (payment initiation), UK/EU.
    truelayer: {
        url: 'https://api.truelayer.com/', gatewayType: 'truelayer', category: 'gateway-bank', verified: false,
        gatewayProfile: { createEndpoint: 'v3/payments', listEndpoint: 'v3/payments', getEndpoint: (id) => `v3/payments/${id}` },
        auth: { scheme: 'Bearer ', env: 'TRUELAYER_ACCESS_TOKEN' }, requiresAuth: true
    },
    // Plaid — account linking + ACH/bank transfers (US-centric). Auth is client_id+secret
    // in the request body, not a header — pass via createPayment({ body }).
    plaid: {
        url: 'https://production.plaid.com/', gatewayType: 'plaid', category: 'gateway-bank', verified: false,
        authMode: 'body: include client_id + secret in the request body via createPayment({ body })',
        gatewayProfile: { createEndpoint: 'transfer/create', listEndpoint: 'transfer/list', getEndpoint: () => 'transfer/get' }
    }
};

// All hosted gateways composed into one lookup.
const hostedGateways = {
    ...fiatGateways,
    ...pspGateways,
    ...bankGateways,
    ...cryptoGateways,
    ...lightningGateways,
    ...gamingGateways,
    ...skinsGateways
};

// Composed lookup used by the rest of the package (key -> config).
const chainConfigs = {
    ...hiveEngineChains,
    ...steemForkChains,
    ...antelopeChains,
    ...explorerChains,
    ...hostedGateways
};

module.exports = {
    chainConfigs,
    explorerChains,
    steemForkChains,
    antelopeChains,
    hiveEngineChains,
    hostedGateways,
    // hosted-gateway sub-groups (used by the registry for categorization)
    fiatGateways,
    pspGateways,
    bankGateways,
    cryptoGateways,
    lightningGateways,
    gamingGateways,
    skinsGateways
};
