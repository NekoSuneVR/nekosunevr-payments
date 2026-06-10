// Assembler / public surface. The implementation now lives in modular files:
//   core/utils.js        - shared helpers + endpoint routing + chain client config
//   core/PaymentAPI.js   - low-level per-gateway API client
//   core/ChainModule.js  - the per-chain dispatcher (existsTransaction, createPayment, ...)
//   config/chains.js     - chain/gateway configuration, grouped by category
//   config/tokens.js     - token registry (USDT/USDC on EVM/Tron, ...)
//   gateways/registry.js - "which system handles which" lookups
//
// This file wires those together and reproduces the dynamic `<KEY>Module` exports so
// existing imports (e.g. `require('nekosunevr-payments').BTCModule`) keep working,
// and adds a `<TOKEN>Module` export for every token in the registry.
const { ChainModule } = require('./core/ChainModule');
const { PaymentAPI } = require('./core/PaymentAPI');
const { resolveEnvEndpoints } = require('./core/utils');
const { chainConfigs } = require('./config/chains');
const { tokenRegistry, buildTokenConfig } = require('./config/tokens');
const registry = require('./gateways/registry');

// Chain / gateway modules — one `<KEY.toUpperCase()>Module` per chainConfigs entry.
Object.keys(chainConfigs).forEach((chain) => {
    exports[`${chain.toUpperCase()}Module`] = class extends ChainModule {
        constructor(configOverrides = {}, domain) {
            let overrides = configOverrides;
            let resolvedDomain = domain;
            if (typeof configOverrides === 'string' && domain === undefined) {
                resolvedDomain = configOverrides;
                overrides = {};
            }
            const mergedConfig = { ...chainConfigs[chain], ...resolveEnvEndpoints(chain), ...overrides };
            super(chain, mergedConfig, resolvedDomain);
        }
    };
});

// Token modules — one `<TOKENKEY>Module` per token (e.g. USDT_BSCModule). The base
// chain's explorer config is layered with the token contract + decimals.
Object.keys(tokenRegistry).forEach((tokenKey) => {
    const baseChain = tokenRegistry[tokenKey].chain;
    exports[`${tokenKey}Module`] = class extends ChainModule {
        constructor(configOverrides = {}, domain) {
            let overrides = configOverrides;
            let resolvedDomain = domain;
            if (typeof configOverrides === 'string' && domain === undefined) {
                resolvedDomain = configOverrides;
                overrides = {};
            }
            const mergedConfig = { ...buildTokenConfig(tokenKey), ...resolveEnvEndpoints(baseChain), ...overrides };
            super(baseChain, mergedConfig, resolvedDomain);
        }
    };
});

// Advanced / direct access.
exports.PaymentAPI = PaymentAPI;
exports.ChainModule = ChainModule;

// Registry lookups — "which system handles which".
exports.registry = registry;
exports.getSystem = registry.getSystem;
exports.listAll = registry.listAll;
exports.listByCategory = registry.listByCategory;
exports.findByChain = registry.findByChain;
exports.listFree = registry.listFree;
exports.listCryptoModules = registry.listCryptoModules;
exports.categories = registry.categories;
