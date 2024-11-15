export const STORAGE_NODE_URL = "node_url";
export const STORAGE_REG_DONE = "reg_done";
export const STORAGE_SEARCH_HISTORY = "search_history";

export enum Context {
	NODE = "node",
	WALLET = "wallet",
	FEEDSTATE = "feedState",
}

export enum TxType {
	POST = "post",
	PAYMENT = "payment",
	PRICE = "set-price",
	PROFILE = "profile",
}

export const TX_APP_NAME = "VeracyApp";
export const TX_APP_VERSION = "0.0.4";
export const TX_APP_CONTENT_TYPE = "application/json";
// export const ARWEAVE_URL = "https://arweave.net";
export const ARWEAVE_URL = "https://node2.irys.xyz"; //Loads slower, but no delay with new transactions
