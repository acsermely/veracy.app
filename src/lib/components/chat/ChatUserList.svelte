<script lang="ts">
	import { User } from "lucide-svelte";
	import { link } from "svelte-routing";
	import { getChatState } from "../../state/chat.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import AvatarFallback from "../ui/avatar/avatar-fallback.svelte";
	import AvatarImage from "../ui/avatar/avatar-image.svelte";
	import Avatar from "../ui/avatar/avatar.svelte";

	const { selectedId } = $props<{ selectedId?: string }>();
	let chatRooms = $state<
		Array<{ userId: string; username?: string; img?: string }>
	>([]);

	const chatState = getChatState();

	// Refresh chat rooms when chatState.chatRooms changes
	$effect(() => {
		if (chatState.chatRooms.length !== chatRooms.length) {
			loadChatRooms();
		}
	});

	async function loadChatRooms() {
		try {
			// Map chatState.chatRooms to the format we need
			chatRooms = chatState.chatRooms.map((userId: string) => ({
				userId,
				username: undefined,
				img: undefined,
			}));

			// Load usernames and images for each chat room
			for (const room of chatRooms) {
				const profile = await ArweaveUtils.getLatestProfile(
					room.userId,
				);
				if (profile) {
					room.username = profile.username;
					room.img = profile.img;
					chatRooms = [...chatRooms]; // Trigger reactivity
				}
			}
		} catch (error) {
			console.error("Failed to load chat rooms:", error);
			chatRooms = [];
		}
	}
</script>

<div
	class="w-64 h-full bg-background border-r border-secondary flex flex-col shadow-lg lg:shadow-none"
>
	<div class="p-4 border-b border-secondary">
		<h2 class="text-lg font-semibold">Messages</h2>
	</div>
	<div class="flex-1 overflow-y-auto">
		{#if chatRooms.length === 0}
			<div class="p-4 text-center text-secondary">No chat rooms yet</div>
		{:else}
			{#each chatRooms as room}
				<a
					href="/chat/{room.userId}"
					class="w-full p-4 flex items-center gap-3 hover:bg-secondary/10 transition-colors {selectedId ===
					room.userId
						? 'bg-secondary/20'
						: ''}"
					use:link
					onclick={() => chatState.markRoomAsRead(room.userId)}
				>
					<div class="relative">
						<Avatar
							class="size-10 bg-gradient-to-bl from-amber-500 via-blue-500 to-teal-500 bg-opacity-50"
						>
							<AvatarImage src={room.img} />
							<AvatarFallback
								class="font-extrabold bg-transparent text-white"
							>
								{#if room.img}
									{room.userId.slice(0, 3)}
								{:else}
									<User size={20} />
								{/if}
							</AvatarFallback>
						</Avatar>
						{#if chatState.unreadRooms.has(room.userId)}
							<div
								class="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full"
							></div>
						{/if}
					</div>
					<div class="flex-1 text-left">
						{#if room.username}
							<div class="flex flex-col">
								<span class="font-medium">{room.username}</span>
								<span class="text-xs text-muted-foreground"
									>{room.userId.slice(0, 10)}...</span
								>
							</div>
						{:else}
							<div class="font-medium">
								{room.userId.slice(0, 10)}...
							</div>
						{/if}
					</div>
				</a>
			{/each}
		{/if}
	</div>
</div>
