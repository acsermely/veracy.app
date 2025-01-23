<script lang="ts">
	import { ThumbsDown, ThumbsUp } from "lucide-svelte";
	import { getContentNodeState } from "../../../state";
	import { getDialogsState } from "../../../state/dialogs.svelte";
	import { Button } from "../../ui/button";
	import { Dialog } from "../../ui/dialog";
	import DialogContent from "../../ui/dialog/dialog-content.svelte";
	import DialogDescription from "../../ui/dialog/dialog-description.svelte";
	import DialogFooter from "../../ui/dialog/dialog-footer.svelte";
	import DialogHeader from "../../ui/dialog/dialog-header.svelte";
	import DialogTitle from "../../ui/dialog/dialog-title.svelte";
	import Textarea from "../../ui/textarea/textarea.svelte";

	const dialogsState = getDialogsState();
	const nodeState = getContentNodeState();

	const maxChar = 1000;

	let rating = $state<"good" | "bad" | "meh">();
	let content = $state("");

	function send(): void {
		nodeState.sendFeedback("feedback", `${rating}\n\n${content}`);
	}
</script>

<Dialog
	bind:open={dialogsState.feedbackDialog}
	openFocus={"#buy-dialog-content"}
>
	<DialogContent id="buy-dialog-content" class="w-full max-w-[450px]">
		<DialogHeader>
			<DialogTitle>Feedback</DialogTitle>
			<DialogDescription>
				Let us know, what do you think!
			</DialogDescription>
		</DialogHeader>
		<div class="flex flex-col w-full">
			<div class="flex w-full justify-evenly">
				<Button
					variant={rating === "bad" ? "default" : "outline"}
					onclick={() => (rating = "bad")}
					size="icon"
				>
					<ThumbsDown onclick={() => (rating = "bad")} />
				</Button>
				<Button
					variant={rating === "meh" ? "default" : "outline"}
					onclick={() => (rating = "meh")}
					class="text-2xl"
					size="icon"
				>
					🤷
				</Button>
				<Button
					variant={rating === "good" ? "default" : "outline"}
					onclick={() => (rating = "good")}
					size="icon"
				>
					<ThumbsUp onclick={() => (rating = "good")} />
				</Button>
			</div>
			<div class="flex flex-col mt-5 items-end">
				<Textarea rows={10} maxlength={maxChar} bind:value={content} />
				<small class="text-muted-foreground m-1"
					>{maxChar - content.length}</small
				>
			</div>
		</div>
		<DialogFooter>
			<Button onclick={() => send()}>Send</Button>
			<Button
				onclick={() => (dialogsState.feedbackDialog = false)}
				variant="secondary">Close</Button
			>
		</DialogFooter>
	</DialogContent>
</Dialog>
