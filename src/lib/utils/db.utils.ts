import type { PostAge } from "../models/post.model";

const DB_NAME = "VeracyDB";
const DB_VERSION = 3;
const DB_STORE_WALLET = "wallet-store";
const DB_STORE_WATCHER = "watcher-store";
const DB_STORE_BUCKET = "bucket-store";
const DB_STORE_FRIEND = "friend-store";

export type DbWalletEntry = {
	address: string;
	key: JsonWebKey;
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
	contributors: string[];
	age?: PostAge;
	img?: string;
};

export type DbFriendEntry = {
	id: string;
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

	static wallet = {
		add: async (address: string, key: JsonWebKey) => {
			return DB.add(DB_STORE_WALLET, {
				address,
				key,
			});
		},

		get: async (address: string) => {
			return DB.get<DbWalletEntry>(DB_STORE_WALLET, address).then(
				(data) => data?.key,
			);
		},

		getAll: async () => {
			return DB.getAllKey(DB_STORE_WALLET);
		},

		remove: async (address: string) => {
			return DB.remove(DB_STORE_WALLET, address);
		},
	};

	//Watcher
	static watcher = {
		add: async (id: string, data: { type: "set-price" | "payment" }) => {
			return this.add(DB_STORE_WATCHER, {
				id,
				data,
			});
		},

		get: async (id: string) => {
			return this.get<DbWatcherEntry>(DB_STORE_WATCHER, id);
		},

		getAll: async () => {
			return DB.getAllKey(DB_STORE_WATCHER);
		},

		remove: async (id: string) => {
			return DB.remove(DB_STORE_WATCHER, id);
		},
	};

	// Friend
	static friend = {
		add: async (id: string) => {
			return this.add(DB_STORE_FRIEND, {
				id,
			});
		},

		get: async (id: string) => {
			return this.get<DbFriendEntry>(DB_STORE_FRIEND, id);
		},

		getAll: async () => {
			return DB.getAllKey(DB_STORE_FRIEND);
		},

		remove: async (id: string) => {
			return DB.remove(DB_STORE_FRIEND, id);
		},
	};

	// Bucket
	static bucket = {
		add: async (
			name: string,
			open: boolean,
			contributors: string[],
			age: PostAge,
		) => {
			return this.add(DB_STORE_BUCKET, {
				name,
				open,
				contributors,
				age,
			});
		},

		get: async (name: string) => {
			return this.get<DbBucketEntry>(DB_STORE_BUCKET, name);
		},

		getAll: async () => {
			return DB.getAllKey(DB_STORE_BUCKET);
		},

		remove: async (name: string) => {
			return DB.remove(DB_STORE_BUCKET, name);
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
			if (!db.objectStoreNames.contains(DB_STORE_WATCHER)) {
				db.createObjectStore(DB_STORE_WATCHER, {
					keyPath: "id",
				});
			}
			if (!db.objectStoreNames.contains(DB_STORE_BUCKET)) {
				db.createObjectStore(DB_STORE_BUCKET, {
					keyPath: "name",
				});
			}
			if (!db.objectStoreNames.contains(DB_STORE_FRIEND)) {
				db.createObjectStore(DB_STORE_FRIEND, {
					keyPath: "id",
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
