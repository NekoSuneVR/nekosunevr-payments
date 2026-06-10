const crypto = require('crypto');
const { PaymentAPI } = require('./PaymentAPI');
const {
    normalizeAddress,
    matchAmountWithDecimals,
    sortObjectDeep
} = require('./utils');

// One-time warning per unverified module. A gateway flagged `verified: false` in config
// has a correct-looking base URL/auth but its exact create/get endpoints are NOT tested —
// confirm against the provider's docs (or override per call). Set
// NEKOPAY_SUPPRESS_UNVERIFIED_WARN=1 to silence.
const warnedUnverified = new Set();
const warnIfUnverified = (chain, config) => {
    if (config.verified !== false) return; // absent/true => trusted, no warning
    if (process.env.NEKOPAY_SUPPRESS_UNVERIFIED_WARN) return;
    if (warnedUnverified.has(chain)) return;
    warnedUnverified.add(chain);
    const extra = config.deprecated ? ' This provider is also flagged DEPRECATED (may be shut down/rebranding).' : '';
    console.warn(`[nekosunevr-payments] "${chain}" is UNVERIFIED — its endpoints/auth are not tested and trusted. Use at your own risk; confirm against the provider's docs or override the endpoint/url.${extra}`);
};

class ChainModule {
    constructor(chain, config, domain = null) {
        if (chain.toLowerCase() === 'woo' && domain) {
            config = { ...config, url: `${domain}/wp-json/wc/v3/` };
        }
        warnIfUnverified(chain.toLowerCase(), config);
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
        this.isGenericGateway = this.isBitPay || this.isPayoneer || this.isPaymentwall || this.isSquare ||
            this.isWorldpay || this.isAmazonPay || this.isApplePay || this.isGooglePay || this.isWeChatPay ||
            this.isOFX || this.isFortumo || this.isAuthorizeNet || this.isAlipay ||
            !!(config.gatewayType && config.gatewayProfile);
        this.isEVM = config.isEVM || false;
        this.isTron = config.isTron || false;
        this.isSolana = config.isSolana || false;
        // Preserve case for Solana (base58 mints); lowercase EVM/Tron contracts.
        this.tokenContract = config.tokenContract
            ? (config.isSolana ? config.tokenContract : config.tokenContract.toLowerCase())
            : null;
        this.defaultEvmDecimals = config.evmDecimals || 18;
        this.defaultTronDecimals = config.tronDecimals || 6;
        this.defaultSolanaDecimals = config.solDecimals || 9;
    }

    async existsTransaction(address, amount, timestamp, memo = null, minimumConfirmations = 0) {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof memo === 'number' && minimumConfirmations === 0) {
                    minimumConfirmations = memo;
                    memo = null;
                }
                minimumConfirmations = Number(minimumConfirmations || 0);
                const normalizedTimestamp = Number(timestamp || 0) > 1000000000000
                    ? Math.floor(Number(timestamp || 0) / 1000)
                    : Number(timestamp || 0);

                if (this.api.hasDirectAntelopeApi()) {
                    const transaction = await this.api.findDirectAntelopeTransaction(address, amount, memo, normalizedTimestamp);
                    const confirmations = Number(transaction?.confirmations || 0);
                    if (!transaction || confirmations < minimumConfirmations) {
                        return resolve({
                            exists: false,
                            txid: '',
                            conf: confirmations || ''
                        });
                    }

                    return resolve({
                        exists: true,
                        txid: transaction.txid,
                        conf: confirmations
                    });
                }

                if (this.api.hasDirectSteemForkRpc()) {
                    const transaction = await this.api.findDirectSteemForkTransaction(address, amount, memo, normalizedTimestamp);
                    const confirmations = Number(transaction?.confirmations || 0);
                    if (!transaction || confirmations < minimumConfirmations) {
                        return resolve({
                            exists: false,
                            txid: '',
                            conf: confirmations || ''
                        });
                    }

                    return resolve({
                        exists: true,
                        txid: transaction.txid,
                        conf: confirmations
                    });
                }

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

                    const confirmations = 6;
                    if (confirmations < minimumConfirmations) {
                        return resolve({
                            exists: false,
                            txid: "",
                            conf: confirmations,
                            raw: match,
                        });
                    }

                    return resolve({
                        exists: true,
                        txid: match.transactionId,
                        conf: confirmations,
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
                    } else if (this.isSolana) {
                        const splMint = this.tokenContract; // raw base58 mint (case-sensitive)
                        const splMatch = (transaction.splTransfers || []).some((t) =>
                            (!splMint || t.mint === splMint) &&
                            t.owner === address &&
                            matchAmountWithDecimals(t.amount, amount, t.decimals));
                        const solMatch = (transaction.solTransfers || []).some((t) =>
                            t.to === address &&
                            matchAmountWithDecimals(t.value, amount, this.defaultSolanaDecimals));
                        isMatch = splMatch || solMatch;
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
                        if (Number(confirmations || 0) < minimumConfirmations) {
                            return resolve({
                                exists: false,
                                txid: '',
                                conf: confirmations
                            });
                        }
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
        if (this.isGoURL) return this.api.createGoURLPayment(chargeData);
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
        if (this.isGoURL) return this.api.getGoURLPaymentStatus(paymentId);
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
        if (this.isGoURL) return this.api.getGoURLPaymentStatus(chargeId);
        if (this.isGenericGateway) return this.api.getGenericGatewayTransaction(chargeId);
        throw new Error('Charge lookup helper only supported for OpenNode, GoURL, and generic payment gateways');
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

module.exports = { ChainModule };
