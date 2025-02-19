import { getContext, setContext } from "svelte";
import { STORAGE_BUCKET } from "../constants";
import { ArweaveUtils, type ArPostIdResult } from "../utils/arweave.utils";
import { DB, type DbBucketEntry } from "../utils/db.utils";

export class FeedState {
	public postIds = $state<ArPostIdResult[]>();

	public cursor = $state<string>();

	public scrollPosition = $state(0);

	public bucket = $state<string>();
	public bucketList = $state<DbBucketEntry[]>([]);

	constructor() {
		const savedBucket = localStorage.getItem(STORAGE_BUCKET);
		if (savedBucket !== null) {
			this.bucket = savedBucket;
		}
		this.refreshBucketList();
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

	refreshBucketList = (): Promise<void> => {
		return DB.bucket.getAll().then((list) => {
			this.bucketList = list;
		});
	};

	queryData = async (cursor?: string): Promise<void> => {
		this.postIds = undefined;
		this.scrollPosition = 0;

		if (this.bucket === undefined) {
			this.postIds = await this.queryDataAll(cursor);
		} else if (this.bucket === "") {
			this.postIds = await this.queryDataFriends(cursor);
		} else {
			this.postIds = await this.queryDataBuckets(cursor);
		}
		this.cursor = this.postIds[this.postIds.length - 1]?.cursor;
	};

	queryDataAll = async (cursor?: string): Promise<ArPostIdResult[]> => {
		return ArweaveUtils.getPostsIds(cursor);
	};

	queryDataFriends = async (cursor?: string): Promise<ArPostIdResult[]> => {
		const friends = await DB.friend.getAllKeys();
		if (!friends?.length) {
			this.postIds = [];
			this.cursor = undefined;
			return [];
		}
		return ArweaveUtils.getPostsIds(cursor, friends);
	};

	queryDataBuckets = async (cursor?: string): Promise<ArPostIdResult[]> => {
		const bucket = await DB.bucket.get(this.bucket!);
		if (!bucket) {
			throw "Bucket not found";
		}

		const friends = !bucket.open ? bucket.contributors : undefined;

		return ArweaveUtils.getBucketPosts(
			this.bucket!,
			cursor,
			friends,
			undefined, // TODO: undefined -> bucket.age, when age is apearing consistently
		);
	};

	moreData = async (): Promise<void> => {
		if (!this.cursor || !this.postIds) {
			return;
		}
		let newids;
		if (this.bucket === undefined) {
			newids = await this.queryDataAll(this.cursor);
		} else if (this.bucket === "") {
			newids = await this.queryDataFriends(this.cursor);
		} else {
			newids = await this.queryDataBuckets(this.cursor);
		}
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
