<script lang="ts">
	import { Loader } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import RefreshWrapper from "../common/RefreshWrapper.svelte";
	import FeedPost from "./FeedPost.svelte";
	import Button from "../ui/button/button.svelte";
	import CardContent from "../ui/card/card-content.svelte";
	import CardHeader from "../ui/card/card-header.svelte";
	import Card from "../ui/card/card.svelte";
	import Skeleton from "../ui/skeleton/skeleton.svelte";
	import type { Post } from "../../models/post.model";
	import { getDialogsState, getWalletState } from "../../state";
	import { getFeedState } from "../../state/feed.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";

	const feedState = getFeedState();
	const dialogState = getDialogsState();
	const walletState = getWalletState();

	let loadingMore = $state(false);

	async function fetchData(id: string): Promise<Post> {
		return ArweaveUtils.getTxById<Post>(id);
	}

	async function loadMore(): Promise<void> {
		loadingMore = true;
		try {
			await feedState.moreData();
		} catch {
			toast.error("Failed to get more. Try again!");
		} finally {
			loadingMore = false;
		}
	}
</script>

<RefreshWrapper
	onRefresh={() => {
		feedState.queryData();
	}}
	bind:scrollPosition={feedState.scrollPosition}
>
	<div id="top" class="w-0 h-0"></div>
	{#if !walletState.hasWallet}
		<Button
			class="w-full m-3 max-w-[450px]"
			onclick={() => (dialogState.connectDialog = true)}>Login</Button
		>
	{:else}
		<Button
			variant="outline"
			class="w-full m-3 max-w-[450px]"
			onclick={() => (dialogState.feedbackDialog = true)}
			>Send Feedback</Button
		>
	{/if}
	{#if feedState.postIds.length}
		{#each feedState.postIds as post}
			{#await fetchData(post.id)}
				<Card class="max-w-[450px] w-full m-5 border-none">
					<CardHeader class="flex flex-row pb-3">
						<Skeleton class="w-40 h-12"></Skeleton>
					</CardHeader>
					<CardContent class="flex flex-col items-center">
						<Skeleton class="w-full h-60 mb-5"></Skeleton>
						<Skeleton class="w-40 h-6 my-3"></Skeleton>
					</CardContent>
				</Card>
			{:then data}
				<FeedPost {data} txId={post.id} timestamp={post.timestamp} />
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
