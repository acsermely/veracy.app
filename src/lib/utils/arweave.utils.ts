import Arweave from "arweave";
import type Transaction from "arweave/node/lib/transaction";
import {
	ARWEAVE_URL,
	TX_APP_CONTENT_TYPE,
	TX_APP_NAME,
	TX_APP_VERSION,
	TxType,
} from "../constants";
import type { Post } from "../model/post.model";

export class ArweaveUtils {
	static arweave = Arweave.init({
		host: "arweave.net",
		port: 443,
		protocol: "https",
		timeout: 20000,
		logging: false,
	});

	static async query<T>(query: Object): Promise<T> {
		if (!this.arweave) {
			throw new Error("Arweave is not initialized");
		}
		const headers = new Headers({});
		headers.append("content-type", "application/json");
		headers.append("accept", "application/json, text/plain, */*");
		return fetch(`${ARWEAVE_URL}/graphql`, {
			method: "POST",
			body: JSON.stringify(query),
			headers,
		})
			.then((response) => response.json())
			.then((data) => {
				return data as T;
			});
		return this.arweave.api
			.post<T>("/graphql", query)
			.then((data) => data.data);
	}

	static async getTxById<T>(txId: string): Promise<T> {
		const response = await fetch(`${ARWEAVE_URL}/${txId}`);
		return (await response.json().then((data) => {
			data.id = txId;
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

	static async newPaymentTx(data: Post): Promise<Transaction> {
		const stringData = JSON.stringify({
			target: data.id,
			price: data.price || "0",
		});
		let tx = await this.arweave.createTransaction({
			data: stringData,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.PAYMENT);
		tx.addTag("Target", data.id);
		tx.addTag("Price", data.price || "0");
		return tx;
	}

	static async newSetPriceTx(data: Post): Promise<Transaction> {
		const stringData = JSON.stringify({
			target: data.id,
			price: data.price || "0",
		});
		let tx = await this.arweave.createTransaction({
			data: stringData,
		});
		tx.addTag("App-Name", TX_APP_NAME);
		tx.addTag("Content-Type", TX_APP_CONTENT_TYPE);
		tx.addTag("Version", TX_APP_VERSION);
		tx.addTag("Type", TxType.PAYMENT);
		tx.addTag("Target", data.id);
		tx.addTag("Price", data.price || "0");
		return tx;
	}

	static async getPostsIds(cursor?: string): Promise<ArPostIdResult[]> {
		return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
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
		return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
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
}

export function queryPosts(cursor?: string) {
	return {
		query: `{
        transactions(
			order: DESC,
			limit: 5,
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

export function queryPaymentForTxAndSender(
	tx: string,
	sender: string,
): { query: string } {
	return {
		query: `{
			transactions(
				order: DESC,
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
						recipient
						owner {
							address
						}
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

export type ArQueryNodes = {
	node: {
		id: string;
		recipient: string;
		owner: {
			address: string;
		};
	};
};

export type ArQueryIds = {
	node: {
		id: string;
	};
	cursor: string;
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
