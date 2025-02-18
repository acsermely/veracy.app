<script lang="ts">
	import { Loader, Trash } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { fade, scale } from "svelte/transition";
	import { getFeedState, getWalletState } from "../../../state";
	import { getDialogsState } from "../../../state/dialogs.svelte";
	import { ArweaveUtils } from "../../../utils/arweave.utils";
	import { debounce, runDelayed } from "../../../utils/common.utils";
	import { DB, type DbBucketEntry } from "../../../utils/db.utils";
	import { compressImageInput } from "../../../utils/image.utils";
	import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
	import { Button } from "../../ui/button";
	import { Dialog } from "../../ui/dialog";
	import DialogContent from "../../ui/dialog/dialog-content.svelte";
	import DialogDescription from "../../ui/dialog/dialog-description.svelte";
	import DialogHeader from "../../ui/dialog/dialog-header.svelte";
	import DialogTitle from "../../ui/dialog/dialog-title.svelte";
	import Input from "../../ui/input/input.svelte";
	import { Label } from "../../ui/label";
	import { Switch } from "../../ui/switch";

	const dialogsState = getDialogsState();
	const walletState = getWalletState();
	const feedState = getFeedState();

	const searchBucket = debounce((name) => {
		if (!name) {
			searching = false;
			return;
		}
		bucketFound = undefined;
		ArweaveUtils.getBucketId(name)
			.then((id) => ArweaveUtils.getTxById<DbBucketEntry>(id))
			.then((data) => {
				bucketFound = data;
			})
			.finally(() => (searching = false));
	}, 500);

	let search = $state("");
	let searching = $state(false);
	let bucketFound = $state<DbBucketEntry>();
	let newBucket = $state<DbBucketEntry>({
		contributors: [],
		name: "",
		open: true,
	});
	let bucketAlreadyExists = $state(false);
	let checkingBucket = $state(false);
	const checkBucketAlreadyExists = debounce((name) => {
		if (!name) {
			return;
		}
		ArweaveUtils.getBucketId(name)
			.then((id) => {
				if (id) {
					bucketAlreadyExists = true;
				}
			})
			.finally(() => (checkingBucket = false));
	}, 500);
	let uploading = $state(false);

	let view = $state<"create" | "finish" | "recent" | undefined>();
	let loadingRecent = $state(false);
	let recentBucketsData = $state<DbBucketEntry[]>([]);

	$effect(() => {
		if (!search) {
			return;
		}
		searching = true;
		searchBucket(search);
	});

	$effect(() => {
		bucketAlreadyExists = false;
		if (!newBucket.name) {
			return;
		}
		checkingBucket = true;
		checkBucketAlreadyExists(newBucket.name);
	});

	$effect(() => {
		if (
			!newBucket.open &&
			!newBucket.contributors?.length &&
			walletState.wallet?.address
		) {
			if (!newBucket.contributors) {
				newBucket.contributors = [];
			}
			newBucket.contributors.push(walletState.wallet.address);
		}
	});

	async function mediaSelected(event: Event): Promise<void> {
		const fileList: FileList | null = (event.target as HTMLInputElement)
			.files;
		if (fileList && fileList[0]) {
			try {
				newBucket.img = await compressImageInput(
					fileList[0],
					100,
					50 * 1024,
				); // 100px wide, under 50kb
			} catch {
				toast.error("Image processing failed!");
			}
		}
	}

	async function submitBucket(): Promise<void> {
		if (
			!newBucket.name ||
			newBucket.open === undefined ||
			!walletState.wallet
		) {
			return;
		}
		uploading = true;
		try {
			const bucketTx = await ArweaveUtils.newBucketTx(newBucket);
			await ArweaveUtils.dispatch(walletState.wallet, bucketTx);
			await DB.bucket.add($state.snapshot(newBucket));
			newBucket = {
				contributors: [],
				name: "",
				open: true,
			};
			feedState.refreshBucketList();
			view = undefined;
		} catch (e) {
			console.error(e);
			toast.error("Failed to Create Bucket!");
		} finally {
			uploading = false;
		}
		return;
	}

	async function loadRecentBuckets(): Promise<void> {
		loadingRecent = true;
		try {
			const bucketNames = await ArweaveUtils.getRecentBuckets();
			recentBucketsData = await Promise.all(
				bucketNames.map(async (name) => {
					try {
						const id = await ArweaveUtils.getBucketId(name);
						return await ArweaveUtils.getTxById<DbBucketEntry>(id);
					} catch (e) {
						console.error(e);
						return null;
					}
				}),
			).then((results) =>
				results.filter(
					(bucket): bucket is DbBucketEntry => bucket !== null,
				),
			);
		} catch (e) {
			console.error(e);
			toast.error("Failed to load recent buckets!");
		} finally {
			loadingRecent = false;
		}
	}
</script>

<Dialog
	bind:open={dialogsState.bucketDialog}
	onOpenChange={(open) => {
		if (!open) {
			search = "";
			newBucket = {
				contributors: [],
				name: "",
				open: true,
			};
			view = undefined;
		}
	}}
>
	<DialogContent
		id="bucket-dialog-content"
		class="transition-transform w-full max-w-[450px]"
	>
		{#if view === "create"}
			<DialogHeader>
				<DialogTitle>Create Bucket</DialogTitle>
				<DialogDescription
					>Organise your content with buckets</DialogDescription
				>
			</DialogHeader>
			<div class="flex w-full items-center">
				<div
					class="flex rounded-full border-2 min-w-16 min-h-16 justify-center items-center"
				>
					{#if !newBucket.img}
						<Label
							class="cursor-pointer w-fit text-center p-3"
							for="bucket-avatar">Img</Label
						>
						<Input
							id="bucket-avatar"
							class="hidden"
							type="file"
							accept="image/*"
							onchange={mediaSelected}
						/>
					{:else}
						<img
							class="flex rounded-full border-2 min-w-16 min-h-16 max-w-16 max-h-16 justify-center items-center object-cover"
							src={newBucket.img}
							alt="avatar"
						/>
					{/if}
				</div>
				<div class="flex flex-col w-full mx-3 relative">
					<Input
						class={bucketAlreadyExists || !newBucket.name
							? " border-destructive border-2"
							: ""}
						placeholder="* Bucket name..."
						maxlength={25}
						bind:value={newBucket.name}
					/>
					<span
						class="absolute -bottom-6 right-2 text-muted-foreground text-xs"
						class:animate-pulse={checkingBucket}
					>
						{#if bucketAlreadyExists}
							Already Exists
						{:else if checkingBucket}
							Checking...
						{/if}
					</span>
				</div>
			</div>
			<div class="flex w-full gap-4 items-baseline mx-3">
				<span>Age:</span>
				<Button
					variant={newBucket.age?.includes("12+")
						? "default"
						: "ghost"}
					onclick={() => {
						if (newBucket.age?.includes("12+")) {
							newBucket.age = newBucket.age.filter(
								(item) => item !== "12+",
							);
							return;
						}
						if (!newBucket.age) {
							newBucket.age = [];
						}
						newBucket.age.push("12+");
					}}
					size="icon">12+</Button
				>
				<Button
					variant={newBucket.age?.includes("16+")
						? "default"
						: "ghost"}
					onclick={() => {
						if (newBucket.age?.includes("16+")) {
							newBucket.age = newBucket.age.filter(
								(item) => item !== "16+",
							);
							return;
						}
						if (!newBucket.age) {
							newBucket.age = [];
						}
						newBucket.age.push("16+");
					}}
					size="icon">16+</Button
				>
				<Button
					variant={newBucket.age?.includes("18+")
						? "default"
						: "ghost"}
					onclick={() => {
						if (newBucket.age?.includes("18+")) {
							newBucket.age = newBucket.age.filter(
								(item) => item !== "18+",
							);
							return;
						}
						if (!newBucket.age) {
							newBucket.age = [];
						}
						newBucket.age.push("18+");
					}}
					size="icon">18+</Button
				>
			</div>
			<div class="mx-3 flex items-center">
				<Label for="open-bucket" class="mr-3">Public bucket:</Label>
				<Switch id="open-bucket" bind:checked={newBucket.open} />
			</div>
			{#if !newBucket.open}
				<div
					class="flex flex-col w-full gap-3 max-h-[30dvh] overflow-auto"
				>
					<span class="mx-3">Contributors:</span>
					<div class="flex flex-col w-full px-3 gap-3">
						{#if newBucket.contributors}
							{#each newBucket.contributors as _, i}
								<div class="flex items-center w-full">
									<Input
										maxlength={43}
										bind:value={newBucket.contributors[i]}
									/>
								</div>
							{/each}
						{/if}
					</div>
					<div class="mx-3 gap-3">
						<Button
							variant="outline"
							size="icon"
							onclick={(event) => {
								if (!newBucket.contributors) {
									newBucket.contributors = [];
								}
								newBucket.contributors.push("");
								runDelayed(
									() =>
										(
											event.target as Element
										).scrollIntoView(),
									10,
								);
							}}>+</Button
						>
						<Button
							variant="outline"
							size="icon"
							onclick={() => {
								if (
									newBucket.contributors &&
									newBucket.contributors.length > 1
								) {
									newBucket.contributors.pop();
								}
							}}>-</Button
						>
					</div>
				</div>
			{/if}
			<div class="flex justify-between">
				<Button
					variant="secondary"
					class="mt-3"
					onclick={() => {
						newBucket = {
							contributors: [],
							name: "",
							open: true,
						};
						view = undefined;
					}}>Back</Button
				>
				<Button
					class="mt-3"
					disabled={!newBucket.name ||
						bucketAlreadyExists ||
						checkingBucket}
					onclick={() => {
						if (newBucket.contributors) {
							newBucket.contributors =
								newBucket.contributors.filter(
									(item) => item.length === 43,
								);
						}
						view = "finish";
					}}>Create</Button
				>
			</div>
		{:else if view === "finish"}
			<DialogHeader>
				<DialogTitle>Preview</DialogTitle>
			</DialogHeader>
			<div class="flex flex-col w-full gap-1">
				<dir
					class="flex flex-col items-center w-full p-3 border-2 rounded-lg"
				>
					<Avatar
						class="inline-flex bg-secondary border-2 border-muted size-14"
					>
						<AvatarImage src={newBucket.img} />
						<AvatarFallback
							class="text-sm bg-transparent text-primary"
							>{newBucket.name.slice(0, 3)}</AvatarFallback
						>
					</Avatar>
					<div class="text-xs pt-1 max-w-14 break-words text-center">
						{newBucket.name}
					</div>
				</dir>
				{#if newBucket.age?.length}
					<div>
						Age: {newBucket.age.join(", ")}
					</div>
				{/if}
				{#if newBucket.open}
					<div>Mode: Public</div>
				{:else}
					<div>Mode: Private</div>
					<div class="text-sm">Contributors:</div>
					<div
						class="flex flex-col text-xs max-h-[30dvh] overflow-auto"
					>
						{#each newBucket.contributors || [] as contributor, i}
							<button
								class="cursor-pointer text-xs"
								onclick={() => {
									navigator.clipboard.writeText(contributor);
									toast.success("Address Copied");
								}}
								>{i + 1}: {contributor.slice(0, 20)}...</button
							>
						{/each}
					</div>
				{/if}
			</div>
			<div class=" flex justify-between">
				<Button
					variant="secondary"
					class="mt-3"
					onclick={() => (view = "create")}>Back</Button
				>
				<Button class="mt-3" onclick={submitBucket}>
					{#if uploading}
						<Loader class="animate-spin m-2" />
					{:else}
						Submit
					{/if}
				</Button>
			</div>
		{:else if view === "recent"}
			<div in:fade>
				<DialogHeader>
					<DialogTitle>Recent Buckets</DialogTitle>
					<DialogDescription>Recently used buckets</DialogDescription>
				</DialogHeader>

				<div
					class="flex flex-col gap-3 max-h-[50vh] overflow-scroll p-3"
				>
					{#if loadingRecent}
						<div class="flex justify-center items-center p-4">
							<Loader class="animate-spin" />
						</div>
					{:else if recentBucketsData.length}
						{#each recentBucketsData as bucket}
							<div class="flex w-full items-center">
								<Button
									variant="outline"
									class="h-fit flex-1 max-w-full flex justify-between items-center"
									onclick={() => {
										DB.bucket
											.add($state.snapshot(bucket))
											.then(() => {
												feedState.refreshBucketList();
												view = undefined;
											});
									}}
								>
									<div
										class="flex w-full justify-center items-center gap-3"
									>
										<Avatar
											class="inline-flex bg-secondary border-2 border-muted size-14"
										>
											<AvatarImage src={bucket.img} />
											<AvatarFallback
												class="text-sm bg-transparent text-primary"
												>{bucket.name.slice(
													0,
													3,
												)}</AvatarFallback
											>
										</Avatar>
										<div
											class="flex flex-col break-words items-start"
										>
											<div>{bucket.name}</div>
											<div class="text-xs">
												{bucket.open
													? "Public"
													: "Private"}
												{#if bucket.age?.length}
													| {bucket.age.join(", ")}
												{/if}
											</div>
										</div>
									</div>
								</Button>
							</div>
						{/each}
					{:else}
						<div
							class="flex w-full justify-center text-muted-foreground"
						>
							No Recent Buckets Found
						</div>
					{/if}
				</div>

				<Button
					variant="secondary"
					class="mt-3"
					onclick={() => (view = undefined)}
				>
					Back
				</Button>
			</div>
		{:else}
			<DialogHeader>
				<DialogTitle>Buckets</DialogTitle>
				<DialogDescription>Manage your Bucket list</DialogDescription>
			</DialogHeader>
			<div class="flex flex-col gap-3 max-h-[50vh] overflow-scroll p-3">
				<Button
					variant="outline"
					class="flex-1"
					onclick={() => {
						loadRecentBuckets();
						view = "recent";
					}}
				>
					Browse Buckets
				</Button>
				<Input
					class="mb-3"
					placeholder="Search bucket..."
					maxlength={25}
					bind:value={search}
				/>
				{#if searching}
					<div
						in:scale
						class="flex flex-col w-full rounded-lg p-2 justify-center items-center"
					>
						<span class="text-xs text-muted-foreground"
							>Searching...</span
						>
					</div>
				{:else if search !== ""}
					<div
						in:scale
						class="flex w-full border-2 rounded-lg p-2 justify-center items-center"
					>
						{#if bucketFound}
							<button
								class="flex w-full justify-center items-center gap-3"
								onclick={() => {
									if (!bucketFound) {
										return;
									}
									DB.bucket
										.add($state.snapshot(bucketFound))
										.then(() => {
											feedState.refreshBucketList();
											search = "";
										});
								}}
							>
								<Avatar
									class="inline-flex bg-secondary border-2 border-muted size-14"
								>
									<AvatarImage src={bucketFound.img} />
									<AvatarFallback
										class="text-sm bg-transparent text-primary"
										>{bucketFound.name.slice(
											0,
											3,
										)}</AvatarFallback
									>
								</Avatar>
								<div
									class="flex flex-col break-words items-start"
								>
									<div>{bucketFound.name}</div>
									<div class="text-xs">
										{bucketFound.open
											? "Public"
											: "Private"}
										{#if bucketFound.age?.length}
											| {bucketFound.age.join(", ")}
										{/if}
									</div>
								</div>
							</button>
						{:else}
							<span>No bucket</span>
						{/if}
					</div>
				{/if}
				<p class="text-xs">My Buckets:</p>
				{#if feedState.bucketList.length}
					{#each feedState.bucketList as bucket}
						<div class="flex w-full items-center">
							<Button
								variant="outline"
								class="h-fit flex-1 max-w-full flex justify-between items-center"
								onclick={() => {
									feedState.setBucket(bucket.name);
									dialogsState.bucketDialog = false;
								}}
							>
								<div class="flex items-center flex-1">
									<Avatar
										class="mr-3 inline-flex bg-secondary border-2 border-muted size-14"
									>
										<AvatarImage src={bucket.img} />
										<AvatarFallback
											class="text-sm bg-transparent text-primary"
											>{bucket.name.slice(
												0,
												3,
											)}</AvatarFallback
										>
									</Avatar>
									<div class="flex flex-col items-start">
										<span
											class="overflow-hidden text-ellipsis"
										>
											{bucket.name}
										</span>
										<span
											class="text-xs text-muted-foreground"
										>
											{bucket.open ? "Public" : "Private"}
											{#if bucket.age?.length}
												| {bucket.age.join(", ")}
											{/if}
										</span>
									</div>
								</div>
								<Button
									variant="ghost"
									class="h-full hover:bg-destructive hover:bg-opacity-50"
									onclick={(e) => {
										e.stopPropagation(); // Prevent parent button click
										DB.bucket
											.remove(bucket.name)
											.then(feedState.refreshBucketList)
											.catch((e) => {
												console.error(e);
											});
									}}
								>
									<Trash />
								</Button>
							</Button>
						</div>
					{/each}
				{:else}
					<div
						class="flex w-full justify-center text-muted-foreground"
					>
						No Saved Buckets
					</div>
				{/if}
			</div>
			<div class="flex gap-3 mt-3">
				<Button
					variant="secondary"
					class="flex-1"
					onclick={() => (view = "create")}
				>
					Create New Bucket
				</Button>
			</div>
		{/if}
	</DialogContent>
</Dialog>
