import { getContext, setContext } from "svelte";
import { LocalWallet } from "../models/wallet.model";

const WALLET_LOCAL_SIGN_PRIV_KEY = "WALLET_LOCAL_SIGN_PRIV_KEY";
const WALLET_LOCAL_ENCRYPT_PRIV_KEY = "WALLET_LOCAL_ENCRYPT_PRIV_KEY";
const WALLET_LOCAL_ENCRYPT_PUB_KEY = "WALLET_LOCAL_ENCRYPT_PUB_KEY";
const WALLET_LOCAL_ADDRESS = "WALLET_LOCAL_ADDRESS";

export class WalletState {
	wallet = $state<LocalWallet>();

	isConnected = $derived(this.wallet !== undefined);
	hasKeys = $state<boolean>(false);

	get address(): string {
		if (this.wallet?.address) {
			return this.wallet.address;
		}
		return localStorage.getItem(WALLET_LOCAL_ADDRESS) || "";
	}

	constructor() {
		const privSKJWK = localStorage.getItem(WALLET_LOCAL_SIGN_PRIV_KEY);
		const privEKJWK = localStorage.getItem(WALLET_LOCAL_ENCRYPT_PRIV_KEY);
		const pubEKJWK = localStorage.getItem(WALLET_LOCAL_ENCRYPT_PUB_KEY);
		const addr = localStorage.getItem(WALLET_LOCAL_ADDRESS);
		if (privSKJWK && privEKJWK && pubEKJWK && addr) {
			this.hasKeys = true;
			try {
				this.connect();
			} catch {
				console.log("Couldn't auto-connect");
			}
		}
	}

	register = async (mnemonic?: string, pin?: number[]): Promise<void> => {
		const newWallet = await LocalWallet.New(mnemonic);

		const privSKJWK = await crypto.subtle.exportKey(
			"jwk",
			newWallet.privateSignKey,
		);
		const privEKJWK = await crypto.subtle.exportKey(
			"jwk",
			newWallet.privateEncriptKey,
		);
		const pubEKJWK = await crypto.subtle.exportKey(
			"jwk",
			newWallet.publicEncriptKey,
		);

		localStorage.setItem(
			WALLET_LOCAL_SIGN_PRIV_KEY,
			JSON.stringify(privSKJWK),
		);
		localStorage.setItem(
			WALLET_LOCAL_ENCRYPT_PRIV_KEY,
			JSON.stringify(privEKJWK),
		);
		localStorage.setItem(
			WALLET_LOCAL_ENCRYPT_PUB_KEY,
			JSON.stringify(pubEKJWK),
		);
		localStorage.setItem(WALLET_LOCAL_ADDRESS, newWallet.address);

		this.wallet = newWallet;
		this.hasKeys = true;
	};

	connect = async (): Promise<void> => {
		const privSKJWK = localStorage.getItem(WALLET_LOCAL_SIGN_PRIV_KEY);
		const privEKJWK = localStorage.getItem(WALLET_LOCAL_ENCRYPT_PRIV_KEY);
		const pubEKJWK = localStorage.getItem(WALLET_LOCAL_ENCRYPT_PUB_KEY);
		const addr = localStorage.getItem(WALLET_LOCAL_ADDRESS);

		if (privSKJWK && privEKJWK && pubEKJWK && addr) {
			try {
				const privSK = await crypto.subtle.importKey(
					"jwk",
					JSON.parse(privSKJWK) as JsonWebKey,
					{
						name: "RSA-PSS",
						hash: { name: "SHA-256" },
					},
					true,
					["sign"],
				);

				const privEK = await crypto.subtle.importKey(
					"jwk",
					JSON.parse(privEKJWK) as JsonWebKey,
					{
						name: "RSA-OAEP",
						hash: { name: "SHA-256" },
					},
					true,
					["decrypt"],
				);

				const pubEK = await crypto.subtle.importKey(
					"jwk",
					JSON.parse(pubEKJWK) as JsonWebKey,
					{
						name: "RSA-OAEP",
						hash: { name: "SHA-256" },
					},
					true,
					["encrypt"],
				);

				this.wallet = new LocalWallet(privSK, pubEK, privEK, addr);
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
		return crypto.subtle.exportKey("jwk", this.wallet.publicEncriptKey);
	};
}

const WALLET_STATE_KEY = "wallet-state-key";

export function setWalletState(): WalletState {
	return setContext(WALLET_STATE_KEY, new WalletState());
}

export function getWalletState(): WalletState {
	return getContext<WalletState>(WALLET_STATE_KEY);
}
