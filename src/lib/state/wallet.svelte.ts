import Arweave from "arweave";
import { ArweaveWebWallet, type State } from "arweave-wallet-connector";
import { getContext, setContext } from "svelte";

export class WalletState {
	isConnected = $state<boolean>(false);
	address = $state<string>("");

	wallet = $state<any>();

	state = $state<Partial<State>>({
		url: "arweave.app",
	});

	needRegistraion = $state(false);

	constructor() {
		this.address = localStorage.getItem(PREV_WALLET_ADDRESS) || "";
	}

	connectWeb = async (): Promise<void> => {
		return new Promise((resolve, reject) => {
			const wallet = new ArweaveWebWallet(
				{
					name: "Veracy",
				},
				{
					state: this.state,
				},
			);
			wallet.on("connect", () => {
				console.log("connect");
				this.wallet = wallet;
				this.address = this.wallet.address;
				this.isConnected = true;
				localStorage.setItem(PREV_WALLET_ADDRESS, this.address);
				resolve();
			});
			wallet.on("disconnect", () => {
				console.log("disconnect");
				this.isConnected = false;
				reject();
			});
			wallet.connect([
				"DISPATCH",
				"ACCESS_ADDRESS",
				"ACCESS_PUBLIC_KEY",
				"ENCRYPT",
				"DECRYPT",
				"SIGN_TRANSACTION",
			]);
		});
	};

	getPublicKey = async (): Promise<JsonWebKey> => {
		const key = await this.wallet.getPublicKey();

		const publicJWK: JsonWebKey = {
			e: "AQAB",
			alg: "RSA-OAEP-256",
			ext: true,
			kty: "RSA",
			n: key,
		};
		return publicJWK;
	};

	decrypt = async (message: string): Promise<string> => {
		const buff = Arweave.utils.stringToBuffer(message);
		const decryptedBuff = await this.wallet.decrypt(new Uint8Array(buff), {
			name: "RSA-OAEP",
		});
		const decoder = new TextDecoder();
		return decoder.decode(decryptedBuff);
	};
}

const WALLET_STATE_KEY = "wallet-state-key";
const PREV_WALLET_ADDRESS = "previous-wallet-address";

export function setWalletState(): WalletState {
	return setContext(WALLET_STATE_KEY, new WalletState());
}

export function getWalletState(): WalletState {
	return getContext<WalletState>(WALLET_STATE_KEY);
}
