import Arweave from "arweave";
import type Transaction from "arweave/web/lib/transaction";
import { generateMnemonic } from "bip39-web-crypto";
import { ArweaveUtils } from "../utils/arweave.utils";
// @ts-ignore
import { getKeyPairFromMnemonic } from "human-crypto-keys";
export class LocalWallet {
	public privateSignKey: CryptoKey;
	public publicEncriptKey: CryptoKey;
	public privateEncriptKey: CryptoKey;

	public address: string;

	static async newMnemonic(): Promise<string> {
		const wordlists = (
			await import("bip39-web-crypto/src/wordlists/english.json")
		).default;
		return generateMnemonic(undefined, undefined, wordlists);
	}
	static async New(mnemonic?: string): Promise<LocalWallet> {
		let ret: {
			signKey: CryptoKey;
			encryptKeypair: CryptoKeyPair;
		};
		if (mnemonic) {
			ret = await generateLocalKeysFromMnemonic(mnemonic);
		} else {
			ret = await generateLocalKeys();
		}

		const address = await crypto.subtle
			.exportKey("jwk", ret.signKey)
			.then((signPrivateKey) =>
				ArweaveUtils.arweave.wallets
					.jwkToAddress(signPrivateKey as JWKInterface)
					.then((address) => address),
			);
		return new LocalWallet(
			ret.signKey,
			ret.encryptKeypair.publicKey,
			ret.encryptKeypair.privateKey,
			address,
		);
	}

	constructor(
		privateSignKey: CryptoKey,
		publicEncriptKey: CryptoKey,
		privateEncriptKey: CryptoKey,
		address: string,
	) {
		this.privateSignKey = privateSignKey;
		this.publicEncriptKey = publicEncriptKey;
		this.privateEncriptKey = privateEncriptKey;
		this.address = address;
	}

	public async encrypt(data: string): Promise<ArrayBuffer> {
		const dataBuffer = Arweave.utils.stringToBuffer(data);
		return crypto.subtle.encrypt(
			{ name: "RSA-OAEP" },
			this.publicEncriptKey,
			dataBuffer,
		);
	}

	public async decrypt(data: ArrayBuffer): Promise<string> {
		return crypto.subtle
			.decrypt({ name: "RSA-OAEP" }, this.privateEncriptKey, data)
			.then((buffer) => Arweave.utils.bufferToString(buffer));
	}

	public async dispatch(tx: Transaction): Promise<any> {
		let dispatchResult: Awaited<any> | undefined;
		if (!tx.quantity || tx.quantity === "0") {
			try {
				const data = tx.get("data", { decode: true, string: false });
				const tags = tx.tags.map((tag) => ({
					name: tag.get("name", { decode: true, string: true }),
					value: tag.get("value", { decode: true, string: true }),
				}));
				const target = tx.target;
				const bundleTx = await createDataItem(this.privateSignKey, {
					data,
					tags,
					target,
				});
				await fetch(DISPATCH_BUNDLER_URL + "/tx", {
					method: "POST",
					headers: {
						"Content-Type": "application/octet-stream",
					},
					body: bundleTx.getRaw(),
				}).then((response) => {
					if (response.status >= 200 && response.status < 300) {
						dispatchResult = { id: bundleTx.id, type: "BUNDLED" };
					}
				});
			} catch (e) {
				console.error(e);
			}
		}
		if (dispatchResult) {
			return dispatchResult;
		}
		throw "Dispatch Error";
	}
}

async function generateLocalKeysFromMnemonic(mnemonic: string): Promise<{
	signKey: CryptoKey;
	encryptKeypair: CryptoKeyPair;
}> {
	let keyPair = await getKeyPairFromMnemonic(
		mnemonic,
		{ id: "rsa", modulusLength: 4096 },
		{ privateKeyFormat: "pkcs8-der" },
	);
	const imported = await window.crypto.subtle.importKey(
		"pkcs8",
		keyPair.privateKey,
		{ name: "RSA-PSS", hash: "SHA-256" },
		true,
		["sign"],
	);
	const privSKJWK = await window.crypto.subtle.exportKey("jwk", imported);
	delete privSKJWK.key_ops;
	delete privSKJWK.alg;

	const signKey = await crypto.subtle.importKey(
		"jwk",
		privSKJWK,
		{
			name: "RSA-PSS",
			hash: { name: "SHA-256" },
		},
		true,
		["sign"],
	);

	const publicKeyJWK = await crypto.subtle.exportKey("jwk", signKey);
	const privateKeyJWK = await crypto.subtle.exportKey("jwk", signKey);

	const rsaOaepPublicKeyJWK = {
		kty: publicKeyJWK.kty,
		n: publicKeyJWK.n,
		e: publicKeyJWK.e,
		alg: "RSA-OAEP-256",
		ext: true,
		key_ops: ["encrypt"],
	} as JsonWebKey;

	const rsaOaepPublicKey = await crypto.subtle.importKey(
		"jwk",
		rsaOaepPublicKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["encrypt"],
	);

	const rsaOaepPrivateKeyJWK = {
		kty: privateKeyJWK.kty,
		n: privateKeyJWK.n,
		e: privateKeyJWK.e,
		d: privateKeyJWK.d,
		p: privateKeyJWK.p,
		q: privateKeyJWK.q,
		dp: privateKeyJWK.dp,
		dq: privateKeyJWK.dq,
		qi: privateKeyJWK.qi,
		alg: "RSA-OAEP-256",
		ext: true,
		key_ops: ["decrypt"],
	};

	const rsaOaepPrivateKey = await crypto.subtle.importKey(
		"jwk",
		rsaOaepPrivateKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["decrypt"],
	);

	return {
		signKey,
		encryptKeypair: {
			privateKey: rsaOaepPrivateKey,
			publicKey: rsaOaepPublicKey,
		},
	};
}

async function generateLocalKeys(): Promise<{
	signKey: CryptoKey;
	encryptKeypair: CryptoKeyPair;
}> {
	const signKeyair = await crypto.subtle.generateKey(
		{
			name: "RSA-PSS",
			modulusLength: 4096,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: "SHA-256" },
		},
		true,
		["sign", "verify"],
	);
	const publicKeyJWK = await crypto.subtle.exportKey(
		"jwk",
		signKeyair.publicKey,
	);
	const privateKeyJWK = await crypto.subtle.exportKey(
		"jwk",
		signKeyair.privateKey,
	);

	const rsaOaepPublicKeyJWK = {
		kty: publicKeyJWK.kty,
		n: publicKeyJWK.n,
		e: publicKeyJWK.e,
		alg: "RSA-OAEP-256",
		ext: true,
		key_ops: ["encrypt"],
	} as JsonWebKey;

	const rsaOaepPublicKey = await crypto.subtle.importKey(
		"jwk",
		rsaOaepPublicKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["encrypt"],
	);

	const rsaOaepPrivateKeyJWK = {
		kty: privateKeyJWK.kty,
		n: privateKeyJWK.n,
		e: privateKeyJWK.e,
		d: privateKeyJWK.d,
		p: privateKeyJWK.p,
		q: privateKeyJWK.q,
		dp: privateKeyJWK.dp,
		dq: privateKeyJWK.dq,
		qi: privateKeyJWK.qi,
		alg: "RSA-OAEP-256",
		ext: true,
		key_ops: ["decrypt"],
	};

	const rsaOaepPrivateKey = await crypto.subtle.importKey(
		"jwk",
		rsaOaepPrivateKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["decrypt"],
	);

	return {
		signKey: signKeyair.privateKey,
		encryptKeypair: {
			privateKey: rsaOaepPrivateKey,
			publicKey: rsaOaepPublicKey,
		},
	};
}

/**
 * This code originates from the ArweaveWebWallet project
 * @link https://github.com/jfbeats/ArweaveWebWallet/blob/master/src/providers/Arweave.ts
 * @param item ArDataItemParams
 * @returns
 */
async function createDataItem(
	privateKey: CryptoKey,
	item: {
		data: Uint8Array | string;
		tags?: { name: string; value: string; key?: string }[];
		target?: string;
	},
) {
	const { createData, signers } = await import("$scripts/arbundles");
	const { data, tags, target } = item;
	const sk = (await crypto.subtle.exportKey(
		"jwk",
		privateKey,
	)) as JWKInterface;
	const signer = new signers.ArweaveSigner(sk);
	const anchor = Arweave.utils
		.bufferTob64(crypto.getRandomValues(new Uint8Array(32)))
		.slice(0, 32);
	const dataItem = createData(data, signer, { tags, target, anchor });
	await dataItem.sign(signer);
	return dataItem;
}

const DISPATCH_BUNDLER_URL = "https://node2.bundlr.network";

interface JWKPublicInterface {
	kty: string;
	e: string;
	n: string;
}

interface JWKInterface extends JWKPublicInterface {
	d?: string;
	p?: string;
	q?: string;
	dp?: string;
	dq?: string;
	qi?: string;
}
