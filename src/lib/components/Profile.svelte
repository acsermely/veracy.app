<script lang="ts">
	import { ChevronLeft, Settings } from "lucide-svelte";
	import { navigate } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import type { Post } from "../model/post.model";
	import { getDialogsState } from "../state/dialogs.svelte";
	import { getLocalWalletState } from "../state/local-wallet.svelte";
	import { ArweaveUtils } from "../utils/arweave.utils";
	import MainPost from "./MainPost.svelte";
	import AvatarFallback from "./ui/avatar/avatar-fallback.svelte";
	import Avatar from "./ui/avatar/avatar.svelte";
	import Button from "./ui/button/button.svelte";
	import CardContent from "./ui/card/card-content.svelte";
	import CardHeader from "./ui/card/card-header.svelte";
	import Card from "./ui/card/card.svelte";
	import Skeleton from "./ui/skeleton/skeleton.svelte";

	const { walletId }: { walletId: string } = $props();

	const dialogsState = getDialogsState();

	let isMe = $derived(walletId === getLocalWalletState().address);

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
	class="flex flex-col w-full max-w-[450px] items-center m-3 mb-0 overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
>
	<div class="flex mb-3 w-full justify-between items-baseline">
		<Button
			variant="outline"
			size="icon"
			onclick={() => {
				if (history.length > 2) {
					history.back();
				} else {
					navigate("/");
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
	<div class="w-full">
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
	<div class="w-full">
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
					<MainPost {data} txId={id} />
				{/await}
			{/each}
		{/if}
	</div>
</div>
