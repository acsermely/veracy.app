<script lang="ts">
	import DialogHeader from "./ui/dialog/dialog-header.svelte";
	import DialogContent from "./ui/dialog/dialog-content.svelte";
	import Input from "./ui/input/input.svelte";
	import DialogTitle from "./ui/dialog/dialog-title.svelte";
	import DialogDescription from "./ui/dialog/dialog-description.svelte";
	import DialogFooter from "./ui/dialog/dialog-footer.svelte";
	import { Dialog, DialogTrigger } from "./ui/dialog";
	import { getContentNodeState } from "../state/node.svelte";
	import { getWalletState } from "../state/wallet.svelte";
	import { getFeedState } from "../state/feed.svelte";
	import { buttonVariants } from "./ui/button";
	import Button from "./ui/button/button.svelte";

	const feedState = getFeedState();
	const walletState = getWalletState();
	const nodeState = getContentNodeState();

	$effect(() => {
		url = nodeState.url;
	});
	let open = $state(false);
	let url = $state("");
	let passw = $state("");

	function connectNode(): void {
		if (!url || !passw || !walletState.address) {
			return;
		}
		nodeState.connect(walletState.address, passw, url).then(() => {
			feedState.queryData();
			open = false;
		});
	}

	function registerNode(): void {
		if (!url || !passw || !walletState.address) {
			return;
		}
		nodeState
			.register(walletState.address, passw, url)
			.then(() => connectNode());
	}
</script>

{#if !walletState.isConnected || !nodeState.isConnected}
	<Dialog bind:open>
		{#if !walletState.isConnected}
			<DialogTrigger
				class={buttonVariants({ variant: "destructive" }) + " h-[10vh]"}
				>Connect</DialogTrigger
			>
		{:else}
			<DialogTrigger
				class={buttonVariants({ variant: "secondary" }) + " h-[10vh]"}
				>Connect Node</DialogTrigger
			>
		{/if}
		<DialogContent class="w-full max-w-[500px]">
			<DialogHeader>
				<DialogTitle>Connect</DialogTitle>
				<DialogDescription>
					Connect to your Wallet and Content Node
				</DialogDescription>
			</DialogHeader>
			<div class="flex w-full flex-col">
				<Button
					class="m-3 mx-6"
					disabled={walletState.isConnected}
					onclick={() => walletState.connectWeb()}
					>Connect Wallet</Button
				>
				<div>
					<h1>Node: <span class="text-green-500">Connected</span></h1>
					<Input
						class="my-3 w-full"
						placeholder="Server Address"
						type="text"
						bind:value={url}
					/>
					<span>Username</span>
					<Input
						class="my-3 w-full"
						disabled
						placeholder="Wallet ID (Connect Wallet)"
						type="text"
						bind:value={walletState.address}
					/>
					<span>Password</span>
					<Input
						class="my-3 w-full"
						placeholder="Password"
						type="password"
						bind:value={passw}
					/>
					<div class="flex items-center w-full">
						<Button class="m-3 w-full" onclick={() => connectNode()}
							>{nodeState.isConnected ? "Re-" : ""}Connect</Button
						>
						<Button
							variant="secondary"
							onclick={() => registerNode()}
							class="m-3 w-full">Register</Button
						>
					</div>
				</div>
			</div>
			<DialogFooter>
				<Button
					class="m-3"
					variant="secondary"
					onclick={() => (open = false)}>Close</Button
				>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
