<script lang="ts">
	import { toast } from "svelte-sonner";
	import {
		getDialogsState,
		getFeedState,
		getWalletState,
	} from "../../../state";
	import { ArweaveUtils } from "../../../utils/arweave.utils";
	import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
	import { Button } from "../../ui/button";
	import { Sheet } from "../../ui/sheet";
	import SheetContent from "../../ui/sheet/sheet-content.svelte";

	const dialogState = getDialogsState();
	const feedState = getFeedState();
	const walletState = getWalletState();

	let selectedBuckets = $state<string[]>([]);

	const shareUrl = $derived(
		`${location.origin}/post/${dialogState.shareSheetContent?.txId}`,
	);

	async function sendSelected(): Promise<void> {
		const postTx = dialogState.shareSheetContent?.txId;
		if (!postTx) {
			toast.error("Missing Transaction Id");
			return;
		}
		if (!walletState.wallet) {
			toast.error("No Wallet!");
			return;
		}
		for (const bucket of selectedBuckets) {
			try {
				const tx = await ArweaveUtils.newSendToBucketTx(postTx, bucket);
				await ArweaveUtils.dispatch(walletState.wallet, tx);
			} catch {
				toast.error("Failed to Send to: " + bucket);
			}
		}
		selectedBuckets = [];
		dialogState.closeShareDialog();
	}
</script>

<Sheet
	bind:open={dialogState.shareSheet}
	onOpenChange={() => {
		selectedBuckets = [];
	}}
>
	<SheetContent side="bottom" class="flex flex-col items-center">
		<div class="flex flex-col w-full max-w-[450px] gap-6">
			<h1>Buckets</h1>
			<div
				class="flex w-full gap-4 items-start overflow-auto no-scrollbar"
			>
				{#each feedState.bucketList as bucket}
					<button
						class="flex flex-col items-center justify-center cursor-pointer"
						onclick={() => {
							if (selectedBuckets.includes(bucket.name)) {
								selectedBuckets = selectedBuckets.filter(
									(item) => item !== bucket.name,
								);
							} else {
								selectedBuckets.push(bucket.name);
							}
						}}
					>
						<Avatar
							class={"inline-flex items-center justify-center size-14" +
								(selectedBuckets.includes(bucket.name)
									? " border-primary border-4"
									: "")}
						>
							<AvatarImage src={bucket.img} />
							<AvatarFallback class="bg-transparent text-white"
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
			</div>

			<!-- <h1>Friends</h1>
			<div class="flex gap-3">
				{#each friends as friend}
					<Avatar
						class={"inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50 cursor-pointer relative" +
							(selectedFriends.has(friend)
								? " border-2 border-primary"
								: "")}
						onclick={() => {
							if (selectedFriends.has(friend)) {
								selectedFriends.delete(friend);
							} else {
								selectedFriends.add(friend);
							}
						}}
					>
						<AvatarFallback
							class="font-extrabold bg-transparent text-white select-none"
							>{friend.slice(0, 3)}</AvatarFallback
						>
					</Avatar>
				{/each}
			</div> -->
			<div class="flex flex-col w-full">
				{#if selectedBuckets.length}
					<Button class="mb-10" onclick={sendSelected}>
						Send to
						{selectedBuckets.length
							? ` ${selectedBuckets.length} Bucket(s)`
							: ""}
					</Button>
				{:else}
					<Button
						class="mb-10"
						disabled={!dialogState.shareSheetContent?.txId}
						onclick={() => {
							if (navigator.share) {
								navigator.share({
									title: "Veracy",
									url: shareUrl,
								});
							} else {
								navigator.clipboard.writeText(shareUrl);
								toast.success("Link Copied");
							}
							dialogState.closeShareDialog();
						}}>{!!navigator.share ? "Share" : "Copy Link"}</Button
					>
				{/if}
			</div>
		</div>
	</SheetContent>
</Sheet>
