<script lang="ts">
	import { toast } from "svelte-sonner";
	import { getContentNodeState } from "../../state";
	import { Button } from "../ui/button";
	import { Dialog } from "../ui/dialog";
	import DialogContent from "../ui/dialog/dialog-content.svelte";
	import DialogDescription from "../ui/dialog/dialog-description.svelte";
	import DialogFooter from "../ui/dialog/dialog-footer.svelte";
	import DialogHeader from "../ui/dialog/dialog-header.svelte";
	import DialogTitle from "../ui/dialog/dialog-title.svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "../ui/select";
	import { Textarea } from "../ui/textarea";

	let { open = $bindable(), txId }: { open: boolean; txId?: string } =
		$props();

	const nodeState = getContentNodeState();

	const maxChar = 1000;

	let category = $state("");
	let content = $state("");

	function send(): void {
		nodeState
			.sendFeedback("report", content, txId)
			.then(() => {
				toast.success("Reported!");
				category = "";
				content = "";
				open = false;
			})
			.catch(() => toast.error("Report failed!"));
	}
</script>

<Dialog bind:open>
	<DialogContent id="buy-dialog-content" class="w-full max-w-[450px]">
		<DialogHeader>
			<DialogTitle>Report</DialogTitle>
			<DialogDescription>What's wrong with this post?</DialogDescription>
		</DialogHeader>
		<div class="flex flex-col w-full">
			<div class="flex w-full">
				<Select
					type="single"
					value={category}
					onValueChange={(v) => {
						if (!v) {
							return;
						}
						category = v;
					}}
				>
					<SelectTrigger
						class="m-x-2 w-fit gap-3 focus:ring-transparent"
					>
						{category === "" ? "Select a Category" : category}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">-</SelectItem>
						<SelectItem value="Illegal">Illegal</SelectItem>
						<SelectItem value="Age">Wrong age rating</SelectItem>
						<SelectItem value="Scam">Scam</SelectItem>
						<SelectItem value="Privacy"
							>Privacy Violation</SelectItem
						>
						<SelectItem value="Misinformation"
							>Misinformation</SelectItem
						>
						<SelectItem value="Other">Other</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div class="flex flex-col mt-5 items-end">
				<Textarea
					placeholder="More details..."
					rows={10}
					maxlength={maxChar}
					bind:value={content}
				/>
				<small class="text-muted-foreground m-1"
					>{maxChar - content.length}</small
				>
			</div>
		</div>
		<DialogFooter class="gap-3">
			<Button onclick={() => send()} disabled={!txId}>
				{txId ? "Send" : "Missing PostId"}
			</Button>
			<Button onclick={() => (open = false)} variant="secondary"
				>Close</Button
			>
		</DialogFooter>
	</DialogContent>
</Dialog>
