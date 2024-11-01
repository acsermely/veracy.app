export const STORAGE_NODE_URL = "node_url";
export const STORAGE_REG_DONE = "reg_done";

export enum Context {
	NODE = "node",
	WALLET = "wallet",
	FEEDSTATE = "feedState",
}

export enum TxType {
	POST = "post",
	PAYMENT = "payment",
	PROFILE = "profile",
}

export const TX_APP_NAME = "Test123";
export const TX_APP_VERSION = "0.0.3";
export const TX_APP_CONTENT_TYPE = "application/json";
// export const ARWEAVE_URL = "https://arweave.net";
export const ARWEAVE_URL = "https://node2.bundlr.network"; //Loads slower, but no delay with new transactions
