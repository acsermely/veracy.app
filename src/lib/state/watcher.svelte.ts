import { getContext, setContext } from "svelte";
import { ArweaveUtils } from "../utils/arweave.utils";
import { DB } from "../utils/db.utils";
import { getWalletState } from "./wallet.svelte";

const WATCHER_INTERVAL = 5000;

export class Watcher {
	private _interval?: number;
	private _walletState = getWalletState();
	private _promiseMap = new Map<string, (() => void)[]>();

	constructor() {
		DB.watcher.getAll().then((list) => {
			if (list.length > 0) {
				this._startInterval();
			}
		});
	}

	private _startInterval(): void {
		this._interval = window.setInterval(async () => {
			if (this._walletState.wallet?.address) {
				const list = await DB.watcher.getAll();
				if (!list.length) {
					clearInterval(this._interval);
					this._interval = undefined;
					return;
				}
				for (const id of list) {
					const item = await DB.watcher.get(id);
					if (!item) {
						continue;
					}
					let tx: string[] = [];
					if (item.data.type === "payment") {
						tx = await ArweaveUtils.getPaymentForPost(
							id,
							this._walletState.wallet.address,
						).catch(() => []);
					} else if (item.data.type === "set-price") {
						tx = await ArweaveUtils.getPriceForPost(
							id,
							this._walletState.wallet.address,
						).catch(() => []);
					}
					if (tx.length > 0) {
						this.remove(id);
					}
				}
			}
		}, WATCHER_INTERVAL);
	}

	private remove(id: string): void {
		DB.watcher.remove(id);
		const resolvers = this._promiseMap.get(id);
		if (resolvers) {
			resolvers.forEach((resolver) => resolver());
			this._promiseMap.delete(id);
		}
	}
	/**
	 * Add Post to transaction Watcher
	 * @param id Post TxId
	 * @returns Promise that resolves when the tansaction is complete
	 */
	public async add(id: string, type: "set-price" | "payment"): Promise<void> {
		if (!this._interval) {
			this._startInterval();
		}
		DB.watcher.add(id, { type });
		return new Promise((resolve) => {
			if (this._promiseMap.get(id)) {
				this._promiseMap.get(id)?.push(resolve);
			} else {
				this._promiseMap.set(id, [resolve]);
			}
		});
	}

	public getPromise(id: string): Promise<void> {
		if (this._promiseMap.get(id)) {
			return new Promise((resolve) =>
				this._promiseMap.get(id)?.push(resolve),
			);
		}
		throw "No Id";
	}
}

const WATCHER_STATE_KEY = "watcher-state-key";

export function setWatcherState(): Watcher {
	return setContext(WATCHER_STATE_KEY, new Watcher());
}

export function getWatcherState(): Watcher {
	return getContext<Watcher>(WATCHER_STATE_KEY);
}
