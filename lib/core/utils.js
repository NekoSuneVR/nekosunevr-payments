const axios = require('axios');
const hive = require('@hiveio/hive-js');
const { ChainTypes, makeBitMaskFilter } = require('@hiveio/hive-js/lib/auth/serializer');
const steem = require('@steemit/steem-js');
const blurt = require('@blurtfoundation/blurtjs');
require('dotenv').config();

const normalizeAddress = (address) => (address || '').toLowerCase();
const formatUnits = (value, decimals = 18) => {
    const raw = value.toString();
    if (decimals === 0) return raw;
    const padded = raw.padStart(decimals + 1, '0');
    const whole = padded.slice(0, -decimals) || '0';
    const fraction = padded.slice(-decimals).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
};
const toSmallestUnit = (amount, decimals = 18) => {
    const amountStr = amount.toString();
    const [whole, fraction = ''] = amountStr.split('.');
    const normalizedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    const combined = `${whole}${normalizedFraction}` || '0';
    return BigInt(combined);
};
const matchAmountWithDecimals = (value, amount, decimals = 18) => {
    if (amount === undefined || amount === null) return false;
    try {
        const rawValue = BigInt(value);
        const amountStr = amount.toString();
        if (/^\d+$/.test(amountStr) && amountStr === value.toString()) return true;
        const scaledAmount = toSmallestUnit(amountStr, decimals);
        if (scaledAmount === rawValue) return true;
        return formatUnits(rawValue, decimals) === amountStr;
    } catch (err) {
        return false;
    }
};
const extractAddressTxReferences = (data) => {
    if (!data || typeof data !== 'object') return [];
    const refs = [];
    if (Array.isArray(data.transactions) && data.transactions.length) refs.push(...data.transactions);
    if (Array.isArray(data.txs) && data.txs.length) refs.push(...data.txs);
    if (Array.isArray(data.txids) && data.txids.length) refs.push(...data.txids);
    // Some explorers return txids grouped by ranges/keys instead of a flat array.
    if (!Array.isArray(data.txids) && data.txids && typeof data.txids === 'object') {
        Object.values(data.txids).forEach(group => {
            if (Array.isArray(group) && group.length) refs.push(...group);
        });
    }
    return refs;
};
const sortObjectDeep = (obj) => {
    if (Array.isArray(obj)) return obj.map(item => sortObjectDeep(item));
    if (!obj || typeof obj !== 'object') return obj;
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObjectDeep(obj[key]);
        return result;
    }, {});
};
const HIVE_TRANSFER_FILTER = makeBitMaskFilter([ChainTypes.operations.transfer]);
const STEEM_FORK_SYMBOL_RE = /\s+[A-Z0-9]+$/;
const ENDPOINT_COOLDOWN_MS = Number(process.env.NEKOPAY_ENDPOINT_COOLDOWN_MS || 120000);
const endpointRoutingState = new Map();
const stripSteemForkAsset = (value) => String(value || '').replace(STEEM_FORK_SYMBOL_RE, '').trim();
const getSteemForkSymbol = (value) => String(value || '').trim().split(/\s+/).pop().toUpperCase();
const matchesSteemForkAmount = (rawAmount, expectedAmount, expectedSymbol = null) => {
    const numericAmount = Number(stripSteemForkAsset(rawAmount));
    if (!Number.isFinite(numericAmount) || numericAmount !== Number(expectedAmount)) return false;
    if (!expectedSymbol) return true;
    return getSteemForkSymbol(rawAmount) === expectedSymbol.toUpperCase();
};
const normalizeHistoryEntry = (entry) => Array.isArray(entry) ? entry[1] : entry;
const normalizeAntelopeActionEntry = (entry) => {
    const action = entry?.action_trace || entry || {};
    if (!action.block_time && entry?.timestamp) action.block_time = entry.timestamp;
    if (!action.trx_id && entry?.trx_id) action.trx_id = entry.trx_id;
    if (!action.block_num && entry?.block_num) action.block_num = entry.block_num;
    return action;
};
const stripAntelopeAsset = (value) => String(value || '').replace(/\s+[A-Z0-9]+$/, '').trim();
const getAntelopeAssetSymbol = (value) => String(value || '').trim().split(/\s+/).pop().toUpperCase();
const callClientMethod = (client, method, args = []) => new Promise((resolve, reject) => {
    client[method](...args, (error, result) => {
        if (error) reject(error);
        else resolve(result);
    });
});
const getSteemForkClient = (rpcKind) => {
    if (rpcKind === 'hive') return hive;
    if (rpcKind === 'steem') return steem;
    if (rpcKind === 'blurt') return blurt;
    return null;
};
const configureSteemForkClient = (rpcKind, url) => {
    const client = getSteemForkClient(rpcKind);
    if (!client) throw new Error(`Unsupported steem-fork rpc kind: ${rpcKind}`);
    if (rpcKind === 'hive') {
        client.api.setOptions({ url });
    } else if (rpcKind === 'steem') {
        client.api.setOptions({ url });
    } else if (rpcKind === 'blurt') {
        client.api.setOptions({ url, useAppbaseApi: true });
    }
    return client;
};
const normalizeEndpointUrl = (url) => String(url || '').trim();
const getEndpointState = (groupKey) => {
    if (!endpointRoutingState.has(groupKey)) {
        endpointRoutingState.set(groupKey, {
            preferred: null,
            cooldowns: new Map()
        });
    }
    return endpointRoutingState.get(groupKey);
};
const isRetriableEndpointError = (error) => {
    const status = Number(error?.response?.status || 0);
    return status === 403 || status === 429 || status === 503;
};
const orderEndpointCandidates = (groupKey, urls) => {
    const state = getEndpointState(groupKey);
    const now = Date.now();
    const normalized = [...new Set((urls || []).map(normalizeEndpointUrl).filter(Boolean))];
    const available = [];
    const cooling = [];

    normalized.forEach((url) => {
        const blockedUntil = Number(state.cooldowns.get(url) || 0);
        if (blockedUntil > now) cooling.push(url);
        else available.push(url);
    });

    if (state.preferred && available.includes(state.preferred)) {
        available.splice(available.indexOf(state.preferred), 1);
        available.unshift(state.preferred);
    }

    return available.length ? available : cooling;
};
const markEndpointSuccess = (groupKey, url) => {
    const normalized = normalizeEndpointUrl(url);
    if (!normalized) return;
    const state = getEndpointState(groupKey);
    state.preferred = normalized;
    state.cooldowns.delete(normalized);
};
const markEndpointCooldown = (groupKey, url) => {
    const normalized = normalizeEndpointUrl(url);
    if (!normalized) return;
    const state = getEndpointState(groupKey);
    state.cooldowns.set(normalized, Date.now() + ENDPOINT_COOLDOWN_MS);
    if (state.preferred === normalized) {
        state.preferred = null;
    }
};
const querySteemForkRpc = async (rpcKind, urls, handler, groupKey = null) => {
    const normalizedUrls = [...new Set((urls || []).map(normalizeEndpointUrl).filter(Boolean))];
    if (!normalizedUrls.length) {
        throw new Error(`No RPC endpoints configured for ${rpcKind}`);
    }

    const routingKey = groupKey || `rpc:${rpcKind}`;
    const candidates = orderEndpointCandidates(routingKey, normalizedUrls);
    let lastError = null;

    for (const url of candidates) {
        try {
            const client = configureSteemForkClient(rpcKind, url);
            const result = await handler(client, url);
            markEndpointSuccess(routingKey, url);
            return result;
        } catch (error) {
            lastError = error;
            if (isRetriableEndpointError(error)) {
                markEndpointCooldown(routingKey, url);
                continue;
            }
            throw error;
        }
    }

    throw lastError || new Error(`No RPC endpoints configured for ${rpcKind}`);
};

// Allow any chain's explorer endpoints to be repointed via environment variables,
// e.g. a self-hosted Blockbook instance for high-traffic deployments. Setting
// NEKOPAY_<CHAIN>_EXPLORER_URL makes that endpoint the primary while the bundled
// public servers stay as fallback (unless NEKOPAY_<CHAIN>_EXPLORER_ALT_URLS is also set).
// Precedence: chainConfigs defaults < env vars < explicit constructor overrides.
const resolveEnvEndpoints = (chain) => {
    const key = chain.toUpperCase();
    const overrides = {};
    const url = (process.env[`NEKOPAY_${key}_EXPLORER_URL`] || '').trim();
    const altRaw = process.env[`NEKOPAY_${key}_EXPLORER_ALT_URLS`];
    if (url) overrides.url = url;
    if (altRaw) {
        const alts = altRaw.split(',').map(value => value.trim()).filter(Boolean);
        if (alts.length) overrides.altExplorerUrls = alts;
    }
    return overrides;
};

// Steem-family chain client configuration (executed once on import).
hive.config.set('address_prefix', 'STM');
hive.config.set('chain_id', 'beeab0de00000000000000000000000000000000000000000000000000000000');
hive.config.set('alternative_api_endpoints', [
    'https://api.hive.blog',
    'https://anyx.io',
    'https://hived.privex.io',
    'https://rpc.ausbit.dev',
    'https://api.openhive.network'
]);

steem.config.set('address_prefix', 'STM');
steem.config.set('chain_id', '782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');

blurt.config.set('address_prefix', 'BLT');
blurt.config.set('chain_id', 'cd8d90f29ae273abec3eaa7731e25934c63eb654d55080caff2ebb7f5df6381f');
blurt.config.set('alternative_api_endpoints', [
    'https://blurt-rpc.saboin.com',
    'https://rpc.blurt.one',
    'https://rpc.blurt.live',
    'https://rpc.beblurt.com'
]);

module.exports = {
    hive,
    steem,
    blurt,
    ChainTypes,
    makeBitMaskFilter,
    normalizeAddress,
    formatUnits,
    toSmallestUnit,
    matchAmountWithDecimals,
    extractAddressTxReferences,
    sortObjectDeep,
    HIVE_TRANSFER_FILTER,
    STEEM_FORK_SYMBOL_RE,
    ENDPOINT_COOLDOWN_MS,
    stripSteemForkAsset,
    getSteemForkSymbol,
    matchesSteemForkAmount,
    normalizeHistoryEntry,
    normalizeAntelopeActionEntry,
    stripAntelopeAsset,
    getAntelopeAssetSymbol,
    callClientMethod,
    getSteemForkClient,
    configureSteemForkClient,
    normalizeEndpointUrl,
    getEndpointState,
    isRetriableEndpointError,
    orderEndpointCandidates,
    markEndpointSuccess,
    markEndpointCooldown,
    querySteemForkRpc,
    resolveEnvEndpoints
};
