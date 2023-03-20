/// <reference types="node" />
import { EventEmitter } from "events";
export interface APIAuthentication {
	tebexapikey?: string;
        sellixapikey?: string;
        sellixmerchant?: string;
        craftingstoreapikey?: string;
        g2aapikey?: string;
}
export declare class TebexPay extends EventEmitter {
	private auth;
	private tebexapikey;
	constructor(auth: APIAuthentication);
        getTransaction(transactionId: string): Promise<void>;
        getPlayerLookup(username: string): Promise<void>;
        getSales(): Promise<void>;
        getBans(): Promise<void>;
        getPackages(): Promise<void>;
        createCheckoutURL(packageId: string, username: string): Promise<void>;
}

export declare class SellixPay extends EventEmitter {
	private auth;
	private sellixapikey;
        private sellixmerchant;
	constructor(auth: APIAuthentication);
        getOrder(orderId: string): Promise<void>;
        getProduct(productId: string): Promise<void>;
}

export declare class CraftingStorePay extends EventEmitter {
	private auth;
	private craftingstoreapikey
	constructor(auth: APIAuthentication);
        getPayment(transactionId: string): Promise<void>;
}

export declare class G2APay extends EventEmitter {
	private auth;
	private g2aapikey
	constructor(auth: APIAuthentication);
        getPayment(transactionId: string): Promise<void>;
}