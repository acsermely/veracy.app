<script lang="ts">
	import { ChevronLeft, Copy, RefreshCcw, Settings } from "lucide-svelte";
	import { navigate } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import type { Post } from "../../../models/post.model";
	import type { ProfileData } from "../../../models/user.model";
	import { getDialogsState } from "../../../state/dialogs.svelte";
	import { getWalletState } from "../../../state/wallet.svelte";
	import {
		ArweaveUtils,
		type ArPostIdResult,
	} from "../../../utils/arweave.utils";
	import { DB } from "../../../utils/db.utils";
	import FeedPost from "../../feed/FeedPost.svelte";
	import AvatarFallback from "../../ui/avatar/avatar-fallback.svelte";
	import AvatarImage from "../../ui/avatar/avatar-image.svelte";
	import Avatar from "../../ui/avatar/avatar.svelte";
	import Button from "../../ui/button/button.svelte";
	import CardContent from "../../ui/card/card-content.svelte";
	import CardHeader from "../../ui/card/card-header.svelte";
	import Card from "../../ui/card/card.svelte";
	import Skeleton from "../../ui/skeleton/skeleton.svelte";
	import RefreshWrapper from "../RefreshWrapper.svelte";

	const { walletId }: { walletId: string } = $props();

	const dialogsState = getDialogsState();

	let isMe = $derived(walletId === getWalletState().wallet?.address);

	let isFollowing = $state(false);

	let loadingProfile = $state(true);

	$effect(() => {
		queryData();
		checkFriends();
	});

	const checkFriends = () => {
		return DB.friend.get(walletId).then((item) => {
			if (!item) {
				isFollowing = false;
				return;
			}
			isFollowing = true;
		});
	};

	let postIds = $state<ArPostIdResult[]>();
	let balance = $state<string>();

	let userProfile = $state<ProfileData>();

	const queryData = async (): Promise<void> => {
		loadingProfile = true;
		try {
			postIds = await ArweaveUtils.getAllPostsIdForWallet(walletId);
			balance = await ArweaveUtils.getBalance(walletId);
			userProfile = await ArweaveUtils.getLatestProfile(walletId);
		} finally {
			loadingProfile = false;
		}
	};

	const fetchData = async (id: string): Promise<Post> => {
		return ArweaveUtils.getTxById<Post>(id);
	};

	async function onRefresh(): Promise<void> {
		queryData();
	}
</script>

<RefreshWrapper {onRefresh}>
	<div
		class="flex flex-col w-full items-center overflow-y-auto no-scrollbar no-scrollbar::-webkit-scrollbar"
	>
		<div
			class="flex p-3 md:px-0 w-full max-w-[450px] justify-between items-baseline"
		>
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
		<div class="w-full px-3 md:px-0 max-w-[450px]">
			<Card class="w-full">
				<CardHeader class={"flex items-center"}>
					{#if loadingProfile}
						<Skeleton class="size-14 rounded-full mb-2" />
						<Skeleton class="h-5 w-32 mb-2" />
						<Skeleton class="h-4 w-48" />
					{:else}
						{#if isMe}
							<button
								class="rounded-full cursor-pointer hover:opacity-80 transition-opacity"
								onclick={() =>
									(dialogsState.profileDialog = true)}
							>
								<Avatar
									class="inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50 size-14"
								>
									<AvatarImage src={userProfile?.img} />
									<AvatarFallback
										class="font-extrabold bg-transparent text-white"
										>{walletId.slice(0, 3)}</AvatarFallback
									>
								</Avatar>
							</button>
						{:else}
							<Avatar
								class="inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50 size-14"
							>
								<AvatarImage src={userProfile?.img} />
								<AvatarFallback
									class="font-extrabold bg-transparent text-white"
									>{walletId.slice(0, 3)}</AvatarFallback
								>
							</Avatar>
						{/if}
						{#if userProfile?.username}
							<span class="mt-2 text-lg font-medium">
								{userProfile.username}
							</span>
						{/if}
						<button
							class="flex items-center cursor-pointer"
							class:text-xs={userProfile?.username}
							onclick={() => {
								navigator.clipboard.writeText(walletId);
								toast.success("Address Copied");
							}}
							>{walletId.slice(0, 20)}... <Copy
								class="h-4"
							/></button
						>
					{/if}
				</CardHeader>
				<CardContent
					class="flex justify-center items-center gap-3 flex-col"
				>
					{#if !isMe}
						<div class="flex flex-col gap-2">
							<Button
								variant="secondary"
								onclick={() => {
									const action = isFollowing
										? DB.friend.remove(walletId)
										: DB.friend.add(walletId);
									action
										.then(checkFriends)
										.catch(() =>
											toast.warning("Failed to Follow!"),
										);
								}}>{isFollowing ? "Unfollow" : "Follow"}</Button
							>
							<Button
								variant="outline"
								onclick={() => {
									navigate(`/chat/${walletId}`);
								}}>Message</Button
							>
						</div>
					{:else}
						<div
							class=" flex border-2 rounded-full py-1 px-4 text-sm"
						>
							Balance:
							{#if balance === undefined}
								<RefreshCcw class="animate-spin h-5 ml-3" />
							{:else}
								{Number.parseFloat(balance!).toFixed(4)} AR
							{/if}
						</div>
						{#if !userProfile}
							<Button
								variant="secondary"
								size="sm"
								onclick={() =>
									(dialogsState.profileDialog = true)}
							>
								Setup Your Profile
							</Button>
						{/if}
					{/if}
				</CardContent>
			</Card>
		</div>
		<div class="w-full flex flex-col items-center max-w-[450px]">
			{#if postIds}
				{#each postIds as post}
					{#await fetchData(post.id)}
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
						<FeedPost
							{data}
							txId={post.id}
							timestamp={post.timestamp}
						/>
					{/await}
				{/each}
			{/if}
		</div>
	</div>
</RefreshWrapper>
