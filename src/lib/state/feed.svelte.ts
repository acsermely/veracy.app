import { getContext, setContext } from "svelte";
import { ArweaveUtils, type ArPostIdResult } from "../utils/arweave.utils";

export class FeedState {
	public postIds = $state<ArPostIdResult[]>([]);

	public cursor = $state<string>();

	queryData = async (): Promise<void> => {
		this.postIds = [];
		this.postIds = await ArweaveUtils.getPostsIds();
		this.cursor = this.postIds[this.postIds.length - 1].cursor;
	};

	moreData = async (): Promise<void> => {
		if (!this.cursor) {
			return;
		}
		const newids = await ArweaveUtils.getPostsIds(this.cursor);
		if (newids.length < 1) {
			this.cursor = "";
			return;
		}
		this.postIds = [...this.postIds, ...newids];
		this.cursor = this.postIds[this.postIds.length - 1].cursor;
	};
}

const FEED_STATE_KEY = "feed-state-key";

export function setFeedState(): FeedState {
	return setContext(FEED_STATE_KEY, new FeedState());
}

export function getFeedState(): FeedState {
	return getContext<FeedState>(FEED_STATE_KEY);
}
