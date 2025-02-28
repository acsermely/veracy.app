import { getContext, setContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import type { InboxMessage } from "../models/node.model";
import type { DbChatMessage } from "../utils/db.utils";
import { DB } from "../utils/db.utils";

export class ChatState {
	public messages = new SvelteMap<string, DbChatMessage[]>();
	private cursors = new SvelteMap<string, string>();
	private loading = new SvelteMap<string, boolean>();
	public inboxCount = $state(0);

	setInboxCount(count: number) {
		this.inboxCount = count;
	}

	async addMessagesFromInbox(
		newMessages: Array<InboxMessage>,
	): Promise<void> {
		try {
			// Group messages by sender
			const messagesBySender = new Map<
				string,
				Array<{ message: string; timestamp: number }>
			>();
			for (const msg of newMessages) {
				if (!messagesBySender.has(msg.sender)) {
					messagesBySender.set(msg.sender, []);
				}
				messagesBySender.get(msg.sender)!.push({
					message: msg.message,
					timestamp: new Date(msg.timestamp).getTime(),
				});
			}

			// Store messages in DB.chat for each sender's chat room
			for (const [sender, senderMessages] of messagesBySender) {
				for (const msg of senderMessages) {
					// Add message to the sender's chat room, with sender as fromId
					await DB.chat.add(msg.message, sender, sender);
				}
				// Reload messages in the UI if we're viewing this sender's chat
				if (this.messages.has(sender)) {
					await this.loadMessages(sender);
				}
			}

			// Reset inbox count after processing
			this.setInboxCount(0);
		} catch (error) {
			console.error("Failed to process inbox messages:", error);
		}
	}

	async loadMessages(roomId: string, limit = 10): Promise<void> {
		try {
			this.loading.set(roomId, true);
			const result = await DB.chat.getRecent(roomId, limit);
			this.messages.set(roomId, result.messages);
			if (result.nextCursor) {
				this.cursors.set(roomId, result.nextCursor);
			} else {
				this.cursors.delete(roomId);
			}
		} finally {
			this.loading.set(roomId, false);
		}
	}

	async loadMore(roomId: string, limit = 10): Promise<boolean> {
		const cursor = this.cursors.get(roomId);
		if (!cursor || this.loading.get(roomId)) {
			return false;
		}

		try {
			this.loading.set(roomId, true);
			const result = await DB.chat.getRecent(roomId, limit, cursor);

			const currentMessages = this.messages.get(roomId) || [];
			this.messages.set(roomId, [...currentMessages, ...result.messages]);

			if (result.nextCursor) {
				this.cursors.set(roomId, result.nextCursor);
				return true;
			} else {
				this.cursors.delete(roomId);
				return false;
			}
		} finally {
			this.loading.set(roomId, false);
		}
	}

	hasMore(roomId: string): boolean {
		return this.cursors.has(roomId);
	}

	isLoading(roomId: string): boolean {
		return this.loading.get(roomId) || false;
	}
}

const CHAT_STATE_KEY = "chat-state-key";

export function setChatState(): ChatState {
	return setContext(CHAT_STATE_KEY, new ChatState());
}

export function getChatState(): ChatState {
	return getContext<ChatState>(CHAT_STATE_KEY);
}
