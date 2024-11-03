import { getContext, setContext } from "svelte";
import { STORAGE_NODE_URL } from "../constants";

export class ContentNode {
	public url = $state("https://veracy.app:8080");
	public isConnected = $state(false);

	constructor() {
		const queryParams = new URLSearchParams(window.location.search);
		const urlHost = queryParams.get("host");
		this.url =
			urlHost || localStorage.getItem(STORAGE_NODE_URL) || this.url;
	}

	loginCheck = async (url?: string): Promise<Response> => {
		url = url || this.url;
		if (!url) {
			throw new Error("No URL");
		}
		try {
			const response = await fetch(`${url}/loginCheck`, {
				credentials: "include",
				signal: AbortSignal.timeout(5000),
			});
			if (response.status === 200) {
				this.isConnected = true;
				return response;
			}
			throw response.statusText;
		} catch (e) {
			this.isConnected = false;
			throw e;
		}
	};

	/**
	 * Register with no username or password
	 * @param walletId Arweave wallet Id
	 * @param publicJWK Arweave wallet public key in JWK format - getPublicKeyJWK() helper function
	 * @param url
	 * @returns
	 */
	registerKey = async (
		walletId: string,
		publicJWK: JsonWebKey,
		url?: string,
	): Promise<Response> => {
		const response = await fetch(`${url || this.url}/registerKey`, {
			method: "POST",
			body: JSON.stringify({
				wallet: walletId,
				key: JSON.stringify(publicJWK),
			}),
		});
		return response;
	};

	loginKeyChallange = async (
		walletId: string,
		challange: string,
		url?: string,
	): Promise<Response> => {
		this.isConnected = false;
		if (url) {
			this.url = url;
		}
		const response = await fetch(`${this.url}/loginChal`, {
			method: "POST",
			credentials: "include",
			body: JSON.stringify({
				wallet: walletId,
				challange: challange,
			}),
		});
		if (response.ok) {
			localStorage.setItem(STORAGE_NODE_URL, this.url);
			this.isConnected = true;
		}
		return response;
	};

	getKeyChallange = async (
		walletId: string,
		url?: string,
	): Promise<Response> => {
		let getUrl = `${url || this.url}/challange?walletId=${walletId}`;
		return fetch(getUrl);
	};

	getImage = async (id: string, tx: string): Promise<string> => {
		let url = `${this.url}/img?id=${id}&tx=${tx}`;
		return fetch(url, { credentials: "include" }).then((response) => {
			if (response.ok) {
				return response.text();
			} else if (response.status == 402) {
				throw response.status.toString();
			}
			throw new Error(response.statusText);
		});
	};

	uploadImage = async (
		id: string,
		walletId: string,
		imageDataURL: string,
	): Promise<string> => {
		const formData = new FormData();
		formData.append("id", id);
		formData.append("walletId", walletId);
		formData.append("image", imageDataURL);

		return fetch(`${this.url}/upload`, {
			method: "POST",
			credentials: "include",
			body: formData,
		}).then((response) => {
			if (response.ok) {
				return response.text();
			}
			throw new Error("Failed to upload image.");
		});
	};
}

const NODE_STATE_KEY = "node-state-key";

export function setContentNodeState(): ContentNode {
	return setContext(NODE_STATE_KEY, new ContentNode());
}

export function getContentNodeState(): ContentNode {
	return getContext<ContentNode>(NODE_STATE_KEY);
}
