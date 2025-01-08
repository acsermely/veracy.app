<script lang="ts">
	import { Loader } from "lucide-svelte";
	import { link } from "svelte-routing";
	import type { Post } from "../../models/post.model";
	import { getDialogsState } from "../../state/dialogs.svelte";
	import { getFeedState } from "../../state/feed.svelte";
	import { Button, buttonVariants } from "../ui/button";
	import { Input } from "../ui/input";

	let {
		data = $bindable(),
		uploading = $bindable(),
		uploadMessage = $bindable(),
		needPayment,
	}: {
		data?: Post;
		uploading: boolean;
		uploadMessage: string;
		needPayment: boolean;
	} = $props();

	const feedState = getFeedState();
	const dialogState = getDialogsState();

	let alreadyPaid = $state(false);
	let price = $state<number>();
</script>

<div class="flex flex-col w-full justify-center items-center">
	{#if uploading}
		<span class="text-xl m-10">Uploading...</span>
		<Loader class="size-10 animate-spin" />
	{:else}
		<span class="text-xl m-10">{uploadMessage}</span>
		{#if !needPayment || alreadyPaid}
			<a
				class={buttonVariants({ variant: "default" })}
				href="/"
				use:link
				onclick={() => feedState.queryData()}
			>
				Home Page
			</a>
		{:else}
			<div class="m-5">
				For activation send the price to the platform:
			</div>
			<Input
				class="my-5 max-w-40"
				maxlength={4}
				bind:value={price}
				type="number"
				placeholder="Set Price..."
			/>
			<Button
				disabled={!price || !data?.id || price === 0}
				class={buttonVariants({
					variant: !price ? "destructive" : "default",
				})}
				onclick={() => {
					dialogState
						.openSetPaymentDialog(data!.id, price!)
						.then((success) => (alreadyPaid = success));
				}}
			>
				{#if price}
					Send {price} AR
				{:else}
					Missing Price
				{/if}
			</Button>
		{/if}
	{/if}
</div>
