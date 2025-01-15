import { getContext, setContext } from "svelte";
import { navigate } from "svelte-routing";
import { toast } from "svelte-sonner";
import { ArweaveUtils } from "../utils/arweave.utils";
import { DB } from "../utils/db.utils";
import { getWalletState } from "./wallet.svelte";

const WATCHER_INTERVAL = 3000;

export class Watcher {
	private _interval?: number;
	private _walletState = getWalletState();
	private _promiseMap = new Map<string, () => void>();

	constructor() {
		DB.getAllWatcher().then((list) => {
			if (list.length > 0) {
				this._startInterval();
			}
		});
	}

	private _startInterval(): void {
		this._interval = window.setInterval(async () => {
			if (this._walletState.wallet?.address) {
				const list = await DB.getAllWatcher();
				if (!list.length) {
					clearInterval(this._interval);
					this._interval = undefined;
					return;
				}
				for (const id of list) {
					const tx = await ArweaveUtils.getPaymentForPost(
						id,
						this._walletState.wallet.address,
					);
					if (tx.length > 0) {
						this.remove(id);
					}
				}
			}
		}, WATCHER_INTERVAL);
	}

	private remove(id: string): void {
		DB.removeWatcher(id);
		const resolver = this._promiseMap.get(id);
		if (resolver) {
			resolver();
			this._promiseMap.delete(id);
		}
		toast.success("Payment Completed. Go to the Post!", {
			duration: 4000,
			action: {
				label: "Go",
				onClick: () => navigate("/post/" + id),
			},
		});
	}
	/**
	 * Add Post to transaction Watcher
	 * @param id Post TxId
	 * @returns Promise that resolves when the tansaction is complete
	 */
	public async add(id: string): Promise<void> {
		if (!this._interval) {
			this._startInterval();
		}
		DB.addWatcher(id);
		return new Promise((resolve) => this._promiseMap.set(id, resolve));
	}
}

const WATCHER_STATE_KEY = "watcher-state-key";

export function setWatcherState(): Watcher {
	return setContext(WATCHER_STATE_KEY, new Watcher());
}

export function getWatcherState(): Watcher {
	return getContext<Watcher>(WATCHER_STATE_KEY);
}
