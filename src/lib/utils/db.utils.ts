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
	data?: any;
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

	// Wallet
	static async addWallet(address: string, key: JsonWebKey): Promise<void> {
		return this.add(DB_STORE_WALLET, {
			address,
			key,
		});
	}

	static async getWallet(address: string): Promise<JsonWebKey> {
		return this.get<DbWalletEntry>(DB_STORE_WALLET, address).then(
			(data) => data.key,
		);
	}

	static async getAllWalletKey(): Promise<string[]> {
		return this.getAllKey(DB_STORE_WALLET);
	}

	static async removeWallet(address: string): Promise<void> {
		return this.remove(DB_STORE_WALLET, address);
	}

	//Watcher
	static async addWatcher(id: string, data?: any): Promise<void> {
		return this.add(DB_STORE_WATCHER, {
			id,
			data,
		});
	}

	static async getWatcher(id: string): Promise<string> {
		return this.get<DbWatcherEntry>(DB_STORE_WATCHER, id).then(
			(data) => data?.id,
		);
	}

	static async getAllWatcher(): Promise<string[]> {
		return this.getAllKey(DB_STORE_WATCHER);
	}

	static async removeWatcher(id: string): Promise<void> {
		return this.remove(DB_STORE_WATCHER, id);
	}
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
