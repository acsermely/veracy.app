<script lang="ts">
	import { Loader } from "lucide-svelte";
	import { link } from "svelte-routing";
	import { toast } from "svelte-sonner";
	import type { Post } from "../../models/post.model";
	import { getWalletState } from "../../state/wallet.svelte";
	import { ArweaveUtils } from "../../utils/arweave.utils";
	import { runDelayed } from "../../utils/common.utils";
	import { Button, buttonVariants } from "../ui/button";
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "../ui/dialog";

	let {
		data = $bindable(),
		uploading = $bindable(),
		uploadMessage = $bindable(),
		price = $bindable(),
		needPayment,
	}: {
		data?: Post;
		uploading: boolean;
		uploadMessage: string;
		price?: number;
		needPayment: boolean;
	} = $props();

	const walletState = getWalletState();

	let alreadyPaid = $state(false);
	let payDialog = $state(false);
	let processing = $state(false);

	async function pay(): Promise<void> {
		if (!data) {
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
			const tx = await ArweaveUtils.newSetPriceTx(data.id, price);
			result = await walletState.wallet.dispatch(tx);
		} catch {
			toast.error("Couldn't set price!");
			processing = false;
			throw "couldn't set price!";
		}
		runDelayed(() => {
			payDialog = false;
			processing = false;
			alreadyPaid = true;
		}, 300);
	}
</script>

<div class="flex flex-col w-full justify-center items-center h-40">
	{#if uploading}
		<span class="text-xl m-10">Uploading...</span>
		<Loader class="size-10 animate-spin" />
	{:else}
		<span class="text-xl m-10">{uploadMessage}</span>
		{#if !needPayment || alreadyPaid}
			<a class={buttonVariants({ variant: "default" })} href="/" use:link>
				Home Page
			</a>
		{:else}
			<div class="m-5">
				For activation send the price to the platform:
			</div>

			<Dialog bind:open={payDialog} openFocus={"#buy-dialog-content"}>
				<DialogTrigger
					disabled={!price || price === 0}
					class={buttonVariants({
						variant: !price ? "destructive" : "default",
					})}
				>
					{#if price}
						Send {price} AR
					{:else}
						Missing Price
					{/if}
				</DialogTrigger>
				<DialogContent
					id="buy-dialog-content"
					class="w-full max-w-[350px]"
				>
					<DialogHeader>
						<DialogTitle>Transaction</DialogTitle>
					</DialogHeader>
					<div class="flex w-full px-5 flex-col gap-2">
						{#if price}
							<div class="flex justify-between items-center">
								<small>Price:</small><b>{price} AR</b>
							</div>
							<div class="flex justify-between items-center">
								<small>Recipient:</small><b>PLATFORM_WALLET</b>
							</div>
						{:else}
							<div class="flex justify-center items-center">
								<b>Missing Price</b>
							</div>
						{/if}
					</div>
					<DialogFooter>
						<Button
							class="m-3"
							variant="secondary"
							onclick={() => (payDialog = false)}>Cancel</Button
						>
						<Button
							class="m-3"
							variant="default"
							disabled={!price || price === 0}
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
		{/if}
	{/if}
</div>
