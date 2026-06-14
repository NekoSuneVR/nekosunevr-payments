# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Changed
- Audited and set explicit `verified` on every entry (96 verified / 59 unverified).
  `verified:true` = bespoke/official, confirmed-reachable integration; `verified:false` =
  generic/guessed endpoints, non-REST flows, or broken/offline explorers — these now warn
  at runtime. Flipped `coingate`/`blockonomics` to `false` (endpoints not validated), the
  generic-profile gateways (square/worldpay/bitpay/applepay/googlepay/…) to `false`, and
  flagged `ltc` (502) and `scc` (redirect loop) explorers `false`. Bespoke trusted
  integrations (stripe/paypal/coinbase/nowpayments/opennode/tebex/craftingstore/xsolla/woo
  + reachable free crypto chains) are `verified:true`.
- Every registry entry now carries explicit boolean `verified`/`deprecated`/`explorerOffline`.
  Flagged `fortumo` deprecated (acquired by Boku). Added `listUnverified()`,
  `listDeprecated()`, `listExplorerOffline()` registry helpers.

### Added
- **Solana Pay** (`SOLANAPAYModule`) — official [`@solana/pay`](https://github.com/solana-foundation/pay)
  request/verify checkout flow. `createPayment({ recipient, amount, splToken?, reference?,
  label?, message?, memo? })` returns a `solana:` request URL + a unique per-order
  `reference` pubkey (and `createSolanaPayQR()` for the QR); `existsTransaction(recipient,
  amount, ts, reference)` verifies via `findReference` + `validateTransfer`. Unlike the
  address-watch `SOL` chain, the reference key identifies each order so same-amount payments
  never collide. Free (RPC only; `NEKOPAY_SOLANAPAY_EXPLORER_URL` to repoint). `@solana/pay`,
  `@solana/web3.js`, `bignumber.js` are loaded lazily (clear install hint if missing).
- **Multi-chain detection adapters** (chains without a Blockbook explorer):
  - Blockscout/Etherscan adapter (EVM `txlist`/`tokentx`) → `BASE`, `ARBITRUM`,
    `OPTIMISM`, `GNOSIS`, `AVAX`, `FTM` (native + tokens, free, no key).
  - Solana RPC adapter (`getSignaturesForAddress`/`getTransaction`) → `SOL` + SPL tokens.
  - Generic EVM JSON-RPC adapter (`eth_getLogs`) → `CRONOS` and any publicnode/chainlist
    chain (token-only). All three live-tested against real endpoints.
- New `crypto-solana` category; new tokens `USDC_BASE`/`USDC_ARBITRUM`/`USDC_OPTIMISM`,
  `USDC_SOL`/`USDT_SOL`. Token registry now supports EVM, Tron, and Solana base chains.
- DOCS §4a documents the adapters + one-line recipes to add any EVM/Solana chain.


## 1.2.0 - 2026-06-10
### Changed
- **Modular refactor**: split the 2,300-line `paymentgateway.js` into `core/` (utils,
  PaymentAPI, ChainModule), `config/` (chains grouped by category, tokens), and
  `gateways/registry.js`. `paymentgateway.js` is now a thin assembler — all existing
  `<CHAIN>Module` imports keep working unchanged.

### Added
- New free crypto explorer modules: `DASHModule`, `ZECModule`, `BTGModule`,
  `DGBModule`, `ETCModule`.
- **Token registry + named token modules**: `USDT_ETH`, `USDC_ETH`, `USDT_BSC`,
  `USDC_BSC`, `USDT_POL`, `USDC_POL`, `USDT_TRX`, `USDC_TRX`, plus node/staking tokens
  `LPT_ETH`, `MYST_ETH`, `MYST_POL`. Add more in one line (`config/tokens.js`).
- **Registry** (`getSystem`, `listByCategory`, `findByChain`, `listFree`,
  `listCryptoModules`, `categories`) to discover which module handles which chain/gateway.
- **Config-driven gateway framework**: add a REST gateway from `config/chains.js` alone
  (base URL + `gatewayProfile` + `auth`), no bespoke code.
- New gateways:
  - Crypto: `COINGATE`, `BLOCKONOMICS`, `BTCPAY`, `CONFIRMO`, `CRYPTOMUS`, `OXAPAY`,
    `PLISIO`, `COINPAYMENTS`, `COINREMITTER`, `GOURL`.
  - Lightning: `ZBD`, `STRIKE`, `SPEED`, `ALBY`.
  - Gaming/Discord commerce: `PAYNOW`, `SELLPASS`.
  - Steam skins (CS2/Dota2 items as payment): `SKINPAY`, `SKINSBACK`.
  - Regional/global PSP aggregators (one API → many local methods): `MOLLIE`,
    `MERCADOPAGO`, `RAZORPAY`, `PAYSTACK`, `FLUTTERWAVE`, `CHECKOUTCOM`, `ADYEN`,
    `KLARNA`, `REVOLUT`, `PAGSEGURO`, plus `PAYSAFECARD`.
- Hosted gateways reorganized into category sub-groups (`fiatGateways`, `pspGateways`,
  `cryptoGateways`, `lightningGateways`, `gamingGateways`, `skinsGateways`); registry
  categories are now `gateway-fiat` / `-crypto` / `-payout` / `-lightning` / `-gaming` /
  `-skins` (replacing the vaguer `gateway-hosted` / `gateway-generic`).
- DOCS: added Tebex (Merchant-of-Record) setup section + how to add gateways.
- More skin gateways: `SKINSCASH`, `PAYSKIN`, `SKINIFY` (vetted; `SKINWALLET` excluded — shut down).
- High-value tokens: `WBTC`/`DAI`/`WETH`/`LINK`/`UNI`/`AAVE`/`SHIB` (ETH),
  `WBNB`/`BTCB`/`ETH`/`CAKE` (BSC), `WMATIC`/`WETH`/`WBTC`/`DAI`/`LINK` (Polygon).
  Contracts verified on-chain (WBTC = 8 decimals, BTCB = 18).
- Bank transfer / open banking (`gateway-bank`): `WISE`, `GOCARDLESS`, `TRUELAYER`, `PLAID`.
- **Unverified-gateway runtime warning**: modules flagged `verified:false` print a one-time
  "use at your own risk" warning (silence with `NEKOPAY_SUPPRESS_UNVERIFIED_WARN=1`).
  Trusted/established gateways stay silent.
- DOCS §8b documents monetization networks (ad/offerwall + passive-income like Honeygain)
  as out-of-scope (you earn, not accept) — not shipped as payment modules.
- TRC-20 tokens on Tron (contracts verified on Tronscan): `USDD` (2.0), `TUSD`, `JST`,
  `SUN`, `BTT`, `WIN`, `WTRX`, `NFT` (APENFT), `HTX`. Mixed decimals (WIN/WTRX/NFT = 6).
- `COINBASEBUSINESSModule` for Coinbase's new Business/onchain Payment Link API; legacy
  `COINBASEModule` (Commerce) retained.
- `COINIFYModule` (crypto payment / buy-crypto gateway) and `ANTISTOCKModule` (successor
  to Sellpass).
- DOCS: documented why Base/Arbitrum/Optimism/Avalanche aren't yet supported (no Blockbook;
  need a Blockscout/Etherscan-v2 adapter).
- `deprecated` registry flag. Marked `SELLIX` (reportedly seized 2024) and `SELLPASS`
  (rebranding to Antistock, paused) as deprecated.
- Documented Cash App Pay via `SQUAREModule` (no standalone REST API exists).
- Per-chain explorer overrides via env vars (`NEKOPAY_<CHAIN>_EXPLORER_URL`,
  `NEKOPAY_<CHAIN>_EXPLORER_ALT_URLS`) + endpoint cooldown/rotation for high traffic.
- `DOCS.md` (setup + maintenance) and `API.md` (methods + webhooks/IPN); README rewritten.

### Fixed (2026 audit)
- CraftingStore base URL `v7` → `v2`.
- Worldpay `api.worldpay.com` → `access.worldpay.com` (rebrand).
- BitPay base `api.bitpay.com` → `bitpay.com`.
- Paymentwall base now includes `/api/`; OFX base now `/v1/`.
- Repointed `DASH` → `dash4.trezor.io` and `BTG` → `btgexplorer.com` (Trezor dropped the
  old per-coin Blockbook hosts).
- Flagged `DGB`, `DOGEC`, `ZNZ` as `explorerOffline` (public explorers gone / projects
  dormant) — supply your own via env override.

## 1.0.0 - 2024-02-05
### Added
- Changelog
- Added StripePay
- Added CoinbasePay
- Added TebexPay
- Added SellixPay
- Added CraftingStorePay
- Added STEEMModule
- Added TLOSModule
- Added BLURTModule
- Added EOSModule
- Added BNBModule
- Added WAXModule
- Added HIVEModule
- Added FLSModule
- Added LTCModule
- Added DOGECModule
