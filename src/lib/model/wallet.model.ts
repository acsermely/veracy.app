import Arweave from "arweave";
import type Transaction from "arweave/web/lib/transaction";
import { ArweaveUtils } from "../utils/arweave.utils";

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

async function generateLocalKeys(): Promise<{
	signKeyair: CryptoKeyPair;
	encryptKeypair: CryptoKeyPair;
	address: string;
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

	const signPrivateKey = (await crypto.subtle.exportKey(
		"jwk",
		signKeyair.privateKey,
	)) as JWKInterface;

	const address =
		await ArweaveUtils.arweave.wallets.jwkToAddress(signPrivateKey);

	return {
		signKeyair,
		encryptKeypair: {
			privateKey: rsaOaepPrivateKey,
			publicKey: rsaOaepPublicKey,
		},
		address,
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
