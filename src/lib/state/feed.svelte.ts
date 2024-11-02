import { getContext, setContext } from "svelte";
import { ArweaveUtils } from "../utils/arweave.utils";

export class FeedState {
	public postIds = $state<string[]>([]);

	queryData = async (): Promise<void> => {
		this.postIds = [];
		this.postIds = await ArweaveUtils.getAllPostsIds();
	};
}

const FEED_STATE_KEY = "feed-state-key";

export function setFeedState(): FeedState {
	return setContext(FEED_STATE_KEY, new FeedState());
}

export function getFeedState(): FeedState {
	return getContext<FeedState>(FEED_STATE_KEY);
}
