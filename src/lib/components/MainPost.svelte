<script lang="ts">
	import { Ellipsis, Loader, ShoppingCart } from "lucide-svelte";
	import { link } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import { SvelteMap } from "svelte/reactivity";
	import { fade } from "svelte/transition";
	import type { Post } from "../model/post.model";
	import { getDialogsState } from "../state/dialogs.svelte";
	import { getLocalWalletState } from "../state/local-wallet.svelte";
	import { getContentNodeState } from "../state/node.svelte";
	import { ArweaveUtils, type ArPaymentResult } from "../utils/arweave.utils";
	import { hasPrivateContent } from "../utils/common.utils";
	import AvatarFallback from "./ui/avatar/avatar-fallback.svelte";
	import Avatar from "./ui/avatar/avatar.svelte";
	import Button from "./ui/button/button.svelte";
	import CardContent from "./ui/card/card-content.svelte";
	import CardDescription from "./ui/card/card-description.svelte";
	import CardFooter from "./ui/card/card-footer.svelte";
	import CardHeader from "./ui/card/card-header.svelte";
	import CardTitle from "./ui/card/card-title.svelte";
	import Card from "./ui/card/card.svelte";
	import { Popover, PopoverTrigger } from "./ui/popover";
	import PopoverContent from "./ui/popover/popover-content.svelte";

	const {
		data,
		txId,
		isPreview,
	}: { data: Post; txId?: string; isPreview?: boolean } = $props();

	const nodeState = getContentNodeState();
	const walletState = getLocalWalletState();
	const dialogState = getDialogsState();

	const shareUrl = $derived(`${location.origin}/post/${txId}`);
	let buyError = $state("");
	let postActive = $state(false);
	let postPrice = $state<number>();

	$effect(() => {
		if (!hasPrivateContent(data.content) || !data.id || isPreview) {
			postActive = true;
			return;
		}
		getPrice(data.id, data.uploader).then((price) => {
			if (price === undefined) {
				return;
			}
			postPrice = price;
			postActive = true;
		});
	});

	let dataPromises = $state(
		new SvelteMap<string, Promise<string>>(
			data.content
				.filter((item) => item.type === "IMG")
				.map((item) => {
					return [item.data, getImagePromise(item.data)];
				}),
		),
	);

	async function getPrice(
		postId: string,
		uploader: string,
	): Promise<number | undefined> {
		const result = await ArweaveUtils.getPriceForPost(postId, uploader);
		if (result.length < 1) {
			return undefined;
		}
		const priceData = await ArweaveUtils.getTxById<ArPaymentResult>(
			result[0],
		);
		return priceData.price;
	}

	async function getImagePromise(id: string): Promise<string> {
		if (isPreview || !txId) {
			return Promise.resolve("");
		}
		return nodeState.getImage(id, txId);
	}

	async function buyPost(id: string, txId?: string): Promise<void> {
		if (!walletState.wallet) {
			toast.error("No Wallet!");
			return;
		}
		if (!txId) {
			toast.error("Can't buy without Transaction ID!");
			return;
		}
		if (!postPrice) {
			toast.error("Can't buy without Price!");
			return;
		}
		await dialogState.openBuyDialog(txId, postPrice);
		dataPromises.set(id, getImagePromise(id));
	}
</script>

<Card class="max-w-[450px] w-full my-10 border-none shadow-none">
	<div transition:fade class="flex w-full">
		<a
			class="flex-1 flex p-3 pb-2 pr-0 cursor-pointer items-center"
			href={"/p/" + data.uploader}
			class:pointer-events-none={isPreview}
			use:link
		>
			<Avatar
				class="inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50"
			>
				<AvatarFallback class="font-extrabold bg-transparent text-white"
					>{data.uploader.slice(0, 2)}</AvatarFallback
				>
			</Avatar>
			<CardHeader class="inline-flex p-3 py-0">
				{#if data.title}
					<CardTitle>{data.title}</CardTitle>
				{/if}
				<CardDescription
					>{data.uploader.slice(0, 25)}...</CardDescription
				>
			</CardHeader>
		</a>
		{#if data.tags?.length || txId}
			<Popover>
				<PopoverTrigger class="mr-2"><Ellipsis /></PopoverTrigger>
				<PopoverContent class="w-fit" side="left">
					{#if txId}
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								navigator.clipboard.writeText(shareUrl);
								toast.success("Link Copied");
							}}>Share</Button
						> <br />
					{/if}
					{#if data.tags?.length}
						<small>Tags:</small>
						{#each data.tags as tag}
							<br /><small class="m-2">{tag}</small>
						{/each}
					{/if}
				</PopoverContent>
			</Popover>
		{/if}
	</div>

	<CardContent class="p-0 border-2">
		<div
			class="inline-flex w-full overflow-x-scroll overflow-y-hidden scroll-smooth snap-x snap-mandatory max-h-[65dvh]"
			style="scrollbar-color: rgba(128, 128, 128, .5) rgba(0, 0, 0, 0); scrollbar-width: thin;"
		>
			{#each data.content as content, i}
				<div
					id={data.id + "_" + i}
					class="min-w-full box-content snap-start inline-flex justify-center min-h-[30dvh]"
				>
					{#if content.type === "TEXT"}
						<pre
							class="min-w-full p-5 text-wrap break-words"
							class:text-left={content.align === "left"}
							class:text-center={content.align === "center"}
							class:text-right={content.align ===
								"right"}>{content.data.trim()}</pre>
					{:else if isPreview}
						<img
							class="h-full object-contain"
							src={content.data}
							alt={"image_" + i}
						/>
					{:else}
						{#await dataPromises.get(content.data)}
							<div
								class="flex-1 flex w-full h-full items-center justify-center"
							>
								<Loader
									class="size-10 animate-spin text-secondary"
								/>
							</div>
						{:then src}
							<img
								class="h-full object-contain"
								{src}
								alt={"image_" + i}
							/>
						{:catch e}
							{#if e === "402"}
								<div
									class="flex flex-col justify-center items-center"
								>
									{#if postActive}
										<span class="mb-2 font-bold"
											>Private Content</span
										>
										<span>
											<small class="text-primary"
												>Price:
												{postPrice} AR
											</small>
										</span>
									{:else}
										<span>Can't buy Content!</span>
										<small>Error: Not activated yet.</small>
									{/if}
									<Button
										class="my-5"
										disabled={!postActive}
										onclick={() =>
											buyPost(content.data, txId)}
									>
										<ShoppingCart class="mr-1" />
										Fake Buy
									</Button>
									{#if buyError}
										<span> {buyError} </span>
									{/if}
								</div>
							{:else}
								<div
									class="min-w-full p-5 flex flex-col gap-4 items-center justify-center"
								>
									{#if nodeState.isConnected}
										<span class="text-destructive">{e}</span
										>
										Please feel free to contact us!
										<small class="text-secondary"
											>(somehow)</small
										>
									{:else}
										Login to see images!
										<Button
											onclick={() =>
												(dialogState.connectDialog = true)}
											>Login</Button
										>
									{/if}
								</div>
							{/if}
						{/await}
					{/if}
				</div>
			{/each}
		</div>
	</CardContent>
	{#if data.content.length > 1}
		<CardFooter class="p-3 flex justify-center w-full flex-wrap">
			{#each data.content as _, i}
				<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
				<span
					onclick={() => {
						const id = data.id + "_" + i;
						const elem = document.getElementById(id);
						elem?.scrollIntoView({
							behavior: "smooth",
							block: "center",
						});
					}}
					class="px-2 w-6 h-6 flex items-center text-xs font-extrabold justify-center hover:bg-slate-500 opacity-50 rounded-full cursor-pointer mx-2"
				>
					{i + 1}
				</span>
			{/each}
		</CardFooter>
	{/if}
</Card>
