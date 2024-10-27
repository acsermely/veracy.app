import { getContext, setContext } from "svelte";
import { STORAGE_NODE_URL } from "../constants";

export class ContentNode {
  public url = $state("");
  public isConnected = $state(false);

  constructor() {
    const queryParams = new URLSearchParams(window.location.search);
    const urlHost = queryParams.get("host");
    this.url = urlHost || localStorage.getItem(STORAGE_NODE_URL) || this.url;
  }

  public connect = async (
    username: string,
    password: string,
    url?: string
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
    url?: string
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
    url?: string
  ): Promise<Response> => {
    if (url) {
      this.url = url;
    }
    const response = await fetch(`${this.url}/registerKey`, {
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
    url?: string
  ): Promise<Response> => {
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
    localStorage.setItem(STORAGE_NODE_URL, this.url);
    this.isConnected = true;
    return response;
  };

  getKeyChallange = async (
    walletId: string,
    url?: string
  ): Promise<Response> => {
    if (url) {
      this.url = url;
    }
    let getUrl = `${this.url}/challange?walletId=${walletId}`;
    return fetch(getUrl);
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
		if (!response.ok) {
			throw new Error("Failed to upload image.");
		}
		return response.text();
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
