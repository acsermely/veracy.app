import { getContext, setContext } from "svelte";
import { STORAGE_BUCKET } from "../constants";
import { ArweaveUtils, type ArPostIdResult } from "../utils/arweave.utils";
import { DB } from "../utils/db.utils";

export class FeedState {
	public postIds = $state<ArPostIdResult[]>();

	public cursor = $state<string>();

	public scrollPosition = $state(0);

	public bucket = $state<string>();

	constructor() {
		const savedBucket = localStorage.getItem(STORAGE_BUCKET);
		if (savedBucket !== null) {
			this.bucket = savedBucket;
		}
	}

	setBucket = (bucket?: string) => {
		this.bucket = bucket;
		this.queryData();
		if (bucket === undefined) {
			localStorage.removeItem(STORAGE_BUCKET);
		} else {
			localStorage.setItem(STORAGE_BUCKET, bucket);
		}
	};

	queryData = async (): Promise<void> => {
		if (this.bucket === undefined) {
			this.queryDataAll();
		} else if (this.bucket === "") {
			this.queryDataFriends();
		}
	};

	queryDataAll = async (): Promise<void> => {
		this.postIds = undefined;
		this.scrollPosition = 0;
		this.postIds = await ArweaveUtils.getPostsIds();
		this.cursor = this.postIds[this.postIds.length - 1]?.cursor;
	};

	queryDataFriends = async (): Promise<void> => {
		this.postIds = undefined;
		this.scrollPosition = 0;
		const friends = await DB.friend.getAll();
		if (!friends?.length) {
			this.postIds = [];
			this.cursor = undefined;
		}
		this.postIds = await ArweaveUtils.getPostsIds(undefined, friends);
		this.cursor = this.postIds[this.postIds.length - 1]?.cursor;
	};

	moreData = async (): Promise<void> => {
		if (!this.cursor || !this.postIds) {
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
