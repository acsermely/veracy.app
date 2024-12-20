// import { generateMnemonic } from "bip39-web-crypto";
// // @ts-ignore
// import { getKeyPairFromMnemonic } from "human-crypto-keys";

// export class WalletNew {
// 	static async newMnemonic(): Promise<string> {
// 		const wordlists = (
// 			await import("bip39-web-crypto/src/wordlists/english.json")
// 		).default;
// 		return generateMnemonic(undefined, undefined, wordlists);
// 	}
// 	static async newWallet(mnemonic: string): Promise<JsonWebKey> {
// 		let keyPair = await getKeyPairFromMnemonic(
// 			mnemonic,
// 			{ id: "rsa", modulusLength: 4096 },
// 			{ privateKeyFormat: "pkcs8-der" },
// 		);
// 		const imported = await window.crypto.subtle.importKey(
// 			"pkcs8",
// 			keyPair.privateKey,
// 			{ name: "RSA-PSS", hash: "SHA-256" },
// 			true,
// 			["sign"],
// 		);
// 		const jwk = await window.crypto.subtle.exportKey("jwk", imported);
// 		delete jwk.key_ops;
// 		delete jwk.alg;
// 		return jwk;
// 	}
// }
