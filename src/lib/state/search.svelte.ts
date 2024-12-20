import { getContext, setContext } from "svelte";
import { ArweaveUtils } from "../utils/arweave.utils";

export class SearchState {
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

const SEARCH_STATE_KEY = "search-state-key";

export function setSearchState(): SearchState {
	return setContext(SEARCH_STATE_KEY, new SearchState());
}

export function getSearchState(): SearchState {
	return getContext<SearchState>(SEARCH_STATE_KEY);
}
