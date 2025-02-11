const DB_NAME = "VeracyDB";
const DB_VERSION = 2;
const DB_STORE_WALLET = "wallet-store";
const DB_STORE_WATCHER = "watcher-store";
// const DB_STORE_PAYMENT = "payment-store";

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

	private static get<T>(store: string, id: string): Promise<T> {
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
		add: async (address: string, key: JsonWebKey): Promise<void> => {
			return DB.add(DB_STORE_WALLET, {
				address,
				key,
			});
		},

		get: async (address: string): Promise<JsonWebKey> => {
			return DB.get<DbWalletEntry>(DB_STORE_WALLET, address).then(
				(data) => data.key,
			);
		},

		getAll: async (): Promise<string[]> => {
			return DB.getAllKey(DB_STORE_WALLET);
		},

		remove: async (address: string): Promise<void> => {
			return DB.remove(DB_STORE_WALLET, address);
		},
	};

	//Watcher
	static watcher = {
		add: async (
			id: string,
			data: { type: "set-price" | "payment" },
		): Promise<void> => {
			return this.add(DB_STORE_WATCHER, {
				id,
				data,
			});
		},

		get: async (id: string): Promise<DbWatcherEntry> => {
			return this.get<DbWatcherEntry>(DB_STORE_WATCHER, id);
		},

		getAll: async (): Promise<string[]> => {
			return DB.getAllKey(DB_STORE_WATCHER);
		},

		remove: async (id: string): Promise<void> => {
			return DB.remove(DB_STORE_WATCHER, id);
		},
	};
}

async function initializeDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = function () {
			const db = request.result;
			db.createObjectStore(DB_STORE_WALLET, {
				keyPath: "address",
			});

			db.createObjectStore(DB_STORE_WATCHER, {
				keyPath: "id",
			});
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
