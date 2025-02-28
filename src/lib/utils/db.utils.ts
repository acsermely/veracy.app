import { STORAGE_CURRENT_WALLET } from "../constants";
import type { PostAge } from "../models/post.model";
import type { ProfileData } from "../models/user.model";

const DB_NAME = "VeracyDB";
const DB_VERSION = 4;
const DB_STORE_WALLET = "wallet-store";
const DB_STORE_PROFILE = "profile-store";

export type DbChatMessage = {
	fromId: string;
	message: string;
	timestamp: number;
};

export type DbChatRoom = {
	userId: string; // The other user's address
	messages: DbChatMessage[];
};

export type DbWalletEntry = {
	address: string;
	key: JsonWebKey;
	friends?: DbFriendEntry[];
	buckets?: DbBucketEntry[];
	watchers?: DbWatcherEntry[];
	chats?: DbChatRoom[]; // Added chat rooms to wallet entry
};

export type DbWatcherEntry = {
	id: string;
	data: {
		type: "set-price" | "payment";
	};
};

export type DbBucketEntry = {
	name: string;
	open: boolean;
	contributors?: string[];
	age?: PostAge[];
	img?: string;
};

export type DbFriendEntry = {
	id: string;
};

export type DbProfileEntry = {
	address: string;
	data: {
		username?: string;
		img?: string;
		description?: string;
	};
	timestamp: number; // When the profile was cached
};

export class DB {
	static db?: IDBDatabase;

	static async getDb(): Promise<IDBDatabase> {
		if (this.db) {
			return this.db;
		}
		try {
			this.db = await initializeDB();
		} catch {
			throw "Couldn't create DB";
		}
		return this.db;
	}

	private static add(store: string, data: any): Promise<void> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([store], "readwrite")
						.objectStore(store);
					const req = walletStore.add(data);
					req.onerror = function () {
						reject("Add Failed");
					};
					req.onsuccess = function () {
						resolve();
					};
				})
				.catch(() => {
					reject("Add Failed");
				});
		});
	}

	private static get<T>(store: string, id: string): Promise<T | undefined> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([store], "readonly")
						.objectStore(store);
					const req = walletStore.get(id);
					req.onerror = function () {
						reject("Get Failed");
					};
					req.onsuccess = function (event: any) {
						resolve(event.target.result as T);
					};
				})
				.catch(() => {
					reject("Get Failed");
				});
		});
	}

	private static getAllKey(store: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([store], "readonly")
						.objectStore(store);
					const req = walletStore.getAllKeys();
					req.onerror = function () {
						reject("Get All Failed");
					};
					req.onsuccess = function (event: any) {
						resolve(event.target.result as string[]);
					};
				})
				.catch(() => {
					reject("Get Failed");
				});
		});
	}

	private static remove(store: string, id: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([store], "readwrite")
						.objectStore(store);
					const req = walletStore.delete(id);
					req.onerror = function () {
						reject("Delete Failed");
					};
					req.onsuccess = function () {
						resolve();
					};
				})
				.catch((e) => {
					console.error(e);
					reject("Delete Failed");
				});
		});
	}

	private static put<T>(store: string, entry: T): Promise<void> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([store], "readwrite")
						.objectStore(store);
					const req = walletStore.put(entry);
					req.onerror = function (e) {
						console.error(e);
						reject("Put Failed");
					};
					req.onsuccess = function () {
						resolve();
					};
				})
				.catch((e) => {
					console.error(e);
					reject("Put Failed");
				});
		});
	}

	static wallet = {
		add: async (address: string, key: JsonWebKey) => {
			await DB.add(DB_STORE_WALLET, {
				address,
				key,
			});

			const DEFAULT_BUCKETS: DbBucketEntry[] = [
				{
					contributors: [],
					name: "Cat",
					open: true,
					img: (
						await import("../components/common/files/cat.img.json")
					).default,
					age: [],
				},
				{
					contributors: [],
					name: "Funny Privacy Violations",
					open: true,
					age: ["12+", "16+"],
				},
			];
			for (const bucket of DEFAULT_BUCKETS) {
				await DB.bucket.add(bucket, address);
			}
		},

		get: async (address?: string) => {
			if (!address) {
				address = localStorage.getItem(STORAGE_CURRENT_WALLET) || "";
				if (!address) {
					throw "Missing Wallet";
				}
			}
			return DB.get<DbWalletEntry>(DB_STORE_WALLET, address);
		},

		getAll: async () => {
			return DB.getAllKey(DB_STORE_WALLET);
		},

		remove: async (address: string) => {
			return DB.remove(DB_STORE_WALLET, address);
		},

		put: async (wallet: DbWalletEntry) => {
			return DB.put<DbWalletEntry>(DB_STORE_WALLET, wallet);
		},
	};

	//Watcher
	static watcher = {
		add: async (id: string, data: { type: "set-price" | "payment" }) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.watchers) {
					wallet.watchers = [];
				}
				wallet.watchers.push({ id, data });
				return DB.wallet.put(wallet);
			});
		},

		get: async (id: string) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.watchers) {
					return undefined;
				}
				return wallet.watchers.find((item) => item.id === id);
			});
		},

		getAllKeys: async () => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				return wallet.watchers?.map((item) => item.id) || [];
			});
		},

		getAll: async () => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				return wallet.watchers || [];
			});
		},

		remove: async (id: string) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.watchers) {
					return;
				}
				wallet.watchers = wallet.watchers.filter(
					(item) => item.id !== id,
				);
				return DB.wallet.put(wallet);
			});
		},
	};

	// Friend
	static friend = {
		add: async (id: string) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.friends) {
					wallet.friends = [];
				}
				wallet.friends.push({ id });
				return DB.wallet.put(wallet);
			});
		},

		get: async (id: string) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.friends) {
					return undefined;
				}
				return wallet.friends.find((item) => item.id === id);
			});
		},

		getAllKeys: async () => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				return wallet.friends?.map((item) => item.id) || [];
			});
		},

		getAll: async () => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				return wallet.friends || [];
			});
		},

		remove: async (id: string) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.friends) {
					return;
				}
				wallet.friends = wallet.friends.filter(
					(item) => item.id !== id,
				);
				return DB.wallet.put(wallet);
			});
		},
	};

	// Bucket
	static bucket = {
		add: async (bucket: DbBucketEntry, address?: string) => {
			return DB.wallet.get(address).then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.buckets) {
					wallet.buckets = [];
				}
				if (wallet.buckets.find((item) => item.name === bucket.name)) {
					throw "Already exists";
				}
				wallet.buckets.push(bucket);
				return DB.wallet.put(wallet);
			});
		},

		get: async (name: string) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.buckets) {
					return undefined;
				}
				return wallet.buckets.find((item) => item.name === name);
			});
		},

		getAllKeys: async () => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				return wallet.buckets?.map((item) => item.name) || [];
			});
		},

		getAll: async () => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				return wallet.buckets || [];
			});
		},

		remove: async (name: string) => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.buckets) {
					throw "No Buckets";
				}
				wallet.buckets = wallet.buckets.filter(
					(item) => item.name !== name,
				);
				return DB.wallet.put(wallet);
			});
		},
	};

	static profile = {
		add: async (address: string, data: ProfileData) => {
			return DB.put<DbProfileEntry>(DB_STORE_PROFILE, {
				address,
				data: {
					username: data.username,
					img: data.img,
					description: data.description,
				},
				timestamp: Date.now(),
			});
		},

		get: async (address: string) => {
			return DB.get<DbProfileEntry>(DB_STORE_PROFILE, address).then(
				(entry) => {
					if (!entry) {
						return undefined;
					}
					// Check if cache is older than 1 day
					if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
						DB.profile.remove(address);
						return undefined;
					}
					return entry.data as ProfileData;
				},
			);
		},

		remove: async (address: string) => {
			return DB.remove(DB_STORE_PROFILE, address);
		},

		evictStale: async () => {
			return DB.getDb().then((db) => {
				const store = db
					.transaction([DB_STORE_PROFILE], "readwrite")
					.objectStore(DB_STORE_PROFILE);

				const request = store.getAll();
				request.onsuccess = () => {
					const entries = request.result as DbProfileEntry[];
					const staleTime = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago

					entries.forEach((entry) => {
						if (entry.timestamp < staleTime) {
							store.delete(entry.address);
						}
					});
				};
			});
		},
	};

	// Chat
	static chat = {
		add: async (
			message: string,
			roomId: string,
			fromId: string,
		): Promise<void> => {
			return DB.wallet.get().then(async (wallet) => {
				if (!wallet) {
					throw "Missing Wallet";
				}
				if (!wallet.chats) {
					wallet.chats = [];
				}

				const chatRoom = wallet.chats.find(
					(room) => room.userId === roomId,
				);
				const newMessage: DbChatMessage = {
					fromId,
					message,
					timestamp: Date.now(),
				};

				if (chatRoom) {
					chatRoom.messages.push(newMessage);
				} else {
					wallet.chats.push({
						userId: roomId,
						messages: [newMessage],
					});
				}

				return DB.wallet.put(wallet);
			});
		},

		get: async (userId: string): Promise<DbChatMessage[]> => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet?.chats) {
					return [];
				}
				const chatRoom = wallet.chats.find(
					(room) => room.userId === userId,
				);
				return (
					chatRoom?.messages.sort(
						(a, b) => a.timestamp - b.timestamp,
					) || []
				);
			});
		},

		getAll: async (): Promise<DbChatRoom[]> => {
			return DB.wallet.get().then((wallet) => {
				return wallet?.chats || [];
			});
		},

		getRecent: async (
			room: string,
			limit: number = 10,
			cursor?: string,
		): Promise<{ messages: DbChatMessage[]; nextCursor?: string }> => {
			return DB.wallet.get().then((wallet) => {
				if (!wallet?.chats) {
					return { messages: [] };
				}

				const messages =
					wallet.chats.find((r) => r.userId === room)?.messages || [];
				const sortedMessages = messages
					.map((msg) => ({ ...msg }))
					.sort((a, b) => b.timestamp - a.timestamp);

				let startIndex = 0;
				if (cursor) {
					const cursorTimestamp = parseInt(cursor);
					startIndex = sortedMessages.findIndex(
						(msg) => msg.timestamp < cursorTimestamp,
					);
					if (startIndex === -1) startIndex = sortedMessages.length;
				}

				const paginatedMessages = sortedMessages.slice(
					startIndex,
					startIndex + limit,
				);
				const nextCursor =
					paginatedMessages.length === limit
						? paginatedMessages[
								paginatedMessages.length - 1
							].timestamp.toString()
						: undefined;

				return { messages: paginatedMessages, nextCursor };
			});
		},
	};
}

async function initializeDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = function () {
			const db = request.result;
			if (!db.objectStoreNames.contains(DB_STORE_WALLET)) {
				db.createObjectStore(DB_STORE_WALLET, {
					keyPath: "address",
				});
			}
			if (!db.objectStoreNames.contains(DB_STORE_PROFILE)) {
				db.createObjectStore(DB_STORE_PROFILE, {
					keyPath: "address",
				});
			}
		};

		request.onsuccess = function () {
			resolve(request.result);
		};

		request.onerror = function (event) {
			console.error("Failed to open local DB", event);
			reject("Failed to open DB");
		};
	});
}
