import type Transaction from "arweave/web/lib/transaction";
import {
	decrypt,
	dispatch,
	encrypt,
	generateLocalKeys,
} from "../utils/wallet.utils";

export class LocalWallet {
	public publicSignKey: CryptoKey;
	public privateSignKey: CryptoKey;
	public publicEncriptKey: CryptoKey;
	public privateEncriptKey: CryptoKey;

	public address: string;

	static async New(): Promise<LocalWallet> {
		const { signKeyair, encryptKeypair, address } =
			await generateLocalKeys();
		return new LocalWallet(
			signKeyair.publicKey,
			signKeyair.privateKey,
			encryptKeypair.publicKey,
			encryptKeypair.privateKey,
			address,
		);
	}

	constructor(
		publicSignKey: CryptoKey,
		privateSignKey: CryptoKey,
		publicEncriptKey: CryptoKey,
		privateEncriptKey: CryptoKey,
		address: string,
	) {
		this.publicSignKey = publicSignKey;
		this.privateSignKey = privateSignKey;
		this.publicEncriptKey = publicEncriptKey;
		this.privateEncriptKey = privateEncriptKey;
		this.address = address;
	}

	public async encrypt(data: string): Promise<ArrayBuffer> {
		return encrypt(this.publicEncriptKey, data);
	}

	public async decrypt(data: ArrayBuffer): Promise<string> {
		return decrypt(this.privateEncriptKey, data);
	}

	public async dispatch(tx: Transaction): Promise<any> {
		return dispatch(this.privateSignKey, tx);
	}
}
