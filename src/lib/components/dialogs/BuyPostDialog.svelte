<script lang="ts">
	import type Transaction from "arweave/node/lib/transaction";
	import { HandCoins, Loader } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import type { Post } from "../../models/post.model";
	import { getDialogsState } from "../../state/dialogs.svelte";
	import { getWalletState } from "../../state/wallet.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import { runDelayed } from "../../utils/common.utils";
	import Button from "../ui/button/button.svelte";
	import { Dialog } from "../ui/dialog";
	import DialogContent from "../ui/dialog/dialog-content.svelte";
	import DialogDescription from "../ui/dialog/dialog-description.svelte";
	import DialogFooter from "../ui/dialog/dialog-footer.svelte";
	import DialogHeader from "../ui/dialog/dialog-header.svelte";
	import DialogTitle from "../ui/dialog/dialog-title.svelte";

	const walletState = getWalletState();
	const dialogsState = getDialogsState();

	let data = $state<Post>();
	let processing = $state(false);

	$effect(() => {
		if (dialogsState.buyDialog) {
			fetchData();
		}
	});

	async function fetchData(): Promise<void> {
		if (!dialogsState.buyDialogContent) {
			toast.error("Couldn't find content!");
			return;
		}
		data = await ArweaveUtils.getTxById<Post>(
			dialogsState.buyDialogContent.id,
		);
	}

	async function buy(): Promise<void> {
		if (!data || !dialogsState.buyDialogContent) {
			toast.error("Post data is not available!");
			return;
		}
		if (!walletState.wallet) {
			toast.error("No Wallet!");
			return;
		}
		processing = true;
		let tx: Transaction;
		try {
			tx = await ArweaveUtils.newPaymentTx(
				data.uploader,
				walletState.wallet.address,
				dialogsState.buyDialogContent.id,
				dialogsState.buyDialogContent.price,
			);
		} catch (e) {
			if ((e as string)?.indexOf("Insufficient") >= 0) {
				toast.error("Insufficient balance!");
			} else {
				toast.error("Transaction failed!");
			}
			processing = false;
			throw "Transaction failed!";
		}

		let result;
		try {
			result = await ArweaveUtils.submitPayment(walletState.wallet, tx);
		} catch {
			toast.error("Transaction failed!");
			processing = false;
			throw "Transaction failed!";
		}
		runDelayed(() => {
			dialogsState.closeBuyDialog();
			processing = false;
		}, 300);
	}
</script>

<Dialog bind:open={dialogsState.buyDialog} openFocus={"#buy-dialog-content"}>
	<DialogContent id="buy-dialog-content" class="w-full max-w-[400px]">
		<DialogHeader>
			<DialogTitle>Purchase</DialogTitle>
			<DialogDescription>
				Confirm you want to buy this post.
			</DialogDescription>
		</DialogHeader>
		<div class="flex w-full px-5 flex-col gap-2">
			{#if dialogsState.buyDialogContent}
				{#if !data}
					<div class="flex justify-between items-center">
						<small>Price:</small><Loader class="animate-spin m-2" />
					</div>
				{:else}
					<div class="flex justify-between items-center">
						<small>Price:</small><b
							>{dialogsState.buyDialogContent.price} AR</b
						>
					</div>
					<div class="flex justify-between items-center">
						<small>Recipient:</small><b
							>{data.uploader.slice(0, 10)}...</b
						>
					</div>
					{#if data.title}
						<div class="flex justify-between items-center">
							<small>Title:</small><span>{data.title}</span>
						</div>
					{/if}
				{/if}
			{/if}
		</div>
		<DialogFooter>
			<Button
				class="m-3"
				variant="secondary"
				onclick={() => (dialogsState.buyDialog = false)}>Cancel</Button
			>
			<Button class="m-3" variant="default" onclick={() => buy()}>
				{#if processing}
					<Loader class="animate-spin" />
				{:else}
					<HandCoins class="mr-1" />
					Purchase
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
