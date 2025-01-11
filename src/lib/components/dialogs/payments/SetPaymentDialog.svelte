<script lang="ts">
	import { Loader } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { getDialogsState } from "../../../state/dialogs.svelte";
	import { getWalletState } from "../../../state/wallet.svelte";
	import { ArweaveUtils } from "../../../utils/arweave.utils";
	import { runDelayed } from "../../../utils/common.utils";
	import { Button } from "../../ui/button";
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "../../ui/dialog";
	import Input from "../../ui/input/input.svelte";

	const dialogState = getDialogsState();
	const walletState = getWalletState();

	$effect(() => {});

	let processing = $state(false);
	let newPrice = $state<number>();

	async function pay(): Promise<void> {
		const price = dialogState.setPaymentDialogContent?.price || newPrice;
		if (
			!dialogState.setPaymentDialogContent ||
			!dialogState.setPaymentDialogContent.id
		) {
			toast.error("Post data is not available!");
			return;
		}
		if (!price || price === 0) {
			toast.error("Missing Price!");
			return;
		}
		if (!walletState.wallet) {
			toast.error("No Wallet!");
			return;
		}
		processing = true;
		let result;
		try {
			const tx = await ArweaveUtils.newSetPriceTx(
				walletState.wallet.address,
				dialogState.setPaymentDialogContent.id,
				price,
			);
			result = await ArweaveUtils.submitPayment(walletState.wallet, tx);
		} catch {
			toast.error("Couldn't set price!");
			processing = false;
			throw "couldn't set price!";
		}
		runDelayed(() => {
			dialogState.closeSetPaymentDialog(true);
			processing = false;
		}, 300);
	}
</script>

<Dialog
	bind:open={dialogState.setPaymentDialog}
	openFocus={"#buy-dialog-content"}
>
	<DialogContent id="buy-dialog-content" class="w-full max-w-[350px]">
		<DialogHeader>
			<DialogTitle>Transaction</DialogTitle>
		</DialogHeader>
		<div class="flex w-full px-5 flex-col gap-2">
			<div class="flex justify-between items-center">
				<small>Price:</small>
				{#if dialogState.setPaymentDialogContent?.price}
					<b>{dialogState.setPaymentDialogContent.price} AR</b>
				{:else}
					<Input
						class="w-1/2"
						bind:value={newPrice}
						placeholder="Price..."
					/>
				{/if}
			</div>
			<div class="flex justify-between items-center">
				<small>Recipient:</small><b>PLATFORM_WALLET</b>
			</div>
		</div>
		<DialogFooter>
			<Button
				class="m-3"
				variant="secondary"
				onclick={() => dialogState.closeSetPaymentDialog(false)}
				>Cancel</Button
			>
			<Button
				class="m-3"
				variant="default"
				disabled={(!dialogState.setPaymentDialogContent?.price ||
					dialogState.setPaymentDialogContent.price === 0) &&
					!newPrice}
				onclick={() => pay()}
			>
				{#if processing}
					<Loader class="animate-spin" />
				{:else}
					Pay
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
