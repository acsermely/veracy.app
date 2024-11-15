import { getContext, setContext } from "svelte";
import { ArweaveUtils } from "../utils/arweave.utils";

export class UserStorageState {
	public allUsers?: Set<string>;

	constructor() {
		ArweaveUtils.getAllUserAddresses().then(
			(addresses) => (this.allUsers = addresses),
		);
	}

	public search = (idSlice: string): string[] => {
		if (!this.allUsers || !idSlice) {
			return [];
		}
		return Array.from(this.allUsers).filter((item) =>
			item.toLocaleLowerCase().includes(idSlice.toLocaleLowerCase()),
		);
	};
}

const USER_STORAGE_STATE_KEY = "user-storage-state-key";

export function setUserStorageState(): UserStorageState {
	return setContext(USER_STORAGE_STATE_KEY, new UserStorageState());
}

export function getUserStorageState(): UserStorageState {
	return getContext<UserStorageState>(USER_STORAGE_STATE_KEY);
}
