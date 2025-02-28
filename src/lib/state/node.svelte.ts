import { getContext, setContext } from "svelte";
import { STORAGE_NODE_URL, STORAGE_TOKEN } from "../constants";
import type { InboxMessage, NodeInfo } from "../models/node.model";

export class ContentNode {
	public url = $state("https://veracy.app:8080");
	public isConnected = $state(false);

	constructor() {
		const queryParams = new URLSearchParams(window.location.search);
		const urlHost = queryParams.get("host");
		this.url =
			localStorage.getItem(STORAGE_NODE_URL) || urlHost || this.url;
	}

	logout = (): void => {
		this.isConnected = false;
		return localStorage.removeItem(STORAGE_TOKEN);
	};

	getNodeInfo = async (): Promise<NodeInfo> => {
		try {
			const token = localStorage.getItem(STORAGE_TOKEN);
			const headers = token
				? { Authorization: `Bearer ${token}` }
				: undefined;
			const response = await fetch(`${this.url}/getInfo`, {
				headers,
				signal: AbortSignal.timeout(5000),
			});
			if (response.status === 200) {
				this.isConnected = true;
				return response.json() as Promise<NodeInfo>;
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
		this.isConnected = false;
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
		if (url) {
			this.url = url;
		}
		const response = await fetch(`${this.url}/loginChal`, {
			method: "POST",
			body: JSON.stringify({
				wallet: walletId,
				challange: challange,
			}),
		});
		if (response.ok) {
			localStorage.setItem(STORAGE_NODE_URL, this.url);
			const token = await response.text();
			localStorage.setItem(STORAGE_TOKEN, token);
			this.isConnected = true;
			return response;
		}
		throw response.status;
	};

	getKeyChallange = async (
		walletId: string,
		url?: string,
	): Promise<Response> => {
		this.isConnected = false;
		let getUrl = `${url || this.url}/challange?walletId=${walletId}`;
		return fetch(getUrl).then((response) => {
			if (response.ok) {
				return response;
			}
			throw response.status;
		});
	};

	getImage = async (id: string, tx: string): Promise<string> => {
		let url = `${this.url}/img?id=${id}&tx=${tx}`;
		const token = localStorage.getItem(STORAGE_TOKEN);
		const headers = token
			? { Authorization: `Bearer ${token}` }
			: undefined;
		return fetch(url, { headers }).then((response) => {
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
		const token = localStorage.getItem(STORAGE_TOKEN);
		const headers = token
			? { Authorization: `Bearer ${token}` }
			: undefined;
		return fetch(`${this.url}/upload`, {
			method: "POST",
			headers,
			body: formData,
		}).then((response) => {
			if (response.ok) {
				return response.text();
			}
			throw new Error("Failed to upload image.");
		});
	};

	sendFeedback = async (
		feedbackType: "feedback" | "report",
		content: string,
		target?: string,
	): Promise<Response> => {
		const token = localStorage.getItem(STORAGE_TOKEN);
		const headers = token
			? { Authorization: `Bearer ${token}` }
			: undefined;
		return fetch(`${this.url}/feedback`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				feedbackType,
				content,
				target,
			}),
		}).then((response) => {
			if (response.ok) {
				return response;
			}
			throw new Error("Failed to send feedback.");
		});
	};

	getMessages = async (): Promise<Array<InboxMessage>> => {
		const token = localStorage.getItem(STORAGE_TOKEN);
		const headers = token
			? { Authorization: `Bearer ${token}` }
			: undefined;
		return fetch(`${this.url}/messages`, {
			headers,
		})
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
				throw new Error("Failed to get messages.");
			})
			.then((data) => data.messages as Array<InboxMessage>);
	};

	sendMessage = async (
		recipient: string,
		message: string,
	): Promise<Response> => {
		const token = localStorage.getItem(STORAGE_TOKEN);
		const headers = {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		};
		return fetch(`${this.url}/sendMessage`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				recipient,
				message,
			}),
		}).then((response) => {
			if (response.ok) {
				return response;
			}
			throw new Error("Failed to send message.");
		});
	};

	markMessagesAsSaved = async (timestamps: string[]): Promise<Response> => {
		const token = localStorage.getItem(STORAGE_TOKEN);
		const headers = {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		};
		return fetch(`${this.url}/savedMessages`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				timestamps,
			}),
		}).then((response) => {
			if (response.ok) {
				return response;
			}
			throw new Error("Failed to mark messages as saved.");
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
