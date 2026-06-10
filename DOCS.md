# nekosunevr-payments — Setup & Maintenance Guide

This guide covers installing, configuring, extending, and maintaining the package.
For the method/callback reference see [API.md](API.md). For a quick tour see the
[README](README.md).

---

## 1. Install

```bash
npm install nekosunevr-payments
```

```js
const { BTCModule, USDT_BSCModule, NOWPAYMENTSModule } = require('nekosunevr-payments');
```

Everything is exposed as a `<NAME>Module` class. Construct one, then call its methods.

---

## 2. Project layout (modular)

```
lib/
  index.js              re-exports everything
  paymentgateway.js     assembles modules from config + re-exports (back-compat)
  core/
    utils.js            shared helpers, endpoint routing, chain client config
    PaymentAPI.js       low-level per-gateway API client
    ChainModule.js      per-chain dispatcher (existsTransaction / createPayment / ...)
  config/
    chains.js           chain & gateway config, grouped by category
    tokens.js           token registry (USDT/USDC/LPT/MYST/...)
  gateways/
    registry.js         "which system handles which" lookups
```

The split is purely organizational — public module names are unchanged, so existing
`require('nekosunevr-payments').BTCModule` code keeps working.

---

## 3. The registry — find which system handles what

```js
const { getSystem, listByCategory, findByChain, listFree, categories } = require('nekosunevr-payments');

categories();                       // all category names
listByCategory('gateway-lightning'); // ['ZBDModule','STRIKEModule','SPEEDModule','ALBYModule']
findByChain('bnb');                  // ['BNBModule','USDT_BSCModule','USDC_BSCModule']
listFree();                          // every no-API-key crypto module
getSystem('USDT_BSCModule');         // { category:'token', chain:'bnb', requiresKeys:[], token:{...} }

// status lookups (every system has boolean verified/deprecated/explorerOffline):
listUnverified();                    // endpoints not validated — warn / confirm before prod
listDeprecated();                    // provider shut down / rebranding (Fortumo, Sellix, Sellpass)
listExplorerOffline();               // explorer gone — supply your own (DGB, DOGEC, ZNZ)
```

Categories: `crypto-evm`, `crypto-tron`, `crypto-solana`, `crypto-utxo`,
`crypto-steemfork`, `crypto-antelope`, `crypto-hiveengine`, `token`, `gateway-fiat`,
`gateway-bank`, `gateway-crypto`, `gateway-payout`, `gateway-lightning`, `gateway-gaming`,
`gateway-skins`.

Each registry entry also exposes `verified` (false = confirm the create/get endpoint
before going live), `selfHosted`, `deprecated` (provider shut down / rebranding —
verify before use), and `explorerOffline` flags.

---

## 4. Configuration by type

### 4a. Free crypto (explorer-backed) — no API key
Just construct and check for a payment:
```js
const btc = new BTCModule();
await btc.existsTransaction(address, amount, sinceUnixSeconds);
```
Token modules pre-fill the contract + decimals:
```js
const usdt = new USDT_TRXModule();
await usdt.existsTransaction(myTronAddress, '25', sinceUnixSeconds);
```

### 4b. Hosted gateways — API keys via env vars
Set only the vars for what you use (see [§7](#7-environment-variables)), then:
```js
const np = new NOWPAYMENTSModule();
await np.createPayment({ price_amount: 25, price_currency: 'usd', pay_currency: 'btc', order_id: 'A1' });
```

### 4c. Config-driven gateways (CoinGate, Lightning, gaming, ...)
These wire base URL + auth from config. Defaults reflect each provider's docs but are
overridable per call:
```js
const cg = new COINGATEModule();                 // needs COINGATE_API_TOKEN
await cg.createPayment({ price_amount: 10, price_currency: 'EUR', receive_currency: 'BTC' });

// override the endpoint/body if a provider's path differs from the default:
await cg.createPayment({ endpoint: 'orders', body: { /* exact provider fields */ } });
```

---

## 5. Adding more "down the line"

### Add a token (1 line)
`config/tokens.js`:
```js
DAI_ETH: { chain: 'eth', symbol: 'DAI', contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
```
→ `DAI_ETHModule` is generated automatically. (Base chain must be EVM or Tron.)

### Add a free explorer chain (1 block)
`config/chains.js` → `explorerChains`:
```js
mychain: { url: 'https://explorer.example/api/', isSteemFork: false },        // UTXO/Insight/Blockbook
mychain: { url: 'https://explorer.example/api', isEVM: true, evmDecimals: 18 } // EVM
```
The explorer must speak Blockbook/Insight (`address/{addr}` + `tx/{txid}`).

### Add a REST gateway (1 block, no new code)
`config/chains.js` → `hostedGateways`:
```js
mygateway: {
  url: 'https://api.mygateway.com/v1/',
  gatewayType: 'mygateway',
  category: 'gateway-crypto',
  gatewayProfile: {
    createEndpoint: 'invoices',
    listEndpoint: 'invoices',
    getEndpoint: (id) => `invoices/${id}`
  },
  auth: { scheme: 'Bearer ', env: 'MYGATEWAY_API_KEY' },  // header auth
  requiresAuth: true
}
```
Auth options: `{ scheme:'Bearer ', env }` (header), `{ name:'apikey', scheme:'', env }`
(custom header), `{ basic:true, env, env2 }` (HTTP Basic). For HMAC/body/query auth,
omit `auth` and pass the signed `headers`/`body` via `createPayment({ headers, body })`.

→ `MYGATEWAYModule` is generated, `createPayment` / `getCharge` / `listCharges` work,
and it shows up in the registry.

---

## 6. High-traffic & self-hosted explorers

Public explorers (Trezor/Guarda/FlitsWallet) rate-limit and can IP-ban heavy traffic.
The library already rotates endpoints and cools down ones that return `403/429/503`
(`NEKOPAY_ENDPOINT_COOLDOWN_MS`, default 120000). For sustained volume (~30+ checks/min),
point any chain at your own explorer via env vars — no code change:

```bash
NEKOPAY_DASH_EXPLORER_URL=https://your-blockbook/api/
NEKOPAY_DASH_EXPLORER_ALT_URLS=https://dash4.trezor.io/api/,https://your-backup/api/
NEKOPAY_BTC_EXPLORER_URL=https://your-btc-blockbook/api/
```

`NEKOPAY_<CHAIN>_EXPLORER_URL` becomes primary; bundled servers stay as fallback unless
`NEKOPAY_<CHAIN>_EXPLORER_ALT_URLS` is also set. Precedence: defaults < env < constructor
overrides. Works for every chain (`NEKOPAY_ETH_EXPLORER_URL`, etc.).

**Offline by default** (project dormant / explorer gone — supply your own URL):
`DGBModule`, `DOGECModule`, `ZNZModule`.

---

## 7. Environment variables

```bash
# --- Free crypto chains/tokens: none required ---

# Regional PSP aggregators
MOLLIE_API_KEY=
MERCADOPAGO_ACCESS_TOKEN=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PAYSTACK_SECRET_KEY=
FLUTTERWAVE_SECRET_KEY=
CHECKOUT_SECRET_KEY=
ADYEN_API_KEY=
KLARNA_USERNAME=
KLARNA_PASSWORD=
REVOLUT_SECRET_KEY=
PAGSEGURO_TOKEN=
PAYSAFECARD_API_KEY=

# Bank transfer / open banking
WISE_API_TOKEN=
GOCARDLESS_ACCESS_TOKEN=
TRUELAYER_ACCESS_TOKEN=
# Plaid uses client_id + secret in the request body (not env header)

# Hosted gateways (set only what you use)
COINBASE_API_KEY=
COINBASE_BUSINESS_API_KEY=
TEBEX_API_KEY=
SELLIX_API_KEY=
CRAFTINGSTORE_API_KEY=
STRIPE_API_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
XSOLLA_MERCHANT_ID=
XSOLLA_API_KEY=
XSOLLA_PROJECT_ID=
SKRILL_MERCHANT_EMAIL=
SKRILL_SECRET_WORD=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_EMAIL=
NOWPAYMENTS_PASSWORD=
OPENNODE_API_KEY=
GOURL_PUBLIC_KEY=
GOURL_PRIVATE_KEY=

# Generic / legacy gateways
BITPAY_API_KEY=
PAYONEER_API_KEY=
PAYMENTWALL_API_KEY=
SQUARE_ACCESS_TOKEN=
WORLDPAY_API_KEY=
AMAZON_PAY_API_KEY=
APPLE_PAY_API_KEY=
GOOGLE_PAY_API_KEY=
WECHAT_PAY_API_KEY=
OFX_API_KEY=
FORTUMO_API_KEY=
AUTHORIZE_NET_API_LOGIN_ID=
AUTHORIZE_NET_TRANSACTION_KEY=
ALIPAY_API_KEY=

# New crypto / payout / lightning / gaming gateways
COINGATE_API_TOKEN=
BLOCKONOMICS_API_KEY=
# Coinify uses API key + password + signing — supply via createPayment (not a simple env header)
PAYNOW_API_KEY=
ANTISTOCK_API_KEY=
PAYSAFECARD_API_KEY=
BTCPAY_API_KEY=            # + set NEKOPAY_BTCPAY_EXPLORER_URL or pass url
CONFIRMO_API_KEY=
ZBD_API_KEY=
STRIKE_API_KEY=
SPEED_SECRET_KEY=
ALBY_ACCESS_TOKEN=
PAYNOW_API_KEY=
SELLPASS_API_KEY=
# Cryptomus / OxaPay / Plisio / CoinPayments / Coinremitter use body/HMAC/query auth —
# pass credentials through createPayment({ headers, body }) (see their authMode note).

# Endpoint routing / self-hosting
NEKOPAY_ENDPOINT_COOLDOWN_MS=120000
NEKOPAY_<CHAIN>_EXPLORER_URL=
NEKOPAY_<CHAIN>_EXPLORER_ALT_URLS=
```

---

## 8. Monero (XMR) — important note

XMR **cannot** be tracked through a public block explorer the way BTC/ETH can. Monero
uses stealth addresses, so only the wallet owner (holding the private **view key**) can
see incoming payments. There is no free "watch this address" explorer. Two real options:

1. **Use a gateway that supports XMR** — already available here via
   `NOWPAYMENTSModule` (`pay_currency: 'xmr'`), and several config-driven gateways
   (CoinGate, etc.) accept XMR. This is the simplest path.
2. **Run `monero-wallet-rpc`** with your account's view key and poll
   `get_transfers` / `get_payments` yourself. This is outside the explorer model, so it
   isn't shipped as an explorer module; wire it as a small custom check or behind a
   config-driven gateway pointing at your wallet-rpc.

A native `XMRModule` that "scans an address" is intentionally **not** provided because it
would be impossible to implement correctly/securely without your private view key.

---

## 8b. Monetization — "earn" networks (NOT payment gateways)

Some requested services let **you earn money** rather than **accept customer payments**.
The money flows *network → you*, settled on the network's schedule — the opposite of a
checkout. They don't fit `createPayment` / `existsTransaction`, so they are **not** shipped
as payment modules. Use them alongside this library, not through it.

### Ad / offerwall / rewarded-survey networks ("get paid when users watch ads / complete offers")
Integration model is a **server-to-server (S2S) postback**: you host a callback URL; the
network sends a GET (sometimes POST) with `user_id`, reward, and a signature/hash; you
verify the hash and credit the user. Active, documented providers:

| Network | Postback / docs |
|---|---|
| AdGate Media | postback URL, retries up to 5× |
| ayeT-Studios | offerwall/surveywall + reward callbacks + offer API |
| BitLabs | GET callbacks, unique tx id, `developer.bitlabs.ai` |
| CPX Research | postback in dashboard, `cpx-research.com/main/en/doc.php` |
| Lootably | SHA-256 hash verify, Offers + Reporting APIs |
| Torox (ex-OfferToro) | `md5(oid-user_id-APP_KEY)` signature |
| Tapjoy | GET callback with `snuid`, retries ~4 days |
| AdGem | GET/POST postback, optional `request_id`+`verifier` hash |
| Pollfish | survey monetization, `click_id` S2S |

To wire one: create a route (e.g. `POST /postback/adgate`), validate the signature with
your network secret, then credit the user. This library's `verifyIPN`-style HMAC helpers
are crypto-gateway specific; for offerwalls follow each network's hash recipe.

### Passive-income / bandwidth-sharing apps (Honeygain, Pawns.app, etc.)
Honeygain, Pawns.app (ex-IPRoyal Pawns), Peer2Profit, EarnApp, Traffmonetizer, Repocket
and similar pay you for sharing idle bandwidth / running their node app. **They are
end-user apps with no merchant/integration API** — you install the app, and they pay out
via PayPal / crypto / (Honeygain) JumpTask. There is **nothing to integrate** in a payments
library; treat them as an external income source, not a gateway. (Some expose only an
unofficial read-only dashboard-stats endpoint, not a payment API.)

---

## 9. Tebex setup (game-server commerce)

**Important:** Tebex is a **Merchant of Record**. With Tebex Checkout, *all* payment
methods — PayPal, Google Pay, cards, paysafecard, iDEAL, SEPA, and 130+ local methods —
are provided **by Tebex itself**. You do **not** connect your own gateways into Tebex, and
you can't pull Tebex's sub-methods out as separate integrations here. You integrate
**Tebex** (`TEBEXModule`) and toggle which methods to accept in the Tebex panel.

Setup:
1. Create a store at <https://creator.tebex.io/> (formerly `tebex.io`).
2. Add packages/products and connect your game server (or use Tebex Checkout headless).
3. Get your **store secret key**: Tebex panel → *Integrations* / *API Keys*.
4. Set it and use the module:
   ```bash
   TEBEX_API_KEY=your_tebex_store_secret
   ```
   ```js
   const { TEBEXModule } = require('nekosunevr-payments');
   const tebex = new TEBEXModule();
   await tebex.getPackages();
   await tebex.getPlayerLookup('PlayerName');
   await tebex.createCheckoutURL(packageId, 'PlayerName'); // hosted checkout link
   await tebex.getSales();
   ```
5. Manage which payment methods are live under *Payment Methods* in the Tebex panel
   (paysafecard requires extra approval). Tebex handles tax, fraud, chargebacks, payouts.

The only Tebex-listed method that also has a usable standalone API (added here separately)
is **paysafecard** (`PAYSAFECARDModule`, `PAYSAFECARD_API_KEY`) — use it if you want to
accept prepaid vouchers *outside* Tebex.

---

## 10. Gateway status notes (audited June 2026)

| Gateway | Note |
|---|---|
| CraftingStore | API is **v2** (was v7 — fixed). |
| Worldpay | Rebranded **Access Worldpay**; base is `access.worldpay.com` (fixed). |
| BitPay | Base is `bitpay.com` (not `api.bitpay.com`); prod uses token + ECC signing. |
| Coinbase Commerce → **Coinbase Business** | Coinbase migrated Commerce to the onchain payment protocol / **Coinbase Business** (Payment Link API, `business.coinbase.com/api/v1`). Legacy `COINBASEModule` (`api.commerce.coinbase.com`, `COINBASE_API_KEY`) still works for existing charges. New integrations: use **`COINBASEBUSINESSModule`** (`COINBASE_BUSINESS_API_KEY`) and confirm endpoints at `docs.cdp.coinbase.com/coinbase-business`. |
| Fortumo | Acquired by **Boku** (2020); new integrations target Boku's DCB platform. |
| Apple Pay / Google Pay | Not simple REST gateways — Apple Pay uses per-session merchant validation; Google Pay is a client-side token flow handed to a processor. Treat these as placeholders. |
| Paymentwall | Base now includes `/api/` (fixed). |
| OFX | Versioned base `/v1/` (fixed). |
| Skrill | Redirect/SID flow, not a JSON REST base. |
| **Sellix** | Reportedly **seized / shut down in early 2024** — `deprecated`. Verify before use. |
| **Sellpass** | Rebranding to **Antistock**, dev paused, trust warnings — `deprecated`. |
| **Cash App Pay** | No general standalone REST API. Take it **via `SQUAREModule`** (Cash App Pay is prebuilt into Square's Web Payments SDK / Payments API — pass the Cash App Pay token as `source_id`), or apply for Cash App's Partner API. |
| **Steam skins** (`SKINPAY`, `SKINSBACK`) | Accept CS2/Dota2 items as payment. Signed (HMAC) APIs — pass shop id + signature via `createPayment({ body, headers })`. Confirm methods at `skinpay.com/api-docs` / `skinsback.com`. |
| **Coinify** (`COINIFYModule`) | Crypto payment gateway / buy-crypto. Base `api.coinify.com/v3/` (sandbox `api.sandbox.coinify.com/v3/`). Auth = API key + password + request signing; get keys in *Integration tools → API keys* and an IPN secret in *Online Store → IPN*. Docs: `coinify.readme.io`, merchant ref `merchant.coinify.com/docs/api`. |

### Multi-chain adapters (Base / L2s / Solana) — supported

Chains without a Blockbook explorer use one of three adapters (set via `explorerApi` /
`isSolana` in config). All bundled ones are free, no API key. Tokens work via the registry.

| Adapter | `config` | Bundled chains | Native + tokens? |
|---|---|---|---|
| **Blockscout** | `isEVM:true, explorerApi:'blockscout'` | `BASE`, `ARBITRUM`, `OPTIMISM`, `GNOSIS` | both |
| **Etherscan/Routescan** | `isEVM:true, explorerApi:'etherscan'` | `AVAX`, `FTM` (Routescan) | both |
| **EVM JSON-RPC** | `isEVM:true, explorerApi:'evmrpc'` | `CRONOS` (publicnode) | **tokens only** (eth_getLogs; no native) |
| **Solana RPC** | `isSolana:true` | `SOL` (+ `USDC_SOL`, `USDT_SOL`) | SOL + SPL tokens |

Add another EVM chain in one config line:
```js
// Blockscout (preferred — native + tokens, no key):
linea: { url: 'https://explorer.linea.build/api/', isEVM: true, explorerApi: 'blockscout', evmDecimals: 18 },
// Etherscan-v2 unified key (covers Base/ETH/ARB/OP): set ETHERSCAN_API_KEY + chain id:
scroll: { url: 'https://api.etherscan.io/v2/api/', isEVM: true, explorerApi: 'etherscan', etherscanChainId: 534352, apiKeyEnv: 'ETHERSCAN_API_KEY', evmDecimals: 18 },
// Generic JSON-RPC fallback (any chain from publicnode.com / chainlist.org) — tokens only:
mantle: { url: 'https://mantle-rpc.publicnode.com/', isEVM: true, explorerApi: 'evmrpc', evmDecimals: 18 },
```
Then add tokens for it in `config/tokens.js` (e.g. `USDC_LINEA: { chain:'linea', symbol:'USDC', contract:'0x...', decimals:6 }`).

Notes:
- **EVM-RPC is token-only** (detects ERC-20 Transfer events via `eth_getLogs` over the last
  `evmRpcLookback` blocks, default 50000). Native-coin detection needs Blockscout/Etherscan.
- **Solana**: public RPC `api.mainnet-beta.solana.com` is rate-limited — for volume set
  `NEKOPAY_SOL_EXPLORER_URL` to a Helius/QuickNode endpoint. SPL matching keys on the
  recipient **token-account owner**, so pass the buyer/merchant **wallet** address.
- Etherscan-family endpoints can rate-limit; the usual env override + cooldown applies.

`verified:false` config-driven gateways (BTCPay, Confirmo, Cryptomus, OxaPay, Plisio,
CoinPayments, Coinremitter, ZBD, Strike, Speed, Alby, PayNow, Sellpass): base URL + auth
are set, but **confirm the exact create/get endpoint** against the provider's current
docs (or override via `createPayment({ endpoint, body })`) before production use.
