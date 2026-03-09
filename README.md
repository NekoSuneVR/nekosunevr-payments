# nekosunevr-payments-nodejs
Payment wrapper for crypto explorers and multiple payment gateways.

## Install
```bash
npm install nekosunevr-payments
```

## What this package gives you
- Transaction detection on supported chains (`existsTransaction`)
- Unified payment creation (`createPayment`) for multiple gateways
- Gateway-specific helper methods for NOWPayments and OpenNode
- Additional generic gateway modules (BitPay, Square, Worldpay, etc.)

## Environment variables
Set only what you use.

```bash
# Existing gateways
COINBASE_API_KEY=
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

# NOWPayments
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_EMAIL=
NOWPAYMENTS_PASSWORD=

# OpenNode
OPENNODE_API_KEY=

# Added generic gateway modules
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
```

## Exported modules

### Crypto / explorer style modules
`HIVEENGINEModule`, `HIVEModule`, `HBDModule`, `BLURTModule`, `STEEMModule`, `SBDModule`, `TLOSModule`, `EOSModule`, `BNBModule`, `WAXModule`, `FLSModule`, `LTCModule`, `DOGECModule`, `ZNZModule`, `POLModule`, `TRXModule`, `TRONModule`, `BCHModule`, `ETHModule`, `PIVXModule`, `DOGEModule`, `SAPPModule`, `MOBICModule`, `SAGAModule`, `PNYModule`, `MONKModule`, `UCRModule`, `KYANModule`, `DASHDModule`, `OWOModule`, `SEVENSEVENSEVENModule`, `CFLModule`, `BIRModule`, `AZRModule`, `BECNModule`, `BTCModule`, `SCCModule`

### Payment gateway modules
`TEBEXModule`, `COINBASEModule`, `SELLIXModule`, `CRAFTINGSTOREModule`, `STRIPEModule`, `PAYPALModule`, `XSOLLAModule`, `SKRILLModule`, `WOOModule`, `NOWPAYMENTSModule`, `OPENNODEModule`, `BITPAYModule`, `PAYONEERModule`, `PAYMENTWALLModule`, `SQUAREModule`, `WORLDPAYModule`, `AMAZONPAYModule`, `APPLEPAYModule`, `GOOGLEPAYModule`, `WECHATPAYModule`, `OFXModule`, `FORTUMOModule`, `AUTHORIZENETModule`, `ALIPAYModule`

## Common usage

### 1) Crypto gateway example (`existsTransaction`)
```js
const { BNBModule } = require('nekosunevr-payments');

async function checkBscUsdtPayment() {
  const bnb = new BNBModule({
    tokenContract: '0x55d398326f99059ff775485246999027b3197955', // USDT on BSC
    url: 'https://bsc1.trezor.io/api',
    altExplorerUrls: ['https://bsc2.trezor.io/api']
  });

  const result = await bnb.existsTransaction(
    '0x2CF64Ab6644EC9BA8A0289443e8e08bdDC77124D',
    '100.017396',
    1764710562
  );

  console.log(result);
}

checkBscUsdtPayment().catch(console.error);
```

### 2) Coinbase example (`createPayment`)
```js
const { COINBASEModule } = require('nekosunevr-payments');

async function createCoinbaseCheckout() {
  const coinbase = new COINBASEModule();
  const charge = await coinbase.createPayment({
    name: 'Pro Plan',
    description: 'Monthly subscription',
    local_price: { amount: '10.00', currency: 'USD' },
    pricing_type: 'fixed_price'
  });

  console.log(charge);
}

createCoinbaseCheckout().catch(console.error);
```

## NOWPayments

### Create payment
```js
const { NOWPAYMENTSModule } = require('nekosunevr-payments');

async function createNowPayment() {
  const np = new NOWPAYMENTSModule();
  const payment = await np.createPayment({
    price_amount: 25,
    price_currency: 'usd',
    pay_currency: 'btc',
    order_id: 'order-12345',
    order_description: 'Store Order #12345',
    ipn_callback_url: 'https://your-domain.com/nowpayments/ipn'
  });

  console.log(payment);
}

createNowPayment().catch(console.error);
```

### Full helper surface
- `getApiStatus()`
- `getAvailableCurrencies()`
- `getMinimumPaymentAmount(fromCurrency, toCurrency)`
- `getEstimatedPrice(amount, fromCurrency, toCurrency)`
- `createPayment(paymentData)`
- `getPaymentStatus(paymentId)`
- `createInvoice(invoiceData)`
- `auth(email, password)`
- `listPayments(params)`
- `listConversions(token, params)`
- `writeOffSubPartner(token, payload)`
- `updateSubscriptionPlan(token, planId, payload)`
- `getSubscriptionPlan(planId)`
- `verifyIPN(ipnPayload, signature)`

### Verify NOWPayments IPN signature
```js
const { NOWPAYMENTSModule } = require('nekosunevr-payments');

const np = new NOWPAYMENTSModule();

function verifyWebhook(req) {
  const isValid = np.verifyIPN(req.body, req.headers['x-nowpayments-sig']);
  if (!isValid) throw new Error('Invalid NOWPayments IPN signature');
}
```

## OpenNode

### Create and query charge
```js
const { OPENNODEModule } = require('nekosunevr-payments');

async function openNodeFlow() {
  const opennode = new OPENNODEModule();

  const charge = await opennode.createPayment({
    amount: 25,
    currency: 'USD',
    description: 'Order #123',
    customer_email: 'user@example.com',
    order_id: '123',
    callback_url: 'https://your-site/opennode/callback',
    success_url: 'https://your-site/success',
    notify_receiver: false
  });

  const chargeInfo = await opennode.getCharge(charge.id);
  const paidCharges = await opennode.listCharges({ page: 1, pageSize: 10 });
  const balance = await opennode.getAccountBalance();
  const currencies = await opennode.getSupportedCurrencies();

  console.log({ chargeInfo, paidCharges, balance, currencies });
}

openNodeFlow().catch(console.error);
```

### OpenNode static addresses
```js
const { OPENNODEModule } = require('nekosunevr-payments');

async function openNodeStaticAddresses() {
  const opennode = new OPENNODEModule();

  const lnAddress = await opennode.createStaticLnAddress({
    min_amt: 1,
    max_amt: 500000000,
    description: 'My LNURL-Pay address',
    callback_url: 'https://your-site/opennode/ln-callback',
    custom_id: 'ln-001'
  });

  const onchainAddress = await opennode.createStaticOnchainAddress({
    callback_url: 'https://your-site/opennode/onchain-callback',
    order_id: 'onchain-001',
    description: 'Reusable BTC address'
  });

  console.log({ lnAddress, onchainAddress });
}

openNodeStaticAddresses().catch(console.error);
```

## Added gateways (BitPay, Square, etc.)
Modules:
- `BITPAYModule`
- `PAYONEERModule`
- `PAYMENTWALLModule`
- `SQUAREModule`
- `WORLDPAYModule`
- `AMAZONPAYModule`
- `APPLEPAYModule`
- `GOOGLEPAYModule`
- `WECHATPAYModule`
- `OFXModule`
- `FORTUMOModule`
- `AUTHORIZENETModule`
- `ALIPAYModule`

Shared methods for these modules:
- `createPayment(payload)`
- `getCharge(id)`
- `listCharges(params)`

### Generic gateway example (BitPay)
```js
const { BITPAYModule } = require('nekosunevr-payments');

async function bitpayFlow() {
  const bitpay = new BITPAYModule();

  const charge = await bitpay.createPayment({
    amount: 25,
    currency: 'USD',
    order_id: 'order-123',
    description: 'Order #123'
  });

  const details = await bitpay.getCharge(charge.id);
  const list = await bitpay.listCharges({ page: 1, pageSize: 10 });

  console.log({ charge, details, list });
}

bitpayFlow().catch(console.error);
```

### Square example
```js
const { SQUAREModule } = require('nekosunevr-payments');

async function squareFlow() {
  const square = new SQUAREModule();

  const payment = await square.createPayment({
    source_id: 'cnon:card-nonce-ok',
    idempotency_key: 'order-123-unique',
    amount_money: { amount: 1000, currency: 'USD' }
  });

  console.log(payment);
}

squareFlow().catch(console.error);
```

### Authorize.Net example
```js
const { AUTHORIZENETModule } = require('nekosunevr-payments');

async function authorizeNetFlow() {
  const anet = new AUTHORIZENETModule();

  const payment = await anet.createPayment({
    body: {
      createTransactionRequest: {
        merchantAuthentication: {
          name: process.env.AUTHORIZE_NET_API_LOGIN_ID,
          transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY
        },
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: '10.00',
          payment: { opaqueData: { dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT', dataValue: 'TOKEN' } }
        }
      }
    }
  });

  console.log(payment);
}

authorizeNetFlow().catch(console.error);
```

## Notes
- For generic gateways, payload shape can vary by provider. Pass exact provider fields in `createPayment`.
- You can override endpoints/headers per request:
  - `createPayment({ endpoint, headers, body })`
- Some providers require advanced signing/certificate flows in production (for example Amazon Pay, WeChat Pay, Apple Pay, Google Pay, Alipay, Authorize.Net).

## Gateway matrix (snapshot: 2026-03-09)
This is a practical onboarding matrix for the gateways configured in this package. Availability, fees, and compliance policies can change by country and merchant risk profile.

| Gateway | Regions where merchants are generally supported | Crypto / Fiat support (examples) | Launch (approx) | Fee model (high level) | KYC/KYB | Personal use vs business | What you usually need for approval |
|---|---|---|---|---|---|---|---|
| NOWPayments | Global in many regions (restricted countries apply) | Crypto: BTC, ETH, LTC, USDT, TRX, DOGE, BCH, XRP, many more; Fiat quoting available in API | 2019 | Typically around 0.5% + conversion fee when exchange is used | AML/KYC/KYB policy applies | Business-first; some sole proprietors accepted depending on jurisdiction | Account signup, payout wallet, API key, IPN secret, compliance review if requested |
| OpenNode | Business acceptance focused on supported jurisdictions | Crypto: BTC (Lightning + on-chain), Fiat settlement in selected setups | 2018 | Processing + settlement fees (plan/volume dependent) | Merchant verification required | Business/merchant focused | Merchant onboarding, business profile, settlement setup |
| BitPay | Merchant availability by country (restricted list exists) | Crypto: BTC, BCH and other supported assets; fiat settlement available in supported currencies | 2011 | Merchant processing fee (commonly volume-based) | KYC/KYB required | Business or legally registered sole proprietors | Merchant account, verification, token/key provisioning |
| Payoneer Checkout | Broad cross-border merchant support | Fiat-heavy: cards + local methods, 120+ checkout currencies (per provider claims) | 2005 | No setup/monthly fee in standard plans; per-transaction fees | KYC/KYB required | Business and qualified sole traders | Business verification, checkout onboarding, API credentials |
| Paymentwall | Global coverage depends on payment methods and risk approval | Fiat methods globally; local methods vary by country | 2010 | Transaction-fee model by method/region | KYC/KYB for merchants | Business-focused (including SMBs) | Merchant application, website/app review, compliance checks |
| Square | Payment processing in selected countries (US, CA, UK, AU, JP, FR, ES, IE) | Fiat cards + wallets (Apple Pay, Google Pay where supported) | 2009 | Per-transaction + optional hardware/subscription services | KYC/KYB required | Business and sole traders in supported regions | Square account, business verification, access token |
| Worldpay | Enterprise/global acquiring availability by contract | Fiat cards and local methods (region-specific) | 1990s (as Worldpay brand) | Contracted acquiring fees | KYC/KYB required | Business/enterprise | Contract onboarding, underwriting, MID/credentials |
| Amazon Pay | Merchant establishment required in supported countries | Fiat card rails through Amazon accounts | 2007 (Checkout by Amazon), Amazon Pay brand later | Transaction + authorization/chargeback related pricing by region | KYC/KYB required | Established businesses | Merchant account, business verification, key pair/integration central setup |
| Apple Pay | Wallet method available in many countries (issuer-dependent) | Fiat card tokenization (no native crypto rail) | 2014 | No direct Apple Pay fee to merchants; PSP/acquirer fees apply | Merchant + processor compliance | Business and eligible merchants | Apple Developer + Merchant ID + payment processor support |
| Google Pay / Google Wallet | Wallet/tap-to-pay available in many countries | Fiat card/wallet rails (UPI in India contexts) | 2018 brand (earlier Android Pay lineage) | No standalone gateway fee; processor/acquirer fees apply | Merchant + processor compliance | Business and eligible merchants | Gateway/PSP integration, Google Pay configuration, domain/app verification |
| WeChat Pay | Strongest in China + cross-border programs | Fiat CNY settlement and partner-supported cross-border flows | 2013 | Merchant and channel fees vary by program | KYC/KYB required | Business-focused | WeChat merchant onboarding, legal entity docs, settlement account |
| Skrill | Broad international merchant availability (country restrictions apply) | Fiat cards/wallet/bank methods; crypto features region-dependent | 2001 | Per-transaction + payout/currency conversion fees | KYC/KYB required | Business and some sole proprietors | Skrill business account, merchant setup, secret/API credentials |
| OFX | International business payments in many countries | Fiat FX/payments (not a retail crypto gateway) | 1998 | FX spread + transfer/plan fees depending on arrangement | KYC/KYB required | Business and some personal products by region | Business account verification, beneficiary/bank setup |
| Fortumo (now under Boku) | Carrier billing / local payments via Boku partner coverage | Fiat local billing/wallet methods | 2007 (Fortumo), acquired by Boku in 2020 | Revenue-share / transaction fees | KYC/KYB required | Business-focused | Partner onboarding with Boku/Fortumo, service approval |
| Authorize.Net | US-centric merchant acquiring ecosystem + supported territories via acquirers | Fiat card/eCheck rails | 1996 | Monthly gateway fee + per-transaction (plan dependent) | KYC/KYB required | Business and sole proprietors (acquirer-dependent) | Merchant account + gateway account, API Login ID and Transaction Key |
| Alipay | Strong in China; international acquiring via partners | Fiat wallet rails (CNY and supported cross-border flows) | 2004 | Merchant fees by partner/channel | KYC/KYB required | Business-focused | Alipay global/open platform onboarding, legal docs, partner/acquirer setup |
| Coinbase Commerce | Global crypto acceptance with region restrictions | Crypto: BTC, ETH, USDC, LTC and supported networks/tokens | 2018 | Processing fee model (plan dependent) | KYC/KYB and sanctions controls | Business and some individual merchants | Coinbase Commerce account, API key, compliance checks |
| PayPal | Very broad global footprint (country-by-country limitations) | Fiat cards/wallet/bank; crypto availability region-limited and product-specific | 1998 | Transaction + FX + optional product fees | KYC/KYB required | Business and personal accounts available | PayPal business account, client ID/secret, verification |
| Stripe | Available in supported countries (growing list) | Fiat cards/wallets/bank methods; crypto products separate by region | 2011 | Per-transaction + optional product fees | KYC/KYB required | Business + sole proprietors in supported countries | Stripe account, business verification, API keys |
| Xsolla | Global game-focused payments with regional tailoring | Mainly fiat/global methods; some crypto options via specific products/regions | 2005 | Contract/transaction model by product | KYC/KYB required | Business-focused | Merchant agreement, product integration, project credentials |
| WooCommerce Payments/Gateways | Depends on selected PSP and country | Fiat (depends on plugin/gateway), crypto via plugins | 2011 (WooCommerce) | Plugin + PSP specific fees | PSP-driven KYC/KYB | Business and sole traders (PSP-dependent) | WooCommerce store + gateway plugin account approvals |
| Tebex | Game-server commerce platform with supported regions/gateways | Mostly fiat gateway methods; crypto depends on connected payment methods | 2011 (Buycraft), Tebex brand later | Platform + gateway fees | Merchant verification required | Business/creator usage depends on policy | Tebex account, store setup, gateway connection |
| Sellix | Digital commerce platform in many regions | Fiat methods + crypto options (plan and provider dependent) | ~2017 | Plan + transaction fees | KYC/KYB required for payouts/compliance | Business and creators (policy dependent) | Sellix account, product/store verification, payout setup |
| CraftingStore | Minecraft/server monetization platform | Primarily fiat via integrated processors | ~2018 | Platform + gateway fees | Merchant verification required | Business/creator usage depends on policy | CraftingStore account, gateway setup, store verification |

### Official onboarding / docs / support links
- NOWPayments: `https://nowpayments.io/`, docs `https://documenter.getpostman.com/view/7907941/2s93JusNJt`, supported coins `https://nowpayments.io/supported-coins`, policy `https://nowpayments.io/doc/AML_KYC_Policy_NOWPayments-v1_3_1.pdf`
- OpenNode: `https://www.opennode.com/`, help/pricing `https://help.opennode.com/`
- BitPay: `https://bitpay.com/`, docs `https://developer.bitpay.com/docs/`, support `https://support.bitpay.com/`
- Payoneer: `https://www.payoneer.com/checkout/`, developer `https://www.payoneer.com/developers/`
- Paymentwall: docs `https://docs.paymentwall.com/`, integration support `integration@paymentwall.com`, business support `merchantsupport@paymentwall.com`
- Square: docs `https://developer.squareup.com/docs/`, dashboard `https://developer.squareup.com/apps`, supported regions `https://developer.squareup.com/docs/international-development`
- Worldpay: `https://developer.worldpay.com/`
- Amazon Pay: merchant help `https://pay.amazon.com/help/201810860`, signup `https://pay.amazon.com/signup`
- Apple Pay: country availability `https://support.apple.com/en-us/102775`, setup `https://developer.apple.com/help/account/capabilities/configure-apple-pay/`
- Google Wallet/Pay: availability `https://support.google.com/wallet/answer/12060037`, web setup `https://developers.google.com/pay/api/web/guides/setup`
- WeChat Pay: merchant docs `https://pay.wechatpay.cn/doc/v3/merchant/`
- Skrill: business `https://www.skrill.com/en/business/`, docs/resources `https://www.skrill.com/en/business/integration/`
- OFX: business/enterprise `https://www.ofx.com/en-us/business/enterprise/`
- Fortumo/Boku: `https://www.boku.com/`, developer `https://developer.boku.com/`, contact `https://www.boku.com/contact/`
- Authorize.Net: developer `https://developer.authorize.net/`, API reference `https://developer.authorize.net/api/reference/`
- Alipay: global `https://global.alipay.com/`, open platform `https://open.alipay.com/`
- Coinbase Commerce: `https://commerce.coinbase.com/`
- PayPal: developer `https://developer.paypal.com/`
- Stripe: docs `https://docs.stripe.com/`
- Xsolla: docs `https://developers.xsolla.com/`
- WooCommerce: `https://woocommerce.com/` and chosen gateway docs
- Tebex: docs `https://docs.tebex.io/`
- Sellix: docs `https://developers.sellix.io/`
- CraftingStore: docs `https://docs.craftingstore.net/`

## Explorer-backed chains in this package
These modules use block explorers to detect on-chain transactions (`existsTransaction`) rather than merchant-acquirer onboarding.

| Chain modules | Region | Asset(s) | Launch (approx) | Cost model | KYC/KYB needed for chain usage |
|---|---|---|---|---|---|
| `HIVEModule`, `HBDModule` | Global (decentralized network) | HIVE, HBD | 2020 | Network fees (chain rules) | No merchant KYC for on-chain detection |
| `STEEMModule`, `SBDModule` | Global | STEEM, SBD | 2016 | Network fees | No |
| `BLURTModule` | Global | BLURT | 2020 | Network fees | No |
| `TLOSModule` | Global | TLOS | 2018 | Network fees | No |
| `EOSModule` | Global | EOS | 2018 | Network fees/resources | No |
| `WAXModule` | Global | WAXP | 2019 | Network fees/resources | No |
| `BNBModule`, `POLModule`, `ETHModule` | Global | BNB, POL, ETH + tokens | 2015/2020/2015 | Gas fees | No |
| `TRXModule`, `TRONModule` | Global | TRX + TRC tokens | 2018 | Network fees/energy model | No |
| `BTCModule`, `BCHModule`, `LTCModule`, `DOGEModule` | Global | BTC, BCH, LTC, DOGE | 2009/2017/2011/2013 | Miner fees | No |
| `PIVXModule` and long-tail explorer modules (`FLS`, `SAPP`, `MOBIC`, `SAGA`, `PNY`, `MONK`, `UCR`, `KYAN`, `DASHD`, `OWO`, `SEVENSEVENSEVEN`, `CFL`, `BIR`, `AZR`, `BECN`, `SCC`, etc.) | Global | Per chain ticker | Varies by chain | Network fees | No |

### Explorer note
- These chain modules do not onboard you as a payment processor.
- You still need your own business/compliance process for selling goods/services (tax, AML, sanctions screening, invoicing, consumer law) based on your jurisdiction.

## Account setup, API keys, and who to contact

Use this as a quick onboarding checklist before coding.

### BitPay
- Create merchant account: `https://bitpay.com/dashboard/signup`
- Pair client and create token: `https://support.bitpay.com/hc/en-us/articles/115003001183-How-do-I-pair-my-client-and-create-a-token`
- Dev docs: `https://developer.bitpay.com/docs/`

### Payoneer
- Product overview / get started: `https://www.payoneer.com/checkout/`
- Developer PSD2 contact page: `https://developer.payoneer.com/psd2/contact`
- Support center form: `https://payoneer.custhelp.com/app/ask/`

### Paymentwall
- Sign up + integration requirements: `https://www.paymentwall.com/en/documentation/API-Documentation/722`
- Integration docs hub: `https://docs.paymentwall.com/`
- Integration/API support: `integration@paymentwall.com`, `devsupport@paymentwall.com`
- Business support/sales: `merchantsupport@paymentwall.com`, `bizdev@paymentwall.com`

### Square
- Create developer account/app: `https://developer.squareup.com/docs/get-started/create-account-and-application`
- Get access tokens: `https://developer.squareup.com/docs/build-basics/access-tokens`
- Dev console: `https://developer.squareup.com/docs/devtools/developer-dashboard`

### Worldpay
- Access Worldpay docs: `https://developer.worldpay.com/`
- Access credentials are typically provisioned via your implementation manager:
  - Example reference: `https://developer.worldpay.com/products/access/tokens/v1/get-started`

### Amazon Pay
- Merchant signup: `https://pay.amazon.com/signup`
- Find Merchant ID / key pair in Integration Central: `https://pay.amazon.com/help/202022560`
- Setup instructions: `https://pay.amazon.com/us/help/201828690`

### Apple Pay
- Apple Developer account help (merchant ID + processing certificate): `https://developer.apple.com/help/account/capabilities/configure-apple-pay/`
- Sandbox/testing: `https://developer.apple.com/apple-pay/sandbox-testing/`

### Google Pay
- Web setup guide: `https://developers.google.com/pay/api/web/guides/setup`

### WeChat Pay
- API v3 docs (merchant): `https://pay.wechatpay.cn/doc/v3/merchant/`
- API domain references (used by docs): `https://api.mch.weixin.qq.com`
- Note: onboarding is usually through WeChat merchant platform and may require regional/business verification.

### Skrill
- Business/merchant onboarding page: `https://www.skrill.com/en/business/shopping-carts/`
- Quick Checkout guide (credentials include MQI/API password + secret word): `https://www.skrill.com/fileadmin/content/pdf/Skrill_Quick_Checkout_Guide_v10.8.pdf`

### OFX
- Business platform: `https://www.ofx.com/`
- API/enterprise integrations (contact-led): `https://www.ofx.com/en-us/business/enterprise/`
- Partner/API contact path: `https://www.ofx.com/en-us/partner-with-us/`

### Fortumo
- Legacy Fortumo domain now redirects to Boku: `https://fortumo.com/`
- Contact Boku for enterprise/local-payment onboarding: `https://www.boku.com/contact/`
- API reference entry point on Boku site: `https://developer.boku.com/`

### Authorize.Net
- Developer center: `https://developer.authorize.net/`
- Create sandbox account: `https://developer.authorize.net/hello_world/sandbox/`
- API credentials (Login ID + Transaction Key): `https://developer.authorize.net/hello_world/common_setup_questions.html`
- API reference: `https://developer.authorize.net/api/reference/index.html`

### Alipay
- Global merchant/developer portal: `https://global.alipay.com/`
- Developer help center: `https://global.alipay.com/developer/helpcenter/`
- Global merchant login: `https://global.alipay.com/ilogin/account_login.htm`
- Open platform: `https://open.alipay.com/`

### Practical rollout tip
- Start in each provider sandbox/test mode first.
- Store keys in environment variables only.
- For production access, many providers require KYC/business approval and sometimes account-manager provisioning before live keys are issued.
