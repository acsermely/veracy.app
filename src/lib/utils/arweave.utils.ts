import Arweave from "arweave";
import type Transaction from "arweave/node/lib/transaction";
import type { JWKInterface } from "arweave/node/lib/wallet";
import {
	BUNDLER_URL,
	REQUEST_TIMEOUT,
	TX_APP_CONTENT_TYPE,
	TX_APP_NAME,
	TX_APP_VERSION,
	TxType,
} from "../constants";
import type { Post } from "../models/post.model";
import type { Wallet } from "../models/wallet.model";
import { getSignKey } from "./wallet.utils";

export class ArweaveUtils {
	static arweave = Arweave.init({
		host: "arweave.net",
		port: 443,
		protocol: "https",
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
		const response = await fetch(`${BUNDLER_URL}/${txId}`);
		return (await response.json().then((data) => {
			return data;
		})) as T;
	}

	static async newPostTx(data: Post): Promise<Transaction> {
		const stringData = JSON.stringify(data);
		let tx = await this.arweave.createTransaction({
			data: stringData,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.POST);
		if (data.title) {
			tx.addTag("Post-Title", data.title);
		}
		if (data.tags && data.tags.length > 0) {
			tx.addTag("Post-Tags", data.tags.join(" "));
		}
		// if (data.settings) {
		// 	if (data.settings.disableComments) {
		// 		tx.addTag("Post-Comments", "false");
		// 	}
		// }
		return tx;
	}

	static async newPaymentTx(
		postId: string,
		price: number,
	): Promise<Transaction> {
		const stringData = JSON.stringify({
			target: postId,
			price: price,
		});
		let tx = await this.arweave.createTransaction({
			data: stringData,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.PAYMENT);
		tx.addTag("Target", postId);
		tx.addTag("Price", price.toString());
		return tx;
	}

	static async newSetPriceTx(
		postId: string,
		price: number,
	): Promise<Transaction> {
		if (!price || price === 0) {
			throw "No Price";
		}
		const stringData = JSON.stringify({
			target: postId,
			price: price,
		});
		let tx = await this.arweave.createTransaction({
			data: stringData,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.PRICE);
		tx.addTag("Target", postId);
		tx.addTag("Price", price.toString());
		return tx;
	}

	static async getPostsIds(cursor?: string): Promise<ArPostIdResult[]> {
		return ArweaveUtils.query<ArQueryResult<ArQueryCursoredIds>>(
			queryPosts(cursor),
		).then((data) =>
			data.data.transactions.edges.map((item) => ({
				id: item.node.id,
				cursor: item.cursor,
			})),
		);
		// return Promise.resolve().then(() => {
		//   let data: ArQueryResult<ArQueryIds> = JSON.parse(allPostsMock);
		//   return data.data.transactions.edges.map((item) => item.node.id);
		// });
	}

	static async getAllPostsIdForWallet(walletId: string): Promise<string[]> {
		return ArweaveUtils.query<ArQueryResult<ArQueryCursoredIds>>(
			queryProfileData(walletId),
		).then((data) =>
			data.data.transactions.edges.map((item) => item.node.id),
		);
		// return Promise.resolve().then(() => {
		//   let data: ArQueryResult<ArQueryNodes> = JSON.parse(allPostsForWallet);
		//   return data.data.transactions.edges
		//     .filter((item) => item.node.owner.address === walletId)
		//     .map((item) => item.node.id);
		// });
	}

	static async getPriceForPost(
		tx: string,
		uploader: string,
	): Promise<string[]> {
		return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
			queryPriceForTx(tx, uploader),
		).then((data) =>
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
}

export function queryPosts(cursor?: string) {
	return {
		query: `{
        transactions(
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
					id
				},
				cursor
			}
        }
    }`,
	};
}

export function queryPriceForTx(tx: string, sender: string): { query: string } {
	return {
		query: `{
			transactions(
				order: DESC,
				owners: ["${sender}"],
				timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
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
				timestamp: {from: 1728246095432, to: ${new Date().getTime()}},
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
						id
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

export type ArQueryCursoredIds = {
	node: {
		id: string;
	};
	cursor: string;
};

export type ArQueryIds = {
	node: {
		id: string;
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
	cursor: string;
};

export type ArPaymentResult = {
	target: string;
	price: number;
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
