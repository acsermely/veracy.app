import type Arweave from "arweave";
import { ArweaveWebWallet } from "arweave-wallet-connector";
import type { State } from "arweave-wallet-connector";
import { getContext, setContext } from "svelte";

export class WalletState {
	isConnected = $state<boolean>(false);
	address = $state<string>("");

	state = $state<Partial<State>>({
		url: "arweave.app",
	});
	wallet = $state<any>();

	connectWeb = async (): Promise<void> => {
		const wallet = new ArweaveWebWallet(
			{
				name: "Permit_v0",
			},
			{
				state: this.state,
			},
		);
		try {
			wallet.on("connect", () => {
				console.log("connect");
				this.wallet = wallet;
				this.address = this.wallet.address;
				this.isConnected = true;
				try {
					wallet.postMessage("keepPopup", undefined, {});
				} catch (e) {
					console.error("FOCUS", e);
				} finally {
					console.log("FOCUS");
				}
			});
			wallet.on("disconnect", () => {
				console.log("disconnect");
				this.isConnected = false;
				return;
			});
			await wallet.connect(["DISPATCH", "ACCESS_ADDRESS"]);
			console.log("wallet:", wallet.keepPopup, wallet.usePopup);
		} catch (e) {
			console.error("sub", e);
			this.isConnected = false;
		}
	};
}

const WALLET_STATE_KEY = "wallet-state-key";

export function setWalletState(): WalletState {
	return setContext(WALLET_STATE_KEY, new WalletState());
}

export function getWalletState(): WalletState {
	return getContext<WalletState>(WALLET_STATE_KEY);
}
