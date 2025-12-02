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
        if (config.isWooCommerce && !config.url.match(/^https:\/\/.*\/wp-json\/wc\/v3\/$/)) {
            throw new Error('WooCommerce URL must be a valid HTTPS URL ending with /wp-json/wc/v3/');
        }

        this.explorerUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
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
        this.isEVM = config.isEVM || false;
        this.tokenContract = config.tokenContract ? config.tokenContract.toLowerCase() : null;
        this.defaultEvmDecimals = config.evmDecimals || 18;

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
        try {
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
                ...(options.headers || {})
            };
            const response = await axios.get(`${this.explorerUrl}${endpoint}`, { headers, params: options.params });
            return response.data;
        } catch (error) {
            throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
        }
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
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ...(this.isTebex && { 'X-Tebex-Secret': this.tebexApiKey }),
                ...(this.isPayPal && { Authorization: `Basic ${this.paypalAuth}` }),
                ...(this.isXsolla && { Authorization: `Basic ${Buffer.from(`${this.xsollaMerchantId}:${this.xsollaApiKey}`).toString('base64')}` }),
                ...(this.isSkrill && { 'X-Skrill-Email': this.skrillMerchantEmail }),
                ...(options.headers || {})
            };
            const response = await axios.post(`${this.explorerUrl}${endpoint}`, body, { headers });
            return response.data;
        } catch (error) {
            throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
        }
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
        return this.fetchData(`address/${address}`, { params: { details: 'txs', tokens: '1' } }).then(data => {
            if (Array.isArray(data.transactions) && data.transactions.length) return data.transactions;
            if (Array.isArray(data.txids) && data.txids.length) return data.txids;
            if (Array.isArray(data.txs) && data.txs.length) return data.txs;
            return [];
        });
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
        this.isEVM = config.isEVM || false;
        this.tokenContract = config.tokenContract ? config.tokenContract.toLowerCase() : null;
        this.defaultEvmDecimals = config.evmDecimals || 18;
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

                    // Skip transactions after timestamp
                    let txTimestamp;
                    if (this.isCoinbase || this.isTebex || this.isSellix || this.isCraftingStore || this.isPayPal || this.isXsolla || this.isSkrill || this.isWooCommerce) {
                        txTimestamp = new Date(transaction.created_at || transaction.date_created).getTime() / 1000;
                    } else if (this.isStripe) {
                        txTimestamp = transaction.created;
                    } else {
                        txTimestamp = transaction.blocktime || transaction.blockTime || 0;
                    }
                    if (txTimestamp !== 0 && txTimestamp > timestamp) continue;

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
                        resolve({
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
        throw new Error('Payment creation only supported for Coinbase, PayPal, Xsolla, Skrill, or WooCommerce');
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
    hbd: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/hive/', isSteemFork: true },
    blurt: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/blurt/', isSteemFork: true },
    steem: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/steem/', isSteemFork: true },
    sbd: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/steem/', isSteemFork: true },
    tlos: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/telos/', isSteemFork: true },
    eos: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/eos/', isSteemFork: true },
    bnb: { url: 'https://bsc1.trezor.io/api/', isSteemFork: false, isEVM: true, evmDecimals: 18 },
    wax: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/wax/', isSteemFork: true },
    fls: { url: 'https://fls.flitswallet.app/api/v1/', isSteemFork: false },
    ltc: { url: 'https://ltc.flitswallet.app/api/v1/', isSteemFork: false },
    dogec: { url: 'https://dogecexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false },
    znz: { url: 'https://znzexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false },
    pol: { url: 'https://pol1.trezor.io/api/v2/', isSteemFork: false, isEVM: true, evmDecimals: 18 },
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
    woo: { url: 'https://placeholder.com/wp-json/wc/v3/', isWooCommerce: true }
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

