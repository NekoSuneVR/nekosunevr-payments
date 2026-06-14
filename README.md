# nekosunevr-payments

A single wrapper for **crypto explorers**, **crypto payment gateways**, **Lightning**,
and **fiat/merchant gateways** — detect on-chain payments and create checkouts through one
consistent API.

```bash
npm install nekosunevr-payments
```

- 📖 **[DOCS.md](DOCS.md)** — setup, configuration, adding new gateways/tokens/chains, high-traffic & self-hosting, Monero, gateway status.
- 🔌 **[API.md](API.md)** — every method, `createPayment` inputs, and webhook/IPN callbacks.
- 📝 **[CHANGELOG.md](CHANGELOG.md)** — release history.

---

## Quick start

**Detect a free, on-chain crypto payment** (no API key):
```js
const { BTCModule, USDT_BSCModule } = require('nekosunevr-payments');

// native coin
await new BTCModule().existsTransaction(btcAddress, '0.01', 1764710562);

// a token (contract + decimals are pre-filled)
await new USDT_BSCModule().existsTransaction(bscAddress, '100', 1764710562);
```

**Create a hosted checkout** (needs an API key — see [DOCS §7](DOCS.md#7-environment-variables)):
```js
const { NOWPAYMENTSModule } = require('nekosunevr-payments');
const np = new NOWPAYMENTSModule();
const payment = await np.createPayment({
  price_amount: 25, price_currency: 'usd', pay_currency: 'btc',
  order_id: 'order-123', ipn_callback_url: 'https://you/ipn'
});
```

**Find which module handles what:**
```js
const { listByCategory, findByChain, listFree } = require('nekosunevr-payments');
listByCategory('gateway-lightning'); // ['ZBDModule','STRIKEModule','SPEEDModule','ALBYModule']
findByChain('eth');                  // ETH + every ETH token module
listFree();                          // all no-API-key crypto modules
```

---

## What's supported

> Module name = `<KEY>Module`, e.g. `BTCModule`, `USDT_TRXModule`, `COINGATEModule`.
> Query the live, authoritative list at runtime via the registry (`listByCategory`, `categories`).

### Free crypto (explorer-backed, no API key)
| Family | Modules |
|---|---|
| EVM (Blockbook) | `BNB`, `POL`, `ETH`, `ETC` |
| EVM L2s / others (Blockscout, Routescan, RPC) | `BASE`, `ARBITRUM`, `OPTIMISM`, `GNOSIS`, `AVAX`, `FTM`, `CRONOS` |
| Solana | `SOL` (+ SPL tokens); `SOLANAPAY` (request/verify checkout via `@solana/pay`) |
| Tron | `TRX`, `TRON` |
| UTXO / PoS | `BTC`, `BCH`, `LTC`, `DOGE`, `DASH`, `ZEC`, `BTG`, `PIVX`, `FLS`, `SAPP`, `MOBIC`, `SAGA`, `PNY`, `MONK`, `UCR`, `KYAN`, `DASHD`, `OWO`, `SEVENSEVENSEVEN`, `CFL`, `BIR`, `AZR`, `BECN`, `SCC` |
| Steem-family | `HIVE`, `HBD`, `STEEM`, `SBD`, `BLURT` |
| Antelope / EOSIO | `EOS`, `TLOS`, `WAX`, `FIO` |
| Hive-Engine | `HIVEENGINE` |
| _Offline (supply your own explorer)_ | `DGB`, `DOGEC`, `ZNZ` — see [DOCS §6](DOCS.md#6-high-traffic--self-hosted-explorers) |

### Tokens (ERC-20 / BEP-20 / TRC-20 / L2 / SPL)
Stablecoins + high-value tokens on **ETH/BSC/POL** (USDT, USDC, DAI, WBTC, WETH, LINK,
UNI, AAVE, SHIB, WBNB, BTCB, CAKE, …), a full **TRC-20** set on Tron (USDT, USDC, USDD,
TUSD, JST, SUN, BTT, WIN, WTRX, NFT, HTX), **L2** USDC (`USDC_BASE`, `USDC_ARBITRUM`,
`USDC_OPTIMISM`), **Solana SPL** (`USDC_SOL`, `USDT_SOL`), and node tokens (`LPT_ETH`,
`MYST_ETH`/`MYST_POL`). Add more in one line — see [DOCS §5](DOCS.md#5-adding-more-down-the-line).

### Crypto payment gateways
`COINBASE`, `NOWPAYMENTS`, `OPENNODE`, `GOURL`, `BITPAY`, `COINGATE`, `BLOCKONOMICS`,
`BTCPAY`, `CONFIRMO`, `CRYPTOMUS`, `OXAPAY`, `PLISIO`, `COINPAYMENTS`, `COINREMITTER`

### Bitcoin Lightning
`ZBD`, `STRIKE`, `SPEED`, `ALBY` (and `OPENNODE` supports Lightning)

### Gaming-server / Discord commerce
`TEBEX`, `CRAFTINGSTORE`, `PAYNOW`, `SELLIX`¹, `SELLPASS`¹

¹ _deprecated/uncertain — Sellix was reportedly seized (2024); Sellpass is rebranding to Antistock with paused dev. Verify before use._

### Steam skins (CS2 / Dota 2 items as payment)
`SKINPAY`, `SKINSBACK` — accept in-game skins as payment (signed/HMAC API; scaffold).

### Fiat / merchant gateways
`STRIPE`, `PAYPAL`, `SQUARE`, `WORLDPAY`, `AUTHORIZENET`, `SKRILL`, `XSOLLA`,
`AMAZONPAY`, `APPLEPAY`, `GOOGLEPAY`, `WECHATPAY`, `ALIPAY`, `OFX`, `PAYONEER`,
`PAYMENTWALL`, `FORTUMO`, `PAYSAFECARD`, `WOO` (WooCommerce)

### Regional / global PSP aggregators (one API → many local methods)
`MOLLIE` (EU: iDEAL/Bancontact/P24…), `MERCADOPAGO` (LatAm: Pix/PSE/OXXO…),
`RAZORPAY` (India: UPI…), `PAYSTACK`, `FLUTTERWAVE` (Africa: M-Pesa/mobile money),
`CHECKOUTCOM`, `ADYEN` (global), `KLARNA` (BNPL), `REVOLUT`, `PAGSEGURO` (Brazil).
These cover most country-specific methods (the kind Tebex/PayNow list) through a single
integration each.

### Bank transfer / open banking
`WISE` (payouts/transfers), `GOCARDLESS` (direct debit), `TRUELAYER` (pay-by-bank),
`PLAID` (ACH/account linking).

> **Earning, not accepting?** Ad/offerwall networks (AdGate, BitLabs, CPX, Tapjoy…) and
> passive-income apps (Honeygain, Pawns.app…) pay *you* — they're monetization, not payment
> gateways, so they're documented (not shipped as modules). See [DOCS §8b](DOCS.md#8b-monetization--earn-networks-not-payment-gateways).

---

## Notes
- **Cash App Pay** has no general standalone merchant REST API — it's taken **through
  Square** (`SQUAREModule`; Cash App Pay is prebuilt into Square's Web Payments SDK /
  Payments API), or via Cash App's approval-gated Partner API. See [DOCS §10](DOCS.md#10-gateway-status-notes-audited-june-2026).
- **Monero (XMR)** can't be tracked by a public explorer (stealth addresses). Use
  `NOWPAYMENTSModule` with `pay_currency:'xmr'`, or run `monero-wallet-rpc` — see
  [DOCS §8](DOCS.md#8-monero-xmr--important-note).
- Some gateways (`verified:false` in the registry) ship with correct base URL + auth but
  **need their create/get endpoint confirmed** against current provider docs before
  production — see [DOCS §10](DOCS.md#10-gateway-status-notes-audited-june-2026).
- Apple Pay / Google Pay are not simple REST gateways (client-side token / per-session
  validation flows) — treat as placeholders.

## License
MIT © NekoSuneVR
