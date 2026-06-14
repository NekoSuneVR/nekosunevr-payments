// Solana Pay helper — thin wrapper around the official `@solana/pay` SDK + `@solana/web3.js`.
// Implements the merchant request/verify flow from
// https://github.com/solana-foundation/pay (examples/payment-flow-merchant):
//
//   1. createSolanaPayRequest(...)  -> a `solana:` URL (encodeURL) + a unique per-order
//      `reference` public key. Show the URL as a QR (createSolanaPayQR) to the payer.
//   2. findAndValidatePayment(...)  -> findReference() locates the on-chain signature that
//      carries that reference, then validateTransfer() confirms recipient/amount/spl-token.
//
// Unlike the address-watch `sol` module (which matches purely by amount and can collide
// between two buyers paying the same amount), the reference key uniquely identifies each
// order — the recommended way to do Solana checkout.
//
// The SDK deps are loaded lazily so the rest of the package keeps working when a deployment
// never touches Solana Pay; a clear install hint is thrown only if/when it's actually used.

let _web3 = null;
let _pay = null;
let _BigNumber = null;

function load() {
    if (_pay) return;
    try {
        _web3 = require('@solana/web3.js');
        _pay = require('@solana/pay');
        _BigNumber = require('bignumber.js');
    } catch (err) {
        throw new Error(
            'Solana Pay support requires the optional dependencies "@solana/pay", ' +
            '"@solana/web3.js" and "bignumber.js". Install them with:\n' +
            '  npm install @solana/pay @solana/web3.js bignumber.js'
        );
    }
}

// A cached Connection per endpoint+commitment so repeated polling doesn't reopen sockets.
const _connections = new Map();
function getConnection(endpoint, commitment = 'confirmed') {
    load();
    const url = String(endpoint || '').replace(/\/+$/, '') || 'https://api.mainnet-beta.solana.com';
    const key = `${url}|${commitment}`;
    let conn = _connections.get(key);
    if (!conn) {
        conn = new _web3.Connection(url, commitment);
        _connections.set(key, conn);
    }
    return conn;
}

// Build the Solana Pay request URL. `reference` is generated as a fresh keypair public key
// when not supplied — keep it; it's the id you verify the payment with later.
// Returns { url, reference } where both are strings.
function createSolanaPayRequest({ recipient, amount, splToken, reference, label, message, memo } = {}) {
    load();
    const { PublicKey, Keypair } = _web3;
    const { encodeURL } = _pay;
    const BigNumber = _BigNumber;

    if (!recipient) throw new Error('Solana Pay: a `recipient` wallet address is required');

    const ref = reference ? new PublicKey(reference) : Keypair.generate().publicKey;
    const fields = { recipient: new PublicKey(recipient), reference: ref };
    if (amount !== undefined && amount !== null && amount !== '') {
        fields.amount = new BigNumber(amount.toString());
    }
    if (splToken) fields.splToken = new PublicKey(splToken);
    if (label) fields.label = label;
    if (message) fields.message = message;
    if (memo) fields.memo = memo;

    const url = encodeURL(fields);
    return { url: url.toString(), reference: ref.toBase58() };
}

// Optional: turn a Solana Pay URL into a QR object (createQR from @solana/pay).
// In Node you can call `.getRawData('png')` on the result to get a Buffer.
function createSolanaPayQR(url, size = 512, background = 'white', color = 'black') {
    load();
    const { createQR } = _pay;
    return createQR(url, size, background, color);
}

// Locate and validate a payment by its reference key.
// Returns { found:false } while no matching tx exists yet (or it failed validation),
// or { found:true, signature } once an on-chain transfer matching recipient/amount/
// spl-token has been confirmed.
async function findAndValidatePayment(connection, { recipient, amount, reference, splToken } = {}, { finality = 'confirmed' } = {}) {
    load();
    const { PublicKey } = _web3;
    const { findReference, validateTransfer, FindReferenceError, ValidateTransferError } = _pay;
    const BigNumber = _BigNumber;

    if (!recipient) throw new Error('Solana Pay: a `recipient` wallet address is required to verify a payment');
    if (!reference) throw new Error('Solana Pay: a `reference` public key is required to verify a payment (the value returned by createPayment)');

    const refKey = new PublicKey(reference);

    let signatureInfo;
    try {
        signatureInfo = await findReference(connection, refKey, { finality });
    } catch (err) {
        if (err instanceof FindReferenceError) return { found: false }; // not paid yet
        throw err;
    }

    const fields = { recipient: new PublicKey(recipient), reference: refKey };
    if (amount !== undefined && amount !== null && amount !== '') {
        fields.amount = new BigNumber(amount.toString());
    }
    if (splToken) fields.splToken = new PublicKey(splToken);

    try {
        await validateTransfer(connection, signatureInfo.signature, fields, { commitment: finality });
    } catch (err) {
        // A transfer carrying the reference exists but doesn't match the expected
        // recipient/amount/token — treat as "not a valid payment for this order".
        if (err instanceof ValidateTransferError) return { found: false, signature: signatureInfo.signature, invalid: true };
        throw err;
    }

    return { found: true, signature: signatureInfo.signature };
}

// Map a signature's commitment level to a confirmations count compatible with the rest of
// the package (finalized => 32, confirmed => 1, otherwise 0).
async function getConfirmations(connection, signature) {
    load();
    const res = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
    const status = res && res.value && res.value[0];
    if (!status) return 0;
    if (typeof status.confirmations === 'number') return status.confirmations;
    return status.confirmationStatus === 'finalized' ? 32 : 0;
}

module.exports = {
    getConnection,
    createSolanaPayRequest,
    createSolanaPayQR,
    findAndValidatePayment,
    getConfirmations
};
