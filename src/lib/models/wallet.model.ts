import Arweave from "arweave";
import { generateMnemonic } from "bip39-web-crypto";
import { generateLocalKeys, generateLocalKeysFromMnemonic, getAddressFromKey, getDecryptKey, getEncryptKey } from "../utils/wallet.utils";

export class Wallet {
	public rawKey: JsonWebKey;

	public address: string;

	static async newMnemonic(): Promise<string> {
		const wordlists = (
			await import("bip39-web-crypto/src/wordlists/english.json")
		).default;
		return generateMnemonic(undefined, undefined, wordlists);
	}
	static async New(mnemonic?: string): Promise<Wallet> {
		let key: JsonWebKey;
		if (mnemonic) {
			key = await generateLocalKeysFromMnemonic(mnemonic);
		} else {
			key = await generateLocalKeys();
		}
		const address = await getAddressFromKey(key);
		return new Wallet(key, address);
	}

	constructor(key: JsonWebKey, addr: string) {
		this.rawKey = key;
		this.address = addr;
	}

	public async encrypt(data: string): Promise<ArrayBuffer> {
		const dataBuffer = Arweave.utils.stringToBuffer(data);
		const encryptKey = await getEncryptKey(this.rawKey);
		return crypto.subtle.encrypt(
			{ name: "RSA-OAEP" },
			encryptKey,
			dataBuffer,
		);
	}

	public async decrypt(data: ArrayBuffer): Promise<string> {
		const decryptKey = await getDecryptKey(this.rawKey);
		return crypto.subtle
			.decrypt({ name: "RSA-OAEP" }, decryptKey, data)
			.then((buffer) => Arweave.utils.bufferToString(buffer));
	}
}