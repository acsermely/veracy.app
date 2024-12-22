import { getContext, setContext } from "svelte";
import { Wallet } from "../models/wallet.model";
import { getAddressFromKey, getEncryptKey } from "../utils/wallet.utils";

const WALLET_LOCAL_PRIV_KEY = "WALLET_LOCAL_PRIV_KEY";
const WALLET_STATE_KEY = "wallet-state-key";

export class WalletState {
	wallet = $state<Wallet>();

	isConnected = $derived(this.wallet !== undefined);
	hasKeys = $state<boolean>(false);

	constructor() {
		const key = localStorage.getItem(WALLET_LOCAL_PRIV_KEY);
		if (key) {
			this.hasKeys = true;
			try {
				this.connect();
			} catch {
				console.log("Couldn't auto-connect");
			}
		}
	}

	register = async (mnemonic?: string, pin?: number[]): Promise<void> => {
		const newWallet = await Wallet.New(mnemonic);

		localStorage.setItem(
			WALLET_LOCAL_PRIV_KEY,
			JSON.stringify(newWallet.rawKey),
		);

		this.wallet = newWallet;
		this.hasKeys = true;
	};

	connect = async (): Promise<void> => {
		const key = localStorage.getItem(WALLET_LOCAL_PRIV_KEY);

		if (key) {
			try {
				const rawKey = JSON.parse(key) as JsonWebKey;
				const address = await getAddressFromKey(rawKey);
				this.wallet = new Wallet(rawKey, address);
				return;
			} catch (e) {
				console.error(e);
				throw "Failed to connect to wallet.";
			}
		}

		throw "No wallet found.";
	};

	getPublicKey = async (): Promise<JsonWebKey> => {
		if (!this.wallet) {
			throw "No Wallet!";
		}
		const encryptKey = await getEncryptKey(this.wallet.rawKey);
		return crypto.subtle.exportKey("jwk", encryptKey);
	};
}

export function setWalletState(): WalletState {
	return setContext(WALLET_STATE_KEY, new WalletState());
}

export function getWalletState(): WalletState {
	return getContext<WalletState>(WALLET_STATE_KEY);
}
