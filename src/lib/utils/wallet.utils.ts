import type { JWKInterface } from "arweave/node/lib/wallet";
import { ArweaveUtils } from "../utils/arweave.utils";
// @ts-ignore
import { getKeyPairFromMnemonic } from "human-crypto-keys";

export async function getAddressFromKey(key: JsonWebKey): Promise<string> {
	return ArweaveUtils.arweave.wallets.jwkToAddress(key as JWKInterface);
}

export async function generateLocalKeysFromMnemonic(
	mnemonic: string,
): Promise<JsonWebKey> {
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

	const signKey = await window.crypto.subtle.exportKey("jwk", imported);
	delete signKey.key_ops;
	delete signKey.alg;

	return signKey;
}

export async function getSignKey(key: JsonWebKey): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"jwk",
		key,
		{
			name: "RSA-PSS",
			hash: { name: "SHA-256" },
		},
		true,
		["sign"],
	);
}

export async function getEncryptKey(key: JsonWebKey): Promise<CryptoKey> {
	const rsaOaepPublicKeyJWK = {
		kty: key.kty,
		n: key.n,
		e: key.e,
		alg: "RSA-OAEP-256",
		ext: true,
		key_ops: ["encrypt"],
	} as JsonWebKey;

	return crypto.subtle.importKey(
		"jwk",
		rsaOaepPublicKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["encrypt"],
	);
}

export async function getDecryptKey(key: JsonWebKey): Promise<CryptoKey> {
	const rsaOaepPrivateKeyJWK = {
		kty: key.kty,
		n: key.n,
		e: key.e,
		d: key.d,
		p: key.p,
		q: key.q,
		dp: key.dp,
		dq: key.dq,
		qi: key.qi,
		alg: "RSA-OAEP-256",
		ext: true,
		key_ops: ["decrypt"],
	};

	return crypto.subtle.importKey(
		"jwk",
		rsaOaepPrivateKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["decrypt"],
	);
}

export async function generateLocalKeys(): Promise<JsonWebKey> {
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

	return crypto.subtle.exportKey("jwk", signKeyair.privateKey);
}
