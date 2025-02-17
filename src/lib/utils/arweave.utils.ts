import Arweave from "arweave";
import type Transaction from "arweave/node/lib/transaction";
import type { JWKInterface } from "arweave/node/lib/wallet";
import {
	ACTIVATION_ADDRESS,
	ARWEAVE_PORT,
	ARWEAVE_PROTOCOL,
	ARWEAVE_URL,
	BUNDLER_URL,
	REQUEST_TIMEOUT,
	TX_APP_JSON_CONTENT_TYPE,
	TX_APP_NAME,
	TX_APP_TEXT_CONTENT_TYPE,
	TX_APP_VERSION,
	TxType,
} from "../constants";
import type { Post } from "../models/post.model";
import type { ProfileData } from "../models/user.model";
import type { Wallet } from "../models/wallet.model";
import type { DbBucketEntry } from "./db.utils";
import { DB } from "./db.utils";
import { userCountPerPostProcessor } from "./feed.utils";
import { getSignKey } from "./wallet.utils";

export class ArweaveUtils {
	static arweave = Arweave.init({
		host: ARWEAVE_URL,
		port: ARWEAVE_PORT,
		protocol: ARWEAVE_PROTOCOL,
		timeout: REQUEST_TIMEOUT,
		logging: false,
	});

	static async query<T>(query: Object): Promise<T> {
		if (!this.arweave) {
			throw new Error("Arweave is not initialized");
		}
		const headers = new Headers({});
		headers.append("content-type", "application/json");
		headers.append("accept", "application/json, text/plain, */*");
		return fetch(`${BUNDLER_URL}/graphql`, {
			method: "POST",
			body: JSON.stringify(query),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
			headers,
		})
			.then((response) => response.json())
			.then((data) => {
				return data as T;
			});
		// return this.arweave.api
		// 	.post<T>("/graphql", query)
		// 	.then((data) => data.data);
	}

	static async getTxById<T>(txId: string): Promise<T> {
		if (!txId) {
			throw "Missing TxId";
		}
		const response = await fetch(`${BUNDLER_URL}/${txId}`);
		return (await response.json().then((data) => {
			return data;
		})) as T;
	}

	static async getPaymentById(txId: string): Promise<Transaction> {
		return ArweaveUtils.arweave.transactions.get(txId);
	}

	static async newPostTx(data: Post): Promise<Transaction> {
		const stringData = JSON.stringify(data);
		let tx = await this.arweave.createTransaction({
			data: stringData,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_JSON_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.POST);
		tx.addTag("Age", data.age);
		return tx;
	}

	static async newPaymentTx(
		targetAddr: string,
		sourceAddr: string,
		postId: string,
		price: number,
	): Promise<Transaction> {
		const priceInWinston = this.arweave.ar.arToWinston(price.toString());
		const balance = await this.arweave.wallets.getBalance(sourceAddr);
		const fee = await this.arweave.transactions.getPrice(0);
		if (
			Number.parseInt(balance) <
			Number.parseInt(priceInWinston) + Number.parseInt(fee)
		) {
			throw "Insufficient balance";
		}
		let tx = await this.arweave.createTransaction({
			target: targetAddr,
			quantity: priceInWinston,
			reward: fee,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_JSON_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.PAYMENT);
		tx.addTag("Target", postId);
		tx.addTag("Price", price.toString());
		return tx;
	}

	static async newSetPriceTx(
		sourceAddr: string,
		postId: string,
		price: number,
	): Promise<Transaction> {
		if (!price || price === 0) {
			throw "No Price";
		}
		const priceInWinston = this.arweave.ar.arToWinston(price.toString());
		const balance = await this.arweave.wallets.getBalance(sourceAddr);
		const fee = await this.arweave.transactions.getPrice(0);
		if (
			Number.parseInt(balance) <
			Number.parseInt(priceInWinston) + Number.parseInt(fee)
		) {
			throw "Insufficient balance";
		}
		let tx = await this.arweave.createTransaction({
			target: ACTIVATION_ADDRESS,
			quantity: priceInWinston,
			reward: fee,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_JSON_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.PRICE);
		tx.addTag("Target", postId);
		tx.addTag("Price", price.toString());
		return tx;
	}

	static async newBucketTx(bucket: DbBucketEntry): Promise<Transaction> {
		if (!bucket.name) {
			throw "Missing Name";
		}
		if (bucket.open === false && !bucket.contributors?.length) {
			throw "Missing Contributors";
		}

		let tx = await this.arweave.createTransaction({
			data: JSON.stringify(bucket),
		});

		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_JSON_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.BUCKET);
		tx.addTag("Bucket", bucket.name);
		return tx;
	}

	static async newSendToBucketTx(
		txId: string,
		bucketName: string,
	): Promise<Transaction> {
		if (!txId || !bucketName) {
			throw "Missing Parameter";
		}

		let tx = await this.arweave.createTransaction({
			data: txId,
		});

		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_TEXT_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.SEND_BUCKET);
		tx.addTag("Bucket", bucketName);
		tx.addTag("PostTx", txId);
		return tx;
	}

	static async getBucketId(bucketName: string): Promise<string> {
		return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
			queryBucketByName(bucketName),
		).then((data) =>
			data.data.transactions?.edges.length
				? data.data.transactions?.edges[0].node.id
				: "",
		);
	}

	static async getBucketPosts(
		bucketName: string,
		cursor?: string,
		friends?: string[],
		ages?: string[],
		items = 1000,
		feedProcessor: (
			item: ArBucketItems[],
		) => ArPostIdResult[] = userCountPerPostProcessor,
	): Promise<ArPostIdResult[]> {
		return ArweaveUtils.query<ArQueryResult<ArBucketItems>>(
			queryBucketItems(bucketName, items, cursor, friends, ages),
		).then((data) => {
			if (!data.data.transactions) {
				throw "No Results";
			}
			return feedProcessor(data.data.transactions.edges);
		});
	}

	static async getPostsIds(
		cursor?: string,
		friends?: string[],
	): Promise<ArPostIdResult[]> {
		return ArweaveUtils.query<ArQueryResult<ArQueryCursoredIds>>(
			queryPosts(cursor, friends),
		).then((data) =>
			data.data.transactions.edges.map((item) => ({
				id: item.node.id,
				cursor: item.cursor,
				timestamp: item.node.timestamp,
			})),
		);
	}

	static async getAllPostsIdForWallet(
		walletId: string,
	): Promise<ArPostIdResult[]> {
		return ArweaveUtils.query<ArQueryResult<ArQueryCursoredIds>>(
			queryProfileData(walletId),
		).then((data) =>
			data.data.transactions.edges.map((item) => ({
				id: item.node.id,
				timestamp: item.node.timestamp,
			})),
		);
	}

	static async getPriceForPost(
		postId: string,
		uploader: string,
	): Promise<string[]> {
		return ArweaveUtils.arweave.api
			.post<ArQueryResult<ArQueryIds>>(
				"/graphql",
				queryPriceForTx(postId, uploader),
			)
			.then((response) => response.data)
			.then((data) =>
				data.data.transactions.edges.map((item) => item.node.id),
			);
	}

	static async getPaymentForPost(
		tx: string,
		uploader: string,
	): Promise<string[]> {
		return ArweaveUtils.arweave.api
			.post<ArQueryResult<ArQueryIds>>(
				"/graphql",
				queryPaymentForTxAndSender(tx, uploader),
			)
			.then((response) => response.data)
			.then((data) =>
				data.data.transactions.edges.map((item) => item.node.id),
			);
	}

	static async getAllUserAddresses(): Promise<Set<string>> {
		return ArweaveUtils.query<ArQueryResult<ArQueryAddresses>>(
			queryAllUserAddresses(),
		).then(
			(data) =>
				new Set(
					data.data.transactions.edges.map(
						(item) => item.node.address,
					),
				),
		);
	}

	static async getBalance(address: string): Promise<any> {
		return this.arweave.ar.winstonToAr(
			await this.arweave.wallets.getBalance(address),
		);
	}

	static async submitPayment(wallet: Wallet, tx: Transaction): Promise<any> {
		try {
			await this.arweave.transactions.sign(
				tx,
				wallet.rawKey as JWKInterface,
			);
		} catch (e) {
			console.error(e);
			throw "Sign failed";
		}

		try {
			const result = await this.arweave.transactions.post(tx);
			return result;
		} catch (e) {
			console.error(e);
			throw "Couldn't create uploader";
		}
	}

	static async dispatch(wallet: Wallet, tx: Transaction): Promise<any> {
		let dispatchResult: Awaited<any> | undefined;
		if (!tx.quantity || tx.quantity === "0") {
			try {
				const data = tx.get("data", { decode: true, string: false });
				const tags = tx.tags.map((tag) => ({
					name: tag.get("name", { decode: true, string: true }),
					value: tag.get("value", { decode: true, string: true }),
				}));
				const target = tx.target;
				const bundleTx = await createDataItem(
					await getSignKey(wallet.rawKey),
					{
						data,
						tags,
						target,
					},
				);
				await fetch(BUNDLER_URL + "/tx", {
					method: "POST",
					headers: {
						"Content-Type": "application/octet-stream",
					},
					body: bundleTx.getRaw(),
				}).then((response) => {
					if (response.status >= 200 && response.status < 300) {
						dispatchResult = { id: bundleTx.id, type: "BUNDLED" };
					}
				});
			} catch (e) {
				console.error(e);
			}
		}
		if (dispatchResult) {
			return dispatchResult;
		}
		throw "Dispatch Error";
	}

	static async getRecentBuckets(): Promise<string[]> {
		return ArweaveUtils.query<
			ArQueryResult<{
				node: {
					tags: Array<{ name: string; value: string }>;
				};
			}>
		>(queryRecentBuckets()).then((data) => {
			const bucketSet = new Set<string>();
			data.data.transactions.edges.forEach((edge) => {
				const bucketTag = edge.node.tags.find(
					(tag) => tag.name === "Bucket",
				);
				if (bucketTag) {
					bucketSet.add(bucketTag.value);
				}
			});
			return Array.from(bucketSet);
		});
	}

	static async newProfileTx(profile: ProfileData): Promise<Transaction> {
		let tx = await this.arweave.createTransaction({
			data: JSON.stringify(profile),
		});

		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_JSON_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.PROFILE);
		tx.addTag("Username", profile.username);
		return tx;
	}

	static async checkUsernameExists(username: string): Promise<boolean> {
		return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
			queryUsernameExists(username),
		).then((data) => {
			return data.data.transactions.edges.length > 0;
		});
	}

	static async getLatestProfile(
		walletId: string,
	): Promise<ProfileData | undefined> {
		// Try to get from cache first
		const cached = await DB.profile.get(walletId);
		if (cached) {
			return cached;
		}

		// If not in cache, query Arweave
		return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
			queryLatestProfile(walletId),
		).then((data) => {
			if (!data.data.transactions.edges.length) {
				return undefined;
			}
			const profileId = data.data.transactions.edges[0].node.id;
			return ArweaveUtils.getTxById<ProfileData>(profileId).then(
				(profile) => {
					DB.profile.add(walletId, profile);
					return profile;
				},
			);
		});
	}
}

export function queryPosts(cursor?: string, friends?: string[]) {
	return {
		query: `{
		transactions(
			${friends?.length ? 'owners: ["' + friends.join('","') + '"],' : ""}
			order: DESC,
			limit: 10,
			timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
			${cursor ? 'after: "' + cursor + '",' : ""}
            tags: [
                { name: "App-Name", values: ["${TX_APP_NAME}"]},
                { name: "Version", values: ["${TX_APP_VERSION}"]},
                { name: "Type", values: ["${TxType.POST}"]}
            ]
        ) 
        {
            edges {
				node {
					id,
					timestamp
				},
				cursor
			}
        }
    }`,
	};
}

export function queryPriceForTx(tx: string, sender: string): { query: string } {
	// order: DESC,
	// timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
	return {
		query: `{
			transactions(
				owners: ["${sender}"],
				recipients: ["${ACTIVATION_ADDRESS}"]
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.PRICE}"]},
					{ name: "Target", values: ["${tx}"]}
				]
			)
			{
				edges {
					node {
						id
					}
				}
			}
		}`,
	};
}

export function queryPaymentForTxAndSender(
	tx: string,
	sender: string,
): { query: string } {
	return {
		query: `{
			transactions(
				owners: ["${sender}"],
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.PAYMENT}"]},
					{ name: "Target", values: ["${tx}"]}
				]
			)
			{
				edges {
					node {
						id
					}
				}
			}
		}`,
	};
}

export function queryProfileData(sender: string): { query: string } {
	return {
		query: `{
			transactions(
				order: DESC,
				owners: ["${sender}"],
				timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.POST}"]},
				]
			)
			{
				edges {
					node {
						id,
						timestamp
					}
				}
			}
		}`,
	};
}

export function queryAllUserAddresses(): { query: string } {
	return {
		query: `{
			transactions(
				order: DESC,
				timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
				]
			)
			{
				edges {
					node {
						address
					}
				}
			}
		}`,
	};
}

export function queryBucketByName(bucketName: string): { query: string } {
	return {
		query: `{
			transactions(
				order: ASC,
				first: 1,
				timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.BUCKET}"]},
					{ name: "Bucket", values: ["${bucketName}"]}
				]
			)
			{
				edges {
					node {
						id,
						timestamp
					}
				}
			}
		}`,
	};
}

export function queryBucketItems(
	bucketName: string,
	limit: number,
	cursor?: string,
	friends?: string[],
	ages?: string[],
): { query: string } {
	return {
		query: `{
			transactions(
				order: DESC,
				${friends?.length ? 'owners: ["' + friends.join('","') + '"],' : ""}
				first: ${limit},
				timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
				${cursor ? 'after: "' + cursor + '",' : ""}
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.SEND_BUCKET}"]},
					{ name: "Bucket", values: ["${bucketName}"]},
					${ages?.length ? '{ name: "Age", values: ["' + ages.join('","') + '"]}' : ""}
				]
			)
			{
				edges {
					node {
						id,
						address,
						tags {
							name,
							value
						},
						timestamp
					},
					cursor
				}
			}
		}`,
	};
}

export function queryRecentBuckets(): { query: string } {
	return {
		query: `{
			transactions(
				order: DESC,
				first: 1000,
				timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.SEND_BUCKET}"]}
				]
			)
			{
				edges {
					node {
						tags {
							name,
							value
						}
					}
				}
			}
		}`,
	};
}

export function queryUsernameExists(username: string): { query: string } {
	return {
		query: `{
			transactions(
				first: 1,
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.PROFILE}"]},
					{ name: "Username", values: ["${username}"]}
				]
			)
			{
				edges {
					node {
						id
					}
				}
			}
		}`,
	};
}

export function queryLatestProfile(walletId: string): { query: string } {
	return {
		query: `{
			transactions(
				owners: ["${walletId}"],
				order: DESC,
				first: 1,
				tags: [
					{ name: "App-Name", values: ["${TX_APP_NAME}"]},
					{ name: "Version", values: ["${TX_APP_VERSION}"]},
					{ name: "Type", values: ["${TxType.PROFILE}"]}
				]
			)
			{
				edges {
					node {
						id
					}
				}
			}
		}`,
	};
}

// Partial Search
// https://arweave-search.goldsky.com/graphql
// query {
//     transactions(
//       tags: [
//         { name: "App-Name", values: "VeracyApp"},
//         { name: "Type", values: "bucket"},
//         { name: "Bucket", values: "test*", match: WILDCARD}
//       ]
//       first: 10
//     ) {
//         edges {
//             node {
//                 id
//               owner {
//                 address
//               }
//               tags {
//                 name
//                 value
//               }
//             }
//         }
//     }
// }

export type ArQueryCursoredIds = {
	node: {
		id: string;
		timestamp: any;
	};
	cursor: string;
};

export type ArQueryIds = {
	node: {
		id: string;
		timestamp?: any;
	};
};

export type ArQueryAddresses = {
	node: {
		address: string;
	};
};

export type ArQueryResult<T> = {
	data: {
		transactions: {
			edges: Array<T>;
		};
	};
};

export type ArPostIdResult = {
	id: string;
	cursor?: string;
	timestamp: any;
};

export type ArPaymentResult = {
	target: string;
	price: number;
};

export type ArBucketItems = {
	node: {
		id: string;
		address: string;
		tags: Array<{ name: string; value: string }>;
		timestamp: any;
	};
	cursor: string;
};

/**
 * This code originates from the ArweaveWebWallet project
 * @link https://github.com/jfbeats/ArweaveWebWallet/blob/master/src/providers/Arweave.ts
 * @param item ArDataItemParams
 * @returns
 */
async function createDataItem(
	privateKey: CryptoKey,
	item: {
		data: Uint8Array | string;
		tags?: { name: string; value: string; key?: string }[];
		target?: string;
	},
) {
	// @ts-ignore
	const { createData, signers } = await import("$scripts/arbundles");
	const { data, tags, target } = item;
	const sk = (await crypto.subtle.exportKey(
		"jwk",
		privateKey,
	)) as JWKInterface;
	const signer = new signers.ArweaveSigner(sk);
	const anchor = Arweave.utils
		.bufferTob64(crypto.getRandomValues(new Uint8Array(32)))
		.slice(0, 32);
	const dataItem = createData(data, signer, { tags, target, anchor });
	await dataItem.sign(signer);
	return dataItem;
}
