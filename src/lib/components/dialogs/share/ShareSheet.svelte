<script lang="ts">
	import { toast } from "svelte-sonner";
	import { SvelteSet } from "svelte/reactivity";
	import { getDialogsState } from "../../../state";
	import { Button } from "../../ui/button";
	import { Sheet } from "../../ui/sheet";
	import SheetContent from "../../ui/sheet/sheet-content.svelte";

	const dialogState = getDialogsState();

	let friends = $state(["asd", "dsa"]);
	let buckets = $state(["ASD", "DSA"]);

	let selectedFriends = $state(new SvelteSet<string>([]));
	let selectedBuckets = $state(new SvelteSet<string>([]));

	const shareUrl = $derived(
		`${location.origin}/post/${dialogState.shareSheetContent?.txId}`,
	);
</script>

<Sheet bind:open={dialogState.shareSheet}>
	<SheetContent side="bottom" class="flex flex-col items-center">
		<div class="flex flex-col w-full max-w-[450px] gap-6">
			<h1>Share:</h1>
			<!-- <h1>Buckets</h1>
			<div class="flex gap-3">
				{#each buckets as bucket}
					<Avatar
						class={"inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50 cursor-pointer relative" +
							(selectedBuckets.has(bucket)
								? " border-2 border-primary"
								: "")}
						onclick={() => {
							if (selectedBuckets.has(bucket)) {
								selectedBuckets.delete(bucket);
							} else {
								selectedBuckets.add(bucket);
							}
						}}
					>
						<AvatarFallback
							class="font-extrabold bg-transparent text-white select-none"
							>{bucket.slice(0, 3)}</AvatarFallback
						>
					</Avatar>
				{/each}
			</div>

			<h1>Friends</h1>
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
				{#if selectedBuckets.size || selectedFriends.size}
					<Button>Send</Button>
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
								return;
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
