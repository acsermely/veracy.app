import type Transaction from "arweave/node/lib/transaction";
import Arweave from "arweave";
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
		tx.addTag("Post-Title", data.title);
		if (data.tags.length > 0) {
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

	static async getAllPostsIds(): Promise<string[]> {
		// return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
		// 	queryAllPosts(),
		// )
		return Promise.resolve().then(() => {
			let data: ArQueryResult<ArQueryIds> = JSON.parse(`{
				"data": {
					"transactions": {
						"edges": [
							{
								"node": {
									"id": "FoXvgnlBXcjowaRZNb0Tk6xb-xp3p133pmLqJIPoMFs",
									"recipient": "",
									"owner": {
										"address": "U8D4nGJTzzK53rZYMGjLc7poHGvhi-etGhrKgt53aMs"
									}
								}
							},
							{
								"node": {
									"id": "GQyWjUcBrdn_NFpdmXbXiUYyGgBfNziRyWUt6z7hNVA",
									"recipient": "",
									"owner": {
										"address": "phn014mLJvoTEmFVQ-ZDLSXNG0j6HlWt0bcOaFOFIjM"
									}
								}
							},
							{
								"node": {
									"id": "BOM1Jtlqz6VuQcW-zhZrWzwgNeCm0XfzW6IVL3Amilc",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "c32PgZRJ80ct1qXTZ0GKK_Bk1_JRfNAj4goxqPzuOFU",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "suFWvIe-lkXJP4vDzdQT1CVt7osZsIZUed3WuPu4HcM",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "0FaavRBRd0XKFwTX-dwkZHEa2rxMJrEICfoy5xh3_9w",
									"recipient": "",
									"owner": {
										"address": "BoIlvHxQA0xp6Y2BQPCD4yn9CsrNKqlIbSqY2Ud_SX4"
									}
								}
							},
							{
								"node": {
									"id": "HR9lHp9xw7mX2LWCCbmYpglIkoEp9G68AVCMshw4FJs",
									"recipient": "",
									"owner": {
										"address": "BoIlvHxQA0xp6Y2BQPCD4yn9CsrNKqlIbSqY2Ud_SX4"
									}
								}
							},
							{
								"node": {
									"id": "sMnzRKTHaJG8vDnTDyGoCBNBzDKSaDV_ljVaZqM6Eu8",
									"recipient": "",
									"owner": {
										"address": "DpQW3pflHnp8px7QbCxHCvgoVc4-vV_i2DpCdGRoq74"
									}
								}
							},
							{
								"node": {
									"id": "Sr-JbSNEmjDixbjrUgF_skoy-Bjtl_Yu_ZRiKWfSiT8",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "3IIbEJrJOWaVQgrIU1v_kQUx5_On2T9AJDKVtGu4Guc",
									"recipient": "",
									"owner": {
										"address": "U8vZ_zttcsWN97BPnKaZWd7HgGchpp8bsnW20DYEidw"
									}
								}
							}
						]
					}
				}
			}`);
			return data.data.transactions.edges.map((item) => item.node.id);
		});
	}

	static async getAllPostsIdForWallet(walletId: string): Promise<string[]> {
		// return ArweaveUtils.query<ArQueryResult<ArQueryIds>>(
		// 	queryProfileData(walletId),
		// ).then((data) =>
		// 	data.data.transactions.edges.map((item) => item.node.id),
		// );
		return Promise.resolve().then(() => {
			let data: ArQueryResult<ArQueryNodes> = JSON.parse(`{
				"data": {
					"transactions": {
						"edges": [
							{
								"node": {
									"id": "FoXvgnlBXcjowaRZNb0Tk6xb-xp3p133pmLqJIPoMFs",
									"recipient": "",
									"owner": {
										"address": "U8D4nGJTzzK53rZYMGjLc7poHGvhi-etGhrKgt53aMs"
									}
								}
							},
							{
								"node": {
									"id": "GQyWjUcBrdn_NFpdmXbXiUYyGgBfNziRyWUt6z7hNVA",
									"recipient": "",
									"owner": {
										"address": "phn014mLJvoTEmFVQ-ZDLSXNG0j6HlWt0bcOaFOFIjM"
									}
								}
							},
							{
								"node": {
									"id": "BOM1Jtlqz6VuQcW-zhZrWzwgNeCm0XfzW6IVL3Amilc",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "c32PgZRJ80ct1qXTZ0GKK_Bk1_JRfNAj4goxqPzuOFU",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "suFWvIe-lkXJP4vDzdQT1CVt7osZsIZUed3WuPu4HcM",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "0FaavRBRd0XKFwTX-dwkZHEa2rxMJrEICfoy5xh3_9w",
									"recipient": "",
									"owner": {
										"address": "BoIlvHxQA0xp6Y2BQPCD4yn9CsrNKqlIbSqY2Ud_SX4"
									}
								}
							},
							{
								"node": {
									"id": "HR9lHp9xw7mX2LWCCbmYpglIkoEp9G68AVCMshw4FJs",
									"recipient": "",
									"owner": {
										"address": "BoIlvHxQA0xp6Y2BQPCD4yn9CsrNKqlIbSqY2Ud_SX4"
									}
								}
							},
							{
								"node": {
									"id": "sMnzRKTHaJG8vDnTDyGoCBNBzDKSaDV_ljVaZqM6Eu8",
									"recipient": "",
									"owner": {
										"address": "DpQW3pflHnp8px7QbCxHCvgoVc4-vV_i2DpCdGRoq74"
									}
								}
							},
							{
								"node": {
									"id": "Sr-JbSNEmjDixbjrUgF_skoy-Bjtl_Yu_ZRiKWfSiT8",
									"recipient": "",
									"owner": {
										"address": "_yE2MZLr2sAQAlLROUP7KKt-WA0aTlgd5B_f49_CU14"
									}
								}
							},
							{
								"node": {
									"id": "3IIbEJrJOWaVQgrIU1v_kQUx5_On2T9AJDKVtGu4Guc",
									"recipient": "",
									"owner": {
										"address": "U8vZ_zttcsWN97BPnKaZWd7HgGchpp8bsnW20DYEidw"
									}
								}
							}
						]
					}
				}
			}`);
			return data.data.transactions.edges
				.filter((item) => item.node.owner.address === walletId)
				.map((item) => item.node.id);
		});
	}
}

export function queryAllPosts() {
	return {
		query: `{
        transactions(
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
};

export type ArQueryResult<T> = {
	data: {
		transactions: {
			edges: Array<T>;
		};
	};
};
