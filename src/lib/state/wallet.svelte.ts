import { getContext, setContext } from "svelte";
import { Wallet } from "../models/wallet.model";
import { DB } from "../utils/db.utils";
import { getAddressFromKey, getEncryptKey } from "../utils/wallet.utils";

const WALLET_LOCAL_ADDRESS = "WALLET_LOCAL_ADDRESS";
const WALLET_STATE_KEY = "wallet-state-key";

export class WalletState {
	wallet = $state<Wallet>();

	isConnected = $derived(this.wallet !== undefined);
	hasKeys = $state<boolean>(false);

	constructor() {
		const address = localStorage.getItem(WALLET_LOCAL_ADDRESS);
		if (address) {
			this.hasKeys = true;
			try {
				this.connect();
			} catch {
				console.log("Couldn't auto-connect");
			}
		}
	}

	registerFromMnem = async (mnemonic?: string): Promise<void> => {
		const newWallet = await Wallet.New(mnemonic);
		await this.register(newWallet);
	};

	registerFromJWK = async (key: JsonWebKey): Promise<void> => {
		const address = await getAddressFromKey(key);
		const newWallet = new Wallet(key, address);
		await this.register(newWallet);
	};

	register = async (newWallet: Wallet): Promise<void> => {
		try {
			const address = await getAddressFromKey(newWallet.rawKey);
			await DB.addWallet(address, newWallet.rawKey);
			localStorage.setItem(WALLET_LOCAL_ADDRESS, address);
		} catch {
			throw "Failed to save wallet data";
		}

		this.wallet = newWallet;
		this.hasKeys = true;
	};

	connect = async (): Promise<void> => {
		const addr = localStorage.getItem(WALLET_LOCAL_ADDRESS);
		if (addr) {
			try {
				const rawKey = await DB.getWallet(addr);
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
