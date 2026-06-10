# nekosunevr-payments — API & Callbacks Reference

Method reference for every module, plus the webhook/IPN callbacks each gateway sends and
what info you must provide. See [DOCS.md](DOCS.md) for setup.

All modules are instances of `ChainModule`. Not every method applies to every module —
calling an unsupported one throws a descriptive error. Use the
[registry](DOCS.md#3-the-registry--find-which-system-handles-what) to check a module's
category first.

---

## 1. Core methods

### `existsTransaction(address, amount, timestamp, memo?, minConfirmations?)`
Detects an incoming payment. Used by **crypto** modules (explorer / steem-fork / antelope
/ hive-engine / tokens) and by hosted gateways that expose a transaction list.

| Param | Type | Notes |
|---|---|---|
| `address` | string | Destination address (or account/email/order id for some gateways). |
| `amount` | string\|number | Expected amount in coin units (e.g. `'25'`, not satoshi). |
| `timestamp` | number | Ignore txs older than this (Unix seconds or ms — both accepted). |
| `memo` | string\|null | Optional memo/destination-tag/order note. If you don't need it you may pass `minConfirmations` here instead. |
| `minConfirmations` | number | Minimum confirmations to count as paid (default 0). |

Returns: `{ exists: boolean, txid: string, conf: number|string, raw?, error? }`.

```js
const r = await new USDT_BSCModule().existsTransaction(addr, '100.5', 1764710562, null, 1);
if (r.exists) console.log('paid in tx', r.txid, 'confs', r.conf);
```

### `getTransaction(address, txid)` / `getTransactionConfirmations(address, txid)`
Fetch a single normalized transaction / its confirmation count.

### `createPayment(data)`
Create a charge/invoice/order. Supported by: Coinbase, PayPal, Xsolla, Skrill,
WooCommerce, NOWPayments, OpenNode, GoURL, every generic + config-driven gateway. Shape
varies by provider (see §3). Generic/config-driven gateways accept overrides:
`createPayment({ endpoint, body, headers })`.

---

## 2. Gateway-specific helpers

| Method | Modules |
|---|---|
| `createInvoice(data)` | NOWPayments |
| `getCharge(id)` / `listCharges(params)` | OpenNode, GoURL, all generic/config-driven gateways |
| `getPaymentStatus(id)` | NOWPayments, GoURL |
| `getApiStatus()` / `getAvailableCurrencies()` | NOWPayments |
| `getMinimumPaymentAmount(from,to)` / `getEstimatedPrice(amt,from,to)` | NOWPayments |
| `auth(email,password)` / `listPayments()` / `listConversions()` | NOWPayments |
| `writeOffSubPartner()` / `updateSubscriptionPlan()` / `getSubscriptionPlan()` | NOWPayments |
| `verifyIPN(payload, signature)` | NOWPayments (HMAC-SHA512 of sorted payload) |
| `getAccountBalance()` / `getSupportedCurrencies()` | OpenNode |
| `createStaticLnAddress()` / `createStaticOnchainAddress()` / `listStatic*` | OpenNode |
| `createCheckoutURL(packageId, username)` / `getPlayerLookup()` / `getSales()` / `getBans()` / `getPackages()` | Tebex |
| `getProduct(id)` | Sellix |

---

## 3. `createPayment` input by gateway (common fields)

| Gateway | Required-ish fields |
|---|---|
| Coinbase Commerce | `name`, `description`, `local_price:{amount,currency}`, `pricing_type` |
| PayPal | `amount`, `currency`, `description`, `email` |
| NOWPayments | `price_amount`, `price_currency`, `pay_currency`, `order_id`, `ipn_callback_url` |
| OpenNode | `amount`, `currency`, `description`, `order_id`, `callback_url`, `success_url` |
| GoURL | `amount`, `amountUSD`, `order_id`, `user_id` (uses `GOURL_PUBLIC_KEY`) |
| Xsolla | `amount`, `currency`, `user_id`, `email`, `return_url` |
| Skrill | `amount`, `currency`, `description`, `status_url` |
| WooCommerce | `product_id`, `quantity`, `email`, billing fields, `payment_method` |
| CoinGate | `price_amount`, `price_currency`, `receive_currency`, `order_id`, `callback_url` |
| Generic/config-driven | Pass exact provider fields in `body`, or top-level fields. |

---

## 4. Callbacks / Webhooks / IPN

Most gateways notify your server asynchronously. You supply a callback URL when creating
the payment, then verify the signature on receipt. The library helps where a documented
verification exists; otherwise verify per the provider's docs.

| Gateway | Callback field on create | Verify how | Header / signature |
|---|---|---|---|
| **NOWPayments** | `ipn_callback_url` | `verifyIPN(req.body, sig)` (built in) | `x-nowpayments-sig` (HMAC-SHA512, needs `NOWPAYMENTS_IPN_SECRET`) |
| **Coinbase Commerce** | webhook in dashboard | HMAC-SHA256 of raw body with shared secret | `X-CC-Webhook-Signature` |
| **OpenNode** | `callback_url` | compare hashed order against your charge | signed `hashed_order` in payload |
| **GoURL** | IPN URL on the cryptobox | hash check with `GOURL_PRIVATE_KEY` | GoURL box hash |
| **CoinGate** | `callback_url` | token/HMAC per docs | order status in payload |
| **BTCPay** | store webhook | HMAC-SHA256 of body with webhook secret | `BTCPay-Sig` |
| **Cryptomus** | `url_callback` | MD5 `sign` = md5(base64(body)+API_KEY) | `sign` in body |
| **OxaPay** | `callbackUrl` | re-query payment status | — |
| **Plisio** | `callback_url` | verify hash with secret key | `verify_hash` |
| **Stripe** | dashboard webhook | `stripe.webhooks.constructEvent` (use the `stripe` SDK directly via `module.api.stripe`) | `Stripe-Signature` |
| **Tebex** | webhook in store | shared secret | per Tebex docs |
| **ZBD / Strike / Speed / Alby** | `callbackUrl` / webhook | provider-specific | per provider docs |

General webhook handler shape:
```js
app.post('/webhook/nowpayments', express.json(), (req, res) => {
  const np = new NOWPAYMENTSModule();
  if (!np.verifyIPN(req.body, req.headers['x-nowpayments-sig'])) return res.sendStatus(400);
  // req.body.payment_status: 'finished' | 'confirmed' | 'partially_paid' | ...
  res.sendStatus(200);
});
```

For crypto **explorer** modules there is no webhook — you poll `existsTransaction(...)`
on an interval (or after the customer claims they paid). Tune your poll rate and use
self-hosted explorers for high volume (see [DOCS §6](DOCS.md#6-high-traffic--self-hosted-explorers)).

---

## 5. Address generation + payout/forwarding

For "generate a deposit address, then forward funds to my wallet":

- **Non-custodial / direct-to-your-wallet** (you supply an xpub; funds land in your
  wallet, no forwarding step): **Blockonomics** (`new_address`), **BTCPay** (self-hosted).
- **Custodial with payout/withdrawal API** (call a payout to your external wallet, or set
  an auto-payout threshold): **NOWPayments** (payout/mass-payout), **OxaPay**,
  **Cryptomus**, **CoinGate**, **CoinPayments**, **OpenNode** (withdrawals).

See each provider's docs for the exact payout endpoint; wire it via
`createPayment`/`fetchPostData` overrides or the gateway's own method.

---

## 6. Direct low-level access

```js
const m = new ETHModule();
m.api;                       // PaymentAPI instance
await m.api.fetchData('tx/0xabc...', { params: { tokens: '1' } });
await m.api.getAddressTransactions(address);
const { PaymentAPI, ChainModule } = require('nekosunevr-payments'); // classes, if you need them
```
