const axios = require('axios');
const commerce = require('coinbase-commerce-node');
const Stripe = require('stripe');
const crypto = require('crypto');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const {
    normalizeAddress,
    extractAddressTxReferences,
    HIVE_TRANSFER_FILTER,
    stripSteemForkAsset,
    matchesSteemForkAmount,
    normalizeHistoryEntry,
    normalizeAntelopeActionEntry,
    stripAntelopeAsset,
    getAntelopeAssetSymbol,
    callClientMethod,
    orderEndpointCandidates,
    markEndpointSuccess,
    markEndpointCooldown,
    isRetriableEndpointError,
    querySteemForkRpc
} = require('./utils');

class PaymentAPI {
    constructor(config) {
        // Validate environment variables for enabled gateways
        if (config.isCoinbase && !process.env.COINBASE_API_KEY) {
            throw new Error('COINBASE_API_KEY is required for Coinbase integration');
        }
        if (config.isTebex && !process.env.TEBEX_API_KEY) {
            throw new Error('TEBEX_API_KEY is required for Tebex integration');
        }
        if (config.isSellix && !process.env.SELLIX_API_KEY) {
            throw new Error('SELLIX_API_KEY is required for Sellix integration');
        }
        if (config.isCraftingStore && !process.env.CRAFTINGSTORE_API_KEY) {
            throw new Error('CRAFTINGSTORE_API_KEY is required for CraftingStore integration');
        }
        if (config.isStripe && !process.env.STRIPE_API_KEY) {
            throw new Error('STRIPE_API_KEY is required for Stripe integration');
        }
        if (config.isPayPal && (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)) {
            throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required for PayPal integration');
        }
        if (config.isXsolla && (!process.env.XSOLLA_MERCHANT_ID || !process.env.XSOLLA_API_KEY || !process.env.XSOLLA_PROJECT_ID)) {
            throw new Error('XSOLLA_MERCHANT_ID, XSOLLA_API_KEY, and XSOLLA_PROJECT_ID are required for Xsolla integration');
        }
        if (config.isSkrill && (!process.env.SKRILL_MERCHANT_EMAIL || !process.env.SKRILL_SECRET_WORD)) {
            throw new Error('SKRILL_MERCHANT_EMAIL and SKRILL_SECRET_WORD are required for Skrill integration');
        }
        if (config.isWooCommerce && (!process.env.WOOCOMMERCE_CONSUMER_KEY || !process.env.WOOCOMMERCE_CONSUMER_SECRET)) {
            throw new Error('WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET are required for WooCommerce integration');
        }
        if (config.isNowPayments && !process.env.NOWPAYMENTS_API_KEY) {
            throw new Error('NOWPAYMENTS_API_KEY is required for NOWPayments integration');
        }
        if (config.isOpenNode && !process.env.OPENNODE_API_KEY) {
            throw new Error('OPENNODE_API_KEY is required for OpenNode integration');
        }
        if (config.isGoURL && (!process.env.GOURL_PUBLIC_KEY || !process.env.GOURL_PRIVATE_KEY)) {
            throw new Error('GOURL_PUBLIC_KEY and GOURL_PRIVATE_KEY are required for GoURL integration');
        }
        if (config.isBitPay && !process.env.BITPAY_API_KEY) {
            throw new Error('BITPAY_API_KEY is required for BitPay integration');
        }
        if (config.isPayoneer && !process.env.PAYONEER_API_KEY) {
            throw new Error('PAYONEER_API_KEY is required for Payoneer integration');
        }
        if (config.isPaymentwall && !process.env.PAYMENTWALL_API_KEY) {
            throw new Error('PAYMENTWALL_API_KEY is required for Paymentwall integration');
        }
        if (config.isSquare && !process.env.SQUARE_ACCESS_TOKEN) {
            throw new Error('SQUARE_ACCESS_TOKEN is required for Square integration');
        }
        if (config.isWorldpay && !process.env.WORLDPAY_API_KEY) {
            throw new Error('WORLDPAY_API_KEY is required for Worldpay integration');
        }
        if (config.isAmazonPay && !process.env.AMAZON_PAY_API_KEY) {
            throw new Error('AMAZON_PAY_API_KEY is required for Amazon Pay integration');
        }
        if (config.isApplePay && !process.env.APPLE_PAY_API_KEY) {
            throw new Error('APPLE_PAY_API_KEY is required for Apple Pay integration');
        }
        if (config.isGooglePay && !process.env.GOOGLE_PAY_API_KEY) {
            throw new Error('GOOGLE_PAY_API_KEY is required for Google Pay integration');
        }
        if (config.isWeChatPay && !process.env.WECHAT_PAY_API_KEY) {
            throw new Error('WECHAT_PAY_API_KEY is required for WeChat Pay integration');
        }
        if (config.isOFX && !process.env.OFX_API_KEY) {
            throw new Error('OFX_API_KEY is required for OFX integration');
        }
        if (config.isFortumo && !process.env.FORTUMO_API_KEY) {
            throw new Error('FORTUMO_API_KEY is required for Fortumo integration');
        }
        if (config.isAuthorizeNet && (!process.env.AUTHORIZE_NET_API_LOGIN_ID || !process.env.AUTHORIZE_NET_TRANSACTION_KEY)) {
            throw new Error('AUTHORIZE_NET_API_LOGIN_ID and AUTHORIZE_NET_TRANSACTION_KEY are required for Authorize.Net integration');
        }
        if (config.isAlipay && !process.env.ALIPAY_API_KEY) {
            throw new Error('ALIPAY_API_KEY is required for Alipay integration');
        }
        if (config.isWooCommerce && !config.url.match(/^https:\/\/.*\/wp-json\/wc\/v3\/$/)) {
            throw new Error('WooCommerce URL must be a valid HTTPS URL ending with /wp-json/wc/v3/');
        }

        this.explorerUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
        this.altExplorerUrls = (config.altExplorerUrls || []).map(u => u.endsWith('/') ? u : `${u}/`);
        this.isSteemFork = config.isSteemFork || false;
        this.isBNB = config.isBNB || false;
        this.isTebex = config.isTebex || false;
        this.isCoinbase = config.isCoinbase || false;
        this.isSellix = config.isSellix || false;
        this.isCraftingStore = config.isCraftingStore || false;
        this.isStripe = config.isStripe || false;
        this.isPayPal = config.isPayPal || false;
        this.isXsolla = config.isXsolla || false;
        this.isSkrill = config.isSkrill || false;
        this.isWooCommerce = config.isWooCommerce || false;
        this.isNowPayments = config.isNowPayments || false;
        this.isOpenNode = config.isOpenNode || false;
        this.isGoURL = config.isGoURL || false;
        this.isBitPay = config.isBitPay || false;
        this.isPayoneer = config.isPayoneer || false;
        this.isPaymentwall = config.isPaymentwall || false;
        this.isSquare = config.isSquare || false;
        this.isWorldpay = config.isWorldpay || false;
        this.isAmazonPay = config.isAmazonPay || false;
        this.isApplePay = config.isApplePay || false;
        this.isGooglePay = config.isGooglePay || false;
        this.isWeChatPay = config.isWeChatPay || false;
        this.isOFX = config.isOFX || false;
        this.isFortumo = config.isFortumo || false;
        this.isAuthorizeNet = config.isAuthorizeNet || false;
        this.isAlipay = config.isAlipay || false;
        this.gatewayType = config.gatewayType || null;
        this.isEVM = config.isEVM || false;
        this.isTron = config.isTron || false;
        this.isSolana = config.isSolana || false;
        this.isSolanaPay = config.isSolanaPay || false;
        // EVM addresses/contracts are case-insensitive (lowercase); Solana mints are
        // base58 and case-sensitive, so preserve case for Solana (both the address-watch
        // `isSolana` chain and the `isSolanaPay` checkout module).
        this.tokenContract = config.tokenContract
            ? ((config.isSolana || config.isSolanaPay) ? config.tokenContract : config.tokenContract.toLowerCase())
            : null;
        this.defaultEvmDecimals = config.evmDecimals || 18;
        this.defaultTronDecimals = config.tronDecimals || 6;
        this.defaultSolanaDecimals = config.solDecimals || 9;
        // Adapter mode for chains without a Blockbook explorer:
        //   'blockscout' | 'etherscan'  -> Etherscan-family API (Base/L2s + tokens)
        //   'evmrpc'                    -> JSON-RPC eth_getLogs (token detection)
        // (Solana uses isSolana + its own RPC adapter.)
        this.explorerApi = config.explorerApi || null;
        this.etherscanChainId = config.etherscanChainId || null;
        this.etherscanApiKey = config.apiKeyEnv ? (process.env[config.apiKeyEnv] || '') : (process.env.ETHERSCAN_API_KEY || '');
        this.evmRpcLookback = Number(config.evmRpcLookback || 50000);
        this.rpcKind = config.rpcKind || null;
        this.rpcUrls = Array.isArray(config.rpcUrls) ? config.rpcUrls.filter(Boolean) : [];
        this.assetSymbol = config.assetSymbol || null;
        this.antelopeHistoryUrl = config.antelopeHistoryUrl || null;
        this.antelopeHistoryUrls = (Array.isArray(config.antelopeHistoryUrls) ? config.antelopeHistoryUrls : [this.antelopeHistoryUrl]).filter(Boolean);
        this.antelopeHistoryMethod = String(config.antelopeHistoryMethod || 'POST').toUpperCase();
        this.antelopeChainUrl = config.antelopeChainUrl || null;
        this.antelopeChainUrls = (Array.isArray(config.antelopeChainUrls) ? config.antelopeChainUrls : [this.antelopeChainUrl]).filter(Boolean);
        this.antelopeBalancesUrl = config.antelopeBalancesUrl || null;
        this.antelopeBalancesUrls = (Array.isArray(config.antelopeBalancesUrls) ? config.antelopeBalancesUrls : [this.antelopeBalancesUrl]).filter(Boolean);
        this.antelopeBalancesMethod = String(config.antelopeBalancesMethod || 'GET').toUpperCase();
        this.antelopeBalanceBody = config.antelopeBalanceBody || null;
        this.antelopeBalanceAddressKey = config.antelopeBalanceAddressKey || 'account';
        this.antelopeTxUrl = config.antelopeTxUrl || null;
        this.antelopeTxUrls = (Array.isArray(config.antelopeTxUrls) ? config.antelopeTxUrls : [this.antelopeTxUrl]).filter(Boolean);
        this.antelopeTxMethod = String(config.antelopeTxMethod || 'GET').toUpperCase();
        this.antelopeHistoryBody = config.antelopeHistoryBody || {};

        this.isHiveEngine = config.isHiveEngine || false;

        this.tebexApiKey = process.env.TEBEX_API_KEY;
        this.coinbaseApiKey = process.env.COINBASE_API_KEY;
        this.sellixApiKey = process.env.SELLIX_API_KEY;
        this.craftingstoreApiKey = process.env.CRAFTINGSTORE_API_KEY;
        this.stripeApiKey = process.env.STRIPE_API_KEY;
        this.paypalClientId = process.env.PAYPAL_CLIENT_ID;
        this.paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
        this.xsollaMerchantId = process.env.XSOLLA_MERCHANT_ID;
        this.xsollaApiKey = process.env.XSOLLA_API_KEY;
        this.xsollaProjectId = process.env.XSOLLA_PROJECT_ID;
        this.skrillMerchantEmail = process.env.SKRILL_MERCHANT_EMAIL;
        this.skrillSecretWord = process.env.SKRILL_SECRET_WORD;
        this.woocommerceConsumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
        this.woocommerceConsumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
        this.nowPaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
        this.nowPaymentsEmail = process.env.NOWPAYMENTS_EMAIL;
        this.nowPaymentsPassword = process.env.NOWPAYMENTS_PASSWORD;
        this.nowPaymentsIpnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
        this.opennodeApiKey = process.env.OPENNODE_API_KEY;
        this.gourlPublicKey = process.env.GOURL_PUBLIC_KEY;
        this.gourlPrivateKey = process.env.GOURL_PRIVATE_KEY;
        this.bitpayApiKey = process.env.BITPAY_API_KEY;
        this.payoneerApiKey = process.env.PAYONEER_API_KEY;
        this.paymentwallApiKey = process.env.PAYMENTWALL_API_KEY;
        this.squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
        this.worldpayApiKey = process.env.WORLDPAY_API_KEY;
        this.amazonPayApiKey = process.env.AMAZON_PAY_API_KEY;
        this.applePayApiKey = process.env.APPLE_PAY_API_KEY;
        this.googlePayApiKey = process.env.GOOGLE_PAY_API_KEY;
        this.wechatPayApiKey = process.env.WECHAT_PAY_API_KEY;
        this.ofxApiKey = process.env.OFX_API_KEY;
        this.fortumoApiKey = process.env.FORTUMO_API_KEY;
        this.authorizeNetApiLoginId = process.env.AUTHORIZE_NET_API_LOGIN_ID;
        this.authorizeNetTransactionKey = process.env.AUTHORIZE_NET_TRANSACTION_KEY;
        this.alipayApiKey = process.env.ALIPAY_API_KEY;
        this.nowPaymentsAuthToken = null;
        this.nowPaymentsAuthTokenExpiresAt = 0;

        this.genericGatewayProfiles = {
            bitpay: { createEndpoint: 'v2/invoices', listEndpoint: 'v2/invoices', getEndpoint: (id) => `v2/invoices/${id}` },
            payoneer: { createEndpoint: 'v1/payments', listEndpoint: 'v1/payments', getEndpoint: (id) => `v1/payments/${id}` },
            paymentwall: { createEndpoint: 'api/payments', listEndpoint: 'api/payments', getEndpoint: (id) => `api/payments/${id}` },
            square: { createEndpoint: 'v2/payments', listEndpoint: 'v2/payments', getEndpoint: (id) => `v2/payments/${id}` },
            worldpay: { createEndpoint: 'payments', listEndpoint: 'payments', getEndpoint: (id) => `payments/${id}` },
            amazonpay: { createEndpoint: 'v2/checkoutSessions', listEndpoint: 'v2/checkoutSessions', getEndpoint: (id) => `v2/checkoutSessions/${id}` },
            applepay: { createEndpoint: 'v1/payments', listEndpoint: 'v1/payments', getEndpoint: (id) => `v1/payments/${id}` },
            googlepay: { createEndpoint: 'v1/payments', listEndpoint: 'v1/payments', getEndpoint: (id) => `v1/payments/${id}` },
            wechatpay: { createEndpoint: 'v3/pay/transactions/native', listEndpoint: 'v3/pay/transactions', getEndpoint: (id) => `v3/pay/transactions/id/${id}` },
            ofx: { createEndpoint: 'v1/payments', listEndpoint: 'v1/payments', getEndpoint: (id) => `v1/payments/${id}` },
            fortumo: { createEndpoint: 'v2/payments', listEndpoint: 'v2/payments', getEndpoint: (id) => `v2/payments/${id}` },
            authorizenet: { createEndpoint: 'xml/v1/request.api', listEndpoint: 'v1/transactions', getEndpoint: (id) => `v1/transactions/${id}` },
            alipay: { createEndpoint: 'v1/payments', listEndpoint: 'v1/payments', getEndpoint: (id) => `v1/payments/${id}` }
        };

        // Config-driven generic gateways: a new REST gateway can be added purely from
        // config (see config/chains.js) without a bespoke isXxx flag.
        //   gatewayType    - profile key
        //   gatewayProfile - { createEndpoint, listEndpoint, getEndpoint(id) }
        //   auth           - { name?, scheme?, env } for a header, or { basic:true, env, env2 }
        //   requiresAuth   - when true, throw if the configured env var(s) are missing
        if (config.gatewayType && config.gatewayProfile) {
            this.genericGatewayProfiles[config.gatewayType] = config.gatewayProfile;
        }
        this.genericAuthHeader = null;
        const gwAuth = config.auth;
        if (gwAuth && (gwAuth.in === undefined || gwAuth.in === 'header')) {
            const value = gwAuth.basic
                ? `Basic ${Buffer.from(`${process.env[gwAuth.env] || ''}:${process.env[gwAuth.env2] || ''}`).toString('base64')}`
                : `${gwAuth.scheme || ''}${process.env[gwAuth.env] || ''}`;
            this.genericAuthHeader = { name: gwAuth.name || 'Authorization', value };
        }
        if (config.requiresAuth && gwAuth) {
            const missing = [gwAuth.env, gwAuth.env2].filter(Boolean).filter((name) => !process.env[name]);
            if (missing.length) {
                throw new Error(`${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required for ${config.gatewayType || 'this'} integration`);
            }
        }

        if (this.isCoinbase) commerce.Client.init(this.coinbaseApiKey);
        if (this.isStripe) this.stripe = new Stripe(this.stripeApiKey);
        if (this.isPayPal) {
            this.paypalAuth = Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64');
        }
        if (this.isWooCommerce) {
            this.woocommerceApi = new WooCommerceRestApi({
                url: this.explorerUrl.replace('/wp-json/wc/v3/', ''),
                consumerKey: this.woocommerceConsumerKey,
                consumerSecret: this.woocommerceConsumerSecret,
                version: 'wc/v3'
            });
        }
    }

    hasDirectSteemForkRpc() {
        return ['hive', 'steem', 'blurt'].includes(this.rpcKind) && this.rpcUrls.length > 0;
    }

    hasDirectAntelopeApi() {
        return !!(this.antelopeHistoryUrls.length && this.assetSymbol);
    }

    async getDirectSteemForkHistory(address, start = -1, limit = 1000) {
        if (!this.hasDirectSteemForkRpc()) return [];
        return querySteemForkRpc(this.rpcKind, this.rpcUrls, async (client) => {
            if (this.rpcKind === 'hive') {
                return callClientMethod(client.api, 'getAccountHistory', [
                    address,
                    start,
                    limit,
                    HIVE_TRANSFER_FILTER[0],
                    HIVE_TRANSFER_FILTER[1]
                ]);
            }
            return callClientMethod(client.api, 'getAccountHistory', [address, start, limit]);
        }, `${this.assetSymbol || this.rpcKind}:history`);
    }

    async getDirectSteemForkHeadBlock() {
        if (!this.hasDirectSteemForkRpc()) return 0;
        const result = await querySteemForkRpc(this.rpcKind, this.rpcUrls, async (client) => {
            return callClientMethod(client.api, 'getDynamicGlobalProperties');
        }, `${this.assetSymbol || this.rpcKind}:head`);
        return Number(result?.head_block_number || 0);
    }

    matchesDirectSteemForkTransfer(record, address, amount, memo = null) {
        const entry = normalizeHistoryEntry(record);
        const op = entry?.op;
        if (!Array.isArray(op) || op[0] !== 'transfer' || !op[1]) return false;
        return String(op[1].to || '').toLowerCase() === String(address || '').toLowerCase() &&
            matchesSteemForkAmount(op[1].amount, amount, this.assetSymbol) &&
            (!memo || op[1].memo === memo);
    }

    mapDirectSteemForkTransaction(record, headBlock = 0) {
        const entry = normalizeHistoryEntry(record);
        const op = entry?.op?.[1] || {};
        const amountValue = stripSteemForkAsset(op.amount || '0');
        const confirmations = Math.max(0, Number(headBlock || 0) - Number(entry?.block || 0));
        return {
            txid: String(entry?.trx_id || ''),
            vin: [{
                address: op.from || '',
                value: amountValue,
                memo: op.memo || ''
            }],
            vout: [{
                address: op.to || '',
                value: amountValue,
                memo: op.memo || ''
            }],
            blockheight: Number(entry?.block || 0),
            time: Math.floor(new Date(entry?.timestamp || Date.now()).getTime() / 1000),
            confirmations,
            blocktime: Math.floor(new Date(entry?.timestamp || Date.now()).getTime() / 1000)
        };
    }

    async findDirectSteemForkTransaction(address, amount, memo = null, minTimestamp = 0) {
        const headBlock = await this.getDirectSteemForkHeadBlock();
        let start = -1;
        let page = 0;
        while (page < 50) {
            const history = await this.getDirectSteemForkHistory(address, start, 1000);
            if (!Array.isArray(history) || !history.length) break;

            const matches = history
                .filter((record) => this.matchesDirectSteemForkTransfer(record, address, amount, memo))
                .map((record) => this.mapDirectSteemForkTransaction(record, headBlock))
                .filter((record) => record.txid && (!minTimestamp || Number(record.time || 0) >= Number(minTimestamp || 0)));

            if (matches.length) {
                return matches.sort((left, right) => right.blockheight - left.blockheight)[0] || null;
            }

            const oldestTimestamp = history.reduce((lowest, record) => {
                const entry = normalizeHistoryEntry(record);
                const value = Math.floor(new Date(entry?.timestamp || Date.now()).getTime() / 1000);
                if (!Number.isFinite(value)) return lowest;
                return Math.min(lowest, value);
            }, Number.POSITIVE_INFINITY);

            if (Number.isFinite(oldestTimestamp) && minTimestamp && oldestTimestamp < Number(minTimestamp || 0)) {
                break;
            }

            const oldestIndex = history.reduce((lowest, record) => {
                const value = Array.isArray(record) ? Number(record[0]) : Number.NaN;
                if (!Number.isFinite(value)) return lowest;
                return Math.min(lowest, value);
            }, Number.POSITIVE_INFINITY);

            if (!Number.isFinite(oldestIndex) || oldestIndex <= 0) {
                break;
            }

            start = oldestIndex - 1;
            page += 1;
        }

        return null;
    }

    async getDirectAntelopeHistory(address, cursor = null) {
        if (!this.hasDirectAntelopeApi()) return [];
        const candidates = orderEndpointCandidates(`${this.assetSymbol}:antelope:history`, this.antelopeHistoryUrls);
        let lastError = null;
        for (const url of candidates) {
            try {
                if (this.antelopeHistoryMethod === 'GET') {
                    const response = await axios.get(url, {
                        params: {
                            account: address,
                            limit: 100,
                            skip: Number(cursor || 0),
                            ...this.antelopeHistoryBody
                        },
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                    markEndpointSuccess(`${this.assetSymbol}:antelope:history`, url);
                    return response.data || {};
                }
                const response = await axios.post(
                    url,
                    {
                        account_name: address,
                        pos: cursor == null ? -1 : cursor,
                        offset: -100,
                        ...this.antelopeHistoryBody
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0'
                        }
                    }
                );
                markEndpointSuccess(`${this.assetSymbol}:antelope:history`, url);
                return response.data || {};
            } catch (error) {
                lastError = error;
                if (isRetriableEndpointError(error)) {
                    markEndpointCooldown(`${this.assetSymbol}:antelope:history`, url);
                    continue;
                }
                throw error;
            }
        }
        throw lastError || new Error(`No Antelope history endpoints configured for ${this.assetSymbol}`);
    }

    async getDirectAntelopeAccount(address) {
        if (!this.antelopeChainUrls.length) return null;
        const candidates = orderEndpointCandidates(`${this.assetSymbol}:antelope:chain`, this.antelopeChainUrls);
        let lastError = null;
        for (const url of candidates) {
            try {
                const response = await axios.post(
                    url,
                    { account_name: address },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0'
                        }
                    }
                );
                markEndpointSuccess(`${this.assetSymbol}:antelope:chain`, url);
                return response.data;
            } catch (error) {
                lastError = error;
                if (isRetriableEndpointError(error)) {
                    markEndpointCooldown(`${this.assetSymbol}:antelope:chain`, url);
                    continue;
                }
                throw error;
            }
        }
        throw lastError || new Error(`No Antelope chain endpoints configured for ${this.assetSymbol}`);
    }

    async getDirectAntelopeBalances(address) {
        if (!this.antelopeBalancesUrls.length) return null;
        const candidates = orderEndpointCandidates(`${this.assetSymbol}:antelope:balances`, this.antelopeBalancesUrls);
        let lastError = null;
        for (const url of candidates) {
            try {
                const response = this.antelopeBalancesMethod === 'POST'
                    ? await axios.post(
                        url,
                        this.antelopeBalanceBody
                            ? { [this.antelopeBalanceAddressKey]: address, ...this.antelopeBalanceBody }
                            : { [this.antelopeBalanceAddressKey]: address, code: 'eosio.token', symbol: this.assetSymbol },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'Mozilla/5.0'
                            }
                        }
                    )
                    : await axios.get(`${url.replace(/\/$/, '')}/${address}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                markEndpointSuccess(`${this.assetSymbol}:antelope:balances`, url);
                return response.data;
            } catch (error) {
                lastError = error;
                if (isRetriableEndpointError(error)) {
                    markEndpointCooldown(`${this.assetSymbol}:antelope:balances`, url);
                    continue;
                }
                throw error;
            }
        }
        throw lastError || new Error(`No Antelope balance endpoints configured for ${this.assetSymbol}`);
    }

    async getDirectAntelopeTransaction(txid) {
        if (!this.antelopeTxUrls.length) return null;
        const candidates = orderEndpointCandidates(`${this.assetSymbol}:antelope:tx`, this.antelopeTxUrls);
        let lastError = null;
        for (const url of candidates) {
            try {
                if (this.antelopeTxMethod === 'POST') {
                    const response = await axios.post(
                        url,
                        { id: txid },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'Mozilla/5.0'
                            }
                        }
                    );
                    markEndpointSuccess(`${this.assetSymbol}:antelope:tx`, url);
                    return response.data || null;
                }
                const response = await axios.get(url, {
                    params: { id: txid },
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                markEndpointSuccess(`${this.assetSymbol}:antelope:tx`, url);
                return response.data || null;
            } catch (error) {
                lastError = error;
                if (isRetriableEndpointError(error)) {
                    markEndpointCooldown(`${this.assetSymbol}:antelope:tx`, url);
                    continue;
                }
                throw error;
            }
        }
        throw lastError || new Error(`No Antelope transaction endpoints configured for ${this.assetSymbol}`);
    }

    normalizeDirectAntelopeTransfer(action, headBlock = 0) {
        const trace = normalizeAntelopeActionEntry(action);
        const act = trace?.act || {};
        const data = act?.data || {};
        const amountValue = stripAntelopeAsset(data.quantity || '0');
        const blockNum = Number(trace?.block_num || action?.block_num || 0);
        const timestamp = trace?.block_time || action?.block_time || new Date().toISOString();
        return {
            txid: String(trace?.trx_id || ''),
            vin: [{
                address: data.from || '',
                value: amountValue,
                memo: data.memo || ''
            }],
            vout: [{
                address: data.to || '',
                value: amountValue,
                memo: data.memo || ''
            }],
            blockheight: blockNum,
            time: Math.floor(new Date(timestamp).getTime() / 1000),
            confirmations: Math.max(0, Number(headBlock || 0) - blockNum),
            blocktime: Math.floor(new Date(timestamp).getTime() / 1000)
        };
    }

    isMatchingDirectAntelopeTransfer(action, address, amount, memo = null) {
        const trace = normalizeAntelopeActionEntry(action);
        const act = trace?.act || {};
        const data = act?.data || {};
        if (act?.name !== 'transfer' || !data?.to || !data?.quantity) return false;
        if (String(data.to).toLowerCase() !== String(address || '').toLowerCase()) return false;
        if (Number(stripAntelopeAsset(data.quantity)) !== Number(amount)) return false;
        if (getAntelopeAssetSymbol(data.quantity) !== String(this.assetSymbol).toUpperCase()) return false;
        if (memo && data.memo !== memo) return false;
        return true;
    }

    async findDirectAntelopeTransaction(address, amount, memo = null, minTimestamp = 0) {
        const account = await this.getDirectAntelopeAccount(address);
        let cursor = this.antelopeHistoryMethod === 'GET' ? 0 : null;
        let page = 0;

        while (page < 50) {
            const history = await this.getDirectAntelopeHistory(address, cursor);
            const actions = Array.isArray(history?.actions) ? history.actions : [];
            if (!actions.length) break;

            const headBlock = Number(account?.head_block_num || history?.head_block_num || history?.last_indexed_block || history?.last_irreversible_block || 0);
            const matches = actions
                .filter((action) => this.isMatchingDirectAntelopeTransfer(action, address, amount, memo))
                .map((action) => this.normalizeDirectAntelopeTransfer(action, headBlock))
                .filter((action) => action.txid && (!minTimestamp || Number(action.time || 0) >= Number(minTimestamp || 0)));

            if (matches.length) {
                return matches.sort((left, right) => right.blockheight - left.blockheight)[0] || null;
            }

            const oldestTimestamp = actions.reduce((lowest, action) => {
                const trace = normalizeAntelopeActionEntry(action);
                const value = Math.floor(new Date(trace?.block_time || action?.block_time || Date.now()).getTime() / 1000);
                if (!Number.isFinite(value)) return lowest;
                return Math.min(lowest, value);
            }, Number.POSITIVE_INFINITY);

            if (Number.isFinite(oldestTimestamp) && minTimestamp && oldestTimestamp < Number(minTimestamp || 0)) {
                break;
            }

            if (this.antelopeHistoryMethod === 'GET') {
                if (actions.length < 100) break;
                cursor = Number(cursor || 0) + actions.length;
            } else {
                const oldestSeq = actions.reduce((lowest, action) => {
                    const value = Number(action?.account_action_seq || action?.action_trace?.account_action_seq || Number.NaN);
                    if (!Number.isFinite(value)) return lowest;
                    return Math.min(lowest, value);
                }, Number.POSITIVE_INFINITY);

                if (!Number.isFinite(oldestSeq) || oldestSeq <= 0) {
                    break;
                }

                cursor = oldestSeq - 1;
            }

            page += 1;
        }

        return null;
    }

    async fetchData(endpoint, options = {}) {
        if (this.isWooCommerce) {
            try {
                const response = await this.woocommerceApi.get(endpoint, options.params || {});
                return response.data;
            } catch (error) {
                throw new Error(`WooCommerce API request failed: ${error.response?.data?.message || error.message}`);
            }
        }
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...(this.isTebex && { 'X-Tebex-Secret': this.tebexApiKey }),
            ...(this.isCoinbase && { 'X-CC-Api-Key': this.coinbaseApiKey, 'X-CC-Version': '2018-03-22' }),
            ...(this.isSellix && { Authorization: `Bearer ${this.sellixApiKey}` }),
            ...(this.isCraftingStore && { token: `Bearer ${this.craftingstoreApiKey}` }),
            ...(this.isPayPal && { Authorization: `Basic ${this.paypalAuth}` }),
            ...(this.isXsolla && { Authorization: `Basic ${Buffer.from(`${this.xsollaMerchantId}:${this.xsollaApiKey}`).toString('base64')}` }),
            ...(this.isSkrill && { 'X-Skrill-Email': this.skrillMerchantEmail }),
            ...(this.isNowPayments && { 'x-api-key': this.nowPaymentsApiKey }),
            ...(this.isOpenNode && { Authorization: this.opennodeApiKey }),
            ...(this.isBitPay && { Authorization: `Bearer ${this.bitpayApiKey}` }),
            ...(this.isPayoneer && { Authorization: `Bearer ${this.payoneerApiKey}` }),
            ...(this.isPaymentwall && { Authorization: `Bearer ${this.paymentwallApiKey}` }),
            ...(this.isSquare && { Authorization: `Bearer ${this.squareAccessToken}`, 'Square-Version': '2024-01-18' }),
            ...(this.isWorldpay && { Authorization: `Bearer ${this.worldpayApiKey}` }),
            ...(this.isAmazonPay && { Authorization: `Bearer ${this.amazonPayApiKey}` }),
            ...(this.isApplePay && { Authorization: `Bearer ${this.applePayApiKey}` }),
            ...(this.isGooglePay && { Authorization: `Bearer ${this.googlePayApiKey}` }),
            ...(this.isWeChatPay && { Authorization: `Bearer ${this.wechatPayApiKey}` }),
            ...(this.isOFX && { Authorization: `Bearer ${this.ofxApiKey}` }),
            ...(this.isFortumo && { Authorization: `Bearer ${this.fortumoApiKey}` }),
            ...(this.isAuthorizeNet && { 'X-ANET-LOGIN': this.authorizeNetApiLoginId, 'X-ANET-KEY': this.authorizeNetTransactionKey }),
            ...(this.isAlipay && { Authorization: `Bearer ${this.alipayApiKey}` }),
            ...(this.genericAuthHeader && { [this.genericAuthHeader.name]: this.genericAuthHeader.value }),
            ...(options.headers || {})
        };
        const bases = orderEndpointCandidates(`${this.assetSymbol || this.gatewayType || this.explorerUrl}:generic:get`, [this.explorerUrl, ...this.altExplorerUrls]);
        let lastError = null;
        for (const base of bases) {
            try {
                const response = await axios.get(`${base}${endpoint}`, { headers, params: options.params });
                markEndpointSuccess(`${this.assetSymbol || this.gatewayType || this.explorerUrl}:generic:get`, base);
                return response.data;
            } catch (error) {
                lastError = error;
                const status = error.response?.status;
                if (status === 403 || status === 429 || status === 503) {
                    markEndpointCooldown(`${this.assetSymbol || this.gatewayType || this.explorerUrl}:generic:get`, base);
                    continue;
                }
                throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
            }
        }
        throw new Error(`API request failed: ${lastError?.response?.data?.message || lastError?.message || 'Unknown error'}`);
    }

    async fetchPostData(endpoint, body, options = {}) {
        if (this.isWooCommerce) {
            try {
                const response = await this.woocommerceApi.post(endpoint, body);
                return response.data;
            } catch (error) {
                throw new Error(`WooCommerce API request failed: ${error.response?.data?.message || error.message}`);
            }
        }
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...(this.isTebex && { 'X-Tebex-Secret': this.tebexApiKey }),
            ...(this.isPayPal && { Authorization: `Basic ${this.paypalAuth}` }),
            ...(this.isXsolla && { Authorization: `Basic ${Buffer.from(`${this.xsollaMerchantId}:${this.xsollaApiKey}`).toString('base64')}` }),
            ...(this.isSkrill && { 'X-Skrill-Email': this.skrillMerchantEmail }),
            ...(this.isNowPayments && { 'x-api-key': this.nowPaymentsApiKey }),
            ...(this.isOpenNode && { Authorization: this.opennodeApiKey }),
            ...(this.isBitPay && { Authorization: `Bearer ${this.bitpayApiKey}` }),
            ...(this.isPayoneer && { Authorization: `Bearer ${this.payoneerApiKey}` }),
            ...(this.isPaymentwall && { Authorization: `Bearer ${this.paymentwallApiKey}` }),
            ...(this.isSquare && { Authorization: `Bearer ${this.squareAccessToken}`, 'Square-Version': '2024-01-18' }),
            ...(this.isWorldpay && { Authorization: `Bearer ${this.worldpayApiKey}` }),
            ...(this.isAmazonPay && { Authorization: `Bearer ${this.amazonPayApiKey}` }),
            ...(this.isApplePay && { Authorization: `Bearer ${this.applePayApiKey}` }),
            ...(this.isGooglePay && { Authorization: `Bearer ${this.googlePayApiKey}` }),
            ...(this.isWeChatPay && { Authorization: `Bearer ${this.wechatPayApiKey}` }),
            ...(this.isOFX && { Authorization: `Bearer ${this.ofxApiKey}` }),
            ...(this.isFortumo && { Authorization: `Bearer ${this.fortumoApiKey}` }),
            ...(this.isAuthorizeNet && { 'X-ANET-LOGIN': this.authorizeNetApiLoginId, 'X-ANET-KEY': this.authorizeNetTransactionKey }),
            ...(this.isAlipay && { Authorization: `Bearer ${this.alipayApiKey}` }),
            ...(this.genericAuthHeader && { [this.genericAuthHeader.name]: this.genericAuthHeader.value }),
            ...(options.headers || {})
        };
        const bases = orderEndpointCandidates(`${this.assetSymbol || this.gatewayType || this.explorerUrl}:generic:post`, [this.explorerUrl, ...this.altExplorerUrls]);
        let lastError = null;
        for (const base of bases) {
            try {
                const response = await axios.post(`${base}${endpoint}`, body, { headers });
                markEndpointSuccess(`${this.assetSymbol || this.gatewayType || this.explorerUrl}:generic:post`, base);
                return response.data;
            } catch (error) {
                lastError = error;
                const status = error.response?.status;
                if (status === 403 || status === 429 || status === 503) {
                    markEndpointCooldown(`${this.assetSymbol || this.gatewayType || this.explorerUrl}:generic:post`, base);
                    continue;
                }
                throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
            }
        }
        throw new Error(`API request failed: ${lastError?.response?.data?.message || lastError?.message || 'Unknown error'}`);
    }

    async getNowPaymentsAuthToken() {
        if (!this.isNowPayments) throw new Error('NOWPayments auth is not supported for this chain');
        if (this.nowPaymentsAuthToken && Date.now() < this.nowPaymentsAuthTokenExpiresAt) {
            return this.nowPaymentsAuthToken;
        }
        if (!this.nowPaymentsEmail || !this.nowPaymentsPassword) {
            throw new Error('NOWPAYMENTS_EMAIL and NOWPAYMENTS_PASSWORD are required to list NOWPayments transactions');
        }
        const response = await axios.post(
            `${this.explorerUrl}auth`,
            { email: this.nowPaymentsEmail, password: this.nowPaymentsPassword },
            { headers: { 'Content-Type': 'application/json' } }
        );
        this.nowPaymentsAuthToken = response.data?.token;
        if (!this.nowPaymentsAuthToken) {
            throw new Error('Failed to authenticate with NOWPayments');
        }
        this.nowPaymentsAuthTokenExpiresAt = Date.now() + (4 * 60 * 1000);
        return this.nowPaymentsAuthToken;
    }

    async nowPaymentsAuth(email, password) {
        if (!this.isNowPayments) throw new Error('NOWPayments auth not supported for this chain');
        const authEmail = email || this.nowPaymentsEmail;
        const authPassword = password || this.nowPaymentsPassword;
        if (!authEmail || !authPassword) {
            throw new Error('NOWPAYMENTS_EMAIL and NOWPAYMENTS_PASSWORD are required for NOWPayments auth');
        }
        const response = await axios.post(
            `${this.explorerUrl}auth`,
            { email: authEmail, password: authPassword },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    // ===================== Adapters for non-Blockbook chains =====================
    hasEvmApi() {
        return this.explorerApi === 'blockscout' || this.explorerApi === 'etherscan';
    }

    async evmApiRequest(params) {
        const group = `${this.explorerApi}:${this.assetSymbol || this.explorerUrl}`;
        const bases = orderEndpointCandidates(group, [this.explorerUrl, ...this.altExplorerUrls]);
        const merged = { ...params };
        if (this.explorerApi === 'etherscan' && this.etherscanChainId) merged.chainid = this.etherscanChainId;
        if (this.etherscanApiKey) merged.apikey = this.etherscanApiKey;
        let lastError = null;
        for (const base of bases) {
            try {
                const response = await axios.get(base.replace(/\/$/, ''), {
                    params: merged,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                markEndpointSuccess(group, base);
                return response.data;
            } catch (error) {
                lastError = error;
                if (isRetriableEndpointError(error)) { markEndpointCooldown(group, base); continue; }
                throw error;
            }
        }
        throw lastError || new Error('EVM explorer API request failed');
    }

    // Map Etherscan-family txlist + tokentx into the Blockbook-style shape the isEVM
    // matcher already understands ({ tokenTransfers:[{contract,to,value,decimals}], vout:[{addresses,value}] }).
    async getEvmApiTransactions(address) {
        const [tokenRes, nativeRes] = await Promise.all([
            this.evmApiRequest({ module: 'account', action: 'tokentx', address, sort: 'desc', page: 1, offset: 1000 }).catch(() => ({})),
            this.evmApiRequest({ module: 'account', action: 'txlist', address, sort: 'desc', page: 1, offset: 1000 }).catch(() => ({}))
        ]);
        let latest = 0;
        try {
            const blockNumber = await this.evmApiRequest({ module: 'proxy', action: 'eth_blockNumber' });
            latest = parseInt(blockNumber?.result, 16) || 0;
        } catch (err) { latest = 0; }
        // Blockscout doesn't always support the Etherscan proxy block-number call; derive
        // the chain head from txlist entries (blockNumber + their reported confirmations).
        if (!latest && Array.isArray(nativeRes?.result)) {
            latest = nativeRes.result.reduce((max, t) => {
                const head = Number(t.blockNumber || 0) + Number(t.confirmations || 0);
                return head > max ? head : max;
            }, 0);
        }

        const txMap = new Map();
        const ensure = (hash, ts, blockNum) => {
            if (!txMap.has(hash)) {
                txMap.set(hash, {
                    txid: hash,
                    tokenTransfers: [],
                    vout: [],
                    time: Number(ts) || 0,
                    blocktime: Number(ts) || 0,
                    blockheight: Number(blockNum) || 0,
                    confirmations: (latest && blockNum) ? Math.max(0, latest - Number(blockNum) + 1) : 0
                });
            }
            return txMap.get(hash);
        };
        (Array.isArray(tokenRes?.result) ? tokenRes.result : []).forEach((t) => {
            const tx = ensure(t.hash, t.timeStamp, t.blockNumber);
            tx.tokenTransfers.push({ contract: t.contractAddress, to: t.to, value: t.value, decimals: Number(t.tokenDecimal) });
        });
        (Array.isArray(nativeRes?.result) ? nativeRes.result : []).forEach((t) => {
            const tx = ensure(t.hash, t.timeStamp, t.blockNumber);
            if (t.confirmations) tx.confirmations = Number(t.confirmations);
            if (t.to && t.value && t.value !== '0') tx.vout.push({ addresses: [t.to], value: t.value });
        });
        return Array.from(txMap.values());
    }

    async rpcCall(method, params) {
        const group = `rpc:${this.assetSymbol || this.explorerUrl}`;
        const bases = orderEndpointCandidates(group, [this.explorerUrl, ...this.altExplorerUrls]);
        let lastError = null;
        for (const base of bases) {
            try {
                const response = await axios.post(base.replace(/\/$/, '') === '' ? base : base, { jsonrpc: '2.0', id: 1, method, params }, {
                    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
                });
                if (response.data?.error) throw new Error(response.data.error.message || 'RPC error');
                markEndpointSuccess(group, base);
                return response.data?.result;
            } catch (error) {
                lastError = error;
                if (isRetriableEndpointError(error)) { markEndpointCooldown(group, base); continue; }
                throw error;
            }
        }
        throw lastError || new Error('RPC request failed');
    }

    // ERC-20 Transfer-event detection via eth_getLogs (token-only; native transfers need a
    // full block scan and are not covered by this fallback — use a Blockscout chain for native).
    async getEvmRpcTransactions(address) {
        const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const latestHex = await this.rpcCall('eth_blockNumber', []);
        const latest = parseInt(latestHex, 16) || 0;
        const fromBlock = latest > this.evmRpcLookback ? latest - this.evmRpcLookback : 0;
        const paddedTo = '0x' + address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
        const filter = {
            fromBlock: '0x' + fromBlock.toString(16),
            toBlock: 'latest',
            topics: [TRANSFER_TOPIC, null, paddedTo]
        };
        if (this.tokenContract) filter.address = this.tokenContract;
        const logs = await this.rpcCall('eth_getLogs', [filter]) || [];
        return logs.map((log) => {
            const blockNum = parseInt(log.blockNumber, 16) || 0;
            return {
                txid: log.transactionHash,
                tokenTransfers: [{
                    contract: log.address,
                    to: address,
                    value: BigInt(log.data || '0x0').toString(),
                    decimals: this.defaultEvmDecimals
                }],
                vout: [],
                time: 0,
                blocktime: 0,
                blockheight: blockNum,
                confirmations: (latest && blockNum) ? Math.max(0, latest - blockNum + 1) : 0
            };
        });
    }

    async solRpc(method, params) {
        return this.rpcCall(method, params);
    }

    normalizeSolanaTx(tx, signature, address, confirmationStatus = null) {
        const meta = tx?.meta || {};
        const message = tx?.transaction?.message || {};
        const keys = (message.accountKeys || []).map((k) => (typeof k === 'string' ? k : k.pubkey));
        const solTransfers = [];
        const idx = keys.indexOf(address);
        if (idx >= 0 && Array.isArray(meta.preBalances) && Array.isArray(meta.postBalances)) {
            const delta = Number(meta.postBalances[idx] || 0) - Number(meta.preBalances[idx] || 0);
            if (delta > 0) solTransfers.push({ to: address, value: delta.toString() }); // lamports
        }
        const splTransfers = [];
        const pre = meta.preTokenBalances || [];
        const post = meta.postTokenBalances || [];
        post.forEach((p) => {
            const owner = p.owner;
            const before = pre.find((b) => b.accountIndex === p.accountIndex);
            const beforeAmt = BigInt(before?.uiTokenAmount?.amount || '0');
            const afterAmt = BigInt(p.uiTokenAmount?.amount || '0');
            const delta = afterAmt - beforeAmt;
            if (delta > 0n) {
                splTransfers.push({
                    mint: p.mint,
                    owner,
                    amount: delta.toString(),
                    decimals: Number(p.uiTokenAmount?.decimals ?? this.defaultSolanaDecimals)
                });
            }
        });
        const finalized = confirmationStatus === 'finalized' || tx?.confirmationStatus === 'finalized';
        return {
            txid: signature,
            solTransfers,
            splTransfers,
            time: Number(tx?.blockTime || 0),
            blocktime: Number(tx?.blockTime || 0),
            blockheight: Number(tx?.slot || 0),
            confirmations: finalized ? 32 : 1
        };
    }

    async getSolanaTransactions(address, limit = 50) {
        const sigs = await this.solRpc('getSignaturesForAddress', [address, { limit }]) || [];
        const out = [];
        for (const sig of sigs) {
            if (sig.err) continue;
            const tx = await this.solRpc('getTransaction', [sig.signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
            if (!tx) continue;
            out.push(this.normalizeSolanaTx(tx, sig.signature, address, sig.confirmationStatus));
        }
        return out;
    }

    async getAddressTransactions(address) {

        if (this.isSolana) {
            return this.getSolanaTransactions(address);
        }
        if (this.explorerApi === 'evmrpc') {
            return this.getEvmRpcTransactions(address);
        }
        if (this.hasEvmApi()) {
            return this.getEvmApiTransactions(address);
        }
        if (this.isHiveEngine) {
            const res = await axios.get(
                `https://accounts.hive-engine.com/accountHistory?account=${address}`
            );
            return res.data; // Array of full objects
        }
        if (this.hasDirectAntelopeApi()) {
            const history = await this.getDirectAntelopeHistory(address);
            const actions = Array.isArray(history?.actions) ? history.actions : [];
            return actions
                .map((action) => normalizeAntelopeActionEntry(action)?.trx_id)
                .filter(Boolean)
                .map((txid) => String(txid));
        }
        if (this.hasDirectSteemForkRpc()) {
            const history = await this.getDirectSteemForkHistory(address);
            return history
                .map((record) => normalizeHistoryEntry(record))
                .filter((entry) => entry?.trx_id)
                .map((entry) => String(entry.trx_id));
        }

        if (this.isCoinbase) {
            const charges = await this.fetchData('charges');
            return charges.data.map(charge => charge.id);
        }
        if (this.isTebex) {
            const payments = await this.fetchData('payments');
            return payments.data.map(payment => payment.id);
        }
        if (this.isSellix) {
            const orders = await this.fetchData('orders');
            return orders.data.map(order => order.uniqid);
        }
        if (this.isCraftingStore) {
            const payments = await this.fetchData('payments');
            return payments.data.map(payment => payment.transactionId);
        }
        if (this.isStripe) {
            const payments = await this.stripe.paymentIntents.list();
            return payments.data.map(payment => payment.id);
        }
        if (this.isPayPal) {
            const transactions = await this.fetchData('v2/payments/captures');
            return transactions.payments.map(payment => payment.id);
        }
        if (this.isXsolla) {
            const transactions = await this.fetchData(`merchant/transactions?user_id=${address}`);
            return transactions.transactions.map(tx => tx.transaction_id);
        }
        if (this.isSkrill) {
            const transactions = await this.fetchData('transactions', { params: { email: address } });
            return transactions.transactions.map(tx => tx.transaction_id);
        }
        if (this.isWooCommerce) {
            const orders = await this.fetchData('orders', { params: { customer_email: address } });
            return orders.map(order => order.id.toString());
        }
        if (this.isNowPayments) {
            const token = await this.getNowPaymentsAuthToken();
            const response = await this.fetchData('payment', {
                params: { limit: 500, offset: 0 },
                headers: { Authorization: `Bearer ${token}` }
            });
            const payments = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.payments)
                    ? response.payments
                    : [];
            return payments
                .filter(payment => normalizeAddress(payment?.pay_address) === normalizeAddress(address))
                .map(payment => payment.payment_id?.toString())
                .filter(Boolean);
        }
        if (this.isOpenNode) {
            const charges = await this.fetchData('v2/charges', { params: { page: 1, pageSize: 100, search: address } });
            const data = Array.isArray(charges?.data) ? charges.data : Array.isArray(charges?.items) ? charges.items : [];
            return data.map(charge => charge.id?.toString()).filter(Boolean);
        }
        if (this.isGenericGateway()) {
            const response = await this.listGenericGatewayTransactions({ page: 1, pageSize: 100, search: address });
            const container = response?.data || response?.result || response?.items || response?.payments || response?.charges || [];
            const list = Array.isArray(container) ? container : [];
            return list
                .map(item => this.extractGatewayTransactionId(item))
                .filter(Boolean)
                .map(id => id.toString());
        }
        const baseParams = { details: 'txs', tokens: '1' };
        const firstPage = await this.fetchData(`address/${address}`, { params: { ...baseParams, page: 1 } });
        const collected = extractAddressTxReferences(firstPage);
        const totalPages = Number(firstPage?.totalPages || 1);
        if (totalPages > 1) {
            for (let page = 2; page <= totalPages; page++) {
                const pagedData = await this.fetchData(`address/${address}`, { params: { ...baseParams, page } });
                collected.push(...extractAddressTxReferences(pagedData));
            }
        }
        return collected;
    }

    async getNowPaymentsStatus() {
        if (!this.isNowPayments) throw new Error('NOWPayments status check not supported for this chain');
        return this.fetchData('status');
    }

    async getNowPaymentsCurrencies() {
        if (!this.isNowPayments) throw new Error('NOWPayments currencies lookup not supported for this chain');
        return this.fetchData('currencies');
    }

    async getNowPaymentsMinimumAmount(fromCurrency, toCurrency) {
        if (!this.isNowPayments) throw new Error('NOWPayments minimum amount lookup not supported for this chain');
        return this.fetchData('min-amount', {
            params: {
                currency_from: fromCurrency,
                currency_to: toCurrency
            }
        });
    }

    async getNowPaymentsEstimateAmount(amount, fromCurrency, toCurrency) {
        if (!this.isNowPayments) throw new Error('NOWPayments estimate lookup not supported for this chain');
        return this.fetchData('estimate', {
            params: {
                amount,
                currency_from: fromCurrency,
                currency_to: toCurrency
            }
        });
    }

    async listNowPayments(params = {}) {
        if (!this.isNowPayments) throw new Error('NOWPayments list payments not supported for this chain');
        const token = await this.getNowPaymentsAuthToken();
        return this.fetchData('payment', {
            params,
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    async listNowPaymentsConversions(token, params = {}) {
        if (!this.isNowPayments) throw new Error('NOWPayments conversions not supported for this chain');
        const bearer = token || await this.getNowPaymentsAuthToken();
        return this.fetchData('conversion', {
            params,
            headers: { Authorization: `Bearer ${bearer}` }
        });
    }

    isGenericGateway() {
        return !!(this.gatewayType && this.genericGatewayProfiles[this.gatewayType]);
    }

    normalizeGatewayRecord(payload) {
        return payload?.data || payload?.result || payload;
    }

    extractGatewayTransactionId(record) {
        const item = this.normalizeGatewayRecord(record) || {};
        return item.id || item.charge_id || item.payment_id || item.transaction_id || item.order_id || item.reference || null;
    }

    extractGatewayStatus(record) {
        const item = this.normalizeGatewayRecord(record) || {};
        return (item.status || item.payment_status || item.state || item.result || '').toString().toLowerCase();
    }

    extractGatewayAmount(record) {
        const item = this.normalizeGatewayRecord(record) || {};
        const value = item.amount ?? item.price ?? item.total ?? item.value ?? item.price_amount ?? item.requested_amount;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    async createGenericGatewayPayment(paymentData) {
        if (!this.isGenericGateway()) throw new Error('Generic gateway payment creation not supported for this chain');
        const profile = this.genericGatewayProfiles[this.gatewayType];
        const endpoint = paymentData.endpoint || profile.createEndpoint;
        const body = paymentData.body || paymentData;
        const response = await this.fetchPostData(endpoint, body, { headers: paymentData.headers || {} });
        const item = this.normalizeGatewayRecord(response);
        return {
            id: this.extractGatewayTransactionId(item),
            status: this.extractGatewayStatus(item),
            amount: this.extractGatewayAmount(item),
            hosted_url: item.hosted_url || item.hosted_checkout_url || item.invoice_url || item.url || null,
            created_at: item.created_at || item.create_time || new Date().toISOString(),
            raw: response
        };
    }

    async getGenericGatewayTransaction(txid, options = {}) {
        if (!this.isGenericGateway()) throw new Error('Generic gateway transaction lookup not supported for this chain');
        const profile = this.genericGatewayProfiles[this.gatewayType];
        const endpoint = options.endpoint || profile.getEndpoint(txid);
        return this.fetchData(endpoint, { params: options.params, headers: options.headers });
    }

    async listGenericGatewayTransactions(params = {}) {
        if (!this.isGenericGateway()) throw new Error('Generic gateway list transactions not supported for this chain');
        const profile = this.genericGatewayProfiles[this.gatewayType];
        return this.fetchData(profile.listEndpoint, { params });
    }

    // --- GoURL (hosted gourl.io cryptobox) ---
    // GoURL identifies a payment box by the per-coin public key and verifies payments
    // with the private key. The exact endpoint paths/field names follow your gourl.io
    // box configuration (see https://gourl.io/api-payment-gateway-php.html); override
    // `endpoint`/`params`/`extra` per call if your box expects a different shape.
    async createGoURLPayment(paymentData) {
        if (!this.isGoURL) throw new Error('GoURL payment creation not supported for this chain');
        const endpoint = paymentData.endpoint || 'box';
        const body = paymentData.body || {
            public_key: this.gourlPublicKey,
            amount: paymentData.amount,
            amountUSD: paymentData.amountUSD ?? paymentData.price_amount,
            period: paymentData.period || 'NOEXPIRY',
            language: paymentData.language || 'en',
            order: paymentData.order_id || paymentData.order || '',
            user: paymentData.user || paymentData.user_id || '',
            userID: paymentData.user_id || '',
            ...(paymentData.extra || {})
        };
        const response = await this.fetchPostData(endpoint, body, { headers: paymentData.headers || {} });
        const item = this.normalizeGatewayRecord(response) || {};
        return {
            id: item.payment_id || item.paymentID || item.box || item.order || body.order || null,
            status: (item.status || item.payment_status || 'pending').toString().toLowerCase(),
            amount: item.amount ?? body.amount ?? null,
            address: item.addr || item.address || null,
            hosted_url: item.payment_url || item.url || null,
            created_at: item.datetime || item.created_at || new Date().toISOString(),
            raw: response
        };
    }

    async getGoURLPaymentStatus(orderID, options = {}) {
        if (!this.isGoURL) throw new Error('GoURL status lookup not supported for this chain');
        const endpoint = options.endpoint || `status/${orderID}`;
        return this.fetchData(endpoint, {
            params: { private_key: this.gourlPrivateKey, order: orderID, ...(options.params || {}) },
            headers: options.headers
        });
    }

    async getTransaction(address, txid) {
        if (this.isSolana) {
            const tx = await this.solRpc('getTransaction', [txid, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
            return tx ? this.normalizeSolanaTx(tx, txid, address) : null;
        }
        if (this.explorerApi === 'evmrpc') {
            const list = await this.getEvmRpcTransactions(address);
            return list.find((t) => String(t.txid).toLowerCase() === String(txid).toLowerCase()) || null;
        }
        if (this.hasEvmApi()) {
            let latest = 0;
            try {
                const blockNumber = await this.evmApiRequest({ module: 'proxy', action: 'eth_blockNumber' });
                latest = parseInt(blockNumber?.result, 16) || 0;
            } catch (err) { latest = 0; }
            const receipt = await this.evmApiRequest({ module: 'proxy', action: 'eth_getTransactionByHash', txhash: txid });
            const blockNum = receipt?.result?.blockNumber ? parseInt(receipt.result.blockNumber, 16) : 0;
            return { txid, confirmations: (blockNum && latest) ? Math.max(0, latest - blockNum + 1) : (blockNum ? 1 : 0) };
        }
        if (this.isHiveEngine) {
            return null; // existsTransaction handles full object directly
        }
        if (this.hasDirectAntelopeApi()) {
            const directTransaction = this.antelopeTxUrl ? await this.getDirectAntelopeTransaction(txid) : null;
            if (directTransaction) {
                const directActions = Array.isArray(directTransaction?.actions)
                    ? directTransaction.actions
                    : Array.isArray(directTransaction?.traces)
                        ? directTransaction.traces
                        : [];
                const matchingActions = directActions.filter((entry) => String(normalizeAntelopeActionEntry(entry)?.trx_id || '').toLowerCase() === String(txid || '').toLowerCase());
                const directAction = matchingActions.find((entry) => normalizeAntelopeActionEntry(entry)?.act?.name === 'transfer')
                    || matchingActions[0];
                if (directAction) {
                    const headBlock = Number(directTransaction?.lib || directTransaction?.last_irreversible_block || directTransaction?.last_indexed_block || 0);
                    return this.normalizeDirectAntelopeTransfer(directAction, headBlock);
                }
            }
            const [history, account] = await Promise.all([
                this.getDirectAntelopeHistory(address),
                this.getDirectAntelopeAccount(address)
            ]);
            const actions = Array.isArray(history?.actions) ? history.actions : [];
            const headBlock = Number(account?.head_block_num || history?.head_block_num || history?.last_indexed_block || history?.last_irreversible_block || 0);
            const action = actions.find((entry) => String(normalizeAntelopeActionEntry(entry)?.trx_id || '').toLowerCase() === String(txid || '').toLowerCase());
            return action ? this.normalizeDirectAntelopeTransfer(action, headBlock) : null;
        }
        if (this.hasDirectSteemForkRpc()) {
            const history = await this.getDirectSteemForkHistory(address);
            const headBlock = await this.getDirectSteemForkHeadBlock();
            const entry = history.find((record) => String(normalizeHistoryEntry(record)?.trx_id || '').toLowerCase() === String(txid || '').toLowerCase());
            return entry ? this.mapDirectSteemForkTransaction(entry, headBlock) : null;
        }
        if (this.isCoinbase) return this.fetchData(`charges/${txid}`);
        if (this.isTebex) return this.fetchData(`payments/${txid}`);
        if (this.isSellix) return this.fetchData(`orders/${txid}`);
        if (this.isCraftingStore) {
            const payments = await this.fetchData('payments');
            return payments.data.find(payment => payment.transactionId.toLowerCase() === txid.toLowerCase());
        }
        if (this.isStripe) return this.stripe.paymentIntents.retrieve(txid);
        if (this.isPayPal) return this.fetchData(`v2/payments/captures/${txid}`);
        if (this.isXsolla) return this.fetchData(`merchant/transactions/${txid}`);
        if (this.isSkrill) return this.fetchData(`transactions/${txid}`);
        if (this.isWooCommerce) return this.fetchData(`orders/${txid}`);
        if (this.isNowPayments) return this.fetchData(`payment/${txid}`);
        if (this.isOpenNode) return this.fetchData(`v2/charge/${txid}`);
        if (this.isGoURL) return this.getGoURLPaymentStatus(txid);
        if (this.isGenericGateway()) return this.getGenericGatewayTransaction(txid);
        const endpoint = this.isSteemFork ? `tx/${address}/${txid}` : `tx/${txid}`;
        const params = this.isEVM ? { tokens: '1' } : undefined;
        return this.fetchData(endpoint, { params });
    }

    async getTransactionConfirmations(address, txid) {
        if (this.isHiveEngine) return 6;
        if (this.hasDirectAntelopeApi()) {
            const transaction = await this.getTransaction(address, txid);
            return transaction?.confirmations || 0;
        }
        if (this.hasDirectSteemForkRpc()) {
            const transaction = await this.getTransaction(address, txid);
            return transaction?.confirmations || 0;
        }
        if (this.isCoinbase) {
            const charge = await this.getTransaction(address, txid);
            return charge.payments.some(p => p.status === 'confirmed') ? 1 : 0;
        }
        if (this.isTebex) {
            const payment = await this.getTransaction(address, txid);
            return payment.status === 'complete' ? 1 : 0;
        }
        if (this.isSellix) {
            const order = await this.getTransaction(address, txid);
            return order.status === 'completed' ? 1 : 0;
        }
        if (this.isCraftingStore) {
            const payment = await this.getTransaction(address, txid);
            return payment.status === 'complete' ? 1 : 0;
        }
        if (this.isStripe) {
            const payment = await this.getTransaction(address, txid);
            return payment.status === 'succeeded' ? 1 : 0;
        }
        if (this.isPayPal) {
            const payment = await this.getTransaction(address, txid);
            return payment.status === 'COMPLETED' ? 1 : 0;
        }
        if (this.isXsolla) {
            const transaction = await this.getTransaction(address, txid);
            return transaction.status === 'done' ? 1 : 0;
        }
        if (this.isSkrill) {
            const transaction = await this.getTransaction(address, txid);
            return transaction.status === 'processed' ? 1 : 0;
        }
        if (this.isWooCommerce) {
            const order = await this.getTransaction(address, txid);
            return order.status === 'completed' ? 1 : 0;
        }
        if (this.isNowPayments) {
            const payment = await this.getTransaction(address, txid);
            return ['confirmed', 'sending', 'partially_paid', 'finished'].includes(payment.payment_status) ? 1 : 0;
        }
        if (this.isOpenNode) {
            const charge = await this.getTransaction(address, txid);
            const chargeData = charge?.data || charge;
            const status = (chargeData?.status || '').toString().toLowerCase();
            return ['paid', 'processing', 'complete', 'completed'].includes(status) ? 1 : 0;
        }
        if (this.isGenericGateway()) {
            const transaction = await this.getTransaction(address, txid);
            const status = this.extractGatewayStatus(transaction);
            return ['paid', 'processing', 'complete', 'completed', 'confirmed', 'succeeded', 'success', 'finished', 'settled'].includes(status) ? 1 : 0;
        }
        const transaction = await this.getTransaction(address, txid);
        return transaction.confirmations || 0;
    }

    async createCoinbaseCharge(chargeData) {
        if (!this.isCoinbase) throw new Error('Coinbase charge creation not supported for this chain');
        try {
            const charge = await commerce.resources.Charge.create(chargeData);
            return {
                item: charge.name,
                hosted_url: charge.hosted_url,
                expires_at: charge.expires_at,
                created_at: charge.created_at,
                code: charge.code,
                type: 'charge:created',
                attempt_number: 0
            };
        } catch (error) {
            throw new Error(`Failed to create Coinbase charge: ${error.message}`);
        }
    }

    async createPayPalOrder(orderData) {
        if (!this.isPayPal) throw new Error('PayPal order creation not supported for this chain');
        try {
            const response = await this.fetchPostData('v2/checkout/orders', {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: orderData.currency || 'USD',
                        value: orderData.amount.toString()
                    },
                    description: orderData.description || 'Payment'
                }],
                payer: {
                    email_address: orderData.email || ''
                }
            });
            return {
                id: response.id,
                status: response.status,
                links: response.links,
                created_at: response.create_time
            };
        } catch (error) {
            throw new Error(`Failed to create PayPal order: ${error.message}`);
        }
    }

    async createXsollaPaymentToken(paymentData) {
        if (!this.isXsolla) throw new Error('Xsolla payment creation not supported for this chain');
        try {
            const response = await this.fetchPostData(`merchant/projects/${this.xsollaProjectId}/payment/token`, {
                user: {
                    id: paymentData.user_id || 'user',
                    email: paymentData.email || ''
                },
                purchase: {
                    checkout: {
                        currency: paymentData.currency || 'USD',
                        amount: paymentData.amount
                    }
                },
                settings: {
                    return_url: paymentData.return_url || ''
                }
            });
            return {
                token: response.token,
                url: `https://secure.xsolla.com/paystation3/?access_token=${response.token}`,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to create Xsolla payment token: ${error.message}`);
        }
    }

    async createSkrillPayment(paymentData) {
        if (!this.isSkrill) throw new Error('Skrill payment creation not supported for this chain');
        try {
            const md5Signature = crypto
                .createHash('md5')
                .update(`${this.skrillMerchantEmail}${paymentData.amount}${paymentData.currency || 'USD'}${this.skrillSecretWord}`)
                .digest('hex');
            const response = await this.fetchPostData('quick-checkout', {
                pay_to_email: this.skrillMerchantEmail,
                amount: paymentData.amount,
                currency: paymentData.currency || 'USD',
                description: paymentData.description || 'Payment',
                recipient_description: paymentData.recipient_description || 'Store Payment',
                status_url: paymentData.status_url || '',
                md5sig: md5Signature
            });
            return {
                transaction_id: response.transaction_id,
                payment_url: response.payment_url,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to create Skrill payment: ${error.message}`);
        }
    }

    async createWooCommerceOrder(orderData) {
        if (!this.isWooCommerce) throw new Error('WooCommerce order creation not supported for this chain');

        // Step 1: Fetch available payment gateways
        const gatewaysResponse = await this.woocommerceApi.get('payment_gateways');
        const gateways = gatewaysResponse.data;

        // Step 2: Build supported methods map dynamically
        const supportedMethodsMap = {};
        for (const gateway of gateways) {
            if (gateway.enabled) {
                supportedMethodsMap[gateway.id] = gateway.title;
            }
        }

        // Step 3: Validate requested method
        const paymentMethod = orderData.payment_method || 'skrill';
        if (!supportedMethodsMap[paymentMethod]) {
            throw new Error(
                `Unsupported payment method: ${paymentMethod}. Supported methods: ${Object.keys(supportedMethodsMap).join(', ')}`
            );
        }

        const paymentMethodTitle = orderData.payment_method_title || supportedMethodsMap[paymentMethod];

        const settings = await this.woocommerceApi.get('settings/general');
        const currencySetting = settings.data.find((s) => s.id === 'woocommerce_currency');
        const storeCurrency = currencySetting?.value || 'USD'; // Fallback to USD

        try {
            const response = await this.woocommerceApi.post('orders', {
                payment_method: paymentMethod,
                payment_method_title: paymentMethodTitle,
                currency: storeCurrency, // Dynamically set
                set_paid: false, // Set to true if you want to mark the order as paid immediately
                billing: {
                    email: orderData.email || '',
                    first_name: orderData.first_name || 'Customer',
                    last_name: orderData.last_name || 'Unknown',
                    address_1: orderData.address_1 || '',
                    city: orderData.city || '',
                    state: orderData.state || '',
                    postcode: orderData.postcode || '',
                    country: orderData.country || 'US'
                },
                line_items: [{
                    product_id: orderData.product_id, // Ensure this is provided
                    quantity: orderData.quantity,
                }],
                shipping: {
                    first_name: orderData.first_name || 'Customer',
                    last_name: orderData.last_name || 'Unknown',
                    address_1: orderData.address_1 || '',
                    city: orderData.city || '',
                    state: orderData.state || '',
                    postcode: orderData.postcode || '',
                    country: orderData.country || 'US'
                },
            });
            return {
                id: response.data.id,
                status: response.data.status,
                total: response.data.total,
                created_at: response.data.date_created,
                payment_url: response.data.payment_url || null
            };
        } catch (error) {
            throw new Error(`Failed to create WooCommerce order: ${error.response?.data?.message || error.message}`);
        }
    }

    async createNowPaymentsPayment(paymentData) {
        if (!this.isNowPayments) throw new Error('NOWPayments payment creation not supported for this chain');
        try {
            const response = await this.fetchPostData('payment', {
                price_amount: paymentData.price_amount || paymentData.amount,
                price_currency: paymentData.price_currency || paymentData.currency || 'usd',
                pay_currency: paymentData.pay_currency,
                ipn_callback_url: paymentData.ipn_callback_url,
                order_id: paymentData.order_id,
                order_description: paymentData.order_description || paymentData.description,
                is_fixed_rate: paymentData.is_fixed_rate,
                is_fee_paid_by_user: paymentData.is_fee_paid_by_user
            });
            return {
                payment_id: response.payment_id,
                payment_status: response.payment_status,
                pay_address: response.pay_address,
                pay_amount: response.pay_amount,
                pay_currency: response.pay_currency,
                order_id: response.order_id,
                order_description: response.order_description,
                created_at: response.created_at || new Date().toISOString(),
                raw: response
            };
        } catch (error) {
            throw new Error(`Failed to create NOWPayments payment: ${error.message}`);
        }
    }

    async createNowPaymentsInvoice(invoiceData) {
        if (!this.isNowPayments) throw new Error('NOWPayments invoice creation not supported for this chain');
        try {
            return await this.fetchPostData('invoice', {
                price_amount: invoiceData.price_amount || invoiceData.amount,
                price_currency: invoiceData.price_currency || invoiceData.currency || 'usd',
                pay_currency: invoiceData.pay_currency,
                order_id: invoiceData.order_id,
                order_description: invoiceData.order_description || invoiceData.description,
                ipn_callback_url: invoiceData.ipn_callback_url,
                success_url: invoiceData.success_url,
                cancel_url: invoiceData.cancel_url,
                is_fixed_rate: invoiceData.is_fixed_rate,
                is_fee_paid_by_user: invoiceData.is_fee_paid_by_user
            });
        } catch (error) {
            throw new Error(`Failed to create NOWPayments invoice: ${error.message}`);
        }
    }

    async nowPaymentsSubPartnerWriteOff(token, payload) {
        if (!this.isNowPayments) throw new Error('NOWPayments sub-partner write-off not supported for this chain');
        const bearer = token || await this.getNowPaymentsAuthToken();
        try {
            return await this.fetchPostData('sub-partner/write-off', payload, {
                headers: { Authorization: `Bearer ${bearer}` }
            });
        } catch (error) {
            throw new Error(`Failed NOWPayments write-off: ${error.message}`);
        }
    }

    async updateNowPaymentsSubscriptionPlan(token, planId, payload) {
        if (!this.isNowPayments) throw new Error('NOWPayments subscription update not supported for this chain');
        const bearer = token || await this.getNowPaymentsAuthToken();
        try {
            const response = await axios.patch(
                `${this.explorerUrl}subscriptions/plans/${planId}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${bearer}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Failed NOWPayments subscription plan update: ${error.response?.data?.message || error.message}`);
        }
    }

    async getNowPaymentsSubscriptionPlan(planId) {
        if (!this.isNowPayments) throw new Error('NOWPayments subscription lookup not supported for this chain');
        return this.fetchData(`subscriptions/plans/${planId}`);
    }

    async createOpenNodeCharge(chargeData) {
        if (!this.isOpenNode) throw new Error('OpenNode charge creation not supported for this chain');
        try {
            const response = await this.fetchPostData('v1/charges', {
                amount: chargeData.amount,
                currency: chargeData.currency,
                description: chargeData.description,
                customer_name: chargeData.customer_name,
                customer_email: chargeData.customer_email,
                order_id: chargeData.order_id,
                callback_url: chargeData.callback_url,
                success_url: chargeData.success_url,
                auto_settle: chargeData.auto_settle,
                split_to_btc_bps: chargeData.split_to_btc_bps,
                ttl: chargeData.ttl,
                notify_receiver: chargeData.notify_receiver
            });
            const charge = response?.data || response;
            return {
                id: charge.id,
                status: charge.status,
                amount: charge.amount,
                currency: charge.currency,
                hosted_url: charge.hosted_checkout_url || charge.hosted_url || null,
                created_at: charge.created_at || new Date().toISOString(),
                raw: response
            };
        } catch (error) {
            throw new Error(`Failed to create OpenNode charge: ${error.message}`);
        }
    }

    async getOpenNodeCharge(chargeId) {
        if (!this.isOpenNode) throw new Error('OpenNode charge lookup not supported for this chain');
        return this.fetchData(`v2/charge/${chargeId}`);
    }

    async listOpenNodeCharges(params = {}) {
        if (!this.isOpenNode) throw new Error('OpenNode charges list not supported for this chain');
        return this.fetchData('v2/charges', { params });
    }

    async getOpenNodeAccountBalance() {
        if (!this.isOpenNode) throw new Error('OpenNode balance lookup not supported for this chain');
        return this.fetchData('v1/account/balance');
    }

    async getOpenNodeSupportedCurrencies() {
        if (!this.isOpenNode) throw new Error('OpenNode currencies lookup not supported for this chain');
        return this.fetchData('v1/currencies');
    }

    async listOpenNodeStaticLnAddresses(params = {}) {
        if (!this.isOpenNode) throw new Error('OpenNode static LN list not supported for this chain');
        return this.fetchData('v2/static-ln-addresses', { params });
    }

    async createOpenNodeStaticLnAddress(payload = {}) {
        if (!this.isOpenNode) throw new Error('OpenNode static LN creation not supported for this chain');
        return this.fetchPostData('v2/static-ln-addresses', payload);
    }

    async listOpenNodeStaticOnchainAddresses(params = {}) {
        if (!this.isOpenNode) throw new Error('OpenNode static on-chain list not supported for this chain');
        return this.fetchData('v2/static-onchain-addresses', { params });
    }

    async createOpenNodeStaticOnchainAddress(payload = {}) {
        if (!this.isOpenNode) throw new Error('OpenNode static on-chain creation not supported for this chain');
        return this.fetchPostData('v2/static-onchain-addresses', payload);
    }

    async createTebexCheckout(packageId, username) {
        if (!this.isTebex) throw new Error('Tebex checkout creation not supported for this chain');
        const body = `package_id=${packageId}&username=${username}`;
        return this.fetchPostData('checkout', body);
    }

    async getTebexPlayerLookup(username) {
        if (!this.isTebex) throw new Error('Tebex player lookup not supported for this chain');
        return this.fetchData(`user/${username}`);
    }

    async getTebexSales() {
        if (!this.isTebex) throw new Error('Tebex sales not supported for this chain');
        return this.fetchData('sales');
    }

    async getTebexBans() {
        if (!this.isTebex) throw new Error('Tebex bans not supported for this chain');
        return this.fetchData('bans');
    }

    async getTebexPackages() {
        if (!this.isTebex) throw new Error('Tebex packages not supported for this chain');
        return this.fetchData('packages');
    }

    async getSellixProduct(productId) {
        if (!this.isSellix) throw new Error('Sellix product not supported for this chain');
        return this.fetchData(`products/${productId}`);
    }
}

module.exports = { PaymentAPI };
