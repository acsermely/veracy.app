<script lang="ts">
	import { ArweaveUtils } from "../data/Arweave.data";
	import type { Post } from "../model/post.model";
	import { getFeedState } from "../state/feed.svelte";
	import CardHeader from "./ui/card/card-header.svelte";
	import Card from "./ui/card/card.svelte";
	import CardContent from "./ui/card/card-content.svelte";
	import Skeleton from "./ui/skeleton/skeleton.svelte";
	import MainPost from "./MainPost.svelte";
	const feedState = getFeedState();

	$effect(() => {
		feedState.queryData();
	});

	const fetchData = async (id: string): Promise<Post> => {
		return ArweaveUtils.getTxById<Post>(id);
	};
</script>

<div class="flex-1 flex flex-col items-center w-full">
	{#each feedState.postIds as id}
		{#await fetchData(id)}
			<Card class="max-w-[500px] w-full m-5">
				<CardHeader class="flex flex-row pb-3">
					<Skeleton class="w-40 h-12"></Skeleton>
				</CardHeader>
				<CardContent>
					<Skeleton class="w-full h-60"></Skeleton>
					<Skeleton class="w-40 h-6 mt-3"></Skeleton>
				</CardContent>
			</Card>
		{:then data}
			<MainPost {data} />
		{/await}
	{/each}
</div>
