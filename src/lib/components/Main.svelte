<script lang="ts">
	import { Loader } from "lucide-svelte";
	import type { Post } from "../model/post.model";
	import { getFeedState } from "../state/feed.svelte";
	import { ArweaveUtils } from "../utils/arweave.utils";
	import MainPost from "./MainPost.svelte";
	import RefreshWrapper from "./RefreshWrapper.svelte";
	import Button from "./ui/button/button.svelte";
	import CardContent from "./ui/card/card-content.svelte";
	import CardHeader from "./ui/card/card-header.svelte";
	import Card from "./ui/card/card.svelte";
	import Skeleton from "./ui/skeleton/skeleton.svelte";

	const feedState = getFeedState();

	$effect(() => {
		feedState.queryData();
	});

	let postIds = $derived(feedState.postIds.map((item) => item.id));
	let loadingMore = $state(false);

	async function fetchData(id: string): Promise<Post> {
		return ArweaveUtils.getTxById<Post>(id);
	}

	async function loadMore(): Promise<void> {
		loadingMore = true;
		await feedState.moreData();
		loadingMore = false;
	}
</script>

<RefreshWrapper
	onRefresh={() => {
		feedState.queryData();
	}}
>
	{#if postIds.length}
		{#each postIds as id}
			{#await fetchData(id)}
				<Card class="max-w-[450px] w-full m-5">
					<CardHeader class="flex flex-row pb-3">
						<Skeleton class="w-40 h-12"></Skeleton>
					</CardHeader>
					<CardContent>
						<Skeleton class="w-full h-60"></Skeleton>
						<Skeleton class="w-40 h-6 mt-3"></Skeleton>
					</CardContent>
				</Card>
			{:then data}
				<MainPost {data} txId={id} />
			{/await}
		{/each}
		<div class="my-3 w-full flex flex-col items-center">
			{#if loadingMore}
				<Loader class="animate-spin m-2" />
			{:else}
				<Button
					variant="ghost"
					class="w-full"
					disabled={!feedState.cursor}
					onclick={() => loadMore()}
					>{feedState.cursor ? "More" : "End"}</Button
				>
			{/if}
		</div>
	{:else}
		<div
			class="flex-1 flex w-full h-full items-center transition-all justify-center"
		>
			<Loader class="size-8 m-5 animate-spin" />
		</div>
	{/if}
</RefreshWrapper>
