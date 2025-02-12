import { getContext, setContext } from "svelte";
import { Wallet } from "../models/wallet.model";
import { DB } from "../utils/db.utils";
import { getAddressFromKey, getEncryptKey } from "../utils/wallet.utils";

const WALLET_LOCAL_ADDRESS = "WALLET_LOCAL_ADDRESS";
const WALLET_STATE_KEY = "wallet-state-key";

export class WalletState {
	wallet = $state<Wallet>();

	hasWallet = $derived(this.wallet !== undefined);

	constructor() {
		const address = localStorage.getItem(WALLET_LOCAL_ADDRESS);
		if (address) {
			try {
				this.useWallet(address);
			} catch {
				console.error("Couldn't auto-connect");
			}
		}
	}

	disconnectWallet = (): void => {
		localStorage.removeItem(WALLET_LOCAL_ADDRESS);
		this.wallet = undefined;
	};

	removeWallet = async (address: string): Promise<void> => {
		return DB.wallet.remove(address);
	};

	registerFromMnem = async (mnemonic?: string): Promise<void> => {
		const newWallet = await Wallet.New(mnemonic);
		await this.addWallet(newWallet);
	};

	registerFromJWK = async (key: JsonWebKey): Promise<void> => {
		const address = await getAddressFromKey(key);
		const newWallet = new Wallet(key, address);
		await this.addWallet(newWallet);
	};

	addWallet = async (newWallet: Wallet): Promise<void> => {
		try {
			const address = await getAddressFromKey(newWallet.rawKey);
			await DB.wallet.add(address, newWallet.rawKey);
			localStorage.setItem(WALLET_LOCAL_ADDRESS, address);
		} catch {
			throw "Failed to save wallet data";
		}

		this.wallet = newWallet;
	};

	useWallet = async (addr?: string): Promise<void> => {
		if (!addr) {
			addr = localStorage.getItem(WALLET_LOCAL_ADDRESS) || undefined;
		}
		if (addr) {
			if (this.wallet) {
				this.wallet = undefined;
			}
			try {
				const rawKey = await DB.wallet.get(addr);
				if (!rawKey) {
					this.disconnectWallet();
					return;
				}
				const address = await getAddressFromKey(rawKey);
				this.wallet = new Wallet(rawKey, address);
				localStorage.setItem(WALLET_LOCAL_ADDRESS, address);
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
