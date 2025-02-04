<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		CircleAlert,
		Ellipsis,
		Loader,
		MessageSquareWarning,
		RefreshCcw,
		Send,
		ShoppingCart,
	} from "lucide-svelte";
	import { link, navigate } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import { SvelteMap } from "svelte/reactivity";
	import { fade } from "svelte/transition";
	import type { Post } from "../../models/post.model";
	import { getDialogsState } from "../../state/dialogs.svelte";
	import { getContentNodeState } from "../../state/node.svelte";
	import { getWalletState } from "../../state/wallet.svelte";
	import { getWatcherState } from "../../state/watcher.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import {
		createSHA256Hash,
		hasPrivateContent,
	} from "../../utils/common.utils";
	import { DB } from "../../utils/db.utils";
	import AvatarFallback from "../ui/avatar/avatar-fallback.svelte";
	import Avatar from "../ui/avatar/avatar.svelte";
	import Button from "../ui/button/button.svelte";
	import CardContent from "../ui/card/card-content.svelte";
	import CardDescription from "../ui/card/card-description.svelte";
	import CardFooter from "../ui/card/card-footer.svelte";
	import CardHeader from "../ui/card/card-header.svelte";
	import Card from "../ui/card/card.svelte";
	import { Input } from "../ui/input";
	import { Popover, PopoverTrigger } from "../ui/popover";
	import PopoverContent from "../ui/popover/popover-content.svelte";
	import RepostPostDialog from "./RepostPostDialog.svelte";

	const {
		data,
		txId,
		isPreview,
		timestamp,
	}: { data: Post; txId?: string; isPreview?: boolean; timestamp?: any } =
		$props();

	const nodeState = getContentNodeState();
	const walletState = getWalletState();
	const dialogState = getDialogsState();
	const watcherState = getWatcherState();

	const isMe = $derived(data.uploader === walletState.wallet?.address);
	let buyError = $state("");
	let postActive = $state(false);
	let postPrice = $state<number>();
	let newPrice = $state<number>();
	let isWatcherActive = $state(true);
	let currentPage = $state(0);

	let openReport = $state(false);

	let hashValid = $state<boolean[]>(data.content.map(() => true));
	let dataPromises =
		$state<SvelteMap<string, Promise<string>>>(initDataPromises());

	$effect(() => {
		if (!isPreview) {
			checkValidationHashes();
		}
		if (!hasPrivateContent(data.content) || !data.id || isPreview) {
			postActive = true;
			return;
		}
		checkPrice();
		refreshWatcher();
	});

	function initDataPromises(): SvelteMap<string, Promise<string>> {
		return new SvelteMap<string, Promise<string>>(
			data.content
				.filter((item) => item.type === "IMG")
				.map((item) => {
					return [item.data, getImagePromise(item.data)];
				}),
		);
	}

	function checkPrice(): void {
		getPrice(data.id, data.uploader).then((price) => {
			if (price === undefined) {
				return;
			}
			postPrice = price;
			postActive = true;
		});
	}

	function checkValidationHashes(): void {
		for (const [i, item] of data.content.entries()) {
			if (item.type === "TEXT") {
				createSHA256Hash(item.data).then((hash) => {
					hashValid[i] = hash === item.hash;
				});
			} else if (item.type === "IMG") {
				dataPromises
					.get(item.data)
					?.then((data) => createSHA256Hash(data))
					.then((hash) => {
						hashValid[i] = hash === item.hash;
					})
					.catch(() => {
						hashValid[i] = true;
					});
			}
		}
	}

	async function getPrice(
		postId: string,
		uploader: string,
	): Promise<number | undefined> {
		const result = await ArweaveUtils.getPriceForPost(postId, uploader);
		if (result.length < 1) {
			return undefined;
		}
		const price = await ArweaveUtils.getPaymentById(result[0]).then((tx) =>
			ArweaveUtils.arweave.ar.winstonToAr(tx.quantity),
		);
		return Number.parseFloat(price);
	}

	async function getImagePromise(id: string): Promise<string> {
		if (isPreview || !txId) {
			return Promise.resolve("");
		}
		return nodeState.getImage(id, txId);
		// return Promise.reject("402");
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
		watcherState.add(txId, "payment").then(() => {
			refreshWatcher();
			toast.success("Payment Completed. Go to the Post!", {
				duration: 4000,
				action: {
					label: "Go",
					onClick: () => navigate("/post/" + txId),
				},
			});
		});
		dataPromises.set(id, getImagePromise(id));
		refreshWatcher();
	}

	async function refreshWatcher(): Promise<boolean> {
		return Promise.all([
			DB.getWatcher(txId || ""), // Payment watcher
			DB.getWatcher(data.id || ""), // Set-payment watcher
		]).then(([itemTx, itemId]) => {
			if (itemId) {
				watcherState
					.getPromise(data.id)
					.then(() => {
						checkPrice();
						refreshWatcher();
						toast.success("Post activated!", {
							duration: 4000,
							action: {
								label: "Go",
								onClick: () => navigate("/post/" + txId),
							},
						});
					})
					.catch();
			}
			isWatcherActive = !!itemTx?.id || !!itemId?.id;
			return isWatcherActive;
		});
	}

	function scrollToContent(i: number): void {
		const id = data.id + "_" + i;
		const elem = document.getElementById(id);
		elem?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	}
</script>

<Card class="max-w-[450px] w-full my-10 border-none shadow-none">
	<div class="flex w-full">
		<a
			class="flex-1 flex py-2 px-0 pl-1 cursor-pointer items-center"
			href={"/p/" + data.uploader}
			class:pointer-events-none={isPreview}
			use:link
		>
			<Avatar
				class="inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50"
			>
				<AvatarFallback class="font-extrabold bg-transparent text-white"
					>{data.uploader?.slice(0, 3)}</AvatarFallback
				>
			</Avatar>
			<CardHeader class="inline-flex p-3 py-0">
				<!-- {#if data.title} TODO PROFILE @HANDLE
					<CardTitle>{data.title}</CardTitle>
				{/if} -->
				<CardDescription
					>{data.uploader?.slice(0, 20)}...</CardDescription
				>
			</CardHeader>
		</a>
		{#if hashValid.includes(false)}
			<Popover>
				<PopoverTrigger class="mr-3 text-red-500"
					><CircleAlert /></PopoverTrigger
				>
				<PopoverContent
					class="w-fit flex flex-col gap-1 text-lg border-red-500"
					side="left"
				>
					Altered or corrupted content!
				</PopoverContent>
			</Popover>
		{:else if postPrice}
			<span
				class="flex text-muted-foreground items-center min-h-full text-sm mr-3"
				>{postPrice.toFixed(2)} AR</span
			>
		{/if}
		<Popover>
			<PopoverTrigger class="mr-2"><Ellipsis /></PopoverTrigger>
			<PopoverContent class="w-fit flex flex-col gap-3" side="left">
				<div class="text-muted-foreground text-center">
					Age: <span class="text-primary">{data.age}</span>
				</div>
				{#if txId && isMe && hasPrivateContent(data.content)}
					<Button
						variant="outline"
						size="sm"
						onclick={() => {
							dialogState
								.openSetPaymentDialog(data!.id, undefined)
								.then((success) => {
									if (success) {
										watcherState
											.add(data!.id, "set-price")
											.then(() => {
												checkPrice();
												refreshWatcher();
											});
										refreshWatcher();
									}
								});
						}}
					>
						Set New Price
					</Button>
				{/if}
			</PopoverContent>
		</Popover>
	</div>

	<CardContent class="flex p-0 relative">
		<div
			class="flex items-center absolute left-0 h-full p-1 opacity-70 z-10"
			class:hidden={currentPage === 0}
		>
			<ChevronLeft
				class="cursor-pointer h-full"
				onclick={() => scrollToContent(currentPage - 1)}
			/>
		</div>
		<div
			in:fade
			out:fade
			class="flex items-center absolute right-0 h-full p-1 opacity-70 z-10"
			class:hidden={currentPage === data.content.length - 1}
		>
			<ChevronRight
				class="cursor-pointer  h-full"
				onclick={() => scrollToContent(currentPage + 1)}
			/>
		</div>
		<div
			class="relative inline-flex w-full overflow-x-scroll overflow-y-hidden scroll-smooth snap-x snap-mandatory max-h-[70dvh]"
			style="scrollbar-color: rgba(128, 128, 128, .5) rgba(0, 0, 0, 0); scrollbar-width: none;"
			onscroll={(event: UIEvent) => {
				const target = event.target as HTMLElement;
				if (!target) {
					return;
				}
				const currentScroll = target.scrollLeft;
				const postWidth = target.scrollWidth / data.content.length;
				currentPage = Math.floor(
					(currentScroll + postWidth / 2) / postWidth,
				);
			}}
		>
			{#each data.content as content, i}
				<div
					id={data.id + "_" + i}
					class="min-w-full h-full box-content snap-start inline-flex justify-center items-center min-h-[40dvh] snap-y"
					class:border-b-2={!hashValid[i]}
					class:border-red-500={!hashValid[i]}
				>
					{#if content.type === "TEXT"}
						<pre
							class="min-w-full p-5 text-wrap break-words overflow-y-auto h-fit max-h-full snap-start"
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
							{#if (postActive || content.privacy === "PUBLIC") && hashValid[i]}
								<img
									class="h-full object-contain"
									{src}
									alt={"image_" + i}
								/>
							{:else if !hashValid[i]}
								<div
									class="flex flex-col justify-center items-center"
								>
									<span>Corrupted Content</span>
									<Button
										class="my-5"
										onclick={() =>
											(dataPromises = initDataPromises())}
									>
										<RefreshCcw class="mr-1" />
									</Button>
								</div>
							{:else if !postActive && isMe}
								<div
									class="flex flex-col justify-center items-center"
								>
									{#if isWatcherActive}
										<span>Processing Payment!</span>
										<small>
											You will be notified when it's done!
										</small>
										<Button
											class="my-5"
											onclick={() => refreshWatcher()}
										>
											<RefreshCcw class="mr-1" />
										</Button>
									{:else}
										<span>Activate your Post!</span>
										<Input
											class="my-5"
											maxlength={4}
											bind:value={newPrice}
											type="number"
											placeholder="Set Price..."
										/>
										<Button
											disabled={!newPrice}
											onclick={() => {
												dialogState
													.openSetPaymentDialog(
														data.id,
														newPrice!,
													)
													.then((success) => {
														if (success) {
															watcherState
																.add(
																	data!.id,
																	"set-price",
																)
																.then(() => {
																	checkPrice();
																	refreshWatcher();
																});
															refreshWatcher();
														}
													});
											}}
										>
											{#if newPrice}
												Send {newPrice} AR
											{:else}
												Set Price
											{/if}
										</Button>
									{/if}
								</div>
							{:else}
								<div
									class="flex flex-col justify-center items-center"
								>
									<span>Can't buy Content!</span>
									<small>Not active yet.</small>
								</div>
							{/if}
						{:catch e}
							{#if e === "402"}
								<div
									class="flex flex-col justify-center items-center"
								>
									{#if isWatcherActive}
										<span>Processing Payment!</span>
										<small>
											You will be notified when it's done!
										</small>
										<Button
											class="my-5"
											onclick={() => refreshWatcher()}
										>
											<RefreshCcw class="mr-1" />
										</Button>
									{:else}
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
											<small>Not active yet.</small>
										{/if}
										<Button
											class="my-5"
											disabled={!postActive}
											onclick={() =>
												buyPost(content.data, txId!)}
										>
											<ShoppingCart class="mr-1" />
											Buy
										</Button>
										{#if buyError}
											<span> {buyError} </span>
										{/if}
									{/if}
								</div>
							{:else}
								<div
									class="min-w-full p-5 flex flex-col gap-4 items-center justify-center"
								>
									{#if nodeState.isConnected}
										<span class="text-destructive">{e}</span
										>
										<!-- Please feel free to contact us!
										<small class="text-secondary"
											>(somehow)</small
										> -->
									{:else}
										Login to see this image!
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
	<CardFooter class="flex flex-col p-0 pb-6">
		{#if data.content.length > 1}
			<div class="p-2 flex justify-center w-full flex-wrap">
				{#each data.content as _, i}
					<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
					<span
						onclick={() => {
							scrollToContent(i);
						}}
						class="px-2 cursor-pointer"
						class:opacity-100={currentPage === i}
						class:opacity-30={currentPage !== i}
					>
						<span
							class="w-2 h-2 flex items-center text-xs font-extrabold justify-center bg-slate-500 rounded-full"
						></span>
					</span>
				{/each}
			</div>
		{/if}
		{#if !isPreview}
			<div class="flex w-full justify-between items-center">
				<div class="flex">
					<Button
						variant="ghost"
						title="Share"
						onclick={() => {
							dialogState.openShareDialog(txId);
						}}
					>
						<Send />
					</Button>
					<!-- <Button variant="ghost">
						<Save />
					</Button> -->
				</div>
				{#if timestamp}
					<small class="text-muted-foreground text-xs"
						>{new Date(timestamp).toLocaleDateString()}</small
					>
				{/if}
				<Button
					title="Report"
					variant="ghost"
					onclick={() => (openReport = true)}
				>
					<MessageSquareWarning />
				</Button>
			</div>
		{/if}
	</CardFooter>
</Card>
<RepostPostDialog bind:open={openReport} {txId} />
