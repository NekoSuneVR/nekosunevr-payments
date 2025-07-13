const axios = require('axios');
const commerce = require('coinbase-commerce-node');
const Stripe = require('stripe');

class PaymentAPI {
    constructor(config) {
        this.explorerUrl = config.url;
        this.isSteemFork = config.isSteemFork || false;
        this.isBNB = config.isBNB || false;
        this.isTebex = config.isTebex || false;
        this.isCoinbase = config.isCoinbase || false;
        this.isSellix = config.isSellix || false;
        this.isCraftingStore = config.isCraftingStore || false;
        this.isStripe = config.isStripe || false;
        this.tebexApiKey = process.env.TEBEX_API_KEY;
        this.coinbaseApiKey = process.env.COINBASE_API_KEY;
        this.sellixApiKey = process.env.SELLIX_API_KEY;
        this.craftingstoreApiKey = process.env.CRAFTINGSTORE_API_KEY;
        this.stripeApiKey = process.env.STRIPE_API_KEY;
        if (this.isCoinbase) commerce.Client.init(this.coinbaseApiKey);
        if (this.isStripe) this.stripe = new Stripe(this.stripeApiKey);
    }

    async fetchData(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(this.isTebex && { 'X-Tebex-Secret': this.tebexApiKey }),
                ...(this.isCoinbase && { 'X-CC-Api-Key': this.coinbaseApiKey, 'X-CC-Version': '2018-03-22' }),
                ...(this.isSellix && { Authorization: `Bearer ${this.sellixApiKey}` }),
                ...(this.isCraftingStore && { token: `Bearer ${this.craftingstoreApiKey}` }),
                ...(options.headers || {})
            };
            const response = await axios.get(`${this.explorerUrl}${endpoint}`, { headers });
            return response.data;
        } catch (error) {
            throw new Error(`API request failed: ${error.message}`);
        }
    }

    async fetchPostData(endpoint, body, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(this.isTebex && { 'X-Tebex-Secret': this.tebexApiKey }),
                ...(options.headers || {})
            };
            const response = await axios.post(`${this.explorerUrl}${endpoint}`, body, { headers });
            return response.data;
        } catch (error) {
            throw new Error(`API request failed: ${error.message}`);
        }
    }

    async getAddressTransactions(address) {
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
        return this.fetchData(`address/${address}`).then(data => data.transactions || []);
    }

    async getTransaction(address, txid) {
        if (this.isCoinbase) return this.fetchData(`charges/${txid}`);
        if (this.isTebex) return this.fetchData(`payments/${txid}`);
        if (this.isSellix) return this.fetchData(`orders/${txid}`);
        if (this.isCraftingStore) {
            const payments = await this.fetchData('payments');
            return payments.data.find(payment => payment.transactionId.toLowerCase() === txid.toLowerCase());
        }
        if (this.isStripe) return this.stripe.paymentIntents.retrieve(txid);
        const endpoint = this.isSteemFork ? `tx/${address}/${txid}` : `tx/${txid}`;
        return this.fetchData(endpoint);
    }

    async getTransactionConfirmations(address, txid) {
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
    constructor(chain, config) {
        this.api = new PaymentAPI(config);
        this.chain = chain.toLowerCase();
        this.isSteemFork = config.isSteemFork || false;
        this.isBNB = config.isBNB || false;
        this.isCoinbase = config.isCoinbase || false;
        this.isTebex = config.isTebex || false;
        this.isSellix = config.isSellix || false;
        this.isCraftingStore = config.isCraftingStore || false;
        this.isStripe = config.isStripe || false;
    }

    async existsTransaction(address, amount, memo = null, timestamp) {
        return new Promise(async (resolve, reject) => {
        try {
            const transactions = await this.api.getAddressTransactions(address);
            
            for (const txid of transactions) {
                const transaction = await this.api.getTransaction(address, txid);

                // Skip transactions after timestamp
                let txTimestamp;
                if (this.isCoinbase || this.isTebex || this.isSellix || this.isCraftingStore) {
                    txTimestamp = new Date(transaction.created_at).getTime() / 1000;
                } else if (this.isStripe) {
                    txTimestamp = transaction.created;
                } else {
                    txTimestamp = transaction.blocktime || 0;
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
                    })
                }
            }

            resolve({
                exists: false,
                txid: '',
                conf: ''
            })
        } catch (error) {
            console.error(`Error checking transaction on ${this.chain}:`, error);
            resolve({
                exists: false,
                txid: '',
                conf: '',
                error: error.message
            });
        }
      })
    }

    async createPayment(chargeData) {
        if (!this.isCoinbase) throw new Error('Payment creation only supported for Coinbase');
        return this.api.createCoinbaseCharge(chargeData);
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

// Chain configurations
const chainConfigs = {
    hive: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/hive/', isSteemFork: true },
    hbd: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/hive/', isSteemFork: true },
    blurt: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/blurt/', isSteemFork: true },
    steem: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/steem/', isSteemFork: true },
    sbd: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/steem/', isSteemFork: true },
    tlos: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/telos/', isSteemFork: true },
    eos: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/eos/', isSteemFork: true },
    bnb: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/bnb/', isBNB: true },
    wax: { url: 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/wax/', isSteemFork: true },
    fls: { url: 'https://fls.flitswallet.app/api/v1/', isSteemFork: false },
    ltc: { url: 'https://ltc.flitswallet.app/api/v1/', isSteemFork: false },
    dogec: { url: 'https://dogecexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false },
    znz: { url: 'https://znzexplorer.alloyxuast.co.uk/api/v1/', isSteemFork: false },
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
    stripe: { url: 'https://api.stripe.com/v1/', isStripe: true }
};

// Export modules for each chain
Object.keys(chainConfigs).forEach(chain => {
    exports[`${chain.toUpperCase()}Module`] = class extends ChainModule {
        constructor() {
            super(chain, chainConfigs[chain]);
        }
    };
});
