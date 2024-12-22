<script lang="ts">
	import { ChevronLeft, Settings } from "lucide-svelte";
	import { navigate } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import FeedPost from "../lib/components/feed/FeedPost.svelte";
	import AvatarFallback from "../lib/components/ui/avatar/avatar-fallback.svelte";
	import Avatar from "../lib/components/ui/avatar/avatar.svelte";
	import Button from "../lib/components/ui/button/button.svelte";
	import CardContent from "../lib/components/ui/card/card-content.svelte";
	import CardHeader from "../lib/components/ui/card/card-header.svelte";
	import Card from "../lib/components/ui/card/card.svelte";
	import Skeleton from "../lib/components/ui/skeleton/skeleton.svelte";
	import type { Post } from "../lib/models/post.model";
	import { getDialogsState } from "../lib/state/dialogs.svelte";
	import { getWalletState } from "../lib/state/wallet.svelte";
	import { ArweaveUtils } from "../lib/utils/arweave.utils";

	const { walletId }: { walletId: string } = $props();

	const dialogsState = getDialogsState();

	let isMe = $derived(walletId === getWalletState().wallet?.address);

	$effect(() => {
		queryData();
	});

	let postIds = $state<string[]>();
	const queryData = async (): Promise<void> => {
		postIds = await ArweaveUtils.getAllPostsIdForWallet(walletId);
	};

	const fetchData = async (id: string): Promise<Post> => {
		return ArweaveUtils.getTxById<Post>(id);
	};
</script>

<div
	class="flex flex-col w-full items-center m-3 mb-0 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
>
	<div class="flex mb-3 w-full max-w-[450px] justify-between items-baseline">
		<Button
			variant="outline"
			size="icon"
			onclick={() => {
				if (history.length > 2) {
					history.back();
				} else {
					navigate("/", { replace: true });
				}
			}}><ChevronLeft /></Button
		>
		{#if isMe}
			<Button
				variant="outline"
				size="icon"
				onclick={() => (dialogsState.connectDialog = true)}
			>
				<Settings />
			</Button>
		{/if}
	</div>
	<div class="w-full max-w-[450px]">
		<Card class="w-full">
			<CardHeader class="flex items-center">
				<Avatar>
					<AvatarFallback>{walletId.slice(0, 2)}</AvatarFallback>
				</Avatar>
			</CardHeader>
			<CardContent
				class="flex justify-center items-center gap-3 flex-col"
			>
				<h1>{walletId.slice(0, 25)}...</h1>
				{#if !isMe}
					<Button
						variant="secondary"
						onclick={() => {
							toast.warning("Feature is not available yet!");
						}}>Follow</Button
					>
				{/if}
			</CardContent>
		</Card>
	</div>
	<div class="w-full flex flex-col items-center max-w-[450px]">
		{#if postIds}
			{#each postIds as id}
				{#await fetchData(id)}
					<Card class="w-full my-5">
						<CardHeader class="flex flex-row pb-3">
							<Skeleton class="w-40 h-12"></Skeleton>
						</CardHeader>
						<CardContent>
							<Skeleton class="w-full h-60"></Skeleton>
							<Skeleton class="w-40 h-6 mt-3"></Skeleton>
						</CardContent>
					</Card>
				{:then data}
					<FeedPost {data} txId={id} />
				{/await}
			{/each}
		{/if}
	</div>
</div>
