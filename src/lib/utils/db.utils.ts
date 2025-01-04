const DB_NAME = "VeracyDB";
const DB_VERSION = 1;
const DB_STORE_WALLET = "wallet-store";

export type DbWalletEntry = {
	address: string;
	key: JsonWebKey;
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

	static async addWallet(address: string, key: JsonWebKey): Promise<void> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([DB_STORE_WALLET], "readwrite")
						.objectStore(DB_STORE_WALLET);
					const req = walletStore.add({
						address,
						key,
					} as DbWalletEntry);
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

	static async getWallet(address: string): Promise<JsonWebKey> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([DB_STORE_WALLET], "readonly")
						.objectStore(DB_STORE_WALLET);
					const req = walletStore.get(address);
					req.onerror = function () {
						reject("Get Failed");
					};
					req.onsuccess = function (event: any) {
						resolve((event.target.result as DbWalletEntry).key);
					};
				})
				.catch(() => {
					reject("Get Failed");
				});
		});
	}

	static async removeWallet(address: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.getDb()
				.then((db) => {
					const walletStore = db
						.transaction([DB_STORE_WALLET], "readonly")
						.objectStore(DB_STORE_WALLET);
					const req = walletStore.delete(address);
					req.onerror = function () {
						reject("Delete Failed");
					};
					req.onsuccess = function () {
						resolve();
					};
				})
				.catch(() => {
					reject("Delete Failed");
				});
		});
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
