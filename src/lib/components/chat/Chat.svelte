<script lang="ts">
	import { Menu } from "lucide-svelte";
	import { getContentNodeState } from "../../state";
	import { getChatState } from "../../state/chat.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import AvatarFallback from "../ui/avatar/avatar-fallback.svelte";
	import AvatarImage from "../ui/avatar/avatar-image.svelte";
	import Avatar from "../ui/avatar/avatar.svelte";
	import { Skeleton } from "../ui/skeleton";
	import ChatRoom from "./ChatRoom.svelte";
	import ChatUserList from "./ChatUserList.svelte";

	const { id } = $props<{ id?: string }>();

	const chatState = getChatState();
	const nodeState = getContentNodeState();

	let userProfile = $state<{ username?: string; img?: string }>();
	let loadingProfile = $state(true);
	let sidebarOpen = $state(!id);
	let pollInterval: number | undefined;

	// Setup polling interval
	$effect(() => {
		// Start polling
		pollInterval = window.setInterval(() => {
			nodeState.getNodeInfo().then((data) => {
				chatState.setInboxCount(data.inboxCount || 0);
			});
		}, 5000);

		// Cleanup on destroy
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = undefined;
			}
		};
	});

	$effect(() => {
		if (id) {
			sidebarOpen = false;
			loadingProfile = true;
			ArweaveUtils.getLatestProfile(id)
				.then((profile) => {
					userProfile = profile;
				})
				.finally(() => {
					loadingProfile = false;
				});
			// Mark room as read when opened
			chatState.markRoomAsRead(id);
		} else {
			sidebarOpen = true;
		}
	});

	$effect(() => {
		if (chatState.inboxCount > 0) {
			nodeState.getMessages().then((messages) =>
				chatState.addMessagesFromInbox(messages).then(() => {
					nodeState.markMessagesAsSaved(
						messages.map((message) => message.id),
					);
				}),
			);
		}
	});
</script>

<div class="w-full h-full flex relative">
	<!-- Sidebar Toggle Button for mobile -->
	<button
		class="lg:hidden absolute top-4 left-4 z-10 p-2 rounded-lg hover:bg-secondary/10"
		onclick={() => (sidebarOpen = !sidebarOpen)}
	>
		<Menu size={24} />
	</button>

	<!-- Overlay for mobile when sidebar is open -->
	{#if sidebarOpen}
		<div
			class="lg:hidden fixed inset-0 bg-black/20 z-20"
			onclick={() => (sidebarOpen = false)}
			role="button"
		></div>
	{/if}

	<!-- Sidebar -->
	<div
		class="absolute lg:relative z-30 h-full transition-transform duration-300 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full lg:translate-x-0'}"
	>
		<ChatUserList selectedId={id} />
	</div>

	<!-- Chat Area -->
	{#if id}
		<div class="flex-1 flex flex-col p-4 gap-4 overflow-hidden lg:pl-4">
			<div class="flex items-center ml-12 lg:mt-0">
				{#if loadingProfile}
					<Skeleton class="size-10 rounded-full" />
					<div class="flex flex-col gap-1 ml-3">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-3 w-32" />
					</div>
				{:else}
					<Avatar
						class="inline-flex bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50"
					>
						<AvatarImage src={userProfile?.img} />
						<AvatarFallback
							class="font-extrabold bg-transparent text-white"
							>{id.slice(0, 3)}</AvatarFallback
						>
					</Avatar>
					<div class="inline-flex p-3 py-0">
						{#if userProfile?.username}
							<div class="flex flex-col">
								<span class="text-sm font-medium"
									>{userProfile.username}</span
								>
								<div class="text-xs text-muted-foreground">
									{id.slice(0, 20)}...
								</div>
							</div>
						{:else}
							<div>{id.slice(0, 20)}...</div>
						{/if}
					</div>
				{/if}
			</div>

			<ChatRoom roomId={id} />
		</div>
	{:else}
		<div
			class="flex-1 flex items-center justify-center text-muted-foreground"
		>
			Select a user to start chatting
		</div>
	{/if}
</div>
