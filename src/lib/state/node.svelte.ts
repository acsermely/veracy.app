import { getContext, setContext } from "svelte";
import { STORAGE_NODE_URL } from "../constants";

export class ContentNode {
	public url = $state("");
	public isConnected = $state(false);

	constructor() {
		const queryParams = new URLSearchParams(window.location.search);
		const urlHost = queryParams.get("host");
		this.url =
			urlHost || localStorage.getItem(STORAGE_NODE_URL) || this.url;
	}

	public connect = async (
		username: string,
		password: string,
		url?: string,
	): Promise<void> => {
		if (url) {
			this.url = url;
		}
		const response = await fetch(`${this.url}/login`, {
			method: "POST",
			credentials: "include",
			body: JSON.stringify({
				username,
				password,
			}),
		});
		if (response.status !== 200) {
			throw "Couldn't connect!";
		}
		localStorage.setItem(STORAGE_NODE_URL, this.url);
		this.isConnected = true;
	};

	loginCheck = async (url?: string): Promise<Response> => {
		url = url || this.url;
		if (!url) {
			throw new Error("No URL");
		}
		const response = await fetch(`${url}/loginCheck`, {
			credentials: "include",
			signal: AbortSignal.timeout(5000),
		});
		if (response.status === 200) {
			this.isConnected = true;
		}
		return response;
	};

	register = async (
		username: string,
		password: string,
		url?: string,
	): Promise<Response> => {
		if (url) {
			this.url = url;
		}
		const response = await fetch(`${this.url}/register`, {
			method: "POST",
			body: JSON.stringify({
				username,
				password,
			}),
		});
		this.isConnected = true;
		return response;
	};

	getImage = async (id: string, tx?: string): Promise<string> => {
		let url = `${this.url}/img?id=${id}`;
		if (tx) {
			url = url + `&tx=${tx}`;
		}
		return fetch(url, { credentials: "include" })
			.then((response) => {
				if (response.ok) {
					return response;
				}
				throw new Error("Failed to fetch image.");
			})
			.then((data) => data.text());
	};
}

const NODE_STATE_KEY = "node-state-key";

export function setContentNodeState(): ContentNode {
	return setContext(NODE_STATE_KEY, new ContentNode());
}

export function getContentNodeState(): ContentNode {
	return getContext<ContentNode>(NODE_STATE_KEY);
}
