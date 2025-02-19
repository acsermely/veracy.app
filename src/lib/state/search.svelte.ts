import { getContext, setContext } from "svelte";
import { ArweaveUtils } from "../utils/arweave.utils";

export type SearchResult = {
	address: string;
	username?: string;
};

export class SearchState {
	public userProfiles = $state<Map<string, string>>(new Map());

	constructor() {
		Promise.all([
			ArweaveUtils.getAllUserProfiles(),
			ArweaveUtils.getAllUserAddresses(),
		]).then(([profiles, addresses]) => {
			this.userProfiles = new Map(profiles);
			// Add addresses that don't have profiles yet
			addresses.forEach((address) => {
				if (!this.userProfiles.has(address)) {
					this.userProfiles.set(address, "");
				}
			});
		});
	}

	public search = (query: string): SearchResult[] => {
		if (!this.userProfiles || !query) {
			return [];
		}

		query = query.toLowerCase();
		const results: SearchResult[] = [];

		this.userProfiles.forEach((username, address) => {
			if (
				address.toLowerCase().includes(query) ||
				username.toLowerCase().includes(query)
			) {
				results.push({
					address,
					username,
				});
			}
		});

		return results;
	};
}

const SEARCH_STATE_KEY = "search-state-key";

export function setSearchState(): SearchState {
	return setContext(SEARCH_STATE_KEY, new SearchState());
}

export function getSearchState(): SearchState {
	return getContext<SearchState>(SEARCH_STATE_KEY);
}
