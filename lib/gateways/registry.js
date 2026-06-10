// Registry: "which system handles which" — a single lookup describing every module
// the package exports, its category, the chain it targets, whether it is free
// (no API key), and which env vars it needs. Derived from the categorized config in
// ../config/chains.js and the token registry in ../config/tokens.js, so it stays in
// sync automatically as those grow.
const {
    explorerChains,
    steemForkChains,
    antelopeChains,
    hiveEngineChains,
    fiatGateways,
    pspGateways,
    bankGateways,
    cryptoGateways,
    lightningGateways,
    gamingGateways,
    skinsGateways
} = require('../config/chains');
const { tokenRegistry } = require('../config/tokens');

const moduleName = (key) => `${key.toUpperCase()}Module`;

// Required env vars per hosted gateway (mirrors PaymentAPI constructor validation).
const GATEWAY_ENV = {
    tebex: ['TEBEX_API_KEY'],
    coinbase: ['COINBASE_API_KEY'],
    sellix: ['SELLIX_API_KEY'],
    craftingstore: ['CRAFTINGSTORE_API_KEY'],
    stripe: ['STRIPE_API_KEY'],
    paypal: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
    xsolla: ['XSOLLA_MERCHANT_ID', 'XSOLLA_API_KEY', 'XSOLLA_PROJECT_ID'],
    skrill: ['SKRILL_MERCHANT_EMAIL', 'SKRILL_SECRET_WORD'],
    woo: ['WOOCOMMERCE_CONSUMER_KEY', 'WOOCOMMERCE_CONSUMER_SECRET'],
    nowpayments: ['NOWPAYMENTS_API_KEY'],
    opennode: ['OPENNODE_API_KEY'],
    gourl: ['GOURL_PUBLIC_KEY', 'GOURL_PRIVATE_KEY'],
    bitpay: ['BITPAY_API_KEY'],
    payoneer: ['PAYONEER_API_KEY'],
    paymentwall: ['PAYMENTWALL_API_KEY'],
    square: ['SQUARE_ACCESS_TOKEN'],
    worldpay: ['WORLDPAY_API_KEY'],
    amazonpay: ['AMAZON_PAY_API_KEY'],
    applepay: ['APPLE_PAY_API_KEY'],
    googlepay: ['GOOGLE_PAY_API_KEY'],
    wechatpay: ['WECHAT_PAY_API_KEY'],
    ofx: ['OFX_API_KEY'],
    fortumo: ['FORTUMO_API_KEY'],
    authorizenet: ['AUTHORIZE_NET_API_LOGIN_ID', 'AUTHORIZE_NET_TRANSACTION_KEY'],
    alipay: ['ALIPAY_API_KEY']
};

// Hosted-gateway groups → their default category. A per-entry `config.category`
// (e.g. 'gateway-payout') still wins over the group default.
const GATEWAY_GROUPS = [
    ['gateway-fiat', fiatGateways],
    ['gateway-fiat', pspGateways],
    ['gateway-bank', bankGateways],
    ['gateway-crypto', cryptoGateways],
    ['gateway-lightning', lightningGateways],
    ['gateway-gaming', gamingGateways],
    ['gateway-skins', skinsGateways]
];

const systems = {};
const register = (key, meta) => {
    systems[moduleName(key)] = { module: moduleName(key), key, ...meta };
};

Object.keys(explorerChains).forEach((key) => {
    const config = explorerChains[key];
    const category = config.isEVM ? 'crypto-evm' : config.isTron ? 'crypto-tron' : 'crypto-utxo';
    register(key, { category, chain: key, free: true, crypto: true, requiresKeys: [], explorerOffline: !!config.explorerOffline });
});
Object.keys(steemForkChains).forEach((key) => {
    register(key, { category: 'crypto-steemfork', chain: key, free: true, crypto: true, requiresKeys: [] });
});
Object.keys(antelopeChains).forEach((key) => {
    register(key, { category: 'crypto-antelope', chain: key, free: true, crypto: true, requiresKeys: [] });
});
Object.keys(hiveEngineChains).forEach((key) => {
    register(key, { category: 'crypto-hiveengine', chain: key, free: true, crypto: true, requiresKeys: [] });
});
GATEWAY_GROUPS.forEach(([groupCategory, group]) => {
    Object.keys(group).forEach((key) => {
        const config = group[key];
        // Per-entry category (e.g. 'gateway-payout') wins over the group default.
        const category = config.category || groupCategory;
        // Env vars: legacy map first, else derive from the config-driven auth descriptor.
        const requiresKeys = GATEWAY_ENV[key]
            || [config.auth && config.auth.env, config.auth && config.auth.env2].filter(Boolean);
        register(key, {
            category,
            chain: key,
            free: false,
            crypto: /crypto|lightning|payout/.test(category),
            requiresKeys,
            verified: config.verified !== false,
            selfHosted: !!config.selfHosted,
            deprecated: !!config.deprecated,
            explorerOffline: !!config.explorerOffline
        });
    });
});
Object.keys(tokenRegistry).forEach((key) => {
    const token = tokenRegistry[key];
    register(key, {
        category: 'token',
        chain: token.chain,
        free: true,
        crypto: true,
        requiresKeys: [],
        token: { symbol: token.symbol, contract: token.contract, decimals: token.decimals }
    });
});

// Resolve a module by its export name ("BTCModule"), bare key ("btc"), or token key.
const getSystem = (name) => {
    if (!name) return null;
    if (systems[name]) return systems[name];
    const asModule = String(name).endsWith('Module') ? String(name) : moduleName(String(name));
    return systems[asModule] || null;
};

const listAll = () => Object.values(systems);
const listByCategory = (category) => listAll().filter((s) => s.category === category).map((s) => s.module);
const findByChain = (chain) => listAll().filter((s) => s.chain === String(chain || '').toLowerCase()).map((s) => s.module);
const listFree = () => listAll().filter((s) => s.free).map((s) => s.module);
const listCryptoModules = () => listAll().filter((s) => s.crypto).map((s) => s.module);
const categories = () => [...new Set(listAll().map((s) => s.category))];

module.exports = {
    systems,
    getSystem,
    listAll,
    listByCategory,
    findByChain,
    listFree,
    listCryptoModules,
    categories
};
