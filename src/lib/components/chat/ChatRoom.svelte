<script lang="ts">
	import { Send } from "lucide-svelte";
	import { getChatState } from "../../state/chat.svelte";
	import type { DbChatMessage } from "../../utils/db.utils";

	const { roomId } = $props<{ roomId: string }>();

	let messageText = $state("");
	const chatState = getChatState();

	function formatTime(date: Date) {
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	async function sendMessage() {
		if (!messageText.trim()) return;

		const newMessage: DbChatMessage = {
			fromId: "me",
			message: messageText,
			timestamp: Date.now(),
		};

		// TODO: Send message to backend
		// For now, just add to local state
		const currentMessages = chatState.messages.get(roomId) || [];
		chatState.messages.set(roomId, [...currentMessages, newMessage]);
		messageText = "";
	}

	// Load initial messages
	$effect(() => {
		if (roomId) {
			chatState.loadMessages(roomId);
		}
	});
</script>

<div class="flex-1 flex flex-col gap-4 overflow-hidden">
	<div class="flex-1 overflow-y-auto">
		{#if chatState.messages.get(roomId) && chatState.messages.get(roomId)!.length > 0}
			{#each chatState.messages.get(roomId) || [] as message}
				<div
					class="mb-4 flex flex-col {message.fromId === roomId
						? ''
						: 'items-end'}"
				>
					<div
						class="max-w-[80%] p-3 rounded-lg {message.fromId ===
						roomId
							? 'bg-secondary/10 rounded-tr-lg'
							: 'bg-primary/10 rounded-tl-lg'}"
					>
						{message.message}
					</div>
					<div class="text-xs text-muted-foreground mt-1 px-3">
						{formatTime(new Date(message.timestamp))}
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex justify-center w-full h-full items-center">
				<div class="text-muted-foreground">No messages yet</div>
			</div>
		{/if}

		{#if chatState.isLoading(roomId)}
			<div class="flex justify-center">
				<div
					class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"
				></div>
			</div>
		{/if}
	</div>

	<div class="flex gap-2">
		<input
			type="text"
			placeholder="Type a message..."
			class="flex-1 px-4 py-2 rounded-lg border border-secondary focus:outline-none focus:border-primary"
			bind:value={messageText}
			onkeydown={(e) => e.key === "Enter" && sendMessage()}
		/>
		<button
			class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={!messageText.trim()}
			onclick={sendMessage}
		>
			<Send size={20} />
		</button>
	</div>
</div>
