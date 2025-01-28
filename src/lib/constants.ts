export const STORAGE_NODE_URL = "node_url";
export const STORAGE_REG_DONE = "reg_done";
export const STORAGE_SEARCH_HISTORY = "search_history";
export const STORAGE_TOKEN = "token";

export const POST_MAX_NUMBER_OF_CONTENT = 6;

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

// GATEWAYS
export const ARWEAVE_URL = "arweave.net";
export const ARWEAVE_PORT = 443;
export const ARWEAVE_PROTOCOL = "https";
export const BUNDLER_URL = "https://node2.irys.xyz";
export const ACTIVATION_ADDRESS = "8vAopD3Fv7QnEqG00-E6aSyLaL9WKZpHmeTPWyNxs9c";

// TEST GATEWAYS
// export const ARWEAVE_URL = "localhost";
// export const ARWEAVE_PORT = 1984;
// export const ARWEAVE_PROTOCOL = "http";
// export const BUNDLER_URL = "https://devnet.irys.xyz";
// export const ACTIVATION_ADDRESS = "0S00yFATR2ozqXiq0XT6EjnB0EBc5xHW35HPZpSK1J8"; // Only for Testing

// POSTS
export const TX_APP_NAME = "VeracyApp";
export const TX_APP_VERSION = "0.0.5";
export const TX_APP_CONTENT_TYPE = "application/json";

export const REQUEST_TIMEOUT = 10000;
