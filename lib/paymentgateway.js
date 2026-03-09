const axios = require('axios');
const commerce = require('coinbase-commerce-node');
const Stripe = require('stripe');
const crypto = require('crypto');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
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
        this.tokenContract = config.tokenContract ? config.tokenContract.toLowerCase() : null;
        this.defaultEvmDecimals = config.evmDecimals || 18;
        this.defaultTronDecimals = config.tronDecimals || 6;

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
            ...(options.headers || {})
        };
        const bases = [this.explorerUrl, ...this.altExplorerUrls];
        let lastError = null;
        for (const base of bases) {
            try {
                const response = await axios.get(`${base}${endpoint}`, { headers, params: options.params });
                return response.data;
            } catch (error) {
                lastError = error;
                const status = error.response?.status;
                if (status === 403 || status === 429 || status === 503) continue;
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
            ...(options.headers || {})
        };
        const bases = [this.explorerUrl, ...this.altExplorerUrls];
        let lastError = null;
        for (const base of bases) {
            try {
                const response = await axios.post(`${base}${endpoint}`, body, { headers });
                return response.data;
            } catch (error) {
                lastError = error;
                const status = error.response?.status;
                if (status === 403 || status === 429 || status === 503) continue;
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

    async getAddressTransactions(address) {

        if (this.isHiveEngine) {
            const res = await axios.get(
                `https://accounts.hive-engine.com/accountHistory?account=${address}`
            );
            return res.data; // Array of full objects
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

    async getTransaction(address, txid) {
        if (this.isHiveEngine) {
            return null; // existsTransaction handles full object directly
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
        if (this.isGenericGateway()) return this.getGenericGatewayTransaction(txid);
        const endpoint = this.isSteemFork ? `tx/${address}/${txid}` : `tx/${txid}`;
        const params = this.isEVM ? { tokens: '1' } : undefined;
        return this.fetchData(endpoint, { params });
    }

    async getTransactionConfirmations(address, txid) {
        if (this.isHiveEngine) return 6;
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

class ChainModule {
    constructor(chain, config, domain = null) {
        if (chain.toLowerCase() === 'woo' && domain) {
            config = { ...config, url: `${domain}/wp-json/wc/v3/` };
        }
        this.api = new PaymentAPI(config);
        this.chain = chain.toLowerCase();
        this.isHiveEngine = config.isHiveEngine || false;
        this.isSteemFork = config.isSteemFork || false;
        this.isBNB = config.isBNB || false;
        this.isCoinbase = config.isCoinbase || false;
        this.isTebex = config.isTebex || false;
        this.isSellix = config.isSellix || false;
        this.Satoshi = require('satoshi-bitcoin');
        this.isCraftingStore = config.isCraftingStore || false;
        this.isStripe = config.isStripe || false;
        this.isPayPal = config.isPayPal || false;
        this.isXsolla = config.isXsolla || false;
        this.isSkrill = config.isSkrill || false;
        this.isWooCommerce = config.isWooCommerce || false;
        this.isNowPayments = config.isNowPayments || false;
        this.isOpenNode = config.isOpenNode || false;
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
        this.isGenericGateway = this.isBitPay || this.isPayoneer || this.isPaymentwall || this.isSquare ||
            this.isWorldpay || this.isAmazonPay || this.isApplePay || this.isGooglePay || this.isWeChatPay ||
            this.isOFX || this.isFortumo || this.isAuthorizeNet || this.isAlipay;
        this.isEVM = config.isEVM || false;
        this.isTron = config.isTron || false;
        this.tokenContract = config.tokenContract ? config.tokenContract.toLowerCase() : null;
        this.defaultEvmDecimals = config.evmDecimals || 18;
        this.defaultTronDecimals = config.tronDecimals || 6;
    }

    async existsTransaction(address, amount, timestamp, memo = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const transactions = await this.api.getAddressTransactions(address);

                if (this.isHiveEngine) {
                    const transfers = transactions.filter(
                        (tx) => tx.operation === "tokens_transfer"
                    );

                    const match = transfers.find(
                        (tx) =>
                            tx.to === address &&
                            Number(tx.quantity) === Number(amount) &&
                            (!memo || tx.memo === memo)
                    );

                    if (!match) {
                        return resolve({
                            exists: false,
                            txid: "",
                            conf: "",
                        });
                    }

                    return resolve({
                        exists: true,
                        txid: match.transactionId,
                        conf: 6,
                        raw: match,
                    });
                }

                for (const txRef of transactions) {
                    const transaction = (typeof txRef === 'object' && txRef !== null)
                        ? txRef
                        : await this.api.getTransaction(address, txRef);
                    const txid = transaction.txid || transaction.hash || txRef;

                    // Normalize timestamp (accept seconds or milliseconds) and skip older txs.
                    const normalizedTimestamp = Number(timestamp) > 1e12
                        ? Math.floor(Number(timestamp) / 1000)
                        : Number(timestamp || 0);
                    let txTimestamp;
                    if (this.isCoinbase || this.isTebex || this.isSellix || this.isCraftingStore || this.isPayPal || this.isXsolla || this.isSkrill || this.isWooCommerce || this.isNowPayments || this.isOpenNode || this.isGenericGateway) {
                        txTimestamp = new Date(transaction.created_at || transaction.date_created).getTime() / 1000;
                    } else if (this.isStripe) {
                        txTimestamp = transaction.created;
                    } else {
                        txTimestamp = transaction.blocktime || transaction.blockTime || 0;
                    }
                    if (normalizedTimestamp > 0 && txTimestamp !== 0 && txTimestamp < normalizedTimestamp) continue;

                    let isMatch = false;
                    if (this.isCoinbase) {
                        const payment = transaction.payments.find(p =>
                            p.value.amount === amount.toString() &&
                            p.value.crypto.address === address &&
                            (!memo || p.metadata.memo === memo) &&
                            p.status === 'confirmed'
                        );
                        isMatch = !!payment;
                    } else if (this.isTebex) {
                        isMatch = transaction.amount === amount &&
                            transaction.status === 'complete' &&
                            transaction.player?.ign?.toLowerCase() === address.toLowerCase() &&
                            (!memo || transaction.note === memo);
                    } else if (this.isSellix) {
                        isMatch = transaction.total === amount &&
                            transaction.status === 'completed' &&
                            transaction.crypto_address === address &&
                            (!memo || transaction.custom_fields?.memo === memo);
                    } else if (this.isCraftingStore) {
                        isMatch = transaction.amount === amount &&
                            transaction.status === 'complete' &&
                            transaction.mcUsername?.toLowerCase() === address.toLowerCase() &&
                            (!memo || transaction.note === memo);
                    } else if (this.isStripe) {
                        isMatch = transaction.amount / 100 === amount &&
                            transaction.status === 'succeeded' &&
                            transaction.metadata.address === address &&
                            (!memo || transaction.metadata.memo === memo);
                    } else if (this.isPayPal) {
                        isMatch = transaction.amount.value === amount.toString() &&
                            transaction.status === 'COMPLETED' &&
                            transaction.payer?.email_address?.toLowerCase() === address.toLowerCase() &&
                            (!memo || transaction.description === memo);
                    } else if (this.isXsolla) {
                        isMatch = transaction.purchase.checkout.amount === amount &&
                            transaction.status === 'done' &&
                            transaction.user.id.toLowerCase() === address.toLowerCase() &&
                            (!memo || transaction.description === memo);
                    } else if (this.isSkrill) {
                        const md5Signature = crypto
                            .createHash('md5')
                            .update(`${transaction.transaction_id}${transaction.amount}${transaction.currency}${this.api.skrillSecretWord}`)
                            .digest('hex');
                        isMatch = transaction.amount === amount &&
                            transaction.status === 'processed' &&
                            transaction.pay_to_email.toLowerCase() === address.toLowerCase() &&
                            transaction.md5sig === md5Signature &&
                            (!memo || transaction.description === memo);
                    } else if (this.isWooCommerce) {
                        const memoMatch = memo ? transaction.meta_data?.find(meta => meta.key === 'payment_memo' && meta.value === memo) : true;
                        isMatch = parseFloat(transaction.total) === amount &&
                            transaction.status === 'completed' &&
                            transaction.billing.email.toLowerCase() === address.toLowerCase() &&
                            memoMatch;
                    } else if (this.isNowPayments) {
                        const status = transaction.payment_status;
                        const validStatus = ['confirming', 'confirmed', 'sending', 'partially_paid', 'finished'].includes(status);
                        const paidAmount = Number(transaction.actually_paid || 0);
                        const expectedAmount = Number(transaction.pay_amount || 0);
                        const addressMatch = normalizeAddress(transaction.pay_address) === normalizeAddress(address);
                        const amountMatch = paidAmount >= Number(amount) || expectedAmount === Number(amount);
                        isMatch = validStatus && addressMatch && amountMatch &&
                            (!memo || transaction.order_description === memo || transaction.order_id === memo);
                    } else if (this.isOpenNode) {
                        const nodeTx = transaction?.data || transaction;
                        const status = (nodeTx?.status || '').toString().toLowerCase();
                        const addressMatch = !address || [
                            nodeTx?.customer_email,
                            nodeTx?.order_id,
                            nodeTx?.id
                        ].filter(Boolean).map(v => v.toString().toLowerCase()).includes(address.toLowerCase());
                        const amountMatch = Number(nodeTx?.amount) === Number(amount);
                        isMatch = ['paid', 'processing', 'complete', 'completed'].includes(status) && amountMatch && addressMatch;
                    } else if (this.isGenericGateway) {
                        const genericTx = transaction?.data || transaction?.result || transaction;
                        const status = (genericTx?.status || genericTx?.payment_status || genericTx?.state || '').toString().toLowerCase();
                        const amountValue = genericTx?.amount ?? genericTx?.price ?? genericTx?.total ?? genericTx?.value ?? genericTx?.price_amount;
                        const addressCandidates = [
                            genericTx?.customer_email,
                            genericTx?.email,
                            genericTx?.order_id,
                            genericTx?.orderId,
                            genericTx?.id,
                            genericTx?.reference
                        ].filter(Boolean).map(v => v.toString().toLowerCase());
                        const addressMatch = !address || addressCandidates.includes(address.toLowerCase());
                        const amountMatch = amountValue === undefined || amountValue === null || Number(amountValue) === Number(amount);
                        isMatch = ['paid', 'processing', 'complete', 'completed', 'confirmed', 'succeeded', 'success', 'finished', 'settled'].includes(status) &&
                            amountMatch &&
                            addressMatch &&
                            (!memo || genericTx?.description === memo || genericTx?.order_description === memo);
                    } else if (this.isTron) {
                        const tokenContract = this.tokenContract;
                        const lowerAddress = normalizeAddress(address);
                        const tokenMatch = (transaction.tokenTransfers || []).some(transfer => {
                            const transferToken = (transfer.contract || transfer.token || transfer.id || '').toString().toLowerCase();
                            if (tokenContract && transferToken !== tokenContract) return false;
                            if (normalizeAddress(transfer.to) !== lowerAddress) return false;
                            const decimals = transfer.decimals !== undefined && transfer.decimals !== null && !Number.isNaN(Number(transfer.decimals))
                                ? Number(transfer.decimals)
                                : this.defaultTronDecimals;
                            return matchAmountWithDecimals(transfer.value || '0', amount, decimals);
                        });
                        const nativeMatch = normalizeAddress(transaction.toAddress) === lowerAddress &&
                            matchAmountWithDecimals(transaction.value || '0', amount, this.defaultTronDecimals);
                        isMatch = tokenMatch || nativeMatch;
                    } else if (this.isEVM) {
                        const tokenContract = this.tokenContract;
                        const lowerAddress = normalizeAddress(address);
                        const tokenTransfers = transaction.tokenTransfers || [];
                        const tokenMatch = tokenTransfers.some(transfer => {
                            if (tokenContract && normalizeAddress(transfer.contract) !== tokenContract) return false;
                            if (normalizeAddress(transfer.to) !== lowerAddress) return false;
                            const decimals = transfer.decimals !== undefined && transfer.decimals !== null && !Number.isNaN(Number(transfer.decimals))
                                ? Number(transfer.decimals)
                                : this.defaultEvmDecimals;
                            return matchAmountWithDecimals(transfer.value || '0', amount, decimals);
                        });
                        const outputs = transaction.vout || [];
                        const nativeMatch = outputs.some(output => {
                            const outputAddresses = output.addresses || [];
                            const matchesAddress = outputAddresses.some(addr => normalizeAddress(addr) === lowerAddress);
                            if (!matchesAddress) return false;
                            const decimals = this.defaultEvmDecimals;
                            return matchAmountWithDecimals(output.value || '0', amount, decimals);
                        });
                        isMatch = tokenMatch || nativeMatch;
                    } else {
                        const matchingVout = transaction.vout.find(vout => {
                            if (this.isBNB) {
                                return vout.value === amount &&
                                    vout.toAddr.toLowerCase() === address.toLowerCase();
                            }
                            if (this.isSteemFork) {
                                return vout.value === amount &&
                                    (!memo || vout.memo === memo) &&
                                    vout.address.toLowerCase() === address.toLowerCase();
                            }
                            return vout.value === amount &&
                                vout.scriptPubKey.addresses[0] === address;
                        });
                        isMatch = !!matchingVout;
                    }

                    if (isMatch) {
                        const confirmations = await this.api.getTransactionConfirmations(address, txid);
                        return resolve({
                            exists: true,
                            txid,
                            conf: confirmations
                        });
                    }
                }

                resolve({
                    exists: false,
                    txid: '',
                    conf: ''
                });
            } catch (error) {
                console.error(`Error checking transaction on ${this.chain}:`, error);
                resolve({
                    exists: false,
                    txid: '',
                    conf: '',
                    error: error.message
                });
            }
        });
    }

    async createPayment(chargeData) {
        if (this.isCoinbase) return this.api.createCoinbaseCharge(chargeData);
        if (this.isPayPal) return this.api.createPayPalOrder(chargeData);
        if (this.isXsolla) return this.api.createXsollaPaymentToken(chargeData);
        if (this.isSkrill) return this.api.createSkrillPayment(chargeData);
        if (this.isWooCommerce) return this.api.createWooCommerceOrder(chargeData);
        if (this.isNowPayments) return this.api.createNowPaymentsPayment(chargeData);
        if (this.isOpenNode) return this.api.createOpenNodeCharge(chargeData);
        if (this.isGenericGateway) return this.api.createGenericGatewayPayment(chargeData);
        throw new Error('Payment creation not supported for this chain');
    }

    async createInvoice(invoiceData) {
        if (!this.isNowPayments) throw new Error('Invoice creation only supported for NOWPayments');
        return this.api.createNowPaymentsInvoice(invoiceData);
    }

    async getApiStatus() {
        if (!this.isNowPayments) throw new Error('API status lookup only supported for NOWPayments');
        return this.api.getNowPaymentsStatus();
    }

    async getAvailableCurrencies() {
        if (!this.isNowPayments) throw new Error('Currency lookup only supported for NOWPayments');
        return this.api.getNowPaymentsCurrencies();
    }

    async getMinimumPaymentAmount(fromCurrency, toCurrency) {
        if (!this.isNowPayments) throw new Error('Minimum amount lookup only supported for NOWPayments');
        return this.api.getNowPaymentsMinimumAmount(fromCurrency, toCurrency);
    }

    async getEstimatedPrice(amount, fromCurrency, toCurrency) {
        if (!this.isNowPayments) throw new Error('Estimated price lookup only supported for NOWPayments');
        return this.api.getNowPaymentsEstimateAmount(amount, fromCurrency, toCurrency);
    }

    async getPaymentStatus(paymentId) {
        if (!this.isNowPayments) throw new Error('Payment status lookup only supported for NOWPayments');
        return this.api.getTransaction('', paymentId);
    }

    async auth(email, password) {
        if (!this.isNowPayments) throw new Error('Auth helper only supported for NOWPayments');
        return this.api.nowPaymentsAuth(email, password);
    }

    async listPayments(params = {}) {
        if (!this.isNowPayments) throw new Error('List payments helper only supported for NOWPayments');
        return this.api.listNowPayments(params);
    }

    async listConversions(token, params = {}) {
        if (!this.isNowPayments) throw new Error('List conversions helper only supported for NOWPayments');
        return this.api.listNowPaymentsConversions(token, params);
    }

    async writeOffSubPartner(token, payload) {
        if (!this.isNowPayments) throw new Error('Sub-partner write-off helper only supported for NOWPayments');
        return this.api.nowPaymentsSubPartnerWriteOff(token, payload);
    }

    async updateSubscriptionPlan(token, planId, payload) {
        if (!this.isNowPayments) throw new Error('Subscription update helper only supported for NOWPayments');
        return this.api.updateNowPaymentsSubscriptionPlan(token, planId, payload);
    }

    async getSubscriptionPlan(planId) {
        if (!this.isNowPayments) throw new Error('Subscription lookup helper only supported for NOWPayments');
        return this.api.getNowPaymentsSubscriptionPlan(planId);
    }

    async getCharge(chargeId) {
        if (this.isOpenNode) return this.api.getOpenNodeCharge(chargeId);
        if (this.isGenericGateway) return this.api.getGenericGatewayTransaction(chargeId);
        throw new Error('Charge lookup helper only supported for OpenNode and generic payment gateways');
    }

    async listCharges(params = {}) {
        if (this.isOpenNode) return this.api.listOpenNodeCharges(params);
        if (this.isGenericGateway) return this.api.listGenericGatewayTransactions(params);
        throw new Error('List charges helper only supported for OpenNode and generic payment gateways');
    }

    async getAccountBalance() {
        if (!this.isOpenNode) throw new Error('Balance helper only supported for OpenNode');
        return this.api.getOpenNodeAccountBalance();
    }

    async getSupportedCurrencies() {
        if (!this.isOpenNode) throw new Error('Currencies helper only supported for OpenNode');
        return this.api.getOpenNodeSupportedCurrencies();
    }

    async listStaticLnAddresses(params = {}) {
        if (!this.isOpenNode) throw new Error('Static LN addresses helper only supported for OpenNode');
        return this.api.listOpenNodeStaticLnAddresses(params);
    }

    async createStaticLnAddress(payload = {}) {
        if (!this.isOpenNode) throw new Error('Static LN address creation helper only supported for OpenNode');
        return this.api.createOpenNodeStaticLnAddress(payload);
    }

    async listStaticOnchainAddresses(params = {}) {
        if (!this.isOpenNode) throw new Error('Static on-chain addresses helper only supported for OpenNode');
        return this.api.listOpenNodeStaticOnchainAddresses(params);
    }

    async createStaticOnchainAddress(payload = {}) {
        if (!this.isOpenNode) throw new Error('Static on-chain address creation helper only supported for OpenNode');
        return this.api.createOpenNodeStaticOnchainAddress(payload);
    }

    verifyIPN(ipnPayload, signature) {
        if (!this.isNowPayments) throw new Error('IPN signature verification only supported for NOWPayments');
        if (!this.api.nowPaymentsIpnSecret) {
            throw new Error('NOWPAYMENTS_IPN_SECRET is required for IPN signature verification');
        }
        const signedPayload = JSON.stringify(sortObjectDeep(ipnPayload));
        const digest = crypto
            .createHmac('sha512', this.api.nowPaymentsIpnSecret)
            .update(signedPayload)
            .digest('hex');
        return digest === signature;
    }

    async createCheckoutURL(packageId, username) {
        if (!this.isTebex) throw new Error('Checkout URL creation only supported for Tebex');
        return this.api.createTebexCheckout(packageId, username);
    }

    async getPlayerLookup(username) {
        if (!this.isTebex) throw new Error('Player lookup only supported for Tebex');
        return this.api.getTebexPlayerLookup(username);
    }

    async getSales() {
        if (!this.isTebex) throw new Error('Sales retrieval only supported for Tebex');
        return this.api.getTebexSales();
    }

    async getBans() {
        if (!this.isTebex) throw new Error('Bans retrieval only supported for Tebex');
        return this.api.getTebexBans();
    }

    async getPackages() {
        if (!this.isTebex) throw new Error('Packages retrieval only supported for Tebex');
        return this.api.getTebexPackages();
    }

    async getProduct(productId) {
        if (!this.isSellix) throw new Error('Product retrieval only supported for Sellix');
        return this.api.getSellixProduct(productId);
    }
}

const chainConfigs = {
    hiveengine: {
        url: "https://accounts.hive-engine.com/accountHistory?account=",
        isHiveEngine: true,
    },
    hive: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/hive/', isSteemFork: true },
    hbd: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/hbd/', isSteemFork: true },
    blurt: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/blurt/', isSteemFork: true },
    steem: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/steem/', isSteemFork: true },
    sbd: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/sbd/', isSteemFork: true },
    tlos: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/telos/', isSteemFork: true },
    eos: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/eos/', isSteemFork: true },
    bnb: {
        url: 'https://bscbook.guarda.com/api',
        altExplorerUrls: ['https://bsc1.trezor.io/api', 'https://bsc2.trezor.io/api'],
        isSteemFork: false,
        isEVM: true,
        evmDecimals: 18
    },
    wax: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/wax/', isSteemFork: true },
    fls: { url: 'https://fls.flitswallet.app/api/v1/', isSteemFork: false },
    ltc: { url: 'https://ltc.flitswallet.app/api/v1/', isSteemFork: false },
    dogec: { url: 'https://dogecexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false },
    znz: { url: 'https://znzexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false },
    pol: {
        url: 'https://maticbook.guarda.com/api',
        altExplorerUrls: ['https://pol1.trezor.io/api', 'https://pol2.trezor.io/api'],
        isSteemFork: false,
        isEVM: true,
        evmDecimals: 18
    },
    trx: { url: 'https://tronbook.guarda.com/api', isSteemFork: false, isTron: true, tronDecimals: 6 },
    tron: { url: 'https://tronbook.guarda.com/api', isSteemFork: false, isTron: true, tronDecimals: 6 },
    bch: { url: 'https://bchbook.guarda.com/api/', isSteemFork: false },
    eth: { url: 'https://ethbook.guarda.co/api', isSteemFork: false, isEVM: true, evmDecimals: 18 },
    pivx: { url: 'https://explorer.duddino.com/api/v1/', isSteemFork: false },
    doge: { url: 'https://doge.flitswallet.app/api/v1/', isSteemFork: false },
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
    btc: { url: 'https://btc.flitswallet.app/api/v1/', isSteemFork: false },
    scc: { url: 'https://scc.flitswallet.app/api/v1/', isSteemFork: false },
    tebex: { url: 'https://plugin.tebex.io/', isTebex: true },
    coinbase: { url: 'https://api.commerce.coinbase.com/', isCoinbase: true },
    sellix: { url: 'https://dev.sellix.io/v1/', isSellix: true },
    craftingstore: { url: 'https://api.craftingstore.net/v7/', isCraftingStore: true },
    stripe: { url: 'https://api.stripe.com/v1/', isStripe: true },
    paypal: { url: 'https://api-m.paypal.com/', isPayPal: true },
    xsolla: { url: 'https://api.xsolla.com/', isXsolla: true },
    skrill: { url: 'https://www.skrill.com/', isSkrill: true },
    woo: { url: 'https://placeholder.com/wp-json/wc/v3/', isWooCommerce: true },
    nowpayments: { url: 'https://api.nowpayments.io/v1/', isNowPayments: true },
    opennode: { url: 'https://api.opennode.com/', isOpenNode: true },
    bitpay: { url: 'https://api.bitpay.com/', isBitPay: true, gatewayType: 'bitpay' },
    payoneer: { url: 'https://api.payoneer.com/', isPayoneer: true, gatewayType: 'payoneer' },
    paymentwall: { url: 'https://api.paymentwall.com/', isPaymentwall: true, gatewayType: 'paymentwall' },
    square: { url: 'https://connect.squareup.com/', isSquare: true, gatewayType: 'square' },
    worldpay: { url: 'https://api.worldpay.com/', isWorldpay: true, gatewayType: 'worldpay' },
    amazonpay: { url: 'https://pay-api.amazon.com/', isAmazonPay: true, gatewayType: 'amazonpay' },
    applepay: { url: 'https://api.apple.com/', isApplePay: true, gatewayType: 'applepay' },
    googlepay: { url: 'https://payments.google.com/', isGooglePay: true, gatewayType: 'googlepay' },
    wechatpay: { url: 'https://api.mch.weixin.qq.com/', isWeChatPay: true, gatewayType: 'wechatpay' },
    ofx: { url: 'https://api.ofx.com/', isOFX: true, gatewayType: 'ofx' },
    fortumo: { url: 'https://api.fortumo.com/', isFortumo: true, gatewayType: 'fortumo' },
    authorizenet: { url: 'https://api.authorize.net/', isAuthorizeNet: true, gatewayType: 'authorizenet' },
    alipay: { url: 'https://openapi.alipay.com/', isAlipay: true, gatewayType: 'alipay' }
};

Object.keys(chainConfigs).forEach(chain => {
    exports[`${chain.toUpperCase()}Module`] = class extends ChainModule {
        constructor(configOverrides = {}, domain) {
            let overrides = configOverrides;
            let resolvedDomain = domain;
            if (typeof configOverrides === 'string' && domain === undefined) {
                resolvedDomain = configOverrides;
                overrides = {};
            }
            const mergedConfig = { ...chainConfigs[chain], ...overrides };
            super(chain, mergedConfig, resolvedDomain);
        }
    };
});

