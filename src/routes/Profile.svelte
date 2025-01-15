<script lang="ts">
	import { ChevronLeft, Copy, RefreshCcw, Settings } from "lucide-svelte";
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
	let balance = $state<string>();
	const queryData = async (): Promise<void> => {
		postIds = await ArweaveUtils.getAllPostsIdForWallet(walletId);
		balance = await ArweaveUtils.getBalance(walletId);
	};

	const fetchData = async (id: string): Promise<Post> => {
		return ArweaveUtils.getTxById<Post>(id);
	};
</script>

<div
	class="flex flex-col w-full items-center overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
>
	<div class="flex p-3 w-full max-w-[450px] justify-between items-baseline">
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
	<div class="w-full px-3 max-w-[450px]">
		<Card class="w-full">
			<CardHeader class="flex items-center">
				<Avatar
					class="inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50"
				>
					<AvatarFallback
						class="font-extrabold bg-transparent text-white"
						>{walletId.slice(0, 3)}</AvatarFallback
					>
				</Avatar>
			</CardHeader>
			<CardContent
				class="flex justify-center items-center gap-3 flex-col"
			>
				<Button
					variant="link"
					class="flex items-center cursor-pointer"
					onclick={() => {
						navigator.clipboard.writeText(walletId);
						toast.success("Address Copied");
					}}>{walletId.slice(0, 20)}... <Copy class="h-4" /></Button
				>
				{#if !isMe}
					<Button
						variant="secondary"
						onclick={() => {
							toast.warning("Feature is not available yet!");
						}}>Follow</Button
					>
				{:else}
					<div class=" flex border-2 rounded-full py-1 px-4 text-sm">
						Balance:
						{#if balance === undefined}
							<RefreshCcw class="animate-spin h-5 ml-3" />
						{:else}
							{Number.parseFloat(balance!).toFixed(4)} AR
						{/if}
					</div>
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
