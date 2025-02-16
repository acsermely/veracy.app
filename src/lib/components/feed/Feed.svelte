<script lang="ts">
	import { Loader } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { fade } from "svelte/transition";
	import type { Post } from "../../models/post.model";
	import { getDialogsState, getWalletState } from "../../state";
	import { getFeedState } from "../../state/feed.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import RefreshWrapper from "../common/RefreshWrapper.svelte";
	import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
	import Button from "../ui/button/button.svelte";
	import CardContent from "../ui/card/card-content.svelte";
	import CardHeader from "../ui/card/card-header.svelte";
	import Card from "../ui/card/card.svelte";
	import Skeleton from "../ui/skeleton/skeleton.svelte";
	import FeedPost from "./FeedPost.svelte";

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
	<div class="flex flex-col w-full max-w-[450px] items-center" in:fade>
		{#if !walletState.hasWallet}
			<Button
				class="w-full m-3 "
				onclick={() => (dialogState.connectDialog = true)}>Login</Button
			>
		{:else}
			<Button
				variant="outline"
				class="w-full m-3"
				onclick={() => (dialogState.feedbackDialog = true)}
				>Send Feedback</Button
			>
			<div class="flex w-full gap-4 items-start overflow-auto">
				<button
					class="flex flex-col items-center cursor-pointer"
					onclick={() => {
						feedState.setBucket(undefined);
						feedState.queryData();
					}}
				>
					<Avatar
						class={"inline-flex bg-secondary border-2 border-muted size-14" +
							(feedState.bucket === undefined
								? " border-primary border-opacity-50"
								: "")}
					>
						<AvatarFallback
							class="text-sm bg-transparent text-primary"
							>ALL</AvatarFallback
						>
					</Avatar>
					<div class="text-xs pt-1">All</div>
				</button>
				<button
					class="flex flex-col items-center cursor-pointer"
					onclick={() => {
						feedState.setBucket("");
						feedState.queryData();
					}}
				>
					<Avatar
						class={"inline-flex bg-secondary border-2 border-muted size-14" +
							(feedState.bucket === ""
								? " border-primary  border-opacity-50"
								: "")}
					>
						<AvatarFallback
							class="text-sm bg-transparent text-primary"
							>FRI</AvatarFallback
						>
					</Avatar>
					<div class="text-xs pt-1 max-w-14 break-words text-center">
						Friends
					</div>
				</button>
				{#each feedState.bucketList as bucket}
					<button
						class="flex flex-col items-center justify-center cursor-pointer"
						onclick={() => {
							feedState.setBucket(bucket.name);
							feedState.queryData();
						}}
					>
						<Avatar
							class={"inline-flex items-center justify-center size-14" +
								(feedState.bucket === bucket.name
									? " border-primary border-2"
									: "")}
						>
							<AvatarImage src={bucket.img} />
							<AvatarFallback class="bg-transparent text-primary"
								>{bucket.name.slice(0, 3)}</AvatarFallback
							>
						</Avatar>
						<div
							class="text-xs pt-1 max-w-16 break-words text-center"
						>
							{bucket.name}
						</div>
					</button>
				{/each}
				<button
					class="flex flex-col items-center justify-center cursor-pointer"
					onclick={() => {
						dialogState.bucketDialog = true;
					}}
				>
					<Avatar
						class="inline-flex items-center justify-center size-14"
					>
						<AvatarFallback class="bg-transparent text-primary"
							>+</AvatarFallback
						>
					</Avatar>
				</button>
			</div>
		{/if}
	</div>
	{#if feedState.postIds === undefined}
		<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
			<Loader class="size-8 m-5 animate-spin text-muted-foreground" />
		</div>
	{:else if feedState.postIds.length}
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
		<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
			No Posts
		</div>
	{/if}
</RefreshWrapper>
